/**
 * ULEZI XPB - Controller de Vagas de Emprego
 * Fluxo empresarial com publicacao imediata para empresas aprovadas
 * e expiracao automatica baseada na data limite configurada.
 */

const { pool } = require("../config/database");
const { success, error, notFound } = require("../utils/response");
const { log } = require("../utils/audit");
const { notificarNovaVaga } = require("../services/notification.service");

/**
 * Actualiza automaticamente vagas expiradas para manter o estado coerente.
 */
const syncExpiredJobs = async () => {
  await pool.execute(
    `UPDATE company_job_postings
     SET status = 'encerrada'
     WHERE status = 'aprovada'
       AND expires_at IS NOT NULL
       AND expires_at <= NOW()`,
  );
};

/**
 * Normaliza e valida a data limite da vaga.
 */
const parseExpirationDate = (value) => {
  if (!value) return { errorMessage: "A data limite da vaga e obrigatoria." };

  const expirationDate = new Date(value);
  if (Number.isNaN(expirationDate.getTime())) {
    return { errorMessage: "A data limite da vaga e invalida." };
  }

  if (expirationDate.getTime() <= Date.now()) {
    return { errorMessage: "A data limite da vaga deve ser futura." };
  }

  return { expirationDate };
};

/**
 * GET /api/community/vagas
 * Lista vagas publicas ainda activas.
 */
const listPublicJobs = async (req, res) => {
  try {
    await syncExpiredJobs();

    const pageNumber = Number.parseInt(req.query.page || "1", 10);
    const limitNumber = Number.parseInt(req.query.limit || "20", 10);
    const page = Number.isNaN(pageNumber) ? 1 : Math.max(1, pageNumber);
    const limit = Number.isNaN(limitNumber)
      ? 20
      : Math.min(50, Math.max(1, limitNumber));
    const offset = (page - 1) * limit;
    const tipo = req.query.tipo;
    const search = req.query.pesquisa || req.query.search;

    let where =
      'WHERE j.status = "aprovada" AND (j.expires_at IS NULL OR j.expires_at > NOW())';
    const params = [];

    if (tipo) {
      where += " AND j.tipo = ?";
      params.push(tipo);
    }

    if (search) {
      where +=
        " AND (j.titulo LIKE ? OR j.descricao LIKE ? OR j.localizacao LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM company_job_postings j
       LEFT JOIN company_profiles cp ON cp.id = j.company_id
       ${where}`,
      params,
    );

    const [rows] = await pool.query(
      `SELECT j.id, j.titulo, j.descricao, j.requisitos, j.localizacao,
              j.tipo, j.salario, j.contacto, j.aprovado_at as publicado_em,
              j.expires_at, cp.nome_empresa, cp.sector, cp.provincia,
              cp.municipio, u.foto_perfil
       FROM company_job_postings j
       LEFT JOIN company_profiles cp ON cp.id = j.company_id
       LEFT JOIN users u ON u.id = cp.user_id
       ${where}
       ORDER BY COALESCE(j.aprovado_at, j.created_at) DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params,
    );

    return success(res, { vagas: rows, total, page, limit });
  } catch (err) {
    console.error("Erro listPublicJobs:", err);
    return error(res, "Erro ao listar vagas.", 500);
  }
};

/**
 * GET /api/community/vagas/:id
 * Detalhe de uma vaga publica activa.
 */
const getPublicJob = async (req, res) => {
  try {
    await syncExpiredJobs();

    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return error(res, "Identificador de vaga invalido.", 400);
    }

    const [[vaga]] = await pool.execute(
      `SELECT j.*, cp.nome_empresa, cp.sector, cp.provincia, cp.municipio,
              cp.descricao as empresa_descricao, u.email, u.telefone, u.foto_perfil
       FROM company_job_postings j
       LEFT JOIN company_profiles cp ON cp.id = j.company_id
       LEFT JOIN users u ON u.id = cp.user_id
       WHERE j.id = ?
         AND j.status = 'aprovada'
         AND (j.expires_at IS NULL OR j.expires_at > NOW())`,
      [id],
    );

    if (!vaga) {
      return notFound(res, "Vaga nao encontrada.");
    }

    return success(res, { vaga });
  } catch (err) {
    return error(res, "Erro ao obter vaga.", 500);
  }
};

/**
 * GET /api/jobs/minhas
 * Lista vagas da empresa autenticada, ordenando pelas mais recentes.
 */
const listMyJobs = async (req, res) => {
  try {
    await syncExpiredJobs();

    const userId = req.user.id;
    const [[companyProfile]] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id = ?",
      [userId],
    );

    if (!companyProfile) {
      return error(res, "Perfil de empresa nao encontrado.", 404);
    }

    const [vagas] = await pool.execute(
      `SELECT j.*, u.nome as aprovado_por_nome
       FROM company_job_postings j
       LEFT JOIN users u ON u.id = j.aprovado_by
       WHERE j.company_id = ?
       ORDER BY COALESCE(j.aprovado_at, j.created_at) DESC`,
      [companyProfile.id],
    );

    return success(res, { vagas });
  } catch (err) {
    return error(res, "Erro ao listar vagas.", 500);
  }
};

