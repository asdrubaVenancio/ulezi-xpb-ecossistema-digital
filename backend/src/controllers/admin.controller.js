/**
 * Controller do Painel Administrativo
 */
const { pool } = require('../config/database');
const { success, error, notFound } = require('../utils/response');
const { log } = require('../utils/audit');

const normalizeRole = (role) => ({
  estudante: 'student',
  empresa: 'company',
  investidor: 'investor',
  funcionario: 'employee',
}[role] || role);

const mapCourse = (course) => ({
  id: course.id,
  nome: course.nome,
  descricao: course.descricao,
  preco: course.preco,
  nivel: course.nivel || 'basico',
  categoria: course.categoria,
  duracao_horas: course.duracao_horas ?? course.duracao ?? 0,
  ativo: course.status === 'ativo',
  status: course.status,
  criado_em: course.created_at,
});

/** GET /api/admin/dashboard - Estatísticas do dashboard */
const getDashboard = async (req, res) => {
  try {
    const [[users]] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE role NOT IN ("admin","employee")');
    const [[students]] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE role="student" AND status="ativo"');
    const [[companies]] = await pool.execute('SELECT COUNT(*) as total FROM company_profiles WHERE is_approved=1');
    const [[pendingCompanies]] = await pool.execute('SELECT COUNT(*) as total FROM company_profiles WHERE is_approved=0');
    const [[investors]] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE role="investor"');
    const [[enrollments]] = await pool.execute('SELECT COUNT(*) as total FROM enrollments');
    const [[paidEnrollments]] = await pool.execute('SELECT COUNT(*) as total FROM enrollments WHERE payment_status="pago"');
    const [[revenue]] = await pool.execute('SELECT COALESCE(SUM(valor),0) as total FROM payments WHERE status="confirmado"');
    const [[opportunities]] = await pool.execute('SELECT COUNT(*) as total FROM investment_opportunities WHERE status="ativa"');
    const [[contracts]] = await pool.execute('SELECT COUNT(*) as total FROM contracts');
    const [[pendingInterests]] = await pool.execute('SELECT COUNT(*) as total FROM investor_interests WHERE status="pendente"');
    // Pagamentos pendentes e vagas aprovadas
    const [[pendingPayments]] = await pool.execute('SELECT COUNT(*) as total FROM payments WHERE status="pendente"');
    const [[activeJobs]] = await pool.execute('SELECT COUNT(*) as total FROM company_job_postings WHERE status="aprovada"');

    // Inscrições recentes
    const [recentEnrollments] = await pool.execute(
      `SELECT e.numero_inscricao, u.nome, c.nome as curso, e.status, e.created_at
       FROM enrollments e LEFT JOIN users u ON u.id=e.student_id LEFT JOIN courses c ON c.id=e.course_id
       ORDER BY e.created_at DESC LIMIT 5`
    );

    return success(res, {
      stats: {
        // Campos em inglês (compatibilidade)
        total_users: users.total,
        students: students.total,
        companies_approved: companies.total,
        companies_pending: pendingCompanies.total,
        investors: investors.total,
        total_enrollments: enrollments.total,
        paid_enrollments: paidEnrollments.total,
        total_revenue: revenue.total,
        active_opportunities: opportunities.total,
        total_contracts: contracts.total,
        pending_interests: pendingInterests.total,
        // Campos em português (para o frontend)
        total_utilizadores: users.total,
        total_inscricoes: enrollments.total,
        total_empresas: companies.total,
        empresas_pendentes: pendingCompanies.total,
        total_investidores: investors.total,
        total_oportunidades: opportunities.total,
        total_contratos: contracts.total,
        oportunidades_pendentes: pendingInterests.total,
        receita_total: revenue.total,
        pagamentos_pendentes: pendingPayments.total,
        total_vagas: activeJobs.total,
      },
      recent_enrollments: recentEnrollments,
    });
  } catch (err) {
    return error(res, 'Erro ao carregar dashboard.', 500);
  }
};

