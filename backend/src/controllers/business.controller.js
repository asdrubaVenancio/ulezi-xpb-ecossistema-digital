/**
 * Controller de NegÃ³cios / Investimentos
 */
const { pool } = require("../config/database");
const {
  success,
  created,
  error,
  notFound,
  badRequest,
} = require("../utils/response");
const { gerarContratoPDF } = require("../utils/pdf-modern");
const {
  sendContractEmail,
  sendInvestorInterestNotification,
} = require("../utils/email");
const { sendWhatsApp } = require("../utils/whatsapp");
const { log } = require("../utils/audit");
const {
  createNotification,
  notificarNovaOportunidade,
  notificarNovoInteresse,
} = require("../services/notification.service");

const normalizeCompanyStatus = (status) =>
  ({
    pendente: "pending",
    aprovado: "approved",
  })[status] || status;

const ensureMediationRuntimeSchema = async (connection) => {
  const executor = connection || pool;
  const [mediationCols] = await executor.execute(
    `SHOW COLUMNS FROM mediations LIKE 'mediator_user_id'`,
  );
  if (!mediationCols.length) {
    await executor.execute(
      `ALTER TABLE mediations ADD COLUMN mediator_user_id INT UNSIGNED NULL AFTER employee_id`,
    );
  }
  try {
    await executor.execute(
      "ALTER TABLE mediations MODIFY COLUMN employee_id INT UNSIGNED NULL",
    );
  } catch (_) {}
};

const getContractPartiesDataByInterest = async (interestId) => {
  const [rows] = await pool.execute(
    `SELECT ii.id as interest_id,
            ii.investor_id,
            u_inv.nome as nome_investidor,
            u_inv.email as email_investidor,
            u_inv.telefone as tel_investidor,
            NULL as tipo_investidor,
            NULL as documento_investidor,
            io.id as opportunity_id,
            io.titulo as titulo_oportunidade,
            io.descricao as desc_oportunidade,
            io.tipo as tipo_oportunidade,
            io.valor,
            cp.id as company_id,
            cp.user_id as company_user_id,
            cp.nome_empresa,
            cp.nif as nif_empresa,
            cp.endereco as endereco_empresa,
            u_comp.email as email_empresa,
            u_comp.telefone as tel_empresa
     FROM investor_interests ii
     LEFT JOIN users u_inv ON u_inv.id = ii.investor_id
     LEFT JOIN investor_profiles ip ON ip.user_id = ii.investor_id
     LEFT JOIN investment_opportunities io ON io.id = ii.opportunity_id
     LEFT JOIN company_profiles cp ON cp.id = io.company_id
     LEFT JOIN users u_comp ON u_comp.id = cp.user_id
     WHERE ii.id = ?
     LIMIT 1`,
    [interestId],
  );

  return rows[0] || null;
};

const getContractPdfPayload = async (contractId) => {
  const [rows] = await pool.execute(
    `SELECT c.*,
            cp.user_id as company_user_id,
            cp.nome_empresa,
            cp.nif as nif_empresa,
            cp.endereco as endereco_empresa,
            u_comp.nome as nome_representante_empresa,
            u_comp.email as email_empresa,
            u_comp.telefone as tel_empresa,
            u_inv.nome as nome_investidor,
            u_inv.email as email_investidor,
            u_inv.telefone as tel_investidor,
            NULL as tipo_investidor,
            NULL as documento_investidor,
            io.titulo as titulo_oportunidade,
            io.descricao as desc_oportunidade,
            io.tipo as tipo_oportunidade,
            io.valor as valor_oportunidade
     FROM contracts c
     LEFT JOIN company_profiles cp ON cp.id = c.company_id
     LEFT JOIN users u_comp ON u_comp.id = cp.user_id
     LEFT JOIN users u_inv ON u_inv.id = c.investor_id
     LEFT JOIN investor_profiles ip ON ip.user_id = c.investor_id
     LEFT JOIN investment_opportunities io ON io.id = c.opportunity_id
     WHERE c.id = ?
     LIMIT 1`,
    [contractId],
  );

  const contract = rows[0];
  if (!contract) return null;

  return {
    id: contract.id,
    titulo: contract.titulo || contract.titulo_oportunidade,
    titulo_oportunidade: contract.titulo_oportunidade,
    nome_empresa: contract.nome_empresa,
    nome_representante_empresa: contract.nome_representante_empresa,
    nif_empresa: contract.nif_empresa,
    email_empresa: contract.email_empresa,
    telefone_empresa: contract.tel_empresa,
    endereco_empresa: contract.endereco_empresa,
    nome_investidor: contract.nome_investidor,
    email_investidor: contract.email_investidor,
    telefone_investidor: contract.tel_investidor,
    tipo_investidor: contract.tipo_investidor,
    documento_investidor: contract.documento_investidor,
    descricao_oportunidade: contract.desc_oportunidade,
    tipo_oportunidade: contract.tipo_oportunidade,
    valor: contract.valor || contract.valor_oportunidade,
    assinado_empresa: contract.assinado_empresa,
    assinado_empresa_at: contract.assinado_empresa_at,
    assinado_investidor: contract.assinado_investidor,
    assinado_investidor_at: contract.assinado_investidor_at,
    data_emissao: new Date(),
    estado_documento: "Assinado digitalmente pelas partes",
  };
};

const getResolvedContractStatus = (contract) => {
  if (contract?.assinado_empresa && contract?.assinado_investidor) {
    return "assinado_ambos";
  }
  return contract?.status || "pendente";
};

const finalizeContractIfReady = async (contractId) => {
  const payload = await getContractPdfPayload(contractId);
  if (!payload) return null;

  const [rows] = await pool.execute(
    `SELECT c.*, cp.user_id as company_user_id
     FROM contracts c
     LEFT JOIN company_profiles cp ON cp.id = c.company_id
     WHERE c.id = ?
     LIMIT 1`,
    [contractId],
  );

  const contract = rows[0];
  if (!contract) return null;

  const bothSigned = Boolean(
    contract.assinado_empresa && contract.assinado_investidor,
  );
  if (!bothSigned) {
    if (contract.status !== getResolvedContractStatus(contract)) {
      await pool.execute("UPDATE contracts SET status=? WHERE id=?", [
        getResolvedContractStatus(contract),
        contractId,
      ]);
      contract.status = getResolvedContractStatus(contract);
    }
    return contract;
  }

  let pdfBuffer = contract.pdf_data || null;
  if (!pdfBuffer) {
    pdfBuffer = await gerarContratoPDF(payload);
  }

  await pool.execute(
    'UPDATE contracts SET status="assinado_ambos", pdf_data=? WHERE id=?',
    [pdfBuffer, contractId],
  );
  if (contract.interest_id) {
    await pool.execute(
      'UPDATE investor_interests SET status="aprovado" WHERE id=?',
      [contract.interest_id],
    );
  }

  return {
    ...contract,
    status: "assinado_ambos",
    pdf_data: pdfBuffer,
  };
};

const normalizeContractRow = (row) => ({
  ...row,
  status: getResolvedContractStatus(row),
});

const notifyContractSignatureRequest = async ({
  contractId,
  companyUserId,
  investorId,
  titulo,
}) => {
  const linkCompany = '/painel/empresa';
  const linkInvestor = '/painel/investidor';
  await Promise.all([
    companyUserId
      ? createNotification(
          companyUserId,
          "assinatura_contrato",
          "Assinatura pendente de contrato",
          `O contrato da oportunidade "${titulo}" aguarda a confirmacao da sua assinatura digital no sistema.`,
          linkCompany,
        )
      : Promise.resolve(),
    investorId
      ? createNotification(
          investorId,
          "assinatura_contrato",
          "Assinatura pendente de contrato",
          `O contrato da oportunidade "${titulo}" aguarda a confirmacao da sua assinatura digital no sistema.`,
          linkInvestor,
        )
      : Promise.resolve(),
  ]);
};