/**
 * POST /api/jobs
 * Publica uma nova vaga de emprego.
 */
const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      titulo,
      descricao,
      requisitos,
      localizacao,
      tipo,
      salario,
      contacto,
      expires_at,
    } = req.body;

    if (!titulo?.trim()) return error(res, "Titulo e obrigatorio.", 422);
    if (!descricao?.trim()) return error(res, "Descricao e obrigatoria.", 422);

    const { expirationDate, errorMessage } = parseExpirationDate(expires_at);
    if (errorMessage) {
      return error(res, errorMessage, 422);
    }

    const [[companyProfile]] = await pool.execute(
      `SELECT cp.id
       FROM company_profiles cp
       WHERE cp.user_id = ? AND cp.is_approved = 1
       LIMIT 1`,
      [userId],
    );

    if (!companyProfile) {
      return error(
        res,
        "Empresa nao esta aprovada ou a assinatura expirou.",
        403,
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO company_job_postings
       (company_id, titulo, descricao, requisitos, localizacao, tipo, salario, contacto, expires_at, status, aprovado_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aprovada', NOW())`,
      [
        companyProfile.id,
        titulo.trim(),
        descricao.trim(),
        requisitos || null,
        localizacao || null,
        tipo || "efetivo",
        salario || null,
        contacto || null,
        expirationDate,
      ],
    );

    await log(
      userId,
      "vaga_criada",
      "company_job_postings",
      result.insertId,
      { titulo },
      req,
    );

    // Notificar empresa sobre a vaga criada
    const [[userData]] = await pool.execute(
      "SELECT email FROM users WHERE id = ?",
      [userId],
    );
    if (userData) {
      notificarNovaVaga(userId, userData.email, titulo).catch((e) =>
        console.error("[NOTIF_VAGA]", e.message),
      );
    }

    return success(
      res,
      { id: result.insertId },
      "Vaga publicada com sucesso.",
      201,
    );
  } catch (err) {
    console.error("Erro createJob:", err);
    return error(res, "Erro ao criar vaga.", 500);
  }
};

/**
 * PUT /api/jobs/:id
 * Edita uma vaga da propria empresa enquanto ela ainda nao expirou.
 */
const updateJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(id) || id <= 0) {
      return error(res, "Identificador invalido.", 400);
    }

    const {
      titulo,
      descricao,
      requisitos,
      localizacao,
      tipo,
      salario,
      contacto,
      expires_at,
    } = req.body;

    const { expirationDate, errorMessage } = parseExpirationDate(expires_at);
    if (errorMessage) {
      return error(res, errorMessage, 422);
    }

    const [[companyProfile]] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id = ?",
      [userId],
    );

    if (!companyProfile) {
      return error(res, "Empresa nao encontrada.", 404);
    }

    const [[vaga]] = await pool.execute(
      "SELECT id, status FROM company_job_postings WHERE id = ? AND company_id = ?",
      [id, companyProfile.id],
    );

    if (!vaga) {
      return notFound(res, "Vaga nao encontrada.");
    }

    if (vaga.status === "encerrada") {
      return error(res, "Nao e possivel editar uma vaga encerrada.", 422);
    }

    await pool.execute(
      `UPDATE company_job_postings
       SET titulo = ?, descricao = ?, requisitos = ?, localizacao = ?,
           tipo = ?, salario = ?, contacto = ?, expires_at = ?
       WHERE id = ?`,
      [
        titulo,
        descricao,
        requisitos,
        localizacao,
        tipo,
        salario,
        contacto,
        expirationDate,
        id,
      ],
    );

    await log(
      userId,
      "vaga_editada",
      "company_job_postings",
      id,
      { titulo },
      req,
    );

    return success(res, {}, "Vaga actualizada com sucesso.");
  } catch (err) {
    return error(res, "Erro ao actualizar vaga.", 500);
  }
};

/**
 * DELETE /api/jobs/:id
 * Elimina a propria vaga.
 */
const deleteJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(id) || id <= 0) {
      return error(res, "Identificador invalido.", 400);
    }

    const [[companyProfile]] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id = ?",
      [userId],
    );

    if (!companyProfile) {
      return error(res, "Empresa nao encontrada.", 404);
    }

    const [result] = await pool.execute(
      "DELETE FROM company_job_postings WHERE id = ? AND company_id = ?",
      [id, companyProfile.id],
    );

    if (result.affectedRows === 0) {
      return notFound(res, "Vaga nao encontrada.");
    }

    await log(userId, "vaga_eliminada", "company_job_postings", id, null, req);

    return success(res, {}, "Vaga eliminada com sucesso.");
  } catch (err) {
    return error(res, "Erro ao eliminar vaga.", 500);
  }
};

/**
 * GET /api/admin/jobs
 * Lista todas as vagas para gestão administrativa com paginação e filtros.
 */
