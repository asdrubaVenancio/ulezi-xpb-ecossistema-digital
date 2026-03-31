/**
 * ULEZI XPB — Controller de Vagas de Emprego
 * Empresas publicam vagas; administração aprova antes de publicar
 * Segue padrão MVC + Service Layer com validação completa
 */

const { pool }            = require('../config/database');
const { success, error, notFound } = require('../utils/response');
const { log }             = require('../utils/audit');

// ─── Vagas públicas (já aprovadas) ────────────────────────────────────────────
/**
 * GET /api/community/vagas
 * Lista vagas aprovadas (site público)
 */
const listPublicJobs = async (req, res) => {
  try {
    const pageNumber = Number.parseInt(req.query.page || '1', 10);
    const limitNumber = Number.parseInt(req.query.limit || '20', 10);
    const page   = Number.isNaN(pageNumber) ? 1 : Math.max(1, pageNumber);
    const limit  = Number.isNaN(limitNumber) ? 20 : Math.min(50, Math.max(1, limitNumber));
    const offset = (page - 1) * limit;
    const tipo   = req.query.tipo;
    const search = req.query.pesquisa || req.query.search;

    // Construir query de forma segura (sem SQL injection)
    let where  = 'WHERE j.status = "aprovada"';
    const params = [];

    if (tipo)   { where += ' AND j.tipo = ?';                    params.push(tipo); }
    if (search) { where += ' AND (j.titulo LIKE ? OR j.descricao LIKE ? OR j.localizacao LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    // Total para paginação
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM company_job_postings j
       LEFT JOIN company_profiles cp ON cp.id = j.company_id ${where}`,
      params
    );

    // Dados paginados — LIMIT e OFFSET interpolados directamente (são inteiros validados acima)
    const [rows] = await pool.query(
      `SELECT j.id, j.titulo, j.descricao, j.requisitos, j.localizacao,
              j.tipo, j.salario, j.contacto, j.aprovado_at as publicado_em,
              j.expires_at, cp.nome_empresa, cp.sector, cp.provincia,
              cp.municipio, u.foto_perfil
       FROM company_job_postings j
       LEFT JOIN company_profiles cp ON cp.id = j.company_id
       LEFT JOIN users            u  ON u.id  = cp.user_id
       ${where}
       ORDER BY j.aprovado_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return success(res, { vagas: rows, total, page, limit });
  } catch (err) {
    console.error('Erro listPublicJobs:', err);
    return error(res, 'Erro ao listar vagas.', 500);
  }
};

/**
 * GET /api/community/vagas/:id
 * Detalhe de uma vaga pública
 */
const getPublicJob = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return error(res, 'Identificador de vaga inválido.', 400);
    }

    const [[vaga]] = await pool.execute(
      `SELECT j.*, cp.nome_empresa, cp.sector, cp.provincia, cp.municipio,
              cp.descricao as empresa_descricao, u.email, u.telefone, u.foto_perfil
       FROM company_job_postings j
       LEFT JOIN company_profiles cp ON cp.id = j.company_id
       LEFT JOIN users u ON u.id = cp.user_id
       WHERE j.id = ? AND j.status = "aprovada"`,
      [id]
    );

    if (!vaga) return notFound(res, 'Vaga não encontrada.');

    return success(res, { vaga });
  } catch (err) {
    return error(res, 'Erro ao obter vaga.', 500);
  }
};

// ─── Empresa: gerir as suas próprias vagas ─────────────────────────────────────
/**
 * GET /api/jobs/minhas
 * Listar vagas da empresa autenticada
 */
const listMyJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obter company_id da empresa autenticada
    const [[cp]] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?',
      [userId]
    );
    if (!cp) return error(res, 'Perfil de empresa não encontrado.', 404);

    const [vagas] = await pool.execute(
      `SELECT j.*, u.nome as aprovado_por_nome
       FROM company_job_postings j
       LEFT JOIN users u ON u.id = j.aprovado_by
       WHERE j.company_id = ?
       ORDER BY j.created_at DESC`,
      [cp.id]
    );

    return success(res, { vagas });
  } catch (err) {
    return error(res, 'Erro ao listar vagas.', 500);
  }
};

