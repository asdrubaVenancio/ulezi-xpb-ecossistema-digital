/**
 * Controller de Centros de Formação Profissional
 * 
 * Responsável pela gestão completa dos centros de formação,
 * incluindo CRUD, associação com cursos e gestão de ofertas.
 * 
 * @author Asdruba developer
 * @version 1.0.0
 */

const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');

/**
 * Valida se um centro de formação existe e está ativo
 * @param {number} centerId - ID do centro
 * @returns {Promise<boolean>} True se existir e estiver ativo
 */
const validarCentroAtivo = async (centerId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM training_centers WHERE id = ? AND status = "ativo"',
    [centerId]
  );
  return rows.length > 0;
};

/**
 * Valida se um curso existe e está ativo
 * @param {number} courseId - ID do curso
 * @returns {Promise<boolean>} True se existir e estiver ativo
 */
const validarCursoAtivo = async (courseId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM courses WHERE id = ? AND status = "ativo"',
    [courseId]
  );
  return rows.length > 0;
};

/**
 * POST /api/admin/training-centers - Criar novo centro de formação
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const createTrainingCenter = async (req, res) => {
  try {
    const {
      nome,
      provincia,
      municipio,
      endereco,
      email,
      telefone,
      descricao,
      cursos_associados = []
    } = req.body;

    // Validação de campos obrigatórios
    if (!nome || nome.trim().length < 3) {
      return badRequest(res, 'Nome do centro é obrigatório e deve ter pelo menos 3 caracteres.');
    }

    if (!provincia || provincia.trim().length < 2) {
      return badRequest(res, 'Província é obrigatória.');
    }

    if (!municipio || municipio.trim().length < 2) {
      return badRequest(res, 'Município é obrigatório.');
    }

    // Verificar duplicação de nome
    const [existing] = await pool.execute(
      'SELECT id FROM training_centers WHERE nome = ? AND status != "inativo"',
      [nome.trim()]
    );

    if (existing.length > 0) {
      return badRequest(res, 'Já existe um centro de formação com este nome.');
    }

    // Inserir centro de formação
    const [result] = await pool.execute(
      `
      INSERT INTO training_centers
        (nome, provincia, municipio, endereco, email, telefone, descricao, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo', ?)
      `,
      [
        nome.trim(),
        provincia.trim(),
        municipio.trim(),
        endereco?.trim() || null,
        email?.trim() || null,
        telefone?.trim() || null,
        descricao?.trim() || null,
        req.user.id,
      ]
    );

    const centerId = result.insertId;

    // Associar cursos se fornecidos
    if (cursos_associados.length > 0) {
      const cursosValidos = [];
      
      for (const courseId of cursos_associados) {
        if (await validarCursoAtivo(courseId)) {
          cursosValidos.push(courseId);
        }
      }

      if (cursosValidos.length > 0) {
        const values = cursosValidos.map(courseId => [centerId, courseId]).flat();
        const placeholders = cursosValidos.map(() => '(?,?)').join(',');
        
        await pool.execute(
          `INSERT IGNORE INTO center_courses (center_id, course_id) VALUES ${placeholders}`,
          values
        );
      }
    }

    // Registrar auditoria
    await log(
      req.user.id,
      'CREATE_TRAINING_CENTER',
      'training_centers',
      centerId,
      { nome, provincia, municipio },
      req
    );

    return created(res, {
      id: centerId,
      nome,
      provincia,
      municipio,
      cursos_associados: cursos_associados.length
    }, 'Centro de formação criado com sucesso.');

  } catch (err) {
    console.error('[TRAINING_CENTER_CREATE]', err);
    return error(res, 'Erro ao criar centro de formação.', 500);
  }
};

/**
 * GET /api/admin/training-centers - Listar centros de formação
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const listTrainingCenters = async (req, res) => {
  try {
    const {
      provincia,
      municipio,
      status = 'ativo',
      search,
      page = 1,
      limit = 50
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Query base para filtros
    let baseWhere = 'WHERE 1=1';
    const params = [];
    const countParams = [];

    // Aplicar filtros
    if (status && status !== 'todos') {
      baseWhere += ' AND tc.status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (provincia) {
      baseWhere += ' AND tc.provincia LIKE ?';
      params.push(`%${provincia}%`);
      countParams.push(`%${provincia}%`);
    }

    if (municipio) {
      baseWhere += ' AND tc.municipio LIKE ?';
      params.push(`%${municipio}%`);
      countParams.push(`%${municipio}%`);
    }

    if (search) {
      baseWhere += ' AND (tc.nome LIKE ? OR tc.descricao LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    // Query de contagem total (sem agregações)
    const countQuery = `SELECT COUNT(*) as total FROM training_centers tc ${baseWhere}`;
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Query principal com agregações e GROUP BY
    const query = `
      SELECT
        tc.id,
        tc.nome,
        tc.provincia,
        tc.municipio,
        tc.endereco,
        tc.email,
        tc.telefone,
        tc.descricao,
        tc.status,
        tc.created_at,
        tc.updated_at,
        u.nome AS criado_por,
        COUNT(DISTINCT cc.course_id) AS total_cursos,
        COUNT(DISTINCT tcc.id) AS total_ofertas
      FROM training_centers tc
      LEFT JOIN users u ON u.id = tc.created_by
      LEFT JOIN center_courses cc ON cc.center_id = tc.id
      LEFT JOIN training_center_courses tcc ON tcc.center_id = tc.id AND tcc.status = 'ativo'
      ${baseWhere}
      GROUP BY tc.id, u.nome
      ORDER BY tc.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(query, params);

    // Enriquecer dados com informações dos cursos
    const enrichedRows = await Promise.all(
      rows.map(async (row) => {
        const [cursos] = await pool.execute(
          `
          SELECT
            c.id,
            c.nome,
            c.categoria,
            c.nivel,
            tcc.preco,
            tcc.carga_horaria,
            tcc.certificado_exigido,
            tcc.especificacoes
          FROM courses c
          LEFT JOIN training_center_courses tcc ON tcc.course_id = c.id AND tcc.center_id = ? AND tcc.status = 'ativo'
          INNER JOIN center_courses cc ON cc.course_id = c.id AND cc.center_id = ?
          WHERE c.status = 'ativo'
          ORDER BY c.nome
          `,
          [row.id, row.id]
        );

        return {
          ...row,
          cursos: cursos.map(curso => ({
            ...curso,
            preco: curso.preco ? Number(curso.preco) : null,
            tem_oferta: !!curso.preco,
            certificado_exigido: !!curso.certificado_exigido
          }))
        };
      })
    );

    return success(res, {
      data: enrichedRows,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_items: total,
        items_per_page: limitNum,
        has_next_page: pageNum < Math.ceil(total / limitNum),
        has_prev_page: pageNum > 1
      },
      filters: { provincia, municipio, status, search }
    });

  } catch (err) {
    console.error('[TRAINING_CENTER_LIST]', err);
    return error(res, 'Erro ao listar centros de formação.', 500);
  }
};

/**
 * GET /api/admin/training-centers/:id - Obter detalhes de um centro
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const getTrainingCenter = async (req, res) => {
  try {
    const { id } = req.params;

    const [[center]] = await pool.execute(
      `
      SELECT
        tc.*,
        u.nome AS criado_por
      FROM training_centers tc
      LEFT JOIN users u ON u.id = tc.created_by
      WHERE tc.id = ?
      `,
      [id]
    );

    if (!center) {
      return notFound(res, 'Centro de formação não encontrado.');
    }

    // Obter cursos associados
    const [cursos] = await pool.execute(
      `
      SELECT
        c.id,
        c.nome,
        c.categoria,
        c.nivel,
        c.descricao,
        tcc.preco,
        tcc.carga_horaria,
        tcc.certificado_exigido,
        tcc.especificacoes,
        tcc.status AS status_oferta
      FROM courses c
      LEFT JOIN training_center_courses tcc ON tcc.course_id = c.id AND tcc.center_id = ?
      INNER JOIN center_courses cc ON cc.course_id = c.id AND cc.center_id = ?
      WHERE c.status = 'ativo'
      ORDER BY c.nome
      `,
      [id, id]
    );

    // Obter estatísticas
    const [[stats]] = await pool.execute(
      `
      SELECT
        COUNT(DISTINCT cc.course_id) AS total_cursos_associados,
        COUNT(DISTINCT tcc.id) AS total_ofertas_ativas,
        COUNT(DISTINCT e.id) AS total_inscricoes,
        COUNT(DISTINCT CASE WHEN e.status = 'confirmada' THEN e.id END) AS total_inscricoes_confirmadas
      FROM training_centers tc
      LEFT JOIN center_courses cc ON cc.center_id = tc.id
      LEFT JOIN training_center_courses tcc ON tcc.center_id = tc.id AND tcc.status = 'ativo'
      LEFT JOIN enrollments e ON e.center_id = tc.id
      WHERE tc.id = ?
      `,
      [id]
    );

    return success(res, {
      ...center,
      cursos: cursos.map(curso => ({
        ...curso,
        preco: curso.preco ? Number(curso.preco) : null,
        tem_oferta: !!curso.preco,
        certificado_exigido: !!curso.certificado_exigido
      })),
      estatisticas: stats
    });

  } catch (err) {
    console.error('[TRAINING_CENTER_GET]', err);
    return error(res, 'Erro ao obter detalhes do centro de formação.', 500);
  }
};

/**
 * PUT /api/admin/training-centers/:id - Atualizar centro de formação
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const updateTrainingCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      provincia,
      municipio,
      endereco,
      email,
      telefone,
      descricao,
      status
    } = req.body;

    // Verificar se centro existe
    const [[existing]] = await pool.execute(
      'SELECT id, nome FROM training_centers WHERE id = ?',
      [id]
    );

    if (!existing) {
      return notFound(res, 'Centro de formação não encontrado.');
    }

    // Verificar duplicação de nome (se estiver mudando)
    if (nome && nome.trim() !== existing.nome) {
      const [duplicate] = await pool.execute(
        'SELECT id FROM training_centers WHERE nome = ? AND id != ? AND status != "excluido"',
        [nome.trim(), id]
      );

      if (duplicate.length > 0) {
        return badRequest(res, 'Já existe outro centro de formação com este nome.');
      }
    }

    // Construir query dinâmica
    const updates = [];
    const params = [];

    if (nome !== undefined) {
      updates.push('nome = ?');
      params.push(nome.trim());
    }
    if (provincia !== undefined) {
      updates.push('provincia = ?');
      params.push(provincia.trim());
    }
    if (municipio !== undefined) {
      updates.push('municipio = ?');
      params.push(municipio.trim());
    }
    if (endereco !== undefined) {
      updates.push('endereco = ?');
      params.push(endereco?.trim() || null);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email?.trim() || null);
    }
    if (telefone !== undefined) {
      updates.push('telefone = ?');
      params.push(telefone?.trim() || null);
    }
    if (descricao !== undefined) {
      updates.push('descricao = ?');
      params.push(descricao?.trim() || null);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return badRequest(res, 'Nenhum campo fornecido para atualização.');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE training_centers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Registrar auditoria
    await log(
      req.user.id,
      'UPDATE_TRAINING_CENTER',
      'training_centers',
      id,
      { campos_atualizados: Object.keys(req.body) },
      req
    );

    return success(res, null, 'Centro de formação atualizado com sucesso.');

  } catch (err) {
    console.error('[TRAINING_CENTER_UPDATE]', err);
    return error(res, 'Erro ao atualizar centro de formação.', 500);
  }
};

/**
 * DELETE /api/admin/training-centers/:id - Excluir centro de formação
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const deleteTrainingCenter = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se centro existe
    const [[existing]] = await pool.execute(
      'SELECT id, nome FROM training_centers WHERE id = ?',
      [id]
    );

    if (!existing) {
      return notFound(res, 'Centro de formação não encontrado.');
    }

    // Verificar se existem inscrições ativas
    const [enrollments] = await pool.execute(
      'SELECT COUNT(*) as total FROM enrollments WHERE center_id = ? AND status IN ("pendente", "em_analise", "confirmada")',
      [id]
    );

    if (enrollments[0].total > 0) {
      return badRequest(res, 'Não é possível excluir um centro com inscrições ativas.');
    }

    // Soft delete
    await pool.execute(
      'UPDATE training_centers SET status = "inativo", updated_at = NOW() WHERE id = ?',
      [id]
    );

    // Registrar auditoria
    await log(
      req.user.id,
      'DELETE_TRAINING_CENTER',
      'training_centers',
      id,
      { nome: existing.nome },
      req
    );

    return success(res, null, 'Centro de formação excluído com sucesso.');

  } catch (err) {
    console.error('[TRAINING_CENTER_DELETE]', err);
    return error(res, 'Erro ao excluir centro de formação.', 500);
  }
};

/**
 * POST /api/admin/training-centers/:id/courses - Associar cursos ao centro
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const associateCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const { courses = [] } = req.body;

    if (!Array.isArray(courses) || courses.length === 0) {
      return badRequest(res, 'Lista de cursos é obrigatória.');
    }

    // Verificar se centro existe
    if (!(await validarCentroAtivo(id))) {
      return notFound(res, 'Centro de formação não encontrado ou inativo.');
    }

    // Validar cursos
    const cursosValidos = [];
    for (const courseId of courses) {
      if (await validarCursoAtivo(courseId)) {
        cursosValidos.push(courseId);
      }
    }

    if (cursosValidos.length === 0) {
      return badRequest(res, 'Nenhum curso válido encontrado para associar.');
    }

    // Inserir associações
    const values = cursosValidos.map(courseId => [id, courseId]).flat();
    const placeholders = cursosValidos.map(() => '(?,?)').join(',');
    
    const [result] = await pool.execute(
      `INSERT IGNORE INTO center_courses (center_id, course_id) VALUES ${placeholders}`,
      values
    );

    // Registrar auditoria
    await log(
      req.user.id,
      'ASSOCIATE_COURSES_CENTER',
      'center_courses',
      id,
      { cursos_associados: cursosValidos, total: result.affectedRows },
      req
    );

    return success(res, {
      cursos_associados: cursosValidos.length,
      novos_associados: result.affectedRows
    }, 'Cursos associados com sucesso.');

  } catch (err) {
    console.error('[TRAINING_CENTER_ASSOCIATE_COURSES]', err);
    return error(res, 'Erro ao associar cursos ao centro.', 500);
  }
};

/**
 * DELETE /api/admin/training-centers/:id/courses/:courseId - Remover associação de curso
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const removeCourseAssociation = async (req, res) => {
  try {
    const { id, courseId } = req.params;

    // Verificar se centro e curso existem
    if (!(await validarCentroAtivo(id))) {
      return notFound(res, 'Centro de formação não encontrado ou inativo.');
    }

    if (!(await validarCursoAtivo(courseId))) {
      return notFound(res, 'Curso não encontrado ou inativo.');
    }

    // Verificar se existem inscrições ativas para esta associação
    const [enrollments] = await pool.execute(
      'SELECT COUNT(*) as total FROM enrollments WHERE center_id = ? AND course_id = ? AND status IN ("pendente", "em_analise", "confirmada")',
      [id, courseId]
    );

    if (enrollments[0].total > 0) {
      return badRequest(res, 'Não é possível remover a associação pois existem inscrições ativas.');
    }

    // Remover associação e ofertas
    await pool.execute(
      'DELETE FROM center_courses WHERE center_id = ? AND course_id = ?',
      [id, courseId]
    );

    await pool.execute(
      'DELETE FROM training_center_courses WHERE center_id = ? AND course_id = ?',
      [id, courseId]
    );

    // Registrar auditoria
    await log(
      req.user.id,
      'REMOVE_COURSE_ASSOCIATION',
      'center_courses',
      id,
      { course_id: courseId },
      req
    );

    return success(res, null, 'Associação de curso removida com sucesso.');

  } catch (err) {
    console.error('[TRAINING_CENTER_REMOVE_COURSE]', err);
    return error(res, 'Erro ao remover associação de curso.', 500);
  }
};

/**
 * GET /api/training-centers - Listar centros disponíveis para alunos
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const listPublicTrainingCenters = async (req, res) => {
  try {
    const { provincia, municipio, course_id } = req.query;

    let query = `
      SELECT DISTINCT
        tc.id,
        tc.nome,
        tc.provincia,
        tc.municipio,
        tc.descricao,
        tc.email,
        tc.telefone,
        tc.whatsapp
      FROM training_centers tc
      INNER JOIN center_courses cc ON cc.center_id = tc.id
      WHERE tc.status = 'ativo'
    `;
    
    const params = [];

    if (provincia) {
      query += ' AND tc.provincia = ?';
      params.push(provincia);
    }

    if (municipio) {
      query += ' AND tc.municipio = ?';
      params.push(municipio);
    }

    if (course_id) {
      query += ' AND cc.course_id = ?';
      params.push(course_id);
    }

    query += ' ORDER BY tc.nome';

    const [rows] = await pool.execute(query, params);

    return success(res, {
      centros: rows,
      total: rows.length
    });

  } catch (err) {
    console.error('[TRAINING_CENTER_PUBLIC_LIST]', err);
    return error(res, 'Erro ao listar centros de formação.', 500);
  }
};

module.exports = {
  // Admin endpoints
  createTrainingCenter,
  listTrainingCenters,
  getTrainingCenter,
  updateTrainingCenter,
  deleteTrainingCenter,
  associateCourses,
  removeCourseAssociation,
  
  // Public endpoints
  listPublicTrainingCenters
};