/** POST /api/companies/documents - Upload de documentos */
const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipo } = req.body;
    const file = req.file;

    if (!file) return badRequest(res, "Nenhum ficheiro enviado.");
    if (!tipo) return badRequest(res, "O tipo de documento Ã© obrigatÃ³rio.");

    const [company] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id=?",
      [userId],
    );
    if (!company.length)
      return notFound(res, "Perfil de empresa nÃ£o encontrado.");

    const companyId = company[0].id;
    const url = `/uploads/documents/${file.filename}`;

    // Verificar se jÃ¡ existe documento do mesmo tipo
    const [existing] = await pool.execute(
      "SELECT id, url_ficheiro FROM company_documents WHERE company_id=? AND tipo=?",
      [companyId, tipo],
    );

    if (existing.length > 0) {
      // Substituir documento existente
      await pool.execute(
        "UPDATE company_documents SET nome_ficheiro=?, url_ficheiro=?, status_verificacao=? WHERE id=?",
        [file.originalname, url, "pendente", existing[0].id],
      );
      await log(
        userId,
        "UPDATE_DOCUMENT",
        "company_documents",
        existing[0].id,
        { tipo },
        req,
      );
      return success(
        res,
        { url },
        "Documento actualizado. Aguarde verificaÃ§Ã£o.",
      );
    } else {
      // Inserir novo documento
      await pool.execute(
        "INSERT INTO company_documents (company_id, tipo, nome_ficheiro, url_ficheiro) VALUES (?,?,?,?)",
        [companyId, tipo, file.originalname, url],
      );
      await log(
        userId,
        "UPLOAD_DOCUMENT",
        "company_documents",
        companyId,
        { tipo },
        req,
      );
      return created(res, { url }, "Documento enviado. Aguarde verificaÃ§Ã£o.");
    }
  } catch (err) {
    return error(res, "Erro ao enviar documento: " + err.message, 500);
  }
};

/** GET /api/companies/my - Perfil da minha empresa */
const getMyCompany = async (req, res) => {
  try {
    const [company] = await pool.execute(
      `SELECT cp.*, u.nome, u.email, u.telefone FROM company_profiles cp
       LEFT JOIN users u ON u.id=cp.user_id WHERE cp.user_id=?`,
      [req.user.id],
    );
    if (!company.length) return notFound(res, "Perfil nÃ£o encontrado.");

    const [docs] = await pool.execute(
      "SELECT * FROM company_documents WHERE company_id=?",
      [company[0].id],
    );
    const [sub] = await pool.execute(
      'SELECT * FROM subscriptions WHERE company_id=? AND status="ativa" AND data_fim >= CURDATE() ORDER BY data_fim DESC LIMIT 1',
      [company[0].id],
    );
    const [services] = await pool.execute(
      `SELECT cs.*, sc.nome as nome_categoria FROM company_services cs
       LEFT JOIN service_categories sc ON sc.id=cs.category_id WHERE cs.company_id=? AND cs.ativo=1`,
      [company[0].id],
    );

    return success(res, {
      company: company[0],
      documents: docs,
      subscription: sub[0] || null,
      services,
    });
  } catch (err) {
    return error(res, "Erro ao obter perfil.", 500);
  }
};

/**
 * POST /api/empresas
 * Cria ou actualiza o perfil empresarial do utilizador autenticado.
 */
const saveCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      nome_empresa,
      descricao,
      sector,
      provincia,
      municipio,
      endereco,
      website,
      nif,
      is_public,
    } = req.body;

    if (!nome_empresa?.trim()) {
      return badRequest(res, "O nome da empresa Ã© obrigatÃ³rio.");
    }

    // Verificar se NIF jÃ¡ existe (exceto para o prÃ³prio registro em caso de update)
    if (nif?.trim()) {
      const nifLimpo = nif.trim();
      const [nifExistente] = await pool.execute(
        `SELECT id FROM company_profiles
         WHERE nif = ? AND user_id != ?`,
        [nifLimpo, userId],
      );
      if (nifExistente.length > 0) {
        return badRequest(
          res,
          "JÃ¡ existe uma empresa cadastrada com este NIF.",
        );
      }
    }

    const [[existing]] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id = ?",
      [userId],
    );

    if (existing) {
      await pool.execute(
        `UPDATE company_profiles
         SET nome_empresa = ?,
             descricao = ?,
             sector = ?,
             provincia = ?,
             municipio = ?,
             endereco = ?,
             website = ?,
             nif = ?,
             is_public = ?
         WHERE user_id = ?`,
        [
          nome_empresa.trim(),
          descricao || null,
          sector || null,
          provincia || null,
          municipio || null,
          endereco || null,
          website || null,
          nif || null,
          is_public == null ? 1 : is_public ? 1 : 0,
          userId,
        ],
      );

      await log(
        userId,
        "UPDATE_COMPANY_PROFILE",
        "company_profiles",
        existing.id,
        null,
        req,
      );
      return success(
        res,
        { id: existing.id },
        "Perfil da empresa actualizado com sucesso.",
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO company_profiles
       (user_id, nome_empresa, descricao, sector, provincia, municipio, endereco, website, nif, is_public)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        userId,
        nome_empresa.trim(),
        descricao || null,
        sector || null,
        provincia || null,
        municipio || null,
        endereco || null,
        website || null,
        nif || null,
        is_public == null ? 1 : is_public ? 1 : 0,
      ],
    );

    await log(
      userId,
      "CREATE_COMPANY_PROFILE",
      "company_profiles",
      result.insertId,
      null,
      req,
    );
    return created(
      res,
      { id: result.insertId },
      "Perfil da empresa criado com sucesso.",
    );
  } catch (err) {
    return error(res, "Erro ao guardar perfil da empresa.", 500);
  }
};