/**
 * POST /api/jobs
 * Empresa submete nova vaga (fica pendente até aprovação)
 */
const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      titulo, descricao, requisitos, localizacao,
      tipo, salario, contacto, expires_at,
    } = req.body;

    // Validações básicas (schema Zod faz a maior parte no frontend, mas backend valida também)
    if (!titulo?.trim())    return error(res, 'Título é obrigatório.', 422);
    if (!descricao?.trim()) return error(res, 'Descrição é obrigatória.', 422);

    // Verificar empresa aprovada e com assinatura ativa
    const [[cp]] = await pool.execute(
      `SELECT cp.id FROM company_profiles cp
       LEFT JOIN subscriptions s ON s.company_id = cp.id AND s.status = 'ativa' AND s.data_fim >= CURDATE()
       WHERE cp.user_id = ? AND cp.is_approved = 1
       LIMIT 1`,
      [userId]
    );
    if (!cp) return error(res, 'Empresa não está aprovada ou a assinatura expirou.', 403);

    const [result] = await pool.execute(
      `INSERT INTO company_job_postings
       (company_id, titulo, descricao, requisitos, localizacao, tipo, salario, contacto, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cp.id, titulo, descricao, requisitos || null, localizacao || null,
       tipo || 'efetivo', salario || null, contacto || null, expires_at || null]
    );

    await log(userId, 'vaga_criada', 'company_job_postings', result.insertId, { titulo }, req);

    return success(res, { id: result.insertId }, 'Vaga submetida com sucesso. Aguarda aprovação da equipa.', 201);
  } catch (err) {
    console.error('Erro createJob:', err);
    return error(res, 'Erro ao criar vaga.', 500);
  }
};

/**
 * PUT /api/jobs/:id
 * Empresa edita vaga própria (apenas se ainda pendente)
 */
const updateJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return error(res, 'Identificador inválido.', 400);
    const { titulo, descricao, requisitos, localizacao, tipo, salario, contacto, expires_at } = req.body;

    const [[cp]] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?', [userId]
    );
    if (!cp) return error(res, 'Empresa não encontrada.', 404);

    const [[vaga]] = await pool.execute(
      'SELECT id, status FROM company_job_postings WHERE id = ? AND company_id = ?',
      [id, cp.id]
    );
    if (!vaga) return notFound(res, 'Vaga não encontrada.');
    if (vaga.status !== 'pendente') return error(res, 'Só é possível editar vagas pendentes.', 422);

    await pool.execute(
      `UPDATE company_job_postings SET titulo=?, descricao=?, requisitos=?,
       localizacao=?, tipo=?, salario=?, contacto=?, expires_at=?
       WHERE id=?`,
      [titulo, descricao, requisitos, localizacao, tipo, salario, contacto, expires_at, id]
    );

    await log(userId, 'vaga_editada', 'company_job_postings', id, { titulo }, req);

    return success(res, {}, 'Vaga actualizada com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao actualizar vaga.', 500);
  }
};

/**
 * DELETE /api/jobs/:id
 * Empresa elimina a própria vaga
 */
const deleteJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return error(res, 'Identificador inválido.', 400);

    const [[cp]] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?', [userId]
    );
    if (!cp) return error(res, 'Empresa não encontrada.', 404);

    const [result] = await pool.execute(
      'DELETE FROM company_job_postings WHERE id = ? AND company_id = ?',
      [id, cp.id]
    );
    if (result.affectedRows === 0) return notFound(res, 'Vaga não encontrada.');

    await log(userId, 'vaga_eliminada', 'company_job_postings', id, null, req);

    return success(res, {}, 'Vaga eliminada com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao eliminar vaga.', 500);
  }
};

// ─── Administração: aprovação de vagas ────────────────────────────────────────
/**
 * GET /api/admin/jobs
 * Admin lista todas as vagas (incluindo pendentes)
 */
const adminListJobs = async (req, res) => {
  try {
    const status = req.query.status;
    let where    = '';
    const params = [];

    if (status) { where = 'WHERE j.status = ?'; params.push(status); }

    const [vagas] = await pool.execute(
      `SELECT j.*, cp.nome_empresa, cp.sector,
              ua.nome as aprovado_por_nome
       FROM company_job_postings j
       LEFT JOIN company_profiles cp ON cp.id = j.company_id
       LEFT JOIN users            ua ON ua.id = j.aprovado_by
       ${where}
       ORDER BY j.created_at DESC`,
      params
    );

    // Contagens por estado
    const [[counts]] = await pool.execute(
      `SELECT
         SUM(status='pendente')  as pendentes,
         SUM(status='aprovada')  as aprovadas,
         SUM(status='rejeitada') as rejeitadas,
         SUM(status='encerrada') as encerradas,
         COUNT(*) as total
       FROM company_job_postings`
    );

    return success(res, { vagas, contagens: counts });
  } catch (err) {
    return error(res, 'Erro ao listar vagas.', 500);
  }
};

/**
 * PUT /api/admin/jobs/:id/approve
 * Admin aprova vaga
 */
const approveJob = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return error(res, 'Identificador inválido.', 400);

    const [[vaga]] = await pool.execute(
      'SELECT id, company_id FROM company_job_postings WHERE id = ?', [id]
    );
    if (!vaga) return notFound(res, 'Vaga não encontrada.');

    await pool.execute(
      `UPDATE company_job_postings
       SET status = "aprovada", aprovado_by = ?, aprovado_at = NOW()
       WHERE id = ?`,
      [adminId, id]
    );

    // Notificar a empresa
    const [[cp]] = await pool.execute(
      'SELECT user_id FROM company_profiles WHERE id = ?', [vaga.company_id]
    );
    if (cp) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'vaga_aprovada', 'Vaga aprovada!',
         'A sua vaga de emprego foi aprovada e já está visível na comunidade.')`,
        [cp.user_id]
      );
    }

    await log(adminId, 'vaga_aprovada', 'company_job_postings', id, null, req);

    return success(res, {}, 'Vaga aprovada com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao aprovar vaga.', 500);
  }
};

