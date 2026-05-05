/**
 * Controller de Cursos do Módulo de Formação Profissional
 * 
 * Responsável pela gestão de cursos base, sem informações específicas
 * de preços e centros que pertencem às ofertas dos centros.
 * 
 * @author Asdruba developer
 * @version 2.0.0
 */
const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');

const mapOffering = (row) => ({
  id: row.offering_id,
  course_id: row.course_id,
  center_id: row.center_id,
  preco: Number(row.preco || 0),
  carga_horaria: row.carga_horaria,
  modalidade: row.modalidade || 'presencial',
  certificado_exigido: !!row.certificado_exigido,
  especificacoes: row.especificacoes,
  proximidade: row.proximidade || 'outro',
  centro: {
    id: row.center_id,
    nome: row.nome_centro,
    provincia: row.provincia,
    municipio: row.municipio,
    endereco: row.endereco,
    email: row.email,
    telefone: row.telefone,
    whatsapp: row.whatsapp,
  },
});

/**
 * GET /api/courses - Listar cursos ativos
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const listCourses = async (req, res) => {
  try {
    // Extrair e validar parâmetros da query
    const { categoria, nivel } = req.query;
    const search = req.query.search || req.query.pesquisa;
    
    // Validação e conversão de parâmetros de paginação
    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || req.query.limite || 20, 10)));
    const offset = (page - 1) * limit;

    // Query base focada apenas nos dados essenciais do curso
    let query = `
      SELECT
        c.id,
        c.nome,
        c.categoria,
        c.status,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT tcc.id) AS total_ofertas,
        COUNT(DISTINCT tc.id) AS total_centros,
        MIN(tcc.preco) AS preco_minimo,
        MAX(tcc.preco) AS preco_maximo,
        MIN(tcc.carga_horaria) AS carga_horaria_minima,
        MAX(tcc.carga_horaria) AS carga_horaria_maxima
      FROM courses c
      LEFT JOIN training_center_courses tcc
        ON tcc.course_id = c.id
       AND tcc.status = 'ativo'
      LEFT JOIN training_centers tc
        ON tc.id = tcc.center_id
       AND tc.status = 'ativo'
      WHERE c.status = 'ativo'
    `;
    
    const params = [];

    // Adicionar filtros dinamicamente
    if (categoria) {
      query += ' AND c.categoria = ?';
      params.push(categoria);
    }
    if (search) {
      query += ' AND (c.nome LIKE ? OR c.categoria LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação - usar interpolação para LIMIT/OFFSET para evitar problemas de prepared statements
    query += ` GROUP BY c.id, c.nome, c.categoria, c.status, c.created_at, c.updated_at ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);

    // Query para contar total de registros (sem paginação)
    let countQuery = 'SELECT COUNT(*) as total FROM courses c WHERE c.status="ativo"';
    const countParams = [];

    if (categoria) {
      countQuery += ' AND c.categoria=?';
      countParams.push(categoria);
    }
    if (search) {
      countQuery += ' AND (c.nome LIKE ? OR c.categoria LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;

    // Calcular informações de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return success(res, {
      data: rows.map((row) => ({
        id: row.id,
        nome: row.nome,
        categoria: row.categoria,
        status: row.status,
        criado_em: row.created_at,
        atualizado_em: row.updated_at,
        // Informações agregadas das ofertas
        ofertas: {
          total: row.total_ofertas || 0,
          preco_minimo: row.preco_minimo ? Number(row.preco_minimo) : null,
          preco_maximo: row.preco_maximo ? Number(row.preco_maximo) : null,
          carga_horaria_minima: row.carga_horaria_minima || null,
          carga_horaria_maxima: row.carga_horaria_maxima || null,
          centros_disponiveis: row.total_centros || 0
        }
      })),
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: total,
        items_per_page: limit,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage,
      },
      filters: {
        categoria,
        search,
      },
    });

  } catch (err) {
    console.error('[COURSE_LIST] Error:', err.message);
    console.error('[COURSE_LIST] Stack:', err.stack);
    return error(res, 'Erro ao listar cursos', 500);
  }
};

/** GET /api/courses/:id - Detalhes de um curso */
const getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `
      SELECT
        c.*,
        MIN(tcc.preco) AS preco_minimo,
        MAX(tcc.preco) AS preco_maximo,
        MIN(tcc.carga_horaria) AS carga_horaria_minima,
        MAX(tcc.carga_horaria) AS carga_horaria_maxima,
        COUNT(DISTINCT tcc.center_id) AS total_centros
      FROM courses c
      LEFT JOIN training_center_courses tcc
        ON tcc.course_id = c.id
       AND tcc.status = 'ativo'
      WHERE c.id = ? AND c.status = 'ativo'
      GROUP BY c.id
      `,
      [id]
    );

    if (!rows.length) {
      return notFound(res, 'Curso não encontrado.');
    }

    const [centers] = await pool.execute(
      `
      SELECT
        tcc.id AS offering_id,
        tcc.course_id,
        tcc.center_id,
        tcc.preco,
        tcc.carga_horaria,
        tcc.modalidade,
        tcc.certificado_exigido,
        tcc.especificacoes,
        tc.nome AS nome_centro,
        tc.provincia,
        tc.municipio,
        tc.endereco,
        tc.email,
        tc.telefone
      FROM training_center_courses tcc
      INNER JOIN training_centers tc ON tc.id = tcc.center_id
      WHERE tcc.course_id = ? AND tcc.status = 'ativo' AND tc.status = 'ativo'
      ORDER BY tc.provincia, tc.municipio, tc.nome
      `,
      [id]
    );

    const course = {
      ...rows[0],
      preco_minimo: rows[0].preco_minimo ? Number(rows[0].preco_minimo) : null,
      preco_maximo: rows[0].preco_maximo ? Number(rows[0].preco_maximo) : null,
      carga_horaria_minima: rows[0].carga_horaria_minima || null,
      carga_horaria_maxima: rows[0].carga_horaria_maxima || null,
      total_centros: rows[0].total_centros,
    };

    return success(res, { course, centers: centers.map(mapOffering) });
  } catch (err) {
    console.error('[COURSE_DETAIL]', err);
    return error(res, 'Erro ao obter curso.', 500);
  }
};