/** GET /api/admin/users - Listar utilizadores */
const listUsers = async (req, res) => {
  try {
    const role = normalizeRole(req.query.role);
    const status = req.query.status;
    const search = req.query.search || req.query.pesquisa;
    const page = req.query.page || 1;
    const limit = req.query.limit || req.query.limite || 30;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT id, nome, email, telefone, role, status, created_at FROM users WHERE 1=1';
    const params = [];
    if (role) { query += ' AND role=?'; params.push(role); }
    if (status) { query += ' AND status=?'; params.push(status); }
    if (search) { query += ' AND (nome LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    return success(res, { utilizadores: rows, total: rows.length });
  } catch (err) {
    return error(res, 'Erro ao listar utilizadores.', 500);
  }
};

/** PUT /api/admin/users/:id/status - Alterar status do utilizador */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['ativo','inativo','bloqueado'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status inválido.' });
    }
    await pool.execute('UPDATE users SET status=? WHERE id=?', [status, id]);
    await log(req.user.id, 'UPDATE_USER_STATUS', 'users', id, { status }, req);
    return success(res, null, 'Status atualizado.');
  } catch (err) {
    return error(res, 'Erro ao atualizar status.', 500);
  }
};

/** GET /api/admin/training-centers - Listar centros de formação */
const listTrainingCenters = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT tc.*, COUNT(cc.course_id) as num_cursos FROM training_centers tc
       LEFT JOIN center_courses cc ON cc.center_id=tc.id
       GROUP BY tc.id ORDER BY tc.nome`
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'Erro ao listar centros.', 500);
  }
};

/** POST /api/admin/training-centers - Criar centro */
const createTrainingCenter = async (req, res) => {
  try {
    const { nome, provincia, municipio, endereco, email, telefone, whatsapp } = req.body;
    if (!nome || !provincia || !municipio) {
      return res.status(400).json({ success: false, message: 'Nome, província e município são obrigatórios.' });
    }
    const [result] = await pool.execute(
      'INSERT INTO training_centers (nome, provincia, municipio, endereco, email, telefone, whatsapp, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [nome, provincia, municipio, endereco||null, email||null, telefone||null, whatsapp||null, req.user.id]
    );
    await log(req.user.id, 'CREATE_CENTER', 'training_centers', result.insertId, { nome }, req);
    return res.status(201).json({ success: true, message: 'Centro criado.', data: { id: result.insertId } });
  } catch (err) {
    return error(res, 'Erro ao criar centro.', 500);
  }
};

/** POST /api/admin/training-centers/:id/courses - Atribuir curso a centro */
const assignCourseToCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_id } = req.body;
    await pool.execute(
      'INSERT IGNORE INTO center_courses (center_id, course_id) VALUES (?,?)',
      [id, course_id]
    );
    return success(res, null, 'Curso atribuído ao centro.');
  } catch (err) {
    return error(res, 'Erro ao atribuir curso.', 500);
  }
};

/** GET /api/admin/notifications - Notificações do sistema */
const listNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return success(res, {
      notificacoes: rows,
      nao_lidas: rows.filter((item) => !item.lida).length,
    });
  } catch (err) {
    return error(res, 'Erro ao listar notificações.', 500);
  }
};

/** PUT /api/admin/notifications/:id/read - Marcar como lida */
const markNotificationRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET lida=1, lida_at=NOW() WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    return success(res, null, 'Notificação marcada como lida.');
  } catch (err) {
    return error(res, 'Erro ao atualizar notificação.', 500);
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET lida=1, lida_at=COALESCE(lida_at, NOW()) WHERE user_id=? AND (lida IS NULL OR lida=0)',
      [req.user.id]
    );
    return success(res, null, 'Todas as notificações foram marcadas como lidas.');
  } catch (err) {
    return error(res, 'Erro ao atualizar notificações.', 500);
  }
};

/** GET /api/admin/audit-logs - Logs de auditoria */
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await pool.execute(
      `SELECT al.*, u.nome, u.email FROM audit_logs al
       LEFT JOIN users u ON u.id=al.user_id
       ORDER BY al.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`
    );
    return success(res, {
      registos: rows.map((row) => ({
        ...row,
        user_nome: row.nome,
        criado_em: row.created_at,
      })),
    });
  } catch (err) {
    return error(res, 'Erro ao obter logs.', 500);
  }
};

const listAdminCourses = async (req, res) => {
  try {
    const search = req.query.search || req.query.pesquisa;
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || req.query.limite || 50);
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (nome LIKE ? OR descricao LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    const countQuery = `SELECT COUNT(*) as total FROM courses WHERE 1=1${search ? ' AND (nome LIKE ? OR descricao LIKE ?)' : ''}`;
    const [countRows] = await pool.execute(countQuery, search ? [`%${search}%`, `%${search}%`] : []);

    return success(res, {
      cursos: rows.map(mapCourse),
      total: countRows[0]?.total || rows.length,
      pagina: page,
      limite: limit,
    });
  } catch (err) {
    return error(res, 'Erro ao listar cursos.', 500);
  }
};

const createAdminCourse = async (req, res) => {
  try {
    const { nome, descricao, preco, duracao_horas, categoria, nivel } = req.body;

    if (!nome || preco == null || preco === '') {
      return error(res, 'Nome e preço são obrigatórios.', 400);
    }

    const [result] = await pool.execute(
      `INSERT INTO courses (nome, descricao, preco, duracao, categoria, nivel, status, created_by)
       VALUES (?,?,?,?,?,?,?,?)`,
      [nome, descricao || null, preco, duracao_horas || null, categoria || null, nivel || 'basico', 'ativo', req.user.id]
    );

    await log(req.user.id, 'CREATE_COURSE', 'courses', result.insertId, { nome }, req);
    return success(res, { id: result.insertId }, 'Curso criado com sucesso.', 201);
  } catch (err) {
    return error(res, 'Erro ao criar curso.', 500);
  }
};

const updateAdminCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, duracao_horas, categoria, nivel, ativo } = req.body;
    const status = typeof ativo === 'boolean' ? (ativo ? 'ativo' : 'inativo') : (req.body.status || null);

    await pool.execute(
      `UPDATE courses SET nome=COALESCE(?,nome), descricao=COALESCE(?,descricao),
       preco=COALESCE(?,preco), duracao=COALESCE(?,duracao), categoria=COALESCE(?,categoria),
       nivel=COALESCE(?,nivel), status=COALESCE(?,status) WHERE id=?`,
      [nome ?? null, descricao ?? null, preco ?? null, duracao_horas ?? null, categoria ?? null, nivel ?? null, status, id]
    );

    await log(req.user.id, 'UPDATE_COURSE', 'courses', id, req.body, req);
    return success(res, null, 'Curso atualizado com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao atualizar curso.', 500);
  }
};

const listAdminOpportunities = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || req.query.limite || 50);
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT io.id, io.titulo, io.tipo, io.valor, io.status, io.created_at, cp.nome_empresa
       FROM investment_opportunities io
       LEFT JOIN company_profiles cp ON cp.id=io.company_id
       ORDER BY io.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    );
    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM investment_opportunities');

    return success(res, {
      oportunidades: rows.map((row) => ({
        id: row.id,
        titulo: row.titulo,
        nome_empresa: row.nome_empresa,
        tipo_servico: row.tipo,
        valor_pedido: row.valor,
        status: row.status,
        criado_em: row.created_at,
      })),
      total: countRows[0]?.total || rows.length,
      pagina: page,
      limite: limit,
    });
  } catch (err) {
    return error(res, 'Erro ao listar oportunidades.', 500);
  }
};

module.exports = {
  getDashboard, listUsers, updateUserStatus, listTrainingCenters,
  createTrainingCenter, assignCourseToCenter, listNotifications,
  markNotificationRead, markAllNotificationsRead, getAuditLogs,
  listAdminCourses, createAdminCourse, updateAdminCourse, listAdminOpportunities,
};

// ──────────────────────────────────────────────────────────────────────────────
// GESTÃO DE EMPRESAS (aprovação / rejeição)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/empresas
 * Lista todas as empresas com estados e contagens
 */
const listAdminCompanies = async (req, res) => {
  try {
    const status = req.query.status; // 'pendente' | 'aprovada' | 'rejeitada' | null
    let where = '';
    const params = [];

    if (status === 'pendente')  { where = 'WHERE cp.is_approved = 0 AND cp.motivo_rejeicao IS NULL'; }
    if (status === 'aprovada')  { where = 'WHERE cp.is_approved = 1'; }
    if (status === 'rejeitada') { where = 'WHERE cp.is_approved = 0 AND cp.motivo_rejeicao IS NOT NULL'; }

    const [rows] = await pool.execute(
      `SELECT cp.id, cp.nome_empresa, cp.nif, cp.sector, cp.provincia, cp.municipio,
              cp.is_approved, cp.motivo_rejeicao, cp.created_at,
              u.nome as representante, u.email, u.telefone,
              (SELECT COUNT(*) FROM company_documents cd WHERE cd.company_id = cp.id) as total_docs,
              s.status as sub_status, s.data_fim as sub_data_fim
       FROM company_profiles cp
       LEFT JOIN users u ON u.id = cp.user_id
       LEFT JOIN subscriptions s ON s.company_id = cp.id AND s.status = 'ativa'
       ${where}
       ORDER BY cp.created_at DESC`,
      params
    );

    // Contagens
    const [[counts]] = await pool.execute(
      `SELECT
         SUM(is_approved = 1) as aprovadas,
         SUM(is_approved = 0 AND motivo_rejeicao IS NULL) as pendentes,
         SUM(is_approved = 0 AND motivo_rejeicao IS NOT NULL) as rejeitadas,
         COUNT(*) as total
       FROM company_profiles`
    );

    return success(res, {
      empresas: rows.map(r => ({
        ...r,
        // Aliases para compatibilidade com o frontend
        num_documentos: r.total_docs,
        criado_em: r.created_at,
        estado: r.is_approved ? 'aprovada' : (r.motivo_rejeicao ? 'rejeitada' : 'pendente'),
      })),
      contagens: counts,
    });
  } catch (err) {
    console.error('listAdminCompanies:', err);
    return error(res, 'Erro ao listar empresas.', 500);
  }
};

/**
 * GET /api/admin/empresas/:id
 * Detalhe de uma empresa incluindo documentos
 */
const getAdminCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const [[cp]] = await pool.execute(
      `SELECT cp.*, u.nome, u.email, u.telefone, u.status as user_status
       FROM company_profiles cp
       LEFT JOIN users u ON u.id = cp.user_id
       WHERE cp.id = ?`,
      [id]
    );
    if (!cp) return notFound(res, 'Empresa não encontrada.');

    const [docs] = await pool.execute(
      'SELECT id, tipo, nome_ficheiro, url_ficheiro, status_verificacao, created_at FROM company_documents WHERE company_id = ?',
      [id]
    );

    const [subs] = await pool.execute(
      'SELECT * FROM subscriptions WHERE company_id = ? ORDER BY created_at DESC LIMIT 5',
      [id]
    );

    return success(res, {
      empresa: { ...cp, estado: cp.is_approved ? 'aprovada' : (cp.motivo_rejeicao ? 'rejeitada' : 'pendente') },
      documentos: docs,
      assinaturas: subs,
    });
  } catch (err) {
    return error(res, 'Erro ao obter empresa.', 500);
  }
};

/**
 * PUT /api/admin/empresas/:id/aprovar
 * Aprova empresa
 */
const approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const [[cp]] = await pool.execute(
      'SELECT id, user_id FROM company_profiles WHERE id = ?', [id]
    );
    if (!cp) return notFound(res, 'Empresa não encontrada.');

    await pool.execute(
      'UPDATE company_profiles SET is_approved=1, approved_by=?, approved_at=NOW(), motivo_rejeicao=NULL WHERE id=?',
      [adminId, id]
    );
    await pool.execute('UPDATE users SET status="ativo" WHERE id=?', [cp.user_id]);

    // Notificar empresa
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'empresa_aprovada', '🎉 Empresa aprovada!',
       'A sua empresa foi verificada e aprovada. Já pode publicar oportunidades de investimento.')`,
      [cp.user_id]
    );

    await log(adminId, 'APPROVE_COMPANY', 'company_profiles', id, {}, req);
    return success(res, {}, 'Empresa aprovada com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao aprovar empresa.', 500);
  }
};