/**
 * PUT /api/admin/jobs/:id/reject
 * Admin rejeita vaga com motivo
 */
const rejectJob = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return error(res, 'Identificador inválido.', 400);
    const { motivo } = req.body;

    if (!motivo?.trim()) return error(res, 'Motivo de rejeição é obrigatório.', 422);

    const [[vaga]] = await pool.execute(
      'SELECT id, company_id FROM company_job_postings WHERE id = ?', [id]
    );
    if (!vaga) return notFound(res, 'Vaga não encontrada.');

    await pool.execute(
      `UPDATE company_job_postings
       SET status = "rejeitada", motivo_rejeicao = ?, aprovado_by = ?, aprovado_at = NOW()
       WHERE id = ?`,
      [motivo, adminId, id]
    );

    // Notificar empresa
    const [[cp]] = await pool.execute(
      'SELECT user_id FROM company_profiles WHERE id = ?', [vaga.company_id]
    );
    if (cp) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'vaga_rejeitada', 'Vaga rejeitada',
         CONCAT('A sua vaga foi rejeitada. Motivo: ', ?))`,
        [cp.user_id, motivo]
      );
    }

    await log(adminId, 'vaga_rejeitada', 'company_job_postings', id, { motivo }, req);

    return success(res, {}, 'Vaga rejeitada.');
  } catch (err) {
    return error(res, 'Erro ao rejeitar vaga.', 500);
  }
};

module.exports = {
  listPublicJobs, getPublicJob,
  listMyJobs, createJob, updateJob, deleteJob,
  adminListJobs, approveJob, rejectJob,
};