/** GET /api/opportunities - Listar oportunidades */
const listOpportunities = async (req, res) => {
  try {
    const { tipo } = req.query;
    const search = req.query.search || req.query.pesquisa;
    const page = req.query.page || 1;
    const limit = req.query.limit || req.query.limite || 20;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `SELECT io.*, cp.nome_empresa, cp.sector, cp.provincia, u.foto_perfil
                 FROM investment_opportunities io
                 LEFT JOIN company_profiles cp ON cp.id=io.company_id
                 LEFT JOIN users u ON u.id=cp.user_id
                 WHERE io.status="ativa" AND cp.is_approved=1
                   AND NOT EXISTS (
                     SELECT 1
                     FROM investor_interests ii
                     WHERE ii.opportunity_id = io.id
                       AND ii.status NOT IN ('cancelado', 'rejeitado')
                   )`;
    const params = [];

    if (tipo) {
      query += " AND io.tipo=?";
      params.push(tipo);
    }
    if (search) {
      query += " AND (io.titulo LIKE ? OR io.descricao LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY io.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, "Erro ao listar oportunidades.", 500);
  }
};

/** GET /api/opportunities/:id - Detalhes de oportunidade */
const getOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT io.*, cp.nome_empresa, cp.descricao as desc_empresa, cp.sector, cp.provincia, cp.municipio, u.email as email_empresa
       FROM investment_opportunities io
       LEFT JOIN company_profiles cp ON cp.id=io.company_id
       LEFT JOIN users u ON u.id=cp.user_id
       WHERE io.id=? AND io.status="ativa"`,
      [id],
    );
    if (!rows.length) return notFound(res, "Oportunidade nÃ£o encontrada.");

    // Incrementar visualizaÃ§Ãµes
    await pool.execute(
      "UPDATE investment_opportunities SET views_count=views_count+1 WHERE id=?",
      [id],
    );

    return success(res, rows[0]);
  } catch (err) {
    return error(res, "Erro ao obter oportunidade.", 500);
  }
};

/** POST /api/opportunities - Criar oportunidade (empresa) */
const createOpportunity = async (req, res) => {
  try {
    const userId = req.user.id;
    const [company] = await pool.execute(
      "SELECT id, is_approved FROM company_profiles WHERE user_id=?",
      [userId],
    );
    if (!company.length)
      return badRequest(res, "Perfil de empresa nÃ£o encontrado.");
    if (!company[0].is_approved)
      return badRequest(res, "A sua empresa ainda nÃ£o foi aprovada.");

    // Verificar assinatura ativa
    const [sub] = await pool.execute(
      'SELECT id FROM subscriptions WHERE company_id=? AND status="ativa" AND data_fim >= CURDATE()',
      [company[0].id],
    );
    if (!sub.length)
      return badRequest(
        res,
        "A sua assinatura estÃ¡ inativa. Renove para publicar oportunidades.",
      );

    // Verificar duplicaÃ§Ã£o
    const { tipo, titulo } = req.body;
    const [dup] = await pool.execute(
      'SELECT id FROM investment_opportunities WHERE company_id=? AND titulo=? AND status="ativa"',
      [company[0].id, titulo],
    );
    if (dup.length)
      return badRequest(
        res,
        "JÃ¡ existe uma oportunidade activa com este tÃ­tulo.",
      );

    const {
      descricao,
      valor,
      moeda,
      dados_especificos,
      imagem_url,
      termos,
      retorno_percentual,
      prazo_pagamento,
      participacao_percentual,
    } = req.body;

    const detalhesOportunidade = {
      ...(dados_especificos && typeof dados_especificos === "object"
        ? dados_especificos
        : {}),
      termos: termos || null,
      retorno_percentual: retorno_percentual || null,
      prazo_pagamento: prazo_pagamento || null,
      participacao_percentual: participacao_percentual || null,
    };

    const dadosEspecificosNormalizados = Object.values(
      detalhesOportunidade,
    ).some((valorCampo) => valorCampo !== null && valorCampo !== "")
      ? JSON.stringify(detalhesOportunidade)
      : null;

    const [result] = await pool.execute(
      "INSERT INTO investment_opportunities (company_id, tipo, titulo, descricao, valor, moeda, dados_especificos, imagem_url) VALUES (?,?,?,?,?,?,?,?)",
      [
        company[0].id,
        tipo,
        titulo,
        descricao,
        valor || null,
        moeda || "Kz",
        dadosEspecificosNormalizados,
        imagem_url || null,
      ],
    );

    await log(
      userId,
      "CREATE_OPPORTUNITY",
      "investment_opportunities",
      result.insertId,
      { tipo, titulo },
      req,
    );

    // Notificar empresa sobre a oportunidade criada
    const [[userData]] = await pool.execute(
      "SELECT email FROM users WHERE id = ?",
      [userId],
    );
    if (userData) {
      notificarNovaOportunidade(
        userId,
        userData.email,
        titulo,
        tipo,
      ).catch((e) => console.error("[NOTIF_OPPORTUNITY]", e.message));
    }

    return created(
      res,
      { id: result.insertId },
      "Oportunidade publicada com sucesso.",
    );
  } catch (err) {
    return error(res, "Erro ao criar oportunidade.", 500);
  }
};

/** POST /api/opportunities/:id/interest - Demonstrar interesse */
const expressInterest = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const investorId = req.user.id;
    const { id: opportunityId } = req.params;
    const { mensagem } = req.body;

    await connection.beginTransaction();
    await ensureMediationRuntimeSchema(connection);

    const [opp] = await connection.execute(
      `SELECT io.*, cp.nome_empresa, cp.user_id as company_user_id, u.email as email_empresa, u.telefone as tel_empresa
       FROM investment_opportunities io
       LEFT JOIN company_profiles cp ON cp.id=io.company_id
       LEFT JOIN users u ON u.id=cp.user_id
      WHERE io.id=? AND io.status="ativa"`,
      [opportunityId],
    );
    if (!opp.length) {
      await connection.rollback();
      return notFound(res, "Oportunidade nÃ£o encontrada.");
    }

    // Verificar se jÃ¡ demonstrou interesse
    const [activeProcess] = await connection.execute(
      `SELECT id
       FROM investor_interests
       WHERE opportunity_id = ?
         AND status NOT IN ('cancelado', 'rejeitado')
       LIMIT 1`,
      [opportunityId],
    );

    if (activeProcess.length) {
      await connection.rollback();
      return badRequest(
        res,
        "Esta oportunidade jÃƒÂ¡ estÃ¡ em processo de mediaÃ§Ã£o e estÃ¡ temporariamente indisponÃ­vel.",
      );
    }

    const [existing] = await connection.execute(
      "SELECT id FROM investor_interests WHERE investor_id=? AND opportunity_id=?",
      [investorId, opportunityId],
    );
    if (existing.length) {
      await connection.rollback();
      return badRequest(res, "JÃ¡ demonstrou interesse nesta oportunidade.");
    }

    const [result] = await connection.execute(
      "INSERT INTO investor_interests (investor_id, opportunity_id, mensagem) VALUES (?,?,?)",
      [investorId, opportunityId, mensagem || null],
    );

    const interestId = result.insertId;

    // Notificar admins e equipa de mediacao, sem disparar contacto direto com a empresa
    const [admins] = await connection.execute(
      'SELECT id, email FROM users WHERE role="admin" AND status="ativo"',
    );
    const [investor] = await connection.execute(
      "SELECT nome, email FROM users WHERE id=?",
      [investorId],
    );
    const [mediators] = await connection.execute(
      `SELECT u.id, u.email
       FROM employees e
       INNER JOIN users u ON u.id = e.user_id
       INNER JOIN employee_responsibilities er ON er.employee_id = e.id
       WHERE e.is_active = 1
         AND u.status = "ativo"
         AND er.tipo_responsabilidade = "mediacao_negocios"
         AND er.is_active = 1`,
    );

    const notifData = {
      nome_investidor: investor[0].nome,
      email_investidor: investor[0].email,
      nome_empresa: opp[0].nome_empresa,
      titulo_oportunidade: opp[0].titulo,
    };

    const usersToNotify = [
      ...new Set(
        [...admins, ...mediators].map((item) => item.id).filter(Boolean),
      ),
    ];
    if (usersToNotify.length > 0) {
      await Promise.all(
        usersToNotify.map((userId) =>
          connection.execute(
            "INSERT INTO notifications (user_id, tipo, titulo, mensagem, link) VALUES (?,?,?,?,?)",
            [
              userId,
              "interest",
              "Novo interesse de investidor",
              `${investor[0].nome} manifestou interesse em "${opp[0].titulo}". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.`,
              '/painel/admin',
            ],
          ),
        ),
      );
    }

    // Notificar empresa sobre o novo interesse
    if (opp[0].company_user_id && opp[0].email_empresa) {
      notificarNovoInteresse(
        opp[0].company_user_id,
        opp[0].email_empresa,
        opp[0].nome_empresa,
        investor[0].nome,
        opp[0].titulo,
      ).catch((e) => console.error("[NOTIF_INTERESSE]", e.message));
    }

    const [selectedMediatorRows] = await connection.execute(
      `SELECT
         e.id,
         e.user_id,
         u.nome,
         u.email,
         COUNT(DISTINCT CASE WHEN m.status IN ('pendente', 'em_analise', 'agendada', 'em_andamento') THEN m.id END) as mediacoes_ativas
       FROM employees e
       INNER JOIN users u ON u.id = e.user_id
       INNER JOIN employee_responsibilities er ON er.employee_id = e.id
       LEFT JOIN mediations m ON m.employee_id = e.id
       WHERE e.is_active = 1
         AND u.status = "ativo"
         AND er.tipo_responsabilidade = "mediacao_negocios"
         AND er.is_active = 1
       GROUP BY e.id, e.user_id, u.nome, u.email
       ORDER BY mediacoes_ativas ASC, e.created_at ASC
       LIMIT 1`,
    );

    const [fallbackAdmins] = await connection.execute(
      `SELECT id, nome, email
       FROM users
       WHERE role = "admin" AND status = "ativo"
       ORDER BY id ASC
       LIMIT 1`,
    );

    let responsePayload = {
      interest_id: interestId,
      status: "pendente_triagem",
    };
    let responseMessage =
      "Interesse registado. A equipa administrativa fara a mediacao do contacto com a empresa.";

    const mediator = selectedMediatorRows[0]
      ? {
          employee_id: selectedMediatorRows[0].id,
          mediator_user_id: selectedMediatorRows[0].user_id,
          nome: selectedMediatorRows[0].nome,
          email: selectedMediatorRows[0].email,
          tipo: "funcionario",
        }
      : fallbackAdmins[0]
        ? {
            employee_id: null,
            mediator_user_id: fallbackAdmins[0].id,
            nome: fallbackAdmins[0].nome,
            email: fallbackAdmins[0].email,
            tipo: "admin",
          }
        : null;

    if (mediator) {
      const [mediationResult] = await connection.execute(
        `INSERT INTO mediations
         (interest_id, employee_id, mediator_user_id, company_id, investor_id, prioridade, status, etapa_atual)
         VALUES (?, ?, ?, ?, ?, 'media', 'pendente', 'triagem')`,
        [
          interestId,
          mediator.employee_id,
          mediator.mediator_user_id,
          opp[0].company_id,
          investorId,
        ],
      );

      await connection.execute(
        'UPDATE investor_interests SET status = "em_mediacao" WHERE id = ?',
        [interestId],
      );

      const notificationEntries = [
        [
          investorId,
          "mediacao_iniciada",
          "Processo de mediacao iniciado",
          `O seu interesse em "${opp[0].titulo}" entrou em mediacao. O mediador responsavel sera ${mediator.nome}.`,
        ],
        [
          opp[0].company_user_id,
          "novo_interesse",
          "Novo interesse em sua oportunidade",
          `O investidor ${investor[0].nome} demonstrou interesse em "${opp[0].titulo}". A equipa da plataforma iniciou a mediacao.`,
        ],
        [
          mediator.mediator_user_id,
          "nova_mediacao",
          "Nova mediacao atribuida",
          `Foi-lhe atribuida a mediacao da oportunidade "${opp[0].titulo}" entre ${investor[0].nome} e ${opp[0].nome_empresa}.`,
        ],
      ].filter((item) => item[0]);

      if (notificationEntries.length > 0) {
        await Promise.all(
          notificationEntries.map(([userId, tipo, titulo, texto]) =>
            connection.execute(
              "INSERT INTO notifications (user_id, tipo, titulo, mensagem) VALUES (?,?,?,?)",
              [userId, tipo, titulo, texto],
            ),
          ),
        );
      }

      responsePayload = {
        interest_id: interestId,
        status: "em_mediacao",
        mediation_id: mediationResult.insertId,
        mediador: {
          nome: mediator.nome,
          tipo: mediator.tipo,
        },
      };
      responseMessage =
        mediator.tipo === "admin"
          ? "Interesse registado. Um administrador assumiu a mediação inicial e poderá indicar um funcionário mais tarde."
          : "Interesse registado. O processo entrou em mediação e o mediador fará o contacto com as partes para definir a reunião.";
    }

    await connection.commit();

    await Promise.all(
      admins.map((admin) =>
        sendInvestorInterestNotification(admin.email, notifData).catch((e) =>
          console.error("[NOTIF]", e),
        ),
      ),
    );

    await log(
      investorId,
      "EXPRESS_INTEREST",
      "investor_interests",
      interestId,
      { opportunityId },
      req,
    );
    return created(res, responsePayload, responseMessage);
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {}
    return error(res, "Erro ao registar interesse.", 500);
  } finally {
    connection.release();
  }
};

/** GET /api/admin/interests - Listar interesses (admin) */
const adminListInterests = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ii.*, u.nome as nome_investidor, u.email as email_investidor, u.telefone as tel_investidor,
              io.titulo, io.tipo, io.valor, cp.nome_empresa
       FROM investor_interests ii
       LEFT JOIN users u ON u.id=ii.investor_id
       LEFT JOIN investment_opportunities io ON io.id=ii.opportunity_id
       LEFT JOIN company_profiles cp ON cp.id=io.company_id
       ORDER BY ii.created_at DESC`,
    );
    return success(res, rows);
  } catch (err) {
    return error(res, "Erro ao listar interesses.", 500);
  }
};