/**
 * PUT /api/admin/empresas/:id/rejeitar
 * Rejeita empresa com motivo obrigatório
 */
const rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { motivo } = req.body;

    if (!motivo?.trim()) return error(res, 'Motivo de rejeição é obrigatório.', 422);

    const [[cp]] = await pool.execute(
      'SELECT id, user_id FROM company_profiles WHERE id = ?', [id]
    );
    if (!cp) return notFound(res, 'Empresa não encontrada.');

    await pool.execute(
      'UPDATE company_profiles SET is_approved=0, motivo_rejeicao=?, approved_by=?, approved_at=NOW() WHERE id=?',
      [motivo, adminId, id]
    );

    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'empresa_rejeitada', 'Empresa não aprovada',
       CONCAT('O seu perfil de empresa não foi aprovado. Motivo: ', ?))`,
      [cp.user_id, motivo]
    );

    await log(adminId, 'REJECT_COMPANY', 'company_profiles', id, { motivo }, req);
    return success(res, {}, 'Empresa rejeitada.');
  } catch (err) {
    return error(res, 'Erro ao rejeitar empresa.', 500);
  }
};

/**
 * POST /api/admin/empresas/:id/assinatura
 * Criar/renovar assinatura de empresa
 */
const createSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plano, valor, data_inicio, data_fim } = req.body;

    if (!plano || !valor || !data_inicio || !data_fim)
      return error(res, 'Plano, valor, data de início e fim são obrigatórios.', 422);

    // Expirar assinaturas anteriores
    await pool.execute(
      "UPDATE subscriptions SET status='expirada' WHERE company_id=? AND status='ativa'",
      [id]
    );

    const [result] = await pool.execute(
      'INSERT INTO subscriptions (company_id, plano, valor, data_inicio, data_fim, status, created_by) VALUES (?,?,?,?,?,?,?)',
      [id, plano, valor, data_inicio, data_fim, 'ativa', req.user.id]
    );

    await log(req.user.id, 'CREATE_SUBSCRIPTION', 'subscriptions', result.insertId, { plano }, req);
    return success(res, { id: result.insertId }, 'Assinatura criada com sucesso.', 201);
  } catch (err) {
    return error(res, 'Erro ao criar assinatura.', 500);
  }
};

/**
 * GET /api/admin/contratos
 * Lista contratos com dados completos
 */
const listAdminContracts = async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || 1);
    const limit = parseInt(req.query.limit || 50);
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT c.id, c.titulo, c.status, c.created_at,
              c.assinado_empresa, c.assinado_investidor,
              cp.nome_empresa,
              ui.nome as investidor_nome,
              io.tipo as oportunidade_tipo, io.titulo as oportunidade_titulo
       FROM contracts c
       LEFT JOIN company_profiles cp ON cp.id = c.company_id
       LEFT JOIN users ui ON ui.id = c.investor_id
       LEFT JOIN investment_opportunities io ON io.id = c.opportunity_id
       ORDER BY c.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    );

    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM contracts');

    return success(res, {
      contratos: rows.map((row) => ({
        ...row,
        criado_em: row.created_at,
      })),
      total,
      pagina: page,
    });
  } catch (err) {
    return error(res, 'Erro ao listar contratos.', 500);
  }
};

/**
 * GET /api/admin/pagamentos
 * Lista todos os pagamentos com filtros
 */
const listAdminPayments = async (req, res) => {
  try {
    const status = req.query.status;
    const page   = parseInt(req.query.page  || 1);
    const limit  = parseInt(req.query.limit || 50);
    const offset = (page - 1) * limit;
    let where = '';
    const params = [];

    if (status) { where = 'WHERE p.status = ?'; params.push(status); }

    const [rows] = await pool.execute(
      `SELECT p.id, p.valor, p.metodo, p.referencia, p.status, p.created_at,
              p.comprovativo_url, u.nome, u.email,
              c.nome as curso_nome, e.numero_inscricao
       FROM payments p
       LEFT JOIN enrollments e ON e.id = p.enrollment_id
       LEFT JOIN users u ON u.id = e.student_id
       LEFT JOIN courses c ON c.id = e.course_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [[revenue]] = await pool.execute(
      "SELECT COALESCE(SUM(valor),0) as total FROM payments WHERE status='confirmado'"
    );
    const [[pending]] = await pool.execute(
      "SELECT COALESCE(SUM(valor),0) as total FROM payments WHERE status='pendente'"
    );
    const [[{ count }]] = await pool.execute('SELECT COUNT(*) as count FROM payments');

    return success(res, {
      pagamentos: rows,
      resumo: { receita_total: revenue.total, pendente: pending.total, total_transacoes: count },
    });
  } catch (err) {
    return error(res, 'Erro ao listar pagamentos.', 500);
  }
};

