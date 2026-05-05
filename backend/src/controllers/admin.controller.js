/**
 * Controller do Painel Administrativo
 */
const fs = require("fs");
const path = require("path");
const { pool } = require("../config/database");
const { success, error, notFound } = require("../utils/response");
const { log } = require("../utils/audit");
const PDFDocument = require("pdfkit");
const {
  sendCompanyApprovalEmail,
  sendCompanyRejectionEmail,
} = require("../utils/email");
const {
  notificarDecisaoEmpresa,
  notificarVagaAprovada,
} = require("../services/notification.service");

const normalizeOfferingModalidade = (modalidade) =>
  modalidade === "online" ? "online" : "presencial";

const normalizeRole = (role) =>
  ({
    estudante: "student",
    empresa: "company",
    investidor: "investor",
    funcionario: "employee",
  })[role] || role;

const mapCourse = (course) => ({
  id: course.id,
  nome: course.nome,
  descricao: course.descricao,
  preco: course.preco,
  nivel: course.nivel || "basico",
  categoria: course.categoria,
  duracao_horas: course.duracao_horas ?? course.duracao ?? 0,
  ativo: course.status === "ativo",
  status: course.status,
  criado_em: course.created_at,
});

/** GET /api/admin/dashboard - Estatísticas do dashboard */
const getDashboard = async (req, res) => {
  try {
    const [[users]] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE role NOT IN ("admin","employee")',
    );
    const [[students]] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE role="student" AND status="ativo"',
    );
    const [[companies]] = await pool.execute(
      "SELECT COUNT(*) as total FROM company_profiles WHERE is_approved=1",
    );
    const [[pendingCompanies]] = await pool.execute(
      "SELECT COUNT(*) as total FROM company_profiles WHERE is_approved=0",
    );
    const [[investors]] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE role="investor"',
    );
    const [[enrollments]] = await pool.execute(
      "SELECT COUNT(*) as total FROM enrollments",
    );
    const [[paidEnrollments]] = await pool.execute(
      'SELECT COUNT(*) as total FROM enrollments WHERE payment_status="pago"',
    );
    const [[revenue]] = await pool.execute(
      'SELECT COALESCE(SUM(valor),0) as total FROM payments WHERE status="confirmado"',
    );
    const [[opportunities]] = await pool.execute(
      'SELECT COUNT(*) as total FROM investment_opportunities WHERE status="ativa"',
    );
    const [[contracts]] = await pool.execute(
      "SELECT COUNT(*) as total FROM contracts",
    );
    const [[pendingInterests]] = await pool.execute(
      'SELECT COUNT(*) as total FROM investor_interests WHERE status="pendente"',
    );
    // Pagamentos pendentes e vagas aprovadas
    const [[pendingPayments]] = await pool.execute(
      'SELECT COUNT(*) as total FROM payments WHERE status="pendente"',
    );
    const [[activeJobs]] = await pool.execute(
      'SELECT COUNT(*) as total FROM company_job_postings WHERE status="aprovada"',
    );

    // Inscrições recentes
    const [recentEnrollments] = await pool.execute(
      `SELECT e.numero_inscricao, u.nome, c.nome as curso, e.status, e.created_at
       FROM enrollments e LEFT JOIN users u ON u.id=e.student_id LEFT JOIN courses c ON c.id=e.course_id
       ORDER BY e.created_at DESC LIMIT 5`,
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
    return error(res, "Erro ao carregar dashboard.", 500);
  }
};

/** GET /api/admin/users — Lista utilizadores com paginação real e filtros (excluindo admin) */
const listUsers = async (req, res) => {
  try {
    const role = normalizeRole(req.query.role);
    const status = req.query.status;
    const search = req.query.search || req.query.pesquisa;
    // Filtro para empresas de consultoria
    const tipoEmpresa = req.query.tipo_empresa;
    const page = parseInt(req.query.page || req.query.pagina || 1, 10);
    const limit = parseInt(req.query.limit || req.query.limite || 20, 10);
    const offset = (page - 1) * limit;

    // Nunca listar o admin na lista de utilizadores
    let where = "WHERE u.role != 'admin'";
    const params = [];

    if (role) {
      where += " AND u.role = ?";
      params.push(role);
    }
    if (status) {
      where += " AND u.status = ?";
      params.push(status);
    }
    if (search) {
      where += " AND (u.nome LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (tipoEmpresa) {
      where += " AND cp.tipo_empresa = ?";
      params.push(tipoEmpresa);
    }

    const selectQuery = `
      SELECT u.id, u.nome, u.email, u.telefone, u.role, u.status, u.created_at,
             cp.tipo_empresa, cp.nome_empresa
      FROM users u
      LEFT JOIN company_profiles cp ON cp.user_id = u.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}`;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN company_profiles cp ON cp.user_id = u.id
      ${where}`;

    const [rows] = await pool.execute(selectQuery, params);
    const [countRows] = await pool.execute(countQuery, params);

    const total = countRows[0]?.total || 0;

    return success(res, {
      utilizadores: rows,
      total,
      pagina: page,
      limite: limit,
      total_paginas: Math.ceil(total / limit),
    });
  } catch (err) {
    return error(res, "Erro ao listar utilizadores.", 500);
  }
};

/** PUT /api/admin/users/:id/status — Alterar status do utilizador (protege o admin) */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Verificar se o utilizador existe e não é admin
    const [userRows] = await pool.execute(
      "SELECT role FROM users WHERE id = ?",
      [id],
    );
    if (userRows.length === 0)
      return notFound(res, "Utilizador não encontrado.");
    if (userRows[0].role === "admin") {
      return error(
        res,
        "Não é possível alterar o estado do administrador.",
        403,
      );
    }

    if (!["ativo", "inativo", "bloqueado"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status inválido." });
    }

    await pool.execute("UPDATE users SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    await log(req.user.id, "UPDATE_USER_STATUS", "users", id, { status }, req);
    return success(res, null, "Status atualizado.");
  } catch (err) {
    return error(res, "Erro ao atualizar status.", 500);
  }
};

/** GET /api/admin/training-centers - Listar centros de formação */
const listTrainingCenters = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT tc.*, COUNT(cc.course_id) as num_cursos FROM training_centers tc
       LEFT JOIN center_courses cc ON cc.center_id=tc.id
       GROUP BY tc.id ORDER BY tc.nome`,
    );
    return success(res, rows);
  } catch (err) {
    return error(res, "Erro ao listar centros.", 500);
  }
};

/** POST /api/admin/training-centers - Criar centro */
const createTrainingCenter = async (req, res) => {
  try {
    const { nome, provincia, municipio, endereco, email, telefone, whatsapp } =
      req.body;
    if (!nome || !provincia || !municipio) {
      return res.status(400).json({
        success: false,
        message: "Nome, província e município são obrigatórios.",
      });
    }
    const [result] = await pool.execute(
      "INSERT INTO training_centers (nome, provincia, municipio, endereco, email, telefone, whatsapp, created_by) VALUES (?,?,?,?,?,?,?,?)",
      [
        nome,
        provincia,
        municipio,
        endereco || null,
        email || null,
        telefone || null,
        whatsapp || null,
        req.user.id,
      ],
    );
    await log(
      req.user.id,
      "CREATE_CENTER",
      "training_centers",
      result.insertId,
      { nome },
      req,
    );
    return res.status(201).json({
      success: true,
      message: "Centro criado.",
      data: { id: result.insertId },
    });
  } catch (err) {
    return error(res, "Erro ao criar centro.", 500);
  }
};