/** GET /api/courses/:id/centers - Centros que oferecem o curso, filtrados por localização */
const getCourseCenters = async (req, res) => {
  try {
    const { id } = req.params;
    const { municipio, provincia } = req.query;

    const [rows] = await pool.execute(
      `
      SELECT
        tcc.id AS offering_id,
        tcc.course_id,
        tcc.center_id,
        tcc.preco,
        tcc.carga_horaria,
        tcc.modalidade,
        tcc.certificado_exigido,
        tcc.especificacoes,
        tc.nome AS nome_centro,
        tc.provincia,
        tc.municipio,
        tc.endereco,
        tc.email,
        tc.telefone
      FROM training_center_courses tcc
      INNER JOIN training_centers tc ON tc.id = tcc.center_id
      WHERE tcc.course_id = ? AND tcc.status = 'ativo' AND tc.status = 'ativo'
      ORDER BY tc.provincia, tc.municipio, tc.nome
      `,
      [id]
    );

    const mapped = rows.map((row) => {
      let proximidade = 'outro';
      if (municipio && row.municipio && row.municipio.toLowerCase() === municipio.toLowerCase()) {
        proximidade = 'local';
      } else if (provincia && row.provincia && row.provincia.toLowerCase() === provincia.toLowerCase()) {
        proximidade = 'provincial';
      }

      return mapOffering({ ...row, proximidade });
    });

    return success(res, {
      local: mapped.filter((item) => item.proximidade === 'local'),
      provincial: mapped.filter((item) => item.proximidade === 'provincial'),
      outros: mapped.filter((item) => item.proximidade === 'outro'),
      centers: mapped,
    });
  } catch (err) {
    console.error('[COURSE_CENTERS]', err);
    return error(res, 'Erro ao buscar centros.', 500);
  }
};

/** GET /api/categories - Categorias dos cursos */
const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT categoria FROM courses WHERE status="ativo" AND categoria IS NOT NULL ORDER BY categoria'
    );
    return success(res, rows.map((row) => row.categoria));
  } catch (err) {
    return error(res, 'Erro ao listar categorias.', 500);
  }
};

/** POST /api/admin/courses - Criar curso (admin) */
const createCourse = async (req, res) => {
  try {
    const { nome, categoria, imagem_url } = req.body;
    
    // Validações básicas
    if (!nome) {
      return badRequest(res, 'O nome do curso é obrigatório.');
    }

    // Inserir apenas dados essenciais do curso
    const [result] = await pool.execute(
      `INSERT INTO courses
        (nome, categoria, imagem_url, created_by)
       VALUES (?,?,?,?)`,
      [
        nome,
        categoria || null,
        imagem_url || null,
        req.user.id,
      ]
    );

    await log(req.user.id, 'CREATE_COURSE', 'courses', result.insertId, { nome }, req);
    return created(res, { id: result.insertId }, 'Curso criado com sucesso.');
  } catch (err) {
    console.error('[COURSE_CREATE]', err);
    return error(res, 'Erro ao criar curso.', 500);
  }
};

/** PUT /api/admin/courses/:id - Atualizar curso */
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, categoria, status, imagem_url } = req.body;

    // Atualizar apenas dados essenciais do curso
    await pool.execute(
      `UPDATE courses
       SET nome = COALESCE(?, nome),
           categoria = COALESCE(?, categoria),
           status = COALESCE(?, status),
           imagem_url = COALESCE(?, imagem_url)
       WHERE id = ?`,
      [
        nome || null,
        categoria || null,
        status || null,
        imagem_url || null,
        id,
      ]
    );

    await log(req.user.id, 'UPDATE_COURSE', 'courses', id, req.body, req);
    return success(res, null, 'Curso atualizado com sucesso.');
  } catch (err) {
    console.error('[COURSE_UPDATE]', err);
    return error(res, 'Erro ao atualizar curso.', 500);
  }
};

/** DELETE /api/admin/courses/:id - Remover curso */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE courses SET status = "inativo" WHERE id = ?', [id]);
    await log(req.user.id, 'DELETE_COURSE', 'courses', id, null, req);
    return success(res, null, 'Curso removido com sucesso.');
  } catch (err) {
    console.error('[COURSE_DELETE]', err);
    return error(res, 'Erro ao remover curso.', 500);
  }
};

module.exports = {
  listCourses,
  getCourse,
  getCourseCenters,
  getCategories,
  createCourse,
  updateCourse,
  deleteCourse,
};