/**
 * PUT /api/admin/pagamentos/:id/confirmar
 * Admin confirma pagamento manualmente
 */
const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const [[pag]] = await pool.execute(
      'SELECT id, enrollment_id FROM payments WHERE id = ?', [id]
    );
    if (!pag) return notFound(res, 'Pagamento não encontrado.');

    await pool.execute(
      "UPDATE payments SET status='confirmado', confirmado_by=?, confirmado_at=NOW() WHERE id=?",
      [adminId, id]
    );
    await pool.execute(
      "UPDATE enrollments SET payment_status='pago', status='confirmada' WHERE id=?",
      [pag.enrollment_id]
    );

    await log(adminId, 'CONFIRM_PAYMENT', 'payments', id, {}, req);
    return success(res, {}, 'Pagamento confirmado e inscrição activada.');
  } catch (err) {
    return error(res, 'Erro ao confirmar pagamento.', 500);
  }
};

/**
 * GET /api/admin/vagas-empresa
 * Admin lista vagas publicadas por empresas
 */
const listCompanyJobsAdmin = async (req, res) => {
  const { adminListJobs } = require('./jobs.controller');
  return adminListJobs(req, res);
};

/**
 * PUT /api/admin/vagas-empresa/:id/aprovar
 */
const approveCompanyJob = async (req, res) => {
  req.params.id = req.params.id;
  const { approveJob } = require('./jobs.controller');
  return approveJob(req, res);
};