/** POST /api/admin/training-centers/:id/courses - Atribuir curso a centro */
const assignCourseToCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_id } = req.body;
    await pool.execute(
      "INSERT IGNORE INTO center_courses (center_id, course_id) VALUES (?,?)",
      [id, course_id],
    );
    return success(res, null, "Curso atribuído ao centro.");
  } catch (err) {
    return error(res, "Erro ao atribuir curso.", 500);
  }
};

/** GET /api/admin/notifications - Notificações do sistema */
const listNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
      [userId],
    );
    return success(res, {
      notificacoes: rows,
      nao_lidas: rows.filter((item) => !item.lida).length,
    });
  } catch (err) {
    return error(res, "Erro ao listar notificações.", 500);
  }
};

/** PUT /api/admin/notifications/:id/read - Marcar como lida */
const markNotificationRead = async (req, res) => {
  try {
    await pool.execute(
      "UPDATE notifications SET lida=1, lida_at=NOW() WHERE id=? AND user_id=?",
      [req.params.id, req.user.id],
    );
    return success(res, null, "Notificação marcada como lida.");
  } catch (err) {
    return error(res, "Erro ao atualizar notificação.", 500);
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await pool.execute(
      "UPDATE notifications SET lida=1, lida_at=COALESCE(lida_at, NOW()) WHERE user_id=? AND (lida IS NULL OR lida=0)",
      [req.user.id],
    );
    return success(
      res,
      null,
      "Todas as notificações foram marcadas como lidas.",
    );
  } catch (err) {
    return error(res, "Erro ao atualizar notificações.", 500);
  }
};

/** GET /api/admin/auditoria — Logs de auditoria com paginação e filtros */
const getAuditLogs = async (req, res) => {
  try {
    const { search, pesquisa, acao, page = 1, limit = 20 } = req.query;
    const termoPesquisa = search || pesquisa;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let where = "WHERE 1=1";
    const params = [];

    if (termoPesquisa) {
      where += " AND (u.nome LIKE ? OR u.email LIKE ? OR al.acao LIKE ?)";
      params.push(
        `%${termoPesquisa}%`,
        `%${termoPesquisa}%`,
        `%${termoPesquisa}%`,
      );
    }
    if (acao) {
      where += " AND al.acao = ?";
      params.push(acao);
    }

    const [rows] = await pool.execute(
      `SELECT al.*, u.nome, u.email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ${parseInt(limit, 10)} OFFSET ${offset}`,
      params,
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}`,
      params,
    );

    const total = countRows[0]?.total || 0;

    return success(res, {
      registos: rows.map((row) => ({
        ...row,
        user_nome: row.nome,
        criado_em: row.created_at,
      })),
      total,
      pagina: parseInt(page, 10),
      limite: parseInt(limit, 10),
      total_paginas: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    return error(res, "Erro ao obter logs.", 500);
  }
};

const listAdminCourses = async (req, res) => {
  try {
    const search = req.query.search || req.query.pesquisa;
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || req.query.limite || 50);
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM courses WHERE 1=1";
    const params = [];

    if (search) {
      query += " AND (nome LIKE ? OR descricao LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    const countQuery = `SELECT COUNT(*) as total FROM courses WHERE 1=1${search ? " AND (nome LIKE ? OR descricao LIKE ?)" : ""}`;
    const [countRows] = await pool.execute(
      countQuery,
      search ? [`%${search}%`, `%${search}%`] : [],
    );

    return success(res, {
      cursos: rows.map(mapCourse),
      total: countRows[0]?.total || rows.length,
      pagina: page,
      limite: limit,
    });
  } catch (err) {
    return error(res, "Erro ao listar cursos.", 500);
  }
};

const createAdminCourse = async (req, res) => {
  try {
    const { nome, descricao, preco, duracao_horas, categoria, nivel } =
      req.body;

    if (!nome) {
      return error(res, "Nome do curso é obrigatório.", 400);
    }

    const [result] = await pool.execute(
      `INSERT INTO courses (nome, descricao, preco, duracao, categoria, nivel, status, created_by)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        nome,
        descricao || null,
        preco === undefined || preco === null || preco === "" ? 0 : preco,
        duracao_horas === undefined || duracao_horas === ""
          ? null
          : duracao_horas,
        categoria || null,
        ["basico", "intermedio", "avancado"].includes(nivel) ? nivel : "basico",
        "ativo",
        req.user.id,
      ],
    );

    await log(
      req.user.id,
      "CREATE_COURSE",
      "courses",
      result.insertId,
      { nome },
      req,
    );
    return success(
      res,
      { id: result.insertId },
      "Curso criado com sucesso.",
      201,
    );
  } catch (err) {
    return error(res, "Erro ao criar curso.", 500);
  }
};

const updateAdminCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, duracao_horas, categoria, nivel, ativo } =
      req.body;
    const status =
      typeof ativo === "boolean"
        ? ativo
          ? "ativo"
          : "inativo"
        : req.body.status || null;

    await pool.execute(
      `UPDATE courses SET nome=COALESCE(?,nome), descricao=COALESCE(?,descricao),
       preco=COALESCE(?,preco), duracao=COALESCE(?,duracao), categoria=COALESCE(?,categoria),
       nivel=COALESCE(?,nivel), status=COALESCE(?,status) WHERE id=?`,
      [
        nome ?? null,
        descricao ?? null,
        preco ?? null,
        duracao_horas ?? null,
        categoria ?? null,
        nivel ?? null,
        status,
        id,
      ],
    );

    await log(req.user.id, "UPDATE_COURSE", "courses", id, req.body, req);
    return success(res, null, "Curso atualizado com sucesso.");
  } catch (err) {
    return error(res, "Erro ao atualizar curso.", 500);
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
       LIMIT ${limit} OFFSET ${offset}`,
    );
    const [countRows] = await pool.execute(
      "SELECT COUNT(*) as total FROM investment_opportunities",
    );

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
    return error(res, "Erro ao listar oportunidades.", 500);
  }
};

module.exports = {
  getDashboard,
  listUsers,
  updateUserStatus,
  listTrainingCenters,
  createTrainingCenter,
  assignCourseToCenter,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAuditLogs,
  listAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  listAdminOpportunities,
};

// ──────────────────────────────────────────────────────────────────────────────
// FICHEIROS DO SISTEMA (listagem consolidada por categorias)
// ──────────────────────────────────────────────────────────────────────────────

const normalizarCategoriaFicheiro = (categoria) => {
  const mapa = {
    pagamentos: "pagamentos",
    comprovativos: "pagamentos",
    documentos_empresa: "documentos_empresa",
    empresa_documentos: "documentos_empresa",
    contratos: "contratos",
    recibos: "recibos",
    cursos: "cursos",
    oportunidades: "oportunidades",
  };
  const key = String(categoria || "")
    .trim()
    .toLowerCase();
  return mapa[key] || key || "";
};

const caminhoAbsolutoUploads = () =>
  path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");

const existeFicheiroLocal = (relativePath) => {
  if (!relativePath) return false;
  const caminho = path.resolve(
    caminhoAbsolutoUploads(),
    relativePath.replace(/^\/+/, ""),
  );
  return fs.existsSync(caminho);
};

/**
 * GET /api/admin/ficheiros
 * Lista ficheiros do sistema por categoria com filtros e paginação
 */
const listSystemFiles = async (req, res) => {
  try {
    const {
      categoria,
      proprietario,
      owner_id,
      search,
      pesquisa,
      page = 1,
      limit = 20,
    } = req.query;

    const categoriaNormalizada = normalizarCategoriaFicheiro(categoria);
    const termoPesquisa = (search || pesquisa || "").trim();
    const ownerId = owner_id ? Number(owner_id) : null;

    const pageNum = Number.isNaN(parseInt(page, 10))
      ? 1
      : Math.max(1, parseInt(page, 10));
    const limitNum = Number.isNaN(parseInt(limit, 10))
      ? 20
      : Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let ficheiros = [];

    // Pagamentos (comprovativos)
    if (!categoriaNormalizada || categoriaNormalizada === "pagamentos") {
      const [rows] = await pool.execute(
        `SELECT
          p.id,
          'pagamentos' AS categoria,
          p.comprovativo_url AS url_ficheiro,
          p.referencia AS nome_referencia,
          p.created_at,
          u.id AS proprietario_id,
          u.nome AS proprietario_nome,
          u.email AS proprietario_email,
          u.role AS proprietario_tipo
         FROM payments p
         INNER JOIN enrollments e ON e.id = p.enrollment_id
         INNER JOIN users u ON u.id = e.student_id
         WHERE p.comprovativo_url IS NOT NULL`,
      );
      ficheiros.push(...rows);
    }

    // Documentos de empresa
    if (
      !categoriaNormalizada ||
      categoriaNormalizada === "documentos_empresa"
    ) {
      const [rows] = await pool.execute(
        `SELECT
          cd.id,
          'documentos_empresa' AS categoria,
          cd.url_ficheiro,
          COALESCE(cd.nome_ficheiro, cd.tipo) AS nome_referencia,
          cd.created_at,
          u.id AS proprietario_id,
          u.nome AS proprietario_nome,
          u.email AS proprietario_email,
          u.role AS proprietario_tipo
         FROM company_documents cd
         INNER JOIN company_profiles cp ON cp.id = cd.company_id
         INNER JOIN users u ON u.id = cp.user_id
         WHERE cd.url_ficheiro IS NOT NULL`,
      );
      ficheiros.push(...rows);
    }

    // Contratos
    if (!categoriaNormalizada || categoriaNormalizada === "contratos") {
      const [rows] = await pool.execute(
        `SELECT
          c.id,
          'contratos' AS categoria,
          c.pdf_url AS url_ficheiro,
          c.titulo AS nome_referencia,
          c.created_at,
          ui.id AS proprietario_id,
          ui.nome AS proprietario_nome,
          ui.email AS proprietario_email,
          ui.role AS proprietario_tipo
         FROM contracts c
         LEFT JOIN users ui ON ui.id = c.investor_id
         WHERE c.pdf_url IS NOT NULL`,
      );
      ficheiros.push(...rows);
    }

    // Recibos
    if (!categoriaNormalizada || categoriaNormalizada === "recibos") {
      const [rows] = await pool.execute(
        `SELECT
          r.id,
          'recibos' AS categoria,
          r.pdf_url AS url_ficheiro,
          r.numero_recibo AS nome_referencia,
          r.created_at,
          u.id AS proprietario_id,
          u.nome AS proprietario_nome,
          u.email AS proprietario_email,
          u.role AS proprietario_tipo
         FROM receipts r
         INNER JOIN enrollments e ON e.id = r.enrollment_id
         INNER JOIN users u ON u.id = e.student_id
         WHERE r.pdf_url IS NOT NULL`,
      );
      ficheiros.push(...rows);
    }

    // Filtros em memória
    if (proprietario) {
      const tipoProprietario = String(proprietario).trim().toLowerCase();
      ficheiros = ficheiros.filter(
        (f) =>
          String(f.proprietario_tipo || "").toLowerCase() === tipoProprietario,
      );
    }

    if (ownerId) {
      ficheiros = ficheiros.filter(
        (f) => Number(f.proprietario_id) === ownerId,
      );
    }

    if (termoPesquisa) {
      const termo = termoPesquisa.toLowerCase();
      ficheiros = ficheiros.filter((f) => {
        const base = [
          f.nome_referencia,
          f.url_ficheiro,
          f.proprietario_nome,
          f.proprietario_email,
          f.categoria,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return base.includes(termo);
      });
    }

    ficheiros.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );

    const total = ficheiros.length;
    const paginados = ficheiros.slice(offset, offset + limitNum).map((f) => ({
      ...f,
      existe_localmente: existeFicheiroLocal(f.url_ficheiro),
      criado_em: f.created_at,
    }));

    const contagensPorCategoria = ficheiros.reduce((acc, item) => {
      acc[item.categoria] = (acc[item.categoria] || 0) + 1;
      return acc;
    }, {});

    return success(res, {
      ficheiros: paginados,
      contagens: contagensPorCategoria,
      total,
      pagina: pageNum,
      limite: limitNum,
      total_paginas: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (err) {
    return error(res, "Erro ao listar ficheiros do sistema.", 500);
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// GERAÇÃO DE LISTAS (CSV/PDF/WORD)
// ──────────────────────────────────────────────────────────────────────────────

const podeGerarListas = async (req) => {
  if (req.user.role === "admin") return true;
  if (req.user.role !== "employee") return false;

  const [rows] = await pool.execute(
    "SELECT cargo FROM employees WHERE user_id = ? LIMIT 1",
    [req.user.id],
  );
  if (!rows.length) return false;

  const cargo = String(rows[0].cargo || "")
    .trim()
    .toLowerCase();
  return cargo === "secretario" || cargo === "secretário";
};

const parseFlexibleDate = (value, boundary = "start") => {
  if (!value) return null;
  const raw = String(value).trim();

  const isMonthYear = /^(\d{1,2})\/(\d{4})$/.test(raw);
  const isDayMonthYear = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(raw);

  if (isDayMonthYear) {
    const [, d, m, y] = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/) || [];
    const day = String(d).padStart(2, "0");
    const month = String(m).padStart(2, "0");
    return `${y}-${month}-${day}`;
  }

  if (isMonthYear) {
    const [, m, y] = raw.match(/^(\d{1,2})\/(\d{4})$/) || [];
    const month = String(m).padStart(2, "0");
    if (boundary === "start") return `${y}-${month}-01`;

    const nextMonth = new Date(Number(y), Number(month), 1);
    nextMonth.setDate(0);
    const lastDay = String(nextMonth.getDate()).padStart(2, "0");
    return `${y}-${month}-${lastDay}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const normalizarEstadoConta = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "ativo") return "Ativo";
  if (s === "inativo") return "Inativo";
  if (s === "bloqueado") return "Bloqueado";
  if (s === "pendente") return "Pendente";
  return status || "—";
};