/** POST /api/admin/interests/:id/contract - Gerar contrato */
const generateContract = async (req, res) => {
  try {
    const { id: interestId } = req.params;
    const newContractFlowData =
      await getContractPartiesDataByInterest(interestId);

    if (!newContractFlowData)
      return notFound(res, "Interesse nÃƒÂ£o encontrado.");

    const [existingContract] = await pool.execute(
      "SELECT id FROM contracts WHERE interest_id=?",
      [interestId],
    );
    if (existingContract.length)
      return badRequest(res, "Contrato jÃƒÂ¡ gerado para este interesse.");

    const [createdContract] = await pool.execute(
      `INSERT INTO contracts (interest_id, opportunity_id, investor_id, company_id, titulo, gerado_by, status)
       VALUES (?,?,?,?,?,?,'enviado')`,
      [
        interestId,
        newContractFlowData.opportunity_id,
        newContractFlowData.investor_id,
        newContractFlowData.company_id,
        newContractFlowData.titulo_oportunidade,
        req.user.id,
      ],
    );

    await pool.execute(
      'UPDATE investor_interests SET status="em_analise" WHERE id=?',
      [interestId],
    );
    await notifyContractSignatureRequest({
      contractId: createdContract.insertId,
      companyUserId: newContractFlowData.company_user_id,
      investorId: newContractFlowData.investor_id,
      titulo: newContractFlowData.titulo_oportunidade,
    });

    await log(
      req.user.id,
      "GENERATE_CONTRACT",
      "contracts",
      createdContract.insertId,
      { interestId },
      req,
    );
    return created(
      res,
      { contract_id: createdContract.insertId, status: "enviado" },
      "Contrato criado. As partes foram notificadas no sistema para confirmar a assinatura digital antes da emissao do PDF final.",
    );

    const [interests] = await pool.execute(
      `SELECT ii.*,
              u_inv.nome as nome_investidor, u_inv.email as email_investidor, u_inv.telefone as tel_investidor,
              u_comp.nome as nome_empresa_user, u_comp.email as email_empresa, u_comp.telefone as tel_empresa,
              cp.nome_empresa, cp.nif as nif_empresa, cp.id as company_id,
              io.titulo as titulo_oportunidade, io.descricao as desc_oportunidade, io.tipo as tipo_oportunidade, io.valor, io.id as opportunity_id
       FROM investor_interests ii
       LEFT JOIN users u_inv ON u_inv.id=ii.investor_id
       LEFT JOIN investment_opportunities io ON io.id=ii.opportunity_id
       LEFT JOIN company_profiles cp ON cp.id=io.company_id
       LEFT JOIN users u_comp ON u_comp.id=cp.user_id
       WHERE ii.id=?`,
      [interestId],
    );

    if (!interests.length) return notFound(res, "Interesse nÃ£o encontrado.");
    const data = interests[0];

    // Verificar se contrato jÃ¡ existe
    const [existing] = await pool.execute(
      "SELECT id FROM contracts WHERE interest_id=?",
      [interestId],
    );
    if (existing.length)
      return badRequest(res, "Contrato jÃ¡ gerado para este interesse.");

    // Gerar PDF
    const contractData = {
      id: `INT-${interestId}`,
      titulo: data.titulo_oportunidade,
      nome_empresa: data.nome_empresa,
      nif_empresa: data.nif_empresa,
      email_empresa: data.email_empresa,
      nome_investidor: data.nome_investidor,
      email_investidor: data.email_investidor,
      descricao_oportunidade: data.desc_oportunidade,
      tipo_oportunidade: data.tipo_oportunidade,
      valor: data.valor,
    };

    let pdfBuffer = null;
    try {
      pdfBuffer = await gerarContratoPDF(contractData);
    } catch (pdfErr) {
      console.error("[PDF CONTRACT]", pdfErr.message);
    }

    const [result] = await pool.execute(
      `INSERT INTO contracts (interest_id, opportunity_id, investor_id, company_id, titulo, pdf_data, gerado_by)
       VALUES (?,?,?,?,?,?,?)`,
      [
        interestId,
        data.opportunity_id,
        data.investor_id,
        data.company_id,
        data.titulo_oportunidade,
        pdfBuffer,
        req.user.id,
      ],
    );

    await pool.execute(
      'UPDATE investor_interests SET status="em_analise" WHERE id=?',
      [interestId],
    );

    // Enviar emails com o contrato
    sendContractEmail(
      data.email_empresa,
      data.nome_empresa,
      contractData,
      pdfBuffer,
    )
      .then(() =>
        pool.execute(
          "UPDATE contracts SET enviado_email_empresa=1 WHERE id=?",
          [result.insertId],
        ),
      )
      .catch((e) => console.error("[CONTRACT EMAIL EMPRESA]", e));

    sendContractEmail(
      data.email_investidor,
      data.nome_investidor,
      contractData,
      pdfBuffer,
    )
      .then(() =>
        pool.execute(
          "UPDATE contracts SET enviado_email_investidor=1 WHERE id=?",
          [result.insertId],
        ),
      )
      .catch((e) => console.error("[CONTRACT EMAIL INVESTIDOR]", e));

    // Notificar empresa e investidor sobre o contrato gerado
    const { notificarContratoGerado } = require('../services/notification.service');
    
    // Buscar user_id da empresa
    const [[empresa]] = await pool.execute(
      'SELECT user_id FROM company_profiles WHERE id = ?',
      [data.company_id]
    );
    if (empresa?.user_id) {
      notificarContratoGerado(
        empresa.user_id,
        data.email_empresa,
        'Investimento',
        `C-${result.insertId}`,
      ).catch((e) => console.error('[NOTIF_CONTRATO_EMP]', e.message));
    }
    
    // Notificar investidor
    notificarContratoGerado(
      data.investor_id,
      data.email_investidor,
      'Investimento',
      `C-${result.insertId}`,
    ).catch((e) => console.error('[NOTIF_CONTRATO_INV]', e.message));

    await log(
      req.user.id,
      "GENERATE_CONTRACT",
      "contracts",
      result.insertId,
      { interestId },
      req,
    );
    return created(
      res,
      { contract_id: result.insertId },
      "Contrato gerado e enviado por email.",
    );
  } catch (err) {
    console.error("[CONTRACT]", err);
    return error(res, "Erro ao gerar contrato.", 500);
  }
};