/**
 * PUT /api/admin/vagas-empresa/:id/rejeitar
 */
const rejectCompanyJob = async (req, res) => {
  const { rejectJob } = require('./jobs.controller');
  return rejectJob(req, res);
};

/**
 * GET /api/admin/configuracoes
 * Lê configurações do sistema
 */
const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT chave, valor FROM system_settings');
    const settings = {};
    rows.forEach(r => { settings[r.chave] = r.valor; });
    return success(res, { configuracoes: settings });
  } catch (err) {
    // Tabela pode não existir ainda — retornar defaults
    return success(res, { configuracoes: {} });
  }
};

/**
 * PUT /api/admin/configuracoes
 * Actualiza configurações do sistema
 */
const updateSettings = async (req, res) => {
  try {
    const dados = req.body;
    for (const [chave, valor] of Object.entries(dados)) {
      await pool.execute(
        'INSERT INTO system_settings (chave, valor) VALUES (?,?) ON DUPLICATE KEY UPDATE valor=?',
        [chave, String(valor), String(valor)]
      );
    }
    await log(req.user.id, 'UPDATE_SETTINGS', 'system_settings', null, dados, req);
    return success(res, {}, 'Configurações guardadas com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao guardar configurações.', 500);
  }
};

/**
 * Funcionalidades avançadas dos centros de formação.
 * Mantidas em funções separadas para evitar regressão no restante controller.
 */