const formatarDataTabela = (value) => {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const y = dt.getFullYear();
  return `${d}/${m}/${y}`;
};

const definirColunasPorTipo = (tipo, rows) => {
  if (tipo === "geral") {
    return [
      { key: "nome_exibicao", label: "Nome" },
      { key: "tipo_conta", label: "Tipo de conta" },
      { key: "email", label: "Email" },
      { key: "telefone", label: "Telefone" },
      { key: "estado_conta", label: "Estado" },
    ];
  }

  if (tipo === "estudantes") {
    return [
      { key: "nome", label: "Nome" },
      { key: "email", label: "Email" },
      { key: "telefone", label: "Telefone" },
      { key: "estado_conta", label: "Estado" },
      { key: "cursos", label: "Curso(s)" },
      { key: "centros", label: "Centro de formação" },
      { key: "ultima_data_evento", label: "Data pagamento/inscrição" },
    ];
  }

  if (tipo === "empresas") {
    return [
      { key: "nome_empresa", label: "Nome da empresa" },
      { key: "representante", label: "Representante" },
      { key: "email", label: "Email" },
      { key: "telefone", label: "Telefone" },
      { key: "estado_conta", label: "Estado" },
    ];
  }

  if (tipo === "investidores") {
    return [
      { key: "nome", label: "Nome" },
      { key: "email", label: "Email" },
      { key: "telefone", label: "Telefone" },
      { key: "estado_conta", label: "Estado" },
    ];
  }

  if (tipo === "funcionarios") {
    return [
      { key: "nome", label: "Nome" },
      { key: "email", label: "Email" },
      { key: "telefone", label: "Telefone" },
      { key: "cargo", label: "Cargo" },
      { key: "departamento", label: "Departamento" },
      { key: "estado_conta", label: "Estado" },
    ];
  }

  if (!rows.length) return [];
  return Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
};

const escapeCsv = (value) => {
  const str = String(value ?? "");
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const gerarCsv = (dados, colunas) => {
  if (!dados.length) return "sem_resultados\n";
  const header = colunas.map((c) => c.label).join(",");
  const linhas = dados.map((row) =>
    colunas.map((c) => escapeCsv(row[c.key])).join(","),
  );
  return [header, ...linhas].join("\n");
};

const gerarWordTabela = (titulo, subtitulo, dados, colunas) => {
  const dataGeracao = formatarDataTabela(new Date());

  const css = `
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; }
    .header {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: #ffffff;
      padding: 24px 28px;
    }
    .titulo { font-size: 24px; font-weight: 700; margin: 0 0 6px 0; }
    .subtitulo { font-size: 13px; margin: 0; opacity: 0.95; }
    .meta {
      padding: 12px 28px 0 28px;
      font-size: 12px;
      color: #4b5563;
    }
    .wrap { padding: 14px 28px 24px 28px; }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 1px solid #e5e7eb;
    }
    thead th {
      background: #f3f4f6;
      color: #111827;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      padding: 10px 8px;
      border: 1px solid #e5e7eb;
      word-break: break-word;
    }
    tbody td {
      font-size: 11px;
      padding: 8px;
      border: 1px solid #e5e7eb;
      vertical-align: top;
      word-break: break-word;
    }
    tbody tr:nth-child(even) { background: #fafafa; }
    .vazio {
      padding: 22px 28px;
      font-size: 13px;
      color: #374151;
    }
  `;

  if (!dados.length) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${titulo}</title>
<style>${css}</style>
</head>
<body>
  <div class="header">
    <h1 class="titulo">${titulo}</h1>
    <p class="subtitulo">${subtitulo}</p>
  </div>
  <div class="meta">Gerado em: ${dataGeracao}</div>
  <div class="vazio">Sem resultados para os filtros informados.</div>
</body>
</html>`;
  }

  const headerHtml = colunas.map((c) => `<th>${c.label}</th>`).join("");
  const bodyHtml = dados
    .map((row) => {
      const tds = colunas
        .map((c) => `<td>${String(row[c.key] ?? "—")}</td>`)
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${titulo}</title>
<style>${css}</style>
</head>
<body>
  <div class="header">
    <h1 class="titulo">${titulo}</h1>
    <p class="subtitulo">${subtitulo}</p>
  </div>
  <div class="meta">Gerado em: ${dataGeracao}</div>
  <div class="wrap">
    <table>
      <thead>
        <tr>${headerHtml}</tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  </div>
</body>
</html>`;
};

const gerarPdfTabela = (titulo, subtitulo, dados, colunas) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 32, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, doc.page.width, 80).fill("#0ea5e9");
    doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold");
    doc.text(titulo, 32, 22, { align: "left" });
    doc.fontSize(10).font("Helvetica");
    doc.text(subtitulo, 32, 46, { align: "left" });

    doc.fillColor("#111827");
    doc.moveDown(3);

    if (!dados.length) {
      doc.fontSize(11).text("Sem resultados para os filtros informados.");
      doc.end();
      return;
    }

    let y = 96;
    const larguraUtil = doc.page.width - 64;
    const larguraCol = Math.max(80, Math.floor(larguraUtil / colunas.length));

    doc.font("Helvetica-Bold").fontSize(9);
    colunas.forEach((col, idx) => {
      doc.text(col.label, 32 + idx * larguraCol, y, {
        width: larguraCol - 6,
        ellipsis: true,
      });
    });

    y += 16;
    doc
      .moveTo(32, y)
      .lineTo(doc.page.width - 32, y)
      .strokeColor("#d1d5db")
      .stroke();
    y += 8;

    doc.font("Helvetica").fontSize(8.5);

    dados.forEach((row) => {
      if (y > doc.page.height - 48) {
        doc.addPage();
        y = 40;
      }

      colunas.forEach((col, idx) => {
        doc.text(String(row[col.key] ?? "—"), 32 + idx * larguraCol, y, {
          width: larguraCol - 6,
          height: 28,
          ellipsis: true,
        });
      });

      y += 22;
    });

    doc.end();
  });