/** GET /api/contracts/:id/download - Descarregar contrato PDF */
const downloadContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const [rows] = await pool.execute(
      `SELECT c.*, cp.user_id as company_user_id FROM contracts c
       LEFT JOIN company_profiles cp ON cp.id=c.company_id WHERE c.id=?`,
      [id],
    );
    if (!rows.length) return notFound(res, "Contrato nÃ£o encontrado.");

    const contract = rows[0];
    const canAccess =
      ["admin", "employee"].includes(role) ||
      contract.investor_id === userId ||
      contract.company_user_id === userId;

    if (!canAccess)
      return res
        .status(403)
        .json({ success: false, message: "Acesso negado." });
    let resolvedContract = normalizeContractRow(contract);
    if (
      !resolvedContract.pdf_data &&
      resolvedContract.assinado_empresa &&
      resolvedContract.assinado_investidor
    ) {
      try {
        const finalized = await finalizeContractIfReady(id);
        if (finalized) {
          resolvedContract = normalizeContractRow(finalized);
        }
      } catch (finalizeErr) {
        console.error("[CONTRACT FINALIZE DOWNLOAD]", finalizeErr.message);
      }
    }

    if (!resolvedContract.pdf_data) {
      return badRequest(
        res,
        "O PDF final do contrato ainda nao esta disponivel. Aguarde a assinatura digital de ambas as partes.",
      );
    }

    if (resolvedContract.pdf_data) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="contrato_${id}.pdf"`,
      );
      return res.send(resolvedContract.pdf_data);
    }
    return notFound(res, "PDF nÃ£o disponÃ­vel.");
  } catch (err) {
    return error(res, "Erro ao obter contrato.", 500);
  }
};

/** POST /api/contracts/:id/sign - Assinar contrato digitalmente */
const signContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const [rows] = await pool.execute(
      `SELECT c.*, cp.user_id as company_user_id FROM contracts c
       LEFT JOIN company_profiles cp ON cp.id=c.company_id WHERE c.id=?`,
      [id],
    );
    if (!rows.length) return notFound(res, "Contrato nÃ£o encontrado.");
    const contract = rows[0];

    let nextStatus = "";
    let signerRoleLabel = "";
    if (
      role === "investor" &&
      contract.investor_id === userId &&
      !contract.assinado_investidor
    ) {
      nextStatus = "assinado_investidor";
      signerRoleLabel = "investidor";
      await pool.execute(
        "UPDATE contracts SET assinado_investidor=1, assinado_investidor_at=NOW(), status=? WHERE id=?",
        [nextStatus, id],
      );
    } else if (
      role === "company" &&
      contract.company_user_id === userId &&
      !contract.assinado_empresa
    ) {
      nextStatus = "assinado_empresa";
      signerRoleLabel = "empresa";
      await pool.execute(
        "UPDATE contracts SET assinado_empresa=1, assinado_empresa_at=NOW(), status=? WHERE id=?",
        [nextStatus, id],
      );
    } else {
      return badRequest(
        res,
        "NÃƒÂ£o pode assinar este contrato ou jÃƒÂ¡ foi assinado.",
      );
    }

    const [updatedContracts] = await pool.execute(
      "SELECT * FROM contracts WHERE id=?",
      [id],
    );
    const updatedContract = updatedContracts[0];

    if (
      updatedContract.assinado_empresa &&
      updatedContract.assinado_investidor
    ) {
      const pdfPayload = await getContractPdfPayload(id);
      let pdfBuffer = null;

      try {
        pdfBuffer = await gerarContratoPDF(pdfPayload);
      } catch (pdfErr) {
        console.error("[PDF CONTRACT FINAL]", pdfErr.message);
      }

      await pool.execute(
        'UPDATE contracts SET status="assinado_ambos", pdf_data=? WHERE id=?',
        [pdfBuffer, id],
      );
      await pool.execute(
        'UPDATE investor_interests SET status="aprovado" WHERE id=?',
        [contract.interest_id],
      );

      await Promise.all([
        contract.company_user_id
          ? createNotification(
              contract.company_user_id,
              "contrato_assinado",
              "Contrato validado",
              `O contrato #${id} foi assinado por ambas as partes e o PDF final ja esta disponivel no sistema.`,
              '/painel/empresa',
            )
          : Promise.resolve(),
        contract.investor_id
          ? createNotification(
              contract.investor_id,
              "contrato_assinado",
              "Contrato validado",
              `O contrato #${id} foi assinado por ambas as partes e o PDF final ja esta disponivel no sistema.`,
              '/painel/investidor',
            )
          : Promise.resolve(),
      ]);

      if (pdfBuffer && pdfPayload) {
        Promise.all([
          sendContractEmail(
            pdfPayload.email_empresa,
            pdfPayload.nome_empresa,
            pdfPayload,
            pdfBuffer,
          )
            .then(() =>
              pool.execute(
                "UPDATE contracts SET enviado_email_empresa=1 WHERE id=?",
                [id],
              ),
            )
            .catch((mailErr) =>
              console.error("[CONTRACT EMAIL EMPRESA FINAL]", mailErr),
            ),
          sendContractEmail(
            pdfPayload.email_investidor,
            pdfPayload.nome_investidor,
            pdfPayload,
            pdfBuffer,
          )
            .then(() =>
              pool.execute(
                "UPDATE contracts SET enviado_email_investidor=1 WHERE id=?",
                [id],
              ),
            )
            .catch((mailErr) =>
              console.error("[CONTRACT EMAIL INVESTIDOR FINAL]", mailErr),
            ),
        ]).catch(() => {});
      }

      await log(
        userId,
        "SIGN_CONTRACT",
        "contracts",
        id,
        { status: "assinado_ambos" },
        req,
      );
      return success(
        res,
        null,
        "Contrato assinado com sucesso. O PDF final foi emitido.",
      );
    }

    const targetUserId =
      signerRoleLabel === "empresa"
        ? contract.investor_id
        : contract.company_user_id;
    if (targetUserId) {
      const isCompany = signerRoleLabel === "investidor";
      await createNotification(
        targetUserId,
        "assinatura_contrato",
        "Assinatura pendente de contrato",
        `A contraparte ja confirmou a assinatura do contrato #${id}. Falta agora a sua confirmacao digital para concluir o documento.`,
        isCompany ? '/painel/empresa' : '/painel/investidor',
      );
    }

    await log(
      userId,
      "SIGN_CONTRACT",
      "contracts",
      id,
      { status: nextStatus },
      req,
    );
    return success(
      res,
      null,
      "Assinatura registada com sucesso. O contrato sera emitido apos a confirmacao da outra parte.",
    );

    let updateField = "";
    if (
      role === "investor" &&
      contract.investor_id === userId &&
      !contract.assinado_investidor
    ) {
      updateField = "assinado_investidor=1, assinado_investidor_at=NOW()";
    } else if (
      role === "company" &&
      contract.company_user_id === userId &&
      !contract.assinado_empresa
    ) {
      updateField = "assinado_empresa=1, assinado_empresa_at=NOW()";
    } else {
      return badRequest(
        res,
        "NÃ£o pode assinar este contrato ou jÃ¡ foi assinado.",
      );
    }

    await pool.execute(`UPDATE contracts SET ${updateField} WHERE id=?`, [id]);

    // Verificar se ambos assinaram
    const [updated] = await pool.execute("SELECT * FROM contracts WHERE id=?", [
      id,
    ]);
    if (updated[0].assinado_empresa && updated[0].assinado_investidor) {
      await pool.execute(
        'UPDATE contracts SET status="assinado_ambos" WHERE id=?',
        [id],
      );
      await pool.execute(
        'UPDATE investor_interests SET status="aprovado" WHERE id=?',
        [contract.interest_id],
      );
    }

    await log(userId, "SIGN_CONTRACT", "contracts", id, null, req);
    return success(res, null, "Contrato assinado com sucesso.");
  } catch (err) {
    return error(res, "Erro ao assinar contrato.", 500);
  }
};