const updateTrainingCenterV2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, provincia, municipio, endereco, email, telefone, whatsapp, descricao, status } = req.body;

    await pool.execute(
      `UPDATE training_centers
       SET nome = COALESCE(?, nome),
           provincia = COALESCE(?, provincia),
           municipio = COALESCE(?, municipio),
           endereco = COALESCE(?, endereco),
           email = COALESCE(?, email),
           telefone = COALESCE(?, telefone),
           whatsapp = COALESCE(?, whatsapp),
           descricao = COALESCE(?, descricao),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [nome || null, provincia || null, municipio || null, endereco || null, email || null, telefone || null, whatsapp || null, descricao || null, status || null, id]
    );

    await log(req.user.id, 'UPDATE_CENTER', 'training_centers', id, req.body, req);
    return success(res, null, 'Centro actualizado com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao actualizar centro.', 500);
  }
};

const deleteTrainingCenterV2 = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE training_centers SET status="inativo" WHERE id=?', [id]);
    await pool.execute('UPDATE training_center_courses SET status="inativo" WHERE center_id=?', [id]);
    await log(req.user.id, 'DELETE_CENTER', 'training_centers', id, null, req);
    return success(res, null, 'Centro desactivado com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao desactivar centro.', 500);
  }
};

const saveCenterCourseOffering = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_id, preco, carga_horaria, certificado_exigido, especificacoes } = req.body;

    if (!course_id) {
      return res.status(400).json({ success: false, message: 'O curso é obrigatório.' });
    }

    await pool.execute('INSERT IGNORE INTO center_courses (center_id, course_id) VALUES (?,?)', [id, course_id]);
    await pool.execute(
      `INSERT INTO training_center_courses
        (center_id, course_id, preco, carga_horaria, certificado_exigido, especificacoes, created_by)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         preco = VALUES(preco),
         carga_horaria = VALUES(carga_horaria),
         certificado_exigido = VALUES(certificado_exigido),
         especificacoes = VALUES(especificacoes),
         status = 'ativo'`,
      [id, course_id, preco || 0, carga_horaria || null, certificado_exigido ? 1 : 0, especificacoes || null, req.user.id]
    );

    await log(req.user.id, 'UPSERT_CENTER_COURSE', 'training_center_courses', null, req.body, req);
    return success(res, null, 'Oferta do curso associada ao centro com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao guardar oferta do centro.', 500);
  }
};

const listCenterCourseOfferings = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT
        tcc.*,
        c.nome AS nome_curso,
        c.categoria,
        c.nivel
       FROM training_center_courses tcc
       INNER JOIN courses c ON c.id = tcc.course_id
       WHERE tcc.center_id = ?
       ORDER BY c.nome`,
      [id]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'Erro ao listar ofertas do centro.', 500);
  }
};

