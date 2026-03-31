/**
 * Controller de Ofertas de Cursos em Centros de Formação
 * 
 * Responsável pela gestão das ofertas específicas de cada centro,
 * incluindo preços, carga horária, exigências e especificações.
 * 
 * @author ULEZI XPB Team
 * @version 1.0.0
 */

const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');

/**
 * Valida se uma oferta existe e está ativa
 * @param {number} offeringId - ID da oferta
 * @returns {Promise<boolean>} True se existir e estiver ativa
 */
const validarOfertaAtiva = async (offeringId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM training_center_courses WHERE id = ? AND status = "ativo"',
    [offeringId]
  );
  return rows.length > 0;
};

/**
 * POST /api/admin/training-offerings - Criar nova oferta de curso
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const createTrainingOffering = async (req, res) => {
  try {
    const {
      center_id,
      course_id,
      preco,
      carga_horaria,
      certificado_exigido = false,
      especificacoes,
      duracao_meses
    } = req.body;

    // Validações básicas
    if (!center_id || !course_id) {
      return badRequest(res, 'Centro de formação e curso são obrigatórios.');
    }

    if (!preco || preco < 0) {
      return badRequest(res, 'Preço é obrigatório e deve ser um valor positivo.');
    }

    // Verificar se centro e curso existem e estão ativos
    const [[center]] = await pool.execute(
      'SELECT id, nome FROM training_centers WHERE id = ? AND status = "ativo"',
      [center_id]
    );

    if (!center) {
      return notFound(res, 'Centro de formação não encontrado ou inativo.');
    }

    const [[course]] = await pool.execute(
      'SELECT id, nome FROM courses WHERE id = ? AND status = "ativo"',
      [course_id]
    );

    if (!course) {
      return notFound(res, 'Curso não encontrado ou inativo.');
    }

    // Verificar se já existe uma oferta ativa para este centro e curso
    const [[existingOffering]] = await pool.execute(
      'SELECT id FROM training_center_courses WHERE center_id = ? AND course_id = ? AND status = "ativo"',
      [center_id, course_id]
    );

    if (existingOffering) {
      return badRequest(res, 'Já existe uma oferta ativa para este centro e curso.');
    }

    // Verificar se existe associação base
    const [[association]] = await pool.execute(
      'SELECT center_id, course_id FROM center_courses WHERE center_id = ? AND course_id = ?',
      [center_id, course_id]
    );

    if (!association) {
      // Criar associação automaticamente
      await pool.execute(
        'INSERT INTO center_courses (center_id, course_id) VALUES (?, ?)',
        [center_id, course_id]
      );
    }

    // Inserir oferta
    const [result] = await pool.execute(
      `
      INSERT INTO training_center_courses
        (center_id, course_id, preco, carga_horaria, certificado_exigido, especificacoes, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'ativo', ?)
      `,
      [
        center_id,
        course_id,
        Number(preco),
        carga_horaria ? parseInt(carga_horaria, 10) : null,
        certificado_exigido ? 1 : 0,
        especificacoes?.trim() || null,
        req.user.id
      ]
    );

    // Registrar auditoria
    await log(
      req.user.id,
      'CREATE_TRAINING_OFFERING',
      'training_center_courses',
      result.insertId,
      {
        center_id,
        course_id,
        preco: Number(preco),
        certificado_exigido: !!certificado_exigido
      },
      req
    );

    return created(res, {
      id: result.insertId,
      center_id,
      course_id,
      preco: Number(preco),
      carga_horaria,
      certificado_exigido: !!certificado_exigido,
      especificacoes
    }, 'Oferta de curso criada com sucesso.');

  } catch (err) {
    console.error('[TRAINING_OFFERING_CREATE]', err);
    return error(res, 'Erro ao criar oferta de curso.', 500);
  }
};

/**
 * GET /api/admin/training-offerings - Listar ofertas de cursos
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const listTrainingOfferings = async (req, res) => {
  try {
    const {
      search,
      center_id,
      course_id,
      status = 'ativo',
      min_preco,
      max_preco,
      page = 1,
      limit = 50
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT
        tcc.id,
        tcc.center_id,
        tcc.course_id,
        tcc.preco,
        tcc.carga_horaria,
        tcc.certificado_exigido,
        tcc.especificacoes,
        tcc.status,
        tcc.created_at,
        tcc.updated_at,
        tc.nome AS nome_centro,
        tc.provincia AS provincia_centro,
        tc.municipio AS municipio_centro,
        c.nome AS nome_curso,
        c.categoria AS categoria_curso,
        c.nivel AS nivel_curso,
        u.nome AS criado_por,
        COUNT(DISTINCT e.id) AS total_inscricoes,
        COUNT(DISTINCT CASE WHEN e.status = 'confirmada' THEN e.id END) AS total_confirmadas
      FROM training_center_courses tcc
      INNER JOIN training_centers tc ON tc.id = tcc.center_id
      INNER JOIN courses c ON c.id = tcc.course_id
      LEFT JOIN users u ON u.id = tcc.created_by
      LEFT JOIN enrollments e ON e.offering_id = tcc.id
      WHERE 1=1
    `;
    
    const params = [];

    // Aplicar filtros
    if (search) {
      query += ' AND (c.nome LIKE ? OR tc.nome LIKE ? OR tc.municipio LIKE ? OR tc.provincia LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'todos') {
      query += ' AND tcc.status = ?';
      params.push(status);
    }

    if (center_id) {
      query += ' AND tcc.center_id = ?';
      params.push(center_id);
    }

    if (course_id) {
      query += ' AND tcc.course_id = ?';
      params.push(course_id);
    }

    if (min_preco) {
      query += ' AND tcc.preco >= ?';
      params.push(Number(min_preco));
    }

    if (max_preco) {
      query += ' AND tcc.preco <= ?';
      params.push(Number(max_preco));
    }

    query += ` GROUP BY tcc.id, tcc.center_id, tcc.course_id, tcc.preco, tcc.carga_horaria, tcc.certificado_exigido, tcc.especificacoes, tcc.status, tcc.created_at, tcc.updated_at, tc.nome, tc.provincia, tc.municipio, c.nome, c.categoria, c.nivel, u.nome ORDER BY tcc.created_at DESC`;

    // Query para contagem total (sem agregações - simples)
    let countQuery = `SELECT COUNT(DISTINCT tcc.id) as total FROM training_center_courses tcc`;
    countQuery += ` INNER JOIN training_centers tc ON tc.id = tcc.center_id`;
    countQuery += ` INNER JOIN courses c ON c.id = tcc.course_id`;
    countQuery += ` WHERE 1=1`;
    
    // Aplicar os mesmos filtros na query de contagem
    const countParams = [...params];
    // (os filtros já estão aplicados em params)
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Aplicar paginação
    query += ` LIMIT ${limitNum} OFFSET ${offset}`;
    const [rows] = await pool.execute(query, params);

    // Enriquecer dados
    const enrichedRows = rows.map(row => ({
      ...row,
      preco: Number(row.preco),
      certificado_exigido: !!row.certificado_exigido,
      tem_inscricoes: row.total_inscricoes > 0,
      taxa_confirmacao: row.total_inscricoes > 0 ? (row.total_confirmadas / row.total_inscricoes * 100).toFixed(1) : 0
    }));

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
      filters: { center_id, course_id, status, min_preco, max_preco }
    });

  } catch (err) {
    console.error('[TRAINING_OFFERING_LIST]', err);
    return error(res, 'Erro ao listar ofertas de cursos.', 500);
  }
};

/**
 * GET /api/admin/training-offerings/:id - Obter detalhes de uma oferta
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const getTrainingOffering = async (req, res) => {
  try {
    const { id } = req.params;

    const [[offering]] = await pool.execute(
      `
      SELECT
        tcc.*,
        tc.nome AS nome_centro,
        tc.provincia AS provincia_centro,
        tc.municipio AS municipio_centro,
        tc.endereco AS endereco_centro,
        tc.email AS email_centro,
        tc.telefone AS telefone_centro,
        tc.whatsapp AS whatsapp_centro,
        c.nome AS nome_curso,
        c.categoria AS categoria_curso,
        c.nivel AS nivel_curso,
        c.descricao AS descricao_curso,
        u.nome AS criado_por
      FROM training_center_courses tcc
      INNER JOIN training_centers tc ON tc.id = tcc.center_id
      INNER JOIN courses c ON c.id = tcc.course_id
      LEFT JOIN users u ON u.id = tcc.created_by
      WHERE tcc.id = ?
      `,
      [id]
    );

    if (!offering) {
      return notFound(res, 'Oferta de curso não encontrada.');
    }

    // Obter inscrições recentes
    const [enrollments] = await pool.execute(
      `
      SELECT
        e.id,
        e.numero_inscricao,
        e.status,
        e.created_at AS data_inscricao,
        u.nome AS nome_aluno,
        u.email AS email_aluno,
        u.telefone AS telefone_aluno
      FROM enrollments e
      INNER JOIN users u ON u.id = e.student_id
      WHERE e.offering_id = ?
      ORDER BY e.created_at DESC
      LIMIT 10
      `,
      [id]
    );

    // Estatísticas detalhadas
    const [[stats]] = await pool.execute(
      `
      SELECT
        COUNT(*) AS total_inscricoes,
        COUNT(CASE WHEN e.status = 'confirmada' THEN 1 END) AS confirmadas,
        COUNT(CASE WHEN e.status = 'em_analise' THEN 1 END) AND em_analise,
        COUNT(CASE WHEN e.status = 'pendente' THEN 1 END) AS pendentes,
        COUNT(CASE WHEN e.status = 'rejeitada' THEN 1 END) AS rejeitadas,
        SUM(p.valor) AS valor_total_arrecadado
      FROM enrollments e
      LEFT JOIN payments p ON p.enrollment_id = e.id AND p.status = 'confirmado'
      WHERE e.offering_id = ?
      `,
      [id]
    );

    return success(res, {
      ...offering,
      preco: Number(offering.preco),
      certificado_exigido: !!offering.certificado_exigido,
      inscricoes_recentes: enrollments,
      estatisticas: {
        ...stats,
        valor_total_arrecadado: Number(stats.valor_total_arrecadado || 0),
        taxa_confirmacao: stats.total_inscricoes > 0 ? (stats.confirmadas / stats.total_inscricoes * 100).toFixed(1) : 0
      }
    });

  } catch (err) {
    console.error('[TRAINING_OFFERING_GET]', err);
    return error(res, 'Erro ao obter detalhes da oferta.', 500);
  }
};

/**
 * PUT /api/admin/training-offerings/:id - Atualizar oferta de curso
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const updateTrainingOffering = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      preco,
      carga_horaria,
      certificado_exigido,
      especificacoes,
      status
    } = req.body;

    // Verificar se oferta existe
    const [[existing]] = await pool.execute(
      'SELECT id, center_id, course_id FROM training_center_courses WHERE id = ?',
      [id]
    );

    if (!existing) {
      return notFound(res, 'Oferta de curso não encontrada.');
    }

    // Construir query dinâmica
    const updates = [];
    const params = [];

    if (preco !== undefined) {
      if (preco < 0) {
        return badRequest(res, 'Preço deve ser um valor positivo.');
      }
      updates.push('preco = ?');
      params.push(Number(preco));
    }

    if (carga_horaria !== undefined) {
      updates.push('carga_horaria = ?');
      params.push(carga_horaria ? parseInt(carga_horaria, 10) : null);
    }

    if (certificado_exigido !== undefined) {
      updates.push('certificado_exigido = ?');
      params.push(certificado_exigido ? 1 : 0);
    }

    if (especificacoes !== undefined) {
      updates.push('especificacoes = ?');
      params.push(especificacoes?.trim() || null);
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
      `UPDATE training_center_courses SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Registrar auditoria
    await log(
      req.user.id,
      'UPDATE_TRAINING_OFFERING',
      'training_center_courses',
      id,
      { campos_atualizados: Object.keys(req.body) },
      req
    );

    return success(res, null, 'Oferta de curso atualizada com sucesso.');

  } catch (err) {
    console.error('[TRAINING_OFFERING_UPDATE]', err);
    return error(res, 'Erro ao atualizar oferta de curso.', 500);
  }
};

/**
 * DELETE /api/admin/training-offerings/:id - Desativar oferta de curso
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const deleteTrainingOffering = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se oferta existe
    const [[existing]] = await pool.execute(
      'SELECT id, center_id, course_id FROM training_center_courses WHERE id = ?',
      [id]
    );

    if (!existing) {
      return notFound(res, 'Oferta de curso não encontrada.');
    }

    // Verificar se existem inscrições ativas
    const [enrollments] = await pool.execute(
      'SELECT COUNT(*) as total FROM enrollments WHERE offering_id = ? AND status IN ("pendente", "em_analise", "confirmada")',
      [id]
    );

    if (enrollments[0].total > 0) {
      return badRequest(res, 'Não é possível desativar uma oferta com inscrições ativas.');
    }

    // Soft delete
    await pool.execute(
      'UPDATE training_center_courses SET status = "inativo", updated_at = NOW() WHERE id = ?',
      [id]
    );

    // Registrar auditoria
    await log(
      req.user.id,
      'DELETE_TRAINING_OFFERING',
      'training_center_courses',
      id,
      { center_id: existing.center_id, course_id: existing.course_id },
      req
    );

    return success(res, null, 'Oferta de curso desativada com sucesso.');

  } catch (err) {
    console.error('[TRAINING_OFFERING_DELETE]', err);
    return error(res, 'Erro ao desativar oferta de curso.', 500);
  }
};

/**
 * GET /api/training-offerings - Listar ofertas disponíveis para alunos
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const listPublicTrainingOfferings = async (req, res) => {
  try {
    const {
      course_id,
      provincia,
      municipio,
      categoria,
      nivel,
      min_preco,
      max_preco,
      sort = 'preco_asc'
    } = req.query;

    let query = `
      SELECT
        tcc.id,
        tcc.preco,
        tcc.carga_horaria,
        tcc.certificado_exigido,
        tcc.especificacoes,
        tc.id AS center_id,
        tc.nome AS nome_centro,
        tc.provincia,
        tc.municipio,
        tc.endereco,
        tc.email,
        tc.telefone,
        tc.whatsapp,
        c.id AS course_id,
        c.nome AS nome_curso,
        c.categoria,
        c.nivel,
        c.descricao AS descricao_curso
      FROM training_center_courses tcc
      INNER JOIN training_centers tc ON tc.id = tcc.center_id
      INNER JOIN courses c ON c.id = tcc.course_id
      WHERE tcc.status = 'ativo' AND tc.status = 'ativo' AND c.status = 'ativo'
    `;
    
    const params = [];

    // Aplicar filtros
    if (course_id) {
      query += ' AND tcc.course_id = ?';
      params.push(course_id);
    }

    if (provincia) {
      query += ' AND tc.provincia = ?';
      params.push(provincia);
    }

    if (municipio) {
      query += ' AND tc.municipio = ?';
      params.push(municipio);
    }

    if (categoria) {
      query += ' AND c.categoria = ?';
      params.push(categoria);
    }

    if (nivel) {
      query += ' AND c.nivel = ?';
      params.push(nivel);
    }

    if (min_preco) {
      query += ' AND tcc.preco >= ?';
      params.push(Number(min_preco));
    }

    if (max_preco) {
      query += ' AND tcc.preco <= ?';
      params.push(Number(max_preco));
    }

    // Aplicar ordenação
    switch (sort) {
      case 'preco_asc':
        query += ' ORDER BY tcc.preco ASC';
        break;
      case 'preco_desc':
        query += ' ORDER BY tcc.preco DESC';
        break;
      case 'nome_asc':
        query += ' ORDER BY c.nome ASC';
        break;
      case 'recentes':
        query += ' ORDER BY tcc.created_at DESC';
        break;
      default:
        query += ' ORDER BY tcc.preco ASC';
    }

    const [rows] = await pool.execute(query, params);

    // Enriquecer dados para exibição pública
    const enrichedRows = rows.map(row => ({
      id: row.id,
      preco: Number(row.preco),
      carga_horaria: row.carga_horaria,
      certificado_exigido: !!row.certificado_exigido,
      especificacoes: row.especificacoes,
      centro: {
        id: row.center_id,
        nome: row.nome_centro,
        provincia: row.provincia,
        municipio: row.municipio,
        endereco: row.endereco,
        contato: {
          email: row.email,
          telefone: row.telefone,
          whatsapp: row.whatsapp
        }
      },
      curso: {
        id: row.course_id,
        nome: row.nome_curso,
        categoria: row.categoria,
        nivel: row.nivel,
        descricao: row.descricao_curso
      }
    }));

    return success(res, {
      ofertas: enrichedRows,
      total: enrichedRows.length,
      filtros_aplicados: {
        course_id,
        provincia,
        municipio,
        categoria,
        nivel,
        min_preco,
        max_preco,
        sort
      }
    });

  } catch (err) {
    console.error('[TRAINING_OFFERING_PUBLIC_LIST]', err);
    return error(res, 'Erro ao listar ofertas de cursos.', 500);
  }
};

module.exports = {
  // Admin endpoints
  createTrainingOffering,
  listTrainingOfferings,
  getTrainingOffering,
  updateTrainingOffering,
  deleteTrainingOffering,
  
  // Public endpoints
  listPublicTrainingOfferings
};