const adminListJobs = async (req, res) => {
  try {
    await syncExpiredJobs();

    const { status, tipo, search, pesquisa, page = 1, limit = 15 } = req.query;
    const termoPesquisa = search || pesquisa;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let where = "WHERE 1=1";
    const params = [];

    if (status) {
      where += " AND j.status = ?";
      params.push(status);
    }
    if (tipo) {
      where += " AND j.tipo = ?";
      params.push(tipo);
    }
    if (termoPesquisa) {
      where +=
        " AND (j.titulo LIKE ? OR j.descricao LIKE ? OR cp.nome_empresa LIKE ?)";
      params.push(
        `%${termoPesquisa}%`,
        `%${termoPesquisa}%`,
        `%${termoPesquisa}%`,
      );
    }

    const [vagas] = await pool.execute(
      `SELECT j.id, j.titulo, j.descricao, j.requisitos, j.localizacao, j.tipo,
              j.salario, j.contacto, j.expires_at, j.status, j.created_at,
              j.motivo_rejeicao, j.aprovado_at,
              cp.nome_empresa, cp.sector,
              ua.nome AS aprovado_por_nome
       FROM company_job_postings j
       LEFT JOIN company_profiles cp ON cp.id = j.company_id
       LEFT JOIN users ua ON ua.id = j.aprovado_by
       ${where}
       ORDER BY j.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params,
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM company_job_postings j
       LEFT JOIN company_profiles cp ON cp.id = j.company_id
       ${where}`,
      params,
    );

    const [[counts]] = await pool.execute(
      `SELECT
         SUM(status = 'pendente') AS pendentes,
         SUM(status = 'aprovada') AS aprovadas,
         SUM(status = 'rejeitada') AS rejeitadas,
         SUM(status = 'encerrada') AS encerradas,
         COUNT(*) AS total
       FROM company_job_postings`,
    );

    const total = countRows[0]?.total || 0;

    return success(res, {
      vagas,
      contagens: counts,
      total,
      pagina: pageNum,
      limite: limitNum,
      total_paginas: Math.ceil(total / limitNum),
    });
  } catch (err) {
    return error(res, "Erro ao listar vagas.", 500);
  }
};

/**
 * PUT /api/admin/jobs/:id/approve
 */
const approveJob = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(id) || id <= 0) {
      return error(res, "Identificador invalido.", 400);
    }

    const [[vaga]] = await pool.execute(
      "SELECT id, company_id FROM company_job_postings WHERE id = ?",
      [id],
    );

    if (!vaga) {
      return notFound(res, "Vaga nao encontrada.");
    }

    await pool.execute(
      `UPDATE company_job_postings
       SET status = 'aprovada', aprovado_by = ?, aprovado_at = NOW()
       WHERE id = ?`,
      [adminId, id],
    );

    const [[companyProfile]] = await pool.execute(
      "SELECT user_id FROM company_profiles WHERE id = ?",
      [vaga.company_id],
    );

    if (companyProfile) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'vaga_aprovada', 'Vaga aprovada!',
                 'A sua vaga de emprego foi aprovada e ja esta visivel na comunidade.')`,
        [companyProfile.user_id],
      );
    }

    await log(adminId, "vaga_aprovada", "company_job_postings", id, null, req);

    return success(res, {}, "Vaga aprovada com sucesso.");
  } catch (err) {
    return error(res, "Erro ao aprovar vaga.", 500);
  }
};

/**
 * PUT /api/admin/jobs/:id/reject
 */
const rejectJob = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);
    const { motivo } = req.body;

    if (Number.isNaN(id) || id <= 0) {
      return error(res, "Identificador invalido.", 400);
    }

    if (!motivo?.trim()) {
      return error(res, "Motivo de rejeicao e obrigatorio.", 422);
    }

    const [[vaga]] = await pool.execute(
      "SELECT id, company_id FROM company_job_postings WHERE id = ?",
      [id],
    );

    if (!vaga) {
      return notFound(res, "Vaga nao encontrada.");
    }

    await pool.execute(
      `UPDATE company_job_postings
       SET status = 'rejeitada', motivo_rejeicao = ?, aprovado_by = ?, aprovado_at = NOW()
       WHERE id = ?`,
      [motivo, adminId, id],
    );

    const [[companyProfile]] = await pool.execute(
      "SELECT user_id FROM company_profiles WHERE id = ?",
      [vaga.company_id],
    );

    if (companyProfile) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'vaga_rejeitada', 'Vaga rejeitada',
                 CONCAT('A sua vaga foi rejeitada. Motivo: ', ?))`,
        [companyProfile.user_id, motivo],
      );
    }

    await log(
      adminId,
      "vaga_rejeitada",
      "company_job_postings",
      id,
      { motivo },
      req,
    );

    return success(res, {}, "Vaga rejeitada.");
  } catch (err) {
    return error(res, "Erro ao rejeitar vaga.", 500);
  }
};

module.exports = {
  listPublicJobs,
  getPublicJob,
  listMyJobs,
  createJob,
  updateJob,
  deleteJob,
  adminListJobs,
  approveJob,
  rejectJob,
};