const obterDadosLista = async (tipo, filtros) => {
  const {
    tipo_empresa,
    centro_id,
    curso_id,
    data_inicio,
    data_fim,
    periodo_pagamento = "todos",
  } = filtros;

  const inicio = parseFlexibleDate(data_inicio, "start");
  const fim = parseFlexibleDate(data_fim, "end");

  if (tipo === "estudantes") {
    let where = "WHERE u.role = 'student'";
    const params = [];

    if (centro_id) {
      where += " AND e.center_id = ?";
      params.push(centro_id);
    }
    if (curso_id) {
      where += " AND e.course_id = ?";
      params.push(curso_id);
    }

    const colunaData =
      periodo_pagamento === "pagamento" ? "p.confirmado_at" : "e.created_at";
    if (inicio) {
      where += ` AND DATE(${colunaData}) >= ?`;
      params.push(inicio);
    }
    if (fim) {
      where += ` AND DATE(${colunaData}) <= ?`;
      params.push(fim);
    }

    const [rows] = await pool.execute(
      `SELECT
         u.id,
         u.nome,
         u.email,
         u.telefone,
         u.status,
         GROUP_CONCAT(DISTINCT c.nome ORDER BY c.nome SEPARATOR ', ') AS cursos,
         GROUP_CONCAT(DISTINCT tc.nome ORDER BY tc.nome SEPARATOR ', ') AS centros,
         MAX(COALESCE(p.confirmado_at, e.created_at)) AS ultima_data_evento
       FROM users u
       LEFT JOIN enrollments e ON e.student_id = u.id
       LEFT JOIN courses c ON c.id = e.course_id
       LEFT JOIN training_centers tc ON tc.id = e.center_id
       LEFT JOIN payments p ON p.enrollment_id = e.id AND p.status = 'confirmado'
       ${where}
       GROUP BY u.id, u.nome, u.email, u.telefone, u.status
       ORDER BY u.nome ASC`,
      params,
    );

    return rows.map((r) => ({
      nome: r.nome,
      email: r.email || "—",
      telefone: r.telefone || "—",
      estado_conta: normalizarEstadoConta(r.status),
      cursos: r.cursos || "—",
      centros: r.centros || "—",
      ultima_data_evento: formatarDataTabela(r.ultima_data_evento),
    }));
  }

  if (tipo === "empresas") {
    let where = "WHERE u.role = 'company'";
    const params = [];

    if (tipo_empresa) {
      where += " AND cp.tipo_empresa = ?";
      params.push(tipo_empresa);
    }

    const [rows] = await pool.execute(
      `SELECT
         cp.nome_empresa,
         COALESCE(NULLIF(u.nome,''), cp.nome_empresa) AS representante,
         u.email,
         u.telefone,
         u.status
       FROM users u
       LEFT JOIN company_profiles cp ON cp.user_id = u.id
       ${where}
       ORDER BY cp.nome_empresa ASC`,
      params,
    );

    return rows.map((r) => ({
      nome_empresa: r.nome_empresa || "—",
      representante: r.representante || "—",
      email: r.email || "—",
      telefone: r.telefone || "—",
      estado_conta: normalizarEstadoConta(r.status),
    }));
  }

  if (tipo === "investidores") {
    const [rows] = await pool.execute(
      `SELECT u.nome, u.email, u.telefone, u.status
       FROM users u
       WHERE u.role = 'investor'
       ORDER BY u.nome ASC`,
    );

    return rows.map((r) => ({
      nome: r.nome || "—",
      email: r.email || "—",
      telefone: r.telefone || "—",
      estado_conta: normalizarEstadoConta(r.status),
    }));
  }

  if (tipo === "funcionarios") {
    const [rows] = await pool.execute(
      `SELECT u.nome, u.email, u.telefone, u.status, e.cargo, e.departamento
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.role = 'employee'
       ORDER BY u.nome ASC`,
    );

    return rows.map((r) => ({
      nome: r.nome || "—",
      email: r.email || "—",
      telefone: r.telefone || "—",
      cargo: r.cargo || "—",
      departamento: r.departamento || "—",
      estado_conta: normalizarEstadoConta(r.status),
    }));
  }

  if (tipo === "geral") {
    const [rows] = await pool.execute(
      `SELECT
         u.role,
         u.nome,
         u.email,
         u.telefone,
         u.status,
         cp.nome_empresa,
         cp.tipo_empresa
       FROM users u
       LEFT JOIN company_profiles cp ON cp.user_id = u.id
       WHERE u.role IN ('student','company','investor')
       ORDER BY u.created_at DESC`,
    );

    return rows.map((r) => {
      const tipoConta =
        r.role === "student"
          ? "Aluno"
          : r.role === "investor"
            ? "Investidor"
            : r.tipo_empresa === "consultoria"
              ? "Empresa (Consultoria)"
              : "Empresa (Normal)";

      return {
        nome_exibicao:
          r.role === "company"
            ? r.nome_empresa || r.nome || "—"
            : r.nome || "—",
        tipo_conta: tipoConta,
        email: r.email || "—",
        telefone: r.telefone || "—",
        estado_conta: normalizarEstadoConta(r.status),
      };
    });
  }

  return [];
};

/**
 * GET /api/admin/listas/:tipo
 * Gera listas de utilizadores em csv/pdf/word
 */