const updateCenterCourseOffering = async (req, res) => {
  try {
    const { centerId, offeringId } = req.params;
    const { preco, carga_horaria, certificado_exigido, especificacoes, status } = req.body;

    await pool.execute(
      `UPDATE training_center_courses
       SET preco = COALESCE(?, preco),
           carga_horaria = COALESCE(?, carga_horaria),
           certificado_exigido = COALESCE(?, certificado_exigido),
           especificacoes = COALESCE(?, especificacoes),
           status = COALESCE(?, status)
       WHERE id = ? AND center_id = ?`,
      [
        preco ?? null,
        carga_horaria ?? null,
        certificado_exigido === undefined ? null : (certificado_exigido ? 1 : 0),
        especificacoes ?? null,
        status ?? null,
        offeringId,
        centerId,
      ]
    );

    await log(req.user.id, 'UPDATE_CENTER_COURSE', 'training_center_courses', offeringId, req.body, req);
    return success(res, null, 'Oferta actualizada com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao actualizar oferta.', 500);
  }
};

const deleteCenterCourseOffering = async (req, res) => {
  try {
    const { centerId, offeringId } = req.params;
    await pool.execute('UPDATE training_center_courses SET status="inativo" WHERE id=? AND center_id=?', [offeringId, centerId]);
    await log(req.user.id, 'DELETE_CENTER_COURSE', 'training_center_courses', offeringId, { center_id: centerId }, req);
    return success(res, null, 'Oferta removida com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao remover oferta.', 500);
  }
};

// Actualizar exports
Object.assign(module.exports, {
  listAdminCompanies, getAdminCompany, approveCompany, rejectCompany,
  createSubscription, listAdminContracts, listAdminPayments, confirmPayment,
  listCompanyJobsAdmin, approveCompanyJob, rejectCompanyJob,
  getSettings, updateSettings,
  updateTrainingCenterV2, deleteTrainingCenterV2,
  saveCenterCourseOffering, listCenterCourseOfferings,
  updateCenterCourseOffering, deleteCenterCourseOffering,
});