/** GET /api/admin/companies - Listar empresas (admin) */
const adminListCompanies = async (req, res) => {
  try {
    const status = normalizeCompanyStatus(req.query.status);
    const page = req.query.page || 1;
    const limit = req.query.limit || req.query.limite || 20;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `SELECT cp.*, u.nome, u.email, u.telefone, u.status as user_status,
                 COUNT(DISTINCT d.id) as num_docs
                 FROM company_profiles cp
                 LEFT JOIN users u ON u.id=cp.user_id
                 LEFT JOIN company_documents d ON d.company_id=cp.id
                 WHERE 1=1`;
    const params = [];

    if (status === "pending") {
      query += " AND cp.is_approved=0";
    } else if (status === "approved") {
      query += " AND cp.is_approved=1";
    }

    query += ` GROUP BY cp.id ORDER BY cp.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, "Erro ao listar empresas.", 500);
  }
};

/** PUT /api/admin/companies/:id/approve - Aprovar/Rejeitar empresa */
const approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, motivo_rejeicao } = req.body;

    await pool.execute(
      "UPDATE company_profiles SET is_approved=?, approved_by=?, approved_at=NOW(), motivo_rejeicao=? WHERE id=?",
      [approved ? 1 : 0, req.user.id, motivo_rejeicao || null, id],
    );

    await log(
      req.user.id,
      approved ? "APPROVE_COMPANY" : "REJECT_COMPANY",
      "company_profiles",
      id,
      { motivo_rejeicao },
      req,
    );
    return success(
      res,
      null,
      approved ? "Empresa aprovada." : "Empresa rejeitada.",
    );
  } catch (err) {
    return error(res, "Erro ao processar empresa.", 500);
  }
};

/** POST /api/admin/subscriptions - Criar assinatura */
const createSubscription = async (req, res) => {
  try {
    const { company_id, plano, valor, data_inicio, data_fim } = req.body;
    if (!company_id || !plano || !valor || !data_inicio || !data_fim) {
      return badRequest(res, "Todos os campos sÃ£o obrigatÃ³rios.");
    }

    // Desativar assinaturas antigas
    await pool.execute(
      'UPDATE subscriptions SET status="expirada" WHERE company_id=? AND status="ativa"',
      [company_id],
    );

    const [result] = await pool.execute(
      "INSERT INTO subscriptions (company_id, plano, valor, data_inicio, data_fim, created_by) VALUES (?,?,?,?,?,?)",
      [company_id, plano, valor, data_inicio, data_fim, req.user.id],
    );

    await log(
      req.user.id,
      "CREATE_SUBSCRIPTION",
      "subscriptions",
      result.insertId,
      { company_id, plano },
      req,
    );
    return created(
      res,
      { id: result.insertId },
      "Assinatura criada com sucesso.",
    );
  } catch (err) {
    return error(res, "Erro ao criar assinatura.", 500);
  }
};

/** POST /api/companies/services - Adicionar serviÃ§o Ã  empresa */
const addCompanyService = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, descricao } = req.body;

    const [company] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id=?",
      [userId],
    );
    if (!company.length) return notFound(res, "Empresa nÃ£o encontrada.");

    const [result] = await pool.execute(
      "INSERT INTO company_services (company_id, category_id, descricao) VALUES (?,?,?) ON DUPLICATE KEY UPDATE descricao=VALUES(descricao), ativo=1",
      [company[0].id, category_id, descricao || null],
    );

    return created(res, null, "ServiÃ§o adicionado com sucesso.");
  } catch (err) {
    return error(res, "Erro ao adicionar serviÃ§o.", 500);
  }
};

const ensureCompanyServicesRuntimeSchema = async () => {
  const [emailCols] = await pool.execute(
    `SHOW COLUMNS FROM company_services LIKE 'contacto_email'`,
  );
  if (!emailCols.length) {
    await pool.execute(
      "ALTER TABLE company_services ADD COLUMN contacto_email VARCHAR(255) NULL AFTER descricao",
    );
  }

  const [whatsappCols] = await pool.execute(
    `SHOW COLUMNS FROM company_services LIKE 'contacto_whatsapp'`,
  );
  if (!whatsappCols.length) {
    await pool.execute(
      "ALTER TABLE company_services ADD COLUMN contacto_whatsapp VARCHAR(50) NULL AFTER contacto_email",
    );
  }
};

const getCompanyProfileIdByUser = async (userId) => {
  const [[company]] = await pool.execute(
    "SELECT id FROM company_profiles WHERE user_id=?",
    [userId],
  );
  return company || null;
};

const upsertCompanyService = async (req, res) => {
  try {
    await ensureCompanyServicesRuntimeSchema();

    const userId = req.user.id;
    const { category_id, descricao, contacto_email, contacto_whatsapp } =
      req.body;
    const company = await getCompanyProfileIdByUser(userId);

    if (!company) return notFound(res, "Empresa nao encontrada.");
    if (!category_id)
      return badRequest(res, "A categoria do servico e obrigatoria.");

    const [[category]] = await pool.execute(
      'SELECT id FROM service_categories WHERE id = ? AND status = "ativo"',
      [category_id],
    );
    if (!category) return badRequest(res, "Categoria de servico invalida.");

    const [result] = await pool.execute(
      `INSERT INTO company_services (company_id, category_id, descricao, contacto_email, contacto_whatsapp)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         descricao = VALUES(descricao),
         contacto_email = VALUES(contacto_email),
         contacto_whatsapp = VALUES(contacto_whatsapp),
         ativo = 1`,
      [
        company.id,
        category_id,
        descricao || null,
        contacto_email || null,
        contacto_whatsapp || null,
      ],
    );

    await log(
      userId,
      "servico_empresa_criado",
      "company_services",
      result.insertId || null,
      { category_id },
      req,
    );
    return created(
      res,
      { id: result.insertId || null },
      "Servico adicionado com sucesso.",
    );
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return badRequest(
        res,
        "Ja existe um servico desta categoria registado para a sua empresa.",
      );
    }
    return error(res, "Erro ao adicionar servico.", 500);
  }
};

const listCompanyServices = async (req, res) => {
  try {
    await ensureCompanyServicesRuntimeSchema();

    const company = await getCompanyProfileIdByUser(req.user.id);
    if (!company) return success(res, { servicos: [] });

    const [services] = await pool.execute(
      `SELECT cs.*, sc.nome as nome_categoria, sc.descricao as categoria_descricao
       FROM company_services cs
       LEFT JOIN service_categories sc ON sc.id = cs.category_id
       WHERE cs.company_id = ?
       ORDER BY cs.created_at DESC`,
      [company.id],
    );

    return success(res, { servicos: services });
  } catch (err) {
    return error(res, "Erro ao listar servicos da empresa.", 500);
  }
};

const updateCompanyService = async (req, res) => {
  try {
    await ensureCompanyServicesRuntimeSchema();

    const userId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);
    const { category_id, descricao, contacto_email, contacto_whatsapp } =
      req.body;
    const company = await getCompanyProfileIdByUser(userId);

    if (Number.isNaN(id) || id <= 0)
      return badRequest(res, "Identificador de servico invalido.");
    if (!company) return notFound(res, "Empresa nao encontrada.");
    if (!category_id)
      return badRequest(res, "A categoria do servico e obrigatoria.");

    const [[service]] = await pool.execute(
      "SELECT id FROM company_services WHERE id = ? AND company_id = ?",
      [id, company.id],
    );
    if (!service) return notFound(res, "Servico nao encontrado.");

    await pool.execute(
      `UPDATE company_services
       SET category_id = ?, descricao = ?, contacto_email = ?, contacto_whatsapp = ?, ativo = 1
       WHERE id = ? AND company_id = ?`,
      [
        category_id,
        descricao || null,
        contacto_email || null,
        contacto_whatsapp || null,
        id,
        company.id,
      ],
    );

    await log(
      userId,
      "servico_empresa_actualizado",
      "company_services",
      id,
      { category_id },
      req,
    );
    return success(res, {}, "Servico actualizado com sucesso.");
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return badRequest(
        res,
        "Ja existe um servico desta categoria registado para a sua empresa.",
      );
    }
    return error(res, "Erro ao actualizar servico.", 500);
  }
};

const deleteCompanyService = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number.parseInt(req.params.id, 10);
    const company = await getCompanyProfileIdByUser(userId);

    if (Number.isNaN(id) || id <= 0)
      return badRequest(res, "Identificador de servico invalido.");
    if (!company) return notFound(res, "Empresa nao encontrada.");

    const [result] = await pool.execute(
      "DELETE FROM company_services WHERE id = ? AND company_id = ?",
      [id, company.id],
    );

    if (result.affectedRows === 0)
      return notFound(res, "Servico nao encontrado.");

    await log(
      userId,
      "servico_empresa_eliminado",
      "company_services",
      id,
      null,
      req,
    );
    return success(res, {}, "Servico removido com sucesso.");
  } catch (err) {
    return error(res, "Erro ao remover servico.", 500);
  }
};

module.exports = {
  uploadDocument,
  getMyCompany,
  saveCompanyProfile,
  listOpportunities,
  getOpportunity,
  createOpportunity,
  expressInterest,
  adminListInterests,
  generateContract,
  downloadContract,
  signContract,
  adminListCompanies,
  approveCompany,
  createSubscription,
  addCompanyService: upsertCompanyService,
  listCompanyServices,
  updateCompanyService,
  deleteCompanyService,
};

// â”€â”€ Dashboard de Empresa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * GET /api/empresa/perfil
 * Retorna o perfil completo da empresa autenticada
 */
const getEmpresaPerfil = async (req, res) => {
  try {
    const [[cp]] = await pool.execute(
      `SELECT cp.*, u.nome, u.email, u.telefone
       FROM company_profiles cp
       LEFT JOIN users u ON u.id = cp.user_id
       WHERE cp.user_id = ?`,
      [req.user.id],
    );
    if (!cp)
      return notFound(
        res,
        "Perfil de empresa nÃ£o encontrado. Complete o registo.",
      );
    return success(res, { perfil: cp });
  } catch (err) {
    return error(res, "Erro ao obter perfil.", 500);
  }
};

/**
 * GET /api/empresa/stats
 * EstatÃ­sticas do dashboard da empresa
 */
const getEmpresaStats = async (req, res) => {
  try {
    // 1) Identificar empresa e tipo
    const [[cp]] = await pool.execute(
      `SELECT id, tipo_empresa
       FROM company_profiles
       WHERE user_id = ?`,
      [req.user.id],
    );

    if (!cp) {
      return success(res, {
        total_oportunidades: 0,
        total_interessados: 0,
        total_vagas: 0,
        total_documentos: 0,
        total_consultoria: 0,
        consultoria_por_atender: 0,
        consultoria_remarcadas_ou_agendadas: 0,
      });
    }

    // 2) Métricas padrão (empresa normal)
    const [[ops]] = await pool.execute(
      'SELECT COUNT(*) as t FROM investment_opportunities WHERE company_id = ? AND status = "ativa"',
      [cp.id],
    );
    const [[ints]] = await pool.execute(
      "SELECT COUNT(*) as t FROM investor_interests ii LEFT JOIN investment_opportunities io ON io.id = ii.opportunity_id WHERE io.company_id = ?",
      [cp.id],
    );
    const [[vagas]] = await pool.execute(
      'SELECT COUNT(*) as t FROM company_job_postings WHERE company_id = ? AND status = "aprovada"',
      [cp.id],
    );
    const [[docs]] = await pool.execute(
      "SELECT COUNT(*) as t FROM company_documents WHERE company_id = ?",
      [cp.id],
    );

    // 3) Métricas específicas para consultoria (dinâmicas e reais)
    let totalConsultoria = 0;
    let consultoriaPorAtender = 0;
    let consultoriaRemarcadasOuAgendadas = 0;

    if (cp.tipo_empresa === "consultoria") {
      const [[totalCons]] = await pool.execute(
        `SELECT COUNT(*) AS t
         FROM consultations
         WHERE consultancy_company_id = ?`,
        [cp.id],
      );

      const [[porAtender]] = await pool.execute(
        `SELECT COUNT(*) AS t
         FROM consultations
         WHERE consultancy_company_id = ?
           AND status IN ('pendente', 'confirmada')`,
        [cp.id],
      );

      const [[agendadasRemarcadas]] = await pool.execute(
        `SELECT COUNT(*) AS t
         FROM consultations
         WHERE consultancy_company_id = ?
           AND status = 'agendada'`,
        [cp.id],
      );

      totalConsultoria = totalCons?.t || 0;
      consultoriaPorAtender = porAtender?.t || 0;
      consultoriaRemarcadasOuAgendadas = agendadasRemarcadas?.t || 0;
    }

    return success(res, {
      total_oportunidades: ops.t,
      total_interessados: ints.t,
      total_vagas: vagas.t,
      total_documentos: docs.t,

      // Novas métricas para dashboard de consultoria
      total_consultoria: totalConsultoria,
      consultoria_por_atender: consultoriaPorAtender,
      consultoria_remarcadas_ou_agendadas: consultoriaRemarcadasOuAgendadas,
    });
  } catch (err) {
    return error(res, "Erro ao obter estatÃ­sticas.", 500);
  }
};

/**
 * GET /api/empresa/oportunidades
 * Lista oportunidades da empresa autenticada
 */
const getEmpresaOportunidades = async (req, res) => {
  try {
    const [[cp]] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id = ?",
      [req.user.id],
    );
    if (!cp) return success(res, { oportunidades: [] });

    const [rows] = await pool.execute(
      `SELECT io.*,
              (SELECT COUNT(*) FROM investor_interests WHERE opportunity_id = io.id) as num_interessados
       FROM investment_opportunities io
       WHERE io.company_id = ?
       ORDER BY io.created_at DESC`,
      [cp.id],
    );

    return success(res, { oportunidades: rows });
  } catch (err) {
    return error(res, "Erro ao listar oportunidades.", 500);
  }
};

/**
 * GET /api/empresa/oportunidades/:id/interessados
 * Lista os interessados de uma oportunidade da empresa autenticada
 */
const getEmpresaOpportunityInterests = async (req, res) => {
  try {
    const { id } = req.params;

    const [[cp]] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id = ?",
      [req.user.id],
    );
    if (!cp) return success(res, { interessados: [], total: 0 });

    const [[opportunity]] = await pool.execute(
      "SELECT id, titulo FROM investment_opportunities WHERE id = ? AND company_id = ?",
      [id, cp.id],
    );
    if (!opportunity) return notFound(res, "Oportunidade nÃ£o encontrada.");

    const [rows] = await pool.execute(
      `SELECT ii.id, ii.mensagem, ii.status, ii.created_at,
              u.id as investidor_id, u.nome, u.email, u.telefone,
              ip.areas_interesse, ip.descricao, ip.provincia, ip.municipio
       FROM investor_interests ii
       LEFT JOIN users u ON u.id = ii.investor_id
       LEFT JOIN investor_profiles ip ON ip.user_id = ii.investor_id
       WHERE ii.opportunity_id = ?
       ORDER BY ii.created_at DESC`,
      [id],
    );

    return success(res, {
      oportunidade: opportunity,
      interessados: rows,
      total: rows.length,
    });
  } catch (err) {
    return error(res, "Erro ao listar interessados.", 500);
  }
};

/**
 * GET /api/empresa/documentos
 * Lista documentos enviados pela empresa
 */
const getEmpresaDocumentos = async (req, res) => {
  try {
    const [[cp]] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id = ?",
      [req.user.id],
    );
    if (!cp) return success(res, { documentos: [] });

    const [rows] = await pool.execute(
      "SELECT * FROM company_documents WHERE company_id = ? ORDER BY created_at DESC",
      [cp.id],
    );

    return success(res, { documentos: rows });
  } catch (err) {
    return error(res, "Erro ao listar documentos.", 500);
  }
};

/**
 * GET /api/empresa/assinatura
 * Retorna a assinatura activa da empresa
 */
const getEmpresaAssinatura = async (req, res) => {
  try {
    const [[cp]] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id = ?",
      [req.user.id],
    );
    if (!cp) return success(res, { assinatura: null });

    const [[sub]] = await pool.execute(
      `SELECT * FROM subscriptions
       WHERE company_id = ? AND status = 'ativa' AND data_fim >= CURDATE()
       ORDER BY data_fim DESC LIMIT 1`,
      [cp.id],
    );

    return success(res, { assinatura: sub || null });
  } catch (err) {
    return error(res, "Erro ao obter assinatura.", 500);
  }
};

/**
 * GET /api/empresa/contratos
 * Lista contratos da empresa autenticada
 */
const getEmpresaContratos = async (req, res) => {
  try {
    const [[cp]] = await pool.execute(
      "SELECT id FROM company_profiles WHERE user_id = ?",
      [req.user.id],
    );
    if (!cp) return success(res, { contratos: [] });

    const [rows] = await pool.execute(
      `SELECT c.*, io.titulo as oportunidade_titulo,
              u.nome as nome_investidor
       FROM contracts c
       LEFT JOIN investment_opportunities io ON io.id = c.opportunity_id
       LEFT JOIN users u ON u.id = c.investor_id
       WHERE c.company_id = ?
       ORDER BY c.created_at DESC`,
      [cp.id],
    );

    return success(res, { contratos: rows.map(normalizeContractRow) });
  } catch (err) {
    return error(res, "Erro ao listar contratos.", 500);
  }
};

// Adicionar ao exports existentes
Object.assign(module.exports, {
  getEmpresaPerfil,
  getEmpresaStats,
  getEmpresaOportunidades,
  getEmpresaDocumentos,
  getEmpresaAssinatura,
  getEmpresaContratos,
  getEmpresaOpportunityInterests,
  listCompanyServices,
  updateCompanyService,
  deleteCompanyService,
});

// â”€â”€ Dashboard de Investidor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * GET /api/investidor/interesses
 * Lista interesses do investidor autenticado
 */
const getInvestidorInteresses = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ii.*, io.titulo, io.tipo, io.valor, io.moeda,
              cp.nome_empresa, cp.sector, cp.provincia
       FROM investor_interests ii
       LEFT JOIN investment_opportunities io ON io.id = ii.opportunity_id
       LEFT JOIN company_profiles cp ON cp.id = io.company_id
       WHERE ii.investor_id = ?
       ORDER BY ii.created_at DESC`,
      [req.user.id],
    );
    return success(res, { interesses: rows });
  } catch (err) {
    return error(res, "Erro ao listar interesses.", 500);
  }
};