const generateSystemList = async (req, res) => {
  try {
    const permitido = await podeGerarListas(req);
    if (!permitido) {
      return error(
        res,
        "Apenas admin ou funcionário com cargo Secretário podem gerar listas.",
        403,
      );
    }

    const tipo = String(req.params.tipo || "")
      .trim()
      .toLowerCase();

    const tiposValidos = [
      "geral",
      "estudantes",
      "empresas",
      "investidores",
      "funcionarios",
    ];
    if (!tiposValidos.includes(tipo)) {
      return error(
        res,
        "Tipo de lista inválido. Use: geral, estudantes, empresas, investidores ou funcionarios.",
        400,
      );
    }

    const formato = String(req.query.formato || "csv")
      .trim()
      .toLowerCase();

    if (!["csv", "pdf", "word"].includes(formato)) {
      return error(res, "Formato inválido. Use csv, pdf ou word.", 400);
    }

    const rows = await obterDadosLista(tipo, req.query);
    const colunas = definirColunasPorTipo(tipo, rows);

    const titulo = `ULEZI XPI — Lista de ${tipo}`;
    const subtitulo = `Total de registos: ${rows.length}`;

    await log(
      req.user.id,
      "GENERATE_SYSTEM_LIST",
      "users",
      null,
      {
        tipo,
        formato,
        filtros: req.query,
        total: rows.length,
      },
      req,
    );

    if (formato === "csv") {
      const csv = gerarCsv(rows, colunas);
      const csvComBom = `\uFEFF${csv}`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="lista-${tipo}.csv"`,
      );
      return res.status(200).send(csvComBom);
    }

    if (formato === "word") {
      const conteudo = gerarWordTabela(titulo, subtitulo, rows, colunas);
      res.setHeader("Content-Type", "application/msword; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="lista-${tipo}.doc"`,
      );
      return res.status(200).send(conteudo);
    }

    const pdfBuffer = await gerarPdfTabela(titulo, subtitulo, rows, colunas);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="lista-${tipo}.pdf"`,
    );
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    return error(res, "Erro ao gerar lista do sistema.", 500);
  }
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
    let where = "";
    const params = [];

    if (status === "pendente") {
      where = "WHERE cp.is_approved = 0 AND cp.motivo_rejeicao IS NULL";
    }
    if (status === "aprovada") {
      where = "WHERE cp.is_approved = 1";
    }
    if (status === "rejeitada") {
      where = "WHERE cp.is_approved = 0 AND cp.motivo_rejeicao IS NOT NULL";
    }

    const [rows] = await pool.execute(
      `SELECT cp.id, cp.nome_empresa, cp.nif, cp.sector, cp.provincia, cp.municipio,
              cp.is_approved, cp.motivo_rejeicao, cp.created_at, cp.status_verificacao,
              COALESCE(NULLIF(u.nome, ''), cp.nome_empresa) as representante,
              u.email, u.telefone,
              (
                SELECT COUNT(*)
                FROM company_documents cd
                WHERE cd.company_id = cp.id
              ) as total_docs,
              s.status as sub_status,
              s.data_fim as sub_data_fim,
              s.tipo_plano as sub_plano
       FROM company_profiles cp
       LEFT JOIN users u ON u.id = cp.user_id
       LEFT JOIN subscriptions s ON s.id = (
         SELECT s2.id
         FROM subscriptions s2
         WHERE s2.company_id = cp.id
           AND s2.status = 'ativa'
           AND s2.data_fim >= CURDATE()
         ORDER BY s2.data_fim DESC, s2.id DESC
         LIMIT 1
       )
       ${where}
       ORDER BY cp.created_at DESC`,
      params,
    );

    // Contagens
    const [[counts]] = await pool.execute(
      `SELECT
         SUM(is_approved = 1) as aprovadas,
         SUM(is_approved = 0 AND motivo_rejeicao IS NULL) as pendentes,
         SUM(is_approved = 0 AND motivo_rejeicao IS NOT NULL) as rejeitadas,
         COUNT(*) as total
       FROM company_profiles`,
    );

    res.set("Cache-Control", "no-store");

    return success(res, {
      empresas: rows.map((r) => ({
        ...r,
        // Aliases para compatibilidade com o frontend
        num_documentos: r.total_docs,
        criado_em: r.created_at,
        estado: r.is_approved
          ? "aprovada"
          : r.motivo_rejeicao
            ? "rejeitada"
            : "pendente",
      })),
      contagens: counts,
    });
  } catch (err) {
    console.error("listAdminCompanies:", err);
    return error(res, "Erro ao listar empresas.", 500);
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
      [id],
    );
    if (!cp) return notFound(res, "Empresa não encontrada.");

    const [docs] = await pool.execute(
      `SELECT id, tipo, nome_ficheiro, url_ficheiro, status_verificacao, created_at,
              visualizado_at, visualizado_by, verificado_at, verificado_by
       FROM company_documents WHERE company_id = ?`,
      [id],
    );

    const [subs] = await pool.execute(
      "SELECT * FROM subscriptions WHERE company_id = ? ORDER BY created_at DESC LIMIT 5",
      [id],
    );

    res.set("Cache-Control", "no-store");

    return success(res, {
      empresa: {
        ...cp,
        estado: cp.is_approved
          ? "aprovada"
          : cp.motivo_rejeicao
            ? "rejeitada"
            : "pendente",
      },
      documentos: docs,
      assinaturas: subs,
    });
  } catch (err) {
    return error(res, "Erro ao obter empresa.", 500);
  }
};

/**
 * GET /api/admin/empresas/documentos/:documentId/visualizar
 * Marca documento da empresa como visualizado e devolve a respetiva URL.
 */
const viewCompanyDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const [[doc]] = await pool.execute(
      `SELECT id, url_ficheiro, visualizado_at
       FROM company_documents
       WHERE id = ?`,
      [documentId],
    );
    if (!doc) return notFound(res, "Documento não encontrado.");

    await pool.execute(
      `UPDATE company_documents
       SET visualizado_at = COALESCE(visualizado_at, NOW()),
           visualizado_by = COALESCE(visualizado_by, ?)
       WHERE id = ?`,
      [userId, documentId],
    );

    return success(res, {
      url: doc.url_ficheiro,
      visualizado_em: doc.visualizado_at || new Date().toISOString(),
    });
  } catch (err) {
    return error(res, "Erro ao abrir documento.", 500);
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
      "SELECT id, user_id, nome_empresa, nif FROM company_profiles WHERE id = ?",
      [id],
    );
    if (!cp) return notFound(res, "Empresa não encontrada.");

    const [[docsResumo]] = await pool.execute(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN visualizado_at IS NOT NULL THEN 1 ELSE 0 END) as visualizados
       FROM company_documents
       WHERE company_id = ?`,
      [id],
    );
    if (!docsResumo.total)
      return error(
        res,
        "NÃ£o Ã© possÃ­vel aprovar sem documentos submetidos.",
        422,
      );
    if ((docsResumo.visualizados || 0) < docsResumo.total) {
      return error(
        res,
        "Abra todos os documentos da empresa antes da aprovaÃ§Ã£o.",
        422,
      );
    }

    await pool.execute(
      "UPDATE company_profiles SET is_approved=1, approved_by=?, approved_at=NOW(), motivo_rejeicao=NULL WHERE id=?",
      [adminId, id],
    );
    await pool.execute(
      `UPDATE company_profiles
       SET status_verificacao='aprovado_visita'
       WHERE id=?`,
      [id],
    );
    await pool.execute(
      `UPDATE company_documents
       SET status_verificacao='aprovado', verificado_by=?, verificado_at=NOW()
       WHERE company_id=?`,
      [adminId, id],
    );
    await pool.execute('UPDATE users SET status="ativo" WHERE id=?', [
      cp.user_id,
    ]);

    // Notificar empresa (interna + email)
    console.log('[APPROVE_COMPANY] Buscando email do usuário:', cp.user_id);
    const [[user]] = await pool.execute(
      "SELECT email, nome FROM users WHERE id = ?",
      [cp.user_id],
    );
    console.log('[APPROVE_COMPANY] Usuário encontrado:', user ? 'Sim' : 'Não', user?.email);

    if (user?.email) {
      console.log('[APPROVE_COMPANY] Enviando notificação interna para user_id:', cp.user_id);
      try {
        await notificarDecisaoEmpresa(
          cp.user_id,
          user.email,
          cp.nome_empresa,
          true,
          null,
        );
        console.log('[APPROVE_COMPANY] Notificação interna enviada com sucesso');
      } catch (notifErr) {
        console.error('[APPROVE_COMPANY] Erro na notificação interna:', notifErr.message);
      }

      // Também enviar email tradicional
      try {
        await sendCompanyApprovalEmail(user.email, {
          nome_empresa: cp.nome_empresa,
          nif: cp.nif,
        });
        console.log('[APPROVE_COMPANY] Email de aprovação enviado');
      } catch (emailErr) {
        console.error('[APPROVE_COMPANY] Erro ao enviar email:', emailErr.message);
      }
    } else {
      console.log('[APPROVE_COMPANY] Não foi possível notificar: email não encontrado');
    }

    await log(adminId, "APPROVE_COMPANY", "company_profiles", id, {}, req);
    return success(res, {}, "Empresa aprovada com sucesso.");
  } catch (err) {
    return error(res, "Erro ao aprovar empresa.", 500);
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

    if (!motivo?.trim())
      return error(res, "Motivo de rejeição é obrigatório.", 422);

    const [[cp]] = await pool.execute(
      "SELECT id, user_id, nome_empresa, nif FROM company_profiles WHERE id = ?",
      [id],
    );
    if (!cp) return notFound(res, "Empresa não encontrada.");

    const [[docsResumo]] = await pool.execute(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN visualizado_at IS NOT NULL THEN 1 ELSE 0 END) as visualizados
       FROM company_documents
       WHERE company_id = ?`,
      [id],
    );
    if (!docsResumo.total)
      return error(
        res,
        "NÃ£o Ã© possÃ­vel rejeitar sem documentos submetidos.",
        422,
      );
    if ((docsResumo.visualizados || 0) < docsResumo.total) {
      return error(
        res,
        "Abra todos os documentos da empresa antes da rejeiÃ§Ã£o.",
        422,
      );
    }

    await pool.execute(
      "UPDATE company_profiles SET is_approved=0, motivo_rejeicao=?, approved_by=?, approved_at=NOW() WHERE id=?",
      [motivo, adminId, id],
    );
    await pool.execute(
      `UPDATE company_profiles
       SET status_verificacao='reprovado_visita'
       WHERE id=?`,
      [id],
    );
    await pool.execute(
      `UPDATE company_documents
       SET status_verificacao='rejeitado', verificado_by=?, verificado_at=NOW()
       WHERE company_id=?`,
      [adminId, id],
    );

    // Notificar empresa sobre rejeição (interna + email)
    const [[user]] = await pool.execute(
      "SELECT email FROM users WHERE id = ?",
      [cp.user_id],
    );
    if (user?.email) {
      notificarDecisaoEmpresa(
        cp.user_id,
        user.email,
        cp.nome_empresa,
        false,
        motivo,
      ).catch((e) => console.error("[NOTIF_REJEICAO]", e.message));
      
      // Também enviar email tradicional
      try {
        await sendCompanyRejectionEmail(user.email, {
          nome_empresa: cp.nome_empresa,
          nif: cp.nif,
          motivo: motivo,
        });
      } catch (emailErr) {
        console.error("Erro ao enviar email de rejeição:", emailErr);
      }
    }

    await log(
      adminId,
      "REJECT_COMPANY",
      "company_profiles",
      id,
      { motivo },
      req,
    );
    return success(res, {}, "Empresa rejeitada.");
  } catch (err) {
    return error(res, "Erro ao rejeitar empresa.", 500);
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
      return error(
        res,
        "Plano, valor, data de início e fim são obrigatórios.",
        422,
      );

    // Expirar assinaturas anteriores
    await pool.execute(
      "UPDATE subscriptions SET status='expirada' WHERE company_id=? AND status='ativa'",
      [id],
    );

    const [result] = await pool.execute(
      "INSERT INTO subscriptions (company_id, plano, valor, data_inicio, data_fim, status, created_by) VALUES (?,?,?,?,?,?,?)",
      [id, plano, valor, data_inicio, data_fim, "ativa", req.user.id],
    );

    await log(
      req.user.id,
      "CREATE_SUBSCRIPTION",
      "subscriptions",
      result.insertId,
      { plano },
      req,
    );
    return success(
      res,
      { id: result.insertId },
      "Assinatura criada com sucesso.",
      201,
    );
  } catch (err) {
    return error(res, "Erro ao criar assinatura.", 500);
  }
};

/**
 * GET /api/admin/contratos
 * Lista contratos com dados completos
 */
const listAdminContracts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 50);
    const search = (req.query.search || req.query.pesquisa || "").trim();
    const status = (req.query.status || "").trim();
    const offset = (page - 1) * limit;
    const params = [];
    const where = [];

    if (search) {
      where.push(
        "(c.titulo LIKE ? OR cp.nome_empresa LIKE ? OR ui.nome LIKE ? OR io.titulo LIKE ?)",
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      if (status === "assinado_ambos") {
        where.push("c.assinado_empresa = 1 AND c.assinado_investidor = 1");
      } else {
        where.push("c.status = ?");
        params.push(status);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

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
       ${whereSql}
        ORDER BY c.created_at DESC
        LIMIT ${limit} OFFSET ${offset}`,
      params,
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM contracts c
       LEFT JOIN company_profiles cp ON cp.id = c.company_id
       LEFT JOIN users ui ON ui.id = c.investor_id
       LEFT JOIN investment_opportunities io ON io.id = c.opportunity_id
       ${whereSql}`,
      params,
    );

    return success(res, {
      contratos: rows.map((row) => ({
        ...row,
        status:
          row.assinado_empresa && row.assinado_investidor
            ? "assinado_ambos"
            : row.status,
        criado_em: row.created_at,
      })),
      total,
      pagina: page,
      limite: limit,
      total_paginas: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    return error(res, "Erro ao listar contratos.", 500);
  }
};

/**
 * GET /api/admin/pagamentos
 * Lista todos os pagamentos com filtros
 */
const listAdminPayments = async (req, res) => {
  try {
    const status = req.query.status;
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 50);
    const offset = (page - 1) * limit;
    let where = "";
    const params = [];

    if (status) {
      where = "WHERE p.status = ?";
      params.push(status);
    }

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
      params,
    );

    const [[revenue]] = await pool.execute(
      "SELECT COALESCE(SUM(valor),0) as total FROM payments WHERE status='confirmado'",
    );
    const [[pending]] = await pool.execute(
      "SELECT COALESCE(SUM(valor),0) as total FROM payments WHERE status='pendente'",
    );
    const [[{ count }]] = await pool.execute(
      "SELECT COUNT(*) as count FROM payments",
    );

    return success(res, {
      pagamentos: rows,
      resumo: {
        receita_total: revenue.total,
        pendente: pending.total,
        total_transacoes: count,
      },
    });
  } catch (err) {
    return error(res, "Erro ao listar pagamentos.", 500);
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
      "SELECT id, enrollment_id FROM payments WHERE id = ?",
      [id],
    );
    if (!pag) return notFound(res, "Pagamento não encontrado.");

    await pool.execute(
      "UPDATE payments SET status='confirmado', confirmado_by=?, confirmado_at=NOW() WHERE id=?",
      [adminId, id],
    );
    await pool.execute(
      "UPDATE enrollments SET payment_status='pago', status='confirmada' WHERE id=?",
      [pag.enrollment_id],
    );

    // Notificar aluno sobre confirmação do pagamento
    const [[inscricao]] = await pool.execute(
      `SELECT e.student_id, e.course_id, p.valor, c.nome as nome_curso, u.email
       FROM enrollments e
       LEFT JOIN payments p ON p.enrollment_id = e.id
       LEFT JOIN courses c ON c.id = e.course_id
       LEFT JOIN users u ON u.id = e.student_id
       WHERE e.id = ?`,
      [pag.enrollment_id],
    );
    if (inscricao?.email) {
      notificarPagamentoConfirmado(
        inscricao.student_id,
        inscricao.email,
        inscricao.nome_curso || 'Curso',
        inscricao.valor || 0,
      ).catch((e) => console.error('[NOTIF_PAGAMENTO]', e.message));
    }

    await log(adminId, "CONFIRM_PAYMENT", "payments", id, {}, req);
    return success(res, {}, "Pagamento confirmado e inscrição activada.");
  } catch (err) {
    return error(res, "Erro ao confirmar pagamento.", 500);
  }
};

/**
 * GET /api/admin/vagas-empresa
 * Admin lista vagas publicadas por empresas
 */
const listCompanyJobsAdmin = async (req, res) => {
  const { adminListJobs } = require("./jobs.controller");
  return adminListJobs(req, res);
};

/**
 * PUT /api/admin/vagas-empresa/:id/aprovar
 */
const approveCompanyJob = async (req, res) => {
  req.params.id = req.params.id;
  const { approveJob } = require("./jobs.controller");
  return approveJob(req, res);
};

/**
 * PUT /api/admin/vagas-empresa/:id/rejeitar
 */
const rejectCompanyJob = async (req, res) => {
  const { rejectJob } = require("./jobs.controller");
  return rejectJob(req, res);
};

/**
 * GET /api/admin/configuracoes
 * Lê configurações do sistema
 */
const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT chave, valor FROM system_settings",
    );
    const settings = {};
    rows.forEach((r) => {
      settings[r.chave] = r.valor;
    });
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
        "INSERT INTO system_settings (chave, valor) VALUES (?,?) ON DUPLICATE KEY UPDATE valor=?",
        [chave, String(valor), String(valor)],
      );
    }
    await log(
      req.user.id,
      "UPDATE_SETTINGS",
      "system_settings",
      null,
      dados,
      req,
    );
    return success(res, {}, "Configurações guardadas com sucesso.");
  } catch (err) {
    return error(res, "Erro ao guardar configurações.", 500);
  }
};

/**
 * Funcionalidades avançadas dos centros de formação.
 * Mantidas em funções separadas para evitar regressão no restante controller.
 */
const updateTrainingCenterV2 = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      provincia,
      municipio,
      endereco,
      email,
      telefone,
      whatsapp,
      descricao,
      status,
    } = req.body;

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
      [
        nome || null,
        provincia || null,
        municipio || null,
        endereco || null,
        email || null,
        telefone || null,
        whatsapp || null,
        descricao || null,
        status || null,
        id,
      ],
    );

    await log(
      req.user.id,
      "UPDATE_CENTER",
      "training_centers",
      id,
      req.body,
      req,
    );
    return success(res, null, "Centro actualizado com sucesso.");
  } catch (err) {
    return error(res, "Erro ao actualizar centro.", 500);
  }
};

const deleteTrainingCenterV2 = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute(
      'UPDATE training_centers SET status="inativo" WHERE id=?',
      [id],
    );
    await pool.execute(
      'UPDATE training_center_courses SET status="inativo" WHERE center_id=?',
      [id],
    );
    await log(req.user.id, "DELETE_CENTER", "training_centers", id, null, req);
    return success(res, null, "Centro desactivado com sucesso.");
  } catch (err) {
    return error(res, "Erro ao desactivar centro.", 500);
  }
};

const saveCenterCourseOffering = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      course_id,
      preco,
      carga_horaria,
      modalidade,
      certificado_exigido,
      especificacoes,
    } = req.body;

    if (!course_id) {
      return res
        .status(400)
        .json({ success: false, message: "O curso é obrigatório." });
    }

    await pool.execute(
      "INSERT IGNORE INTO center_courses (center_id, course_id) VALUES (?,?)",
      [id, course_id],
    );
    await pool.execute(
      `INSERT INTO training_center_courses
        (center_id, course_id, preco, carga_horaria, modalidade, certificado_exigido, especificacoes, created_by)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
          preco = VALUES(preco),
          carga_horaria = VALUES(carga_horaria),
          modalidade = VALUES(modalidade),
          certificado_exigido = VALUES(certificado_exigido),
          especificacoes = VALUES(especificacoes),
          status = 'ativo'`,
      [
        id,
        course_id,
        preco || 0,
        carga_horaria || null,
        normalizeOfferingModalidade(modalidade),
        certificado_exigido ? 1 : 0,
        especificacoes || null,
        req.user.id,
      ],
    );

    await log(
      req.user.id,
      "UPSERT_CENTER_COURSE",
      "training_center_courses",
      null,
      req.body,
      req,
    );
    return success(
      res,
      null,
      "Oferta do curso associada ao centro com sucesso.",
    );
  } catch (err) {
    return error(res, "Erro ao guardar oferta do centro.", 500);
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
      [id],
    );
    return success(res, rows);
  } catch (err) {
    return error(res, "Erro ao listar ofertas do centro.", 500);
  }
};

const updateCenterCourseOffering = async (req, res) => {
  try {
    const { centerId, offeringId } = req.params;
    const {
      preco,
      carga_horaria,
      modalidade,
      certificado_exigido,
      especificacoes,
      status,
    } = req.body;

    await pool.execute(
      `UPDATE training_center_courses
       SET preco = COALESCE(?, preco),
           carga_horaria = COALESCE(?, carga_horaria),
           modalidade = COALESCE(?, modalidade),
           certificado_exigido = COALESCE(?, certificado_exigido),
           especificacoes = COALESCE(?, especificacoes),
           status = COALESCE(?, status)
       WHERE id = ? AND center_id = ?`,
      [
        preco ?? null,
        carga_horaria ?? null,
        modalidade === undefined
          ? null
          : normalizeOfferingModalidade(modalidade),
        certificado_exigido === undefined ? null : certificado_exigido ? 1 : 0,
        especificacoes ?? null,
        status ?? null,
        offeringId,
        centerId,
      ],
    );

    await log(
      req.user.id,
      "UPDATE_CENTER_COURSE",
      "training_center_courses",
      offeringId,
      req.body,
      req,
    );
    return success(res, null, "Oferta actualizada com sucesso.");
  } catch (err) {
    return error(res, "Erro ao actualizar oferta.", 500);
  }
};

const deleteCenterCourseOffering = async (req, res) => {
  try {
    const { centerId, offeringId } = req.params;
    await pool.execute(
      'UPDATE training_center_courses SET status="inativo" WHERE id=? AND center_id=?',
      [offeringId, centerId],
    );
    await log(
      req.user.id,
      "DELETE_CENTER_COURSE",
      "training_center_courses",
      offeringId,
      { center_id: centerId },
      req,
    );
    return success(res, null, "Oferta removida com sucesso.");
  } catch (err) {
    return error(res, "Erro ao remover oferta.", 500);
  }
};

// Actualizar exports
Object.assign(module.exports, {
  listAdminCompanies,
  getAdminCompany,
  viewCompanyDocument,
  approveCompany,
  rejectCompany,
  createSubscription,
  listAdminContracts,
  listAdminPayments,
  confirmPayment,
  listCompanyJobsAdmin,
  approveCompanyJob,
  rejectCompanyJob,
  getSettings,
  updateSettings,
  updateTrainingCenterV2,
  deleteTrainingCenterV2,
  saveCenterCourseOffering,
  listCenterCourseOfferings,
  updateCenterCourseOffering,
  deleteCenterCourseOffering,
  listSystemFiles,
  generateSystemList,
});