/**
 * GET /api/investidor/contratos
 * Lista contratos do investidor autenticado
 */
const getInvestidorContratos = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, io.titulo as oportunidade_titulo,
              cp.nome_empresa
       FROM contracts c
       LEFT JOIN investment_opportunities io ON io.id = c.opportunity_id
       LEFT JOIN company_profiles cp ON cp.id = c.company_id
       WHERE c.investor_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id],
    );
    return success(res, { contratos: rows.map(normalizeContractRow) });
  } catch (err) {
    return error(res, "Erro ao listar contratos.", 500);
  }
};

/**
 * GET /api/investidor/perfil
 * Perfil do investidor autenticado
 */
const getInvestidorPerfil = async (req, res) => {
  try {
    const [[ip]] = await pool.execute(
      `SELECT ip.*, u.nome, u.email, u.telefone
       FROM investor_profiles ip
       LEFT JOIN users u ON u.id = ip.user_id
       WHERE ip.user_id = ?`,
      [req.user.id],
    );
    return success(res, { perfil: ip || null });
  } catch (err) {
    return error(res, "Erro ao obter perfil.", 500);
  }
};

/**
 * PUT /api/investidor/perfil
 * Actualizar perfil do investidor
 */
const updateInvestidorPerfil = async (req, res) => {
  try {
    const { areas_interesse, descricao, provincia, municipio, is_public } =
      req.body;
    const [[ip]] = await pool.execute(
      "SELECT id FROM investor_profiles WHERE user_id = ?",
      [req.user.id],
    );
    if (ip) {
      await pool.execute(
        `UPDATE investor_profiles SET areas_interesse=?, descricao=?, provincia=?, municipio=?, is_public=?
         WHERE user_id=?`,
        [
          areas_interesse,
          descricao,
          provincia,
          municipio,
          is_public ? 1 : 0,
          req.user.id,
        ],
      );
    } else {
      await pool.execute(
        `INSERT INTO investor_profiles (user_id, areas_interesse, descricao, provincia, municipio, is_public)
         VALUES (?,?,?,?,?,?)`,
        [
          req.user.id,
          areas_interesse,
          descricao,
          provincia,
          municipio,
          is_public ? 1 : 0,
        ],
      );
    }
    return success(res, {}, "Perfil actualizado com sucesso.");
  } catch (err) {
    return error(res, "Erro ao actualizar perfil.", 500);
  }
};

/**
 * DELETE /api/investidor/interesses/:id
 * Cancelar interesse
 */
const cancelarInteresse = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      `DELETE FROM investor_interests
       WHERE id = ? AND investor_id = ? AND status = 'pendente'`,
      [id, req.user.id],
    );
    if (result.affectedRows === 0)
      return error(
        res,
        "Interesse nÃ£o encontrado ou nÃ£o pode ser cancelado.",
        404,
      );
    return success(res, {}, "Interesse cancelado.");
  } catch (err) {
    return error(res, "Erro ao cancelar interesse.", 500);
  }
};

Object.assign(module.exports, {
  getInvestidorInteresses,
  getInvestidorContratos,
  getInvestidorPerfil,
  updateInvestidorPerfil,
  cancelarInteresse,
});
