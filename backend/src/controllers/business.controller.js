/**
 * Controller de Negócios / Investimentos
 */
const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { gerarContratoPDF } = require('../utils/pdf');
const { sendContractEmail, sendInvestorInterestNotification } = require('../utils/email');
const { sendWhatsApp } = require('../utils/whatsapp');
const { log } = require('../utils/audit');

const normalizeCompanyStatus = (status) => ({
  pendente: 'pending',
  aprovado: 'approved',
}[status] || status);

/** POST /api/companies/documents - Upload de documentos */
const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipo } = req.body;
    const file = req.file;

    if (!file) return badRequest(res, 'Nenhum ficheiro enviado.');
    if (!tipo) return badRequest(res, 'O tipo de documento é obrigatório.');

    const [company] = await pool.execute('SELECT id FROM company_profiles WHERE user_id=?', [userId]);
    if (!company.length) return notFound(res, 'Perfil de empresa não encontrado.');

    const url = `/uploads/documents/${file.filename}`;
    await pool.execute(
      'INSERT INTO company_documents (company_id, tipo, nome_ficheiro, url_ficheiro) VALUES (?,?,?,?)',
      [company[0].id, tipo, file.originalname, url]
    );
    await log(userId, 'UPLOAD_DOCUMENT', 'company_documents', company[0].id, { tipo }, req);
    return created(res, { url }, 'Documento enviado. Aguarde verificação.');
  } catch (err) {
    return error(res, 'Erro ao enviar documento.', 500);
  }
};

/** GET /api/companies/my - Perfil da minha empresa */
const getMyCompany = async (req, res) => {
  try {
    const [company] = await pool.execute(
      `SELECT cp.*, u.nome, u.email, u.telefone FROM company_profiles cp
       LEFT JOIN users u ON u.id=cp.user_id WHERE cp.user_id=?`,
      [req.user.id]
    );
    if (!company.length) return notFound(res, 'Perfil não encontrado.');

    const [docs] = await pool.execute('SELECT * FROM company_documents WHERE company_id=?', [company[0].id]);
    const [sub] = await pool.execute(
      'SELECT * FROM subscriptions WHERE company_id=? AND status="ativa" AND data_fim >= CURDATE() ORDER BY data_fim DESC LIMIT 1',
      [company[0].id]
    );
    const [services] = await pool.execute(
      `SELECT cs.*, sc.nome as nome_categoria FROM company_services cs
       LEFT JOIN service_categories sc ON sc.id=cs.category_id WHERE cs.company_id=? AND cs.ativo=1`,
      [company[0].id]
    );

    return success(res, { company: company[0], documents: docs, subscription: sub[0] || null, services });
  } catch (err) {
    return error(res, 'Erro ao obter perfil.', 500);
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
      return badRequest(res, 'O nome da empresa é obrigatório.');
    }

    const [[existing]] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?',
      [userId]
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
          is_public == null ? 1 : (is_public ? 1 : 0),
          userId,
        ]
      );

      await log(userId, 'UPDATE_COMPANY_PROFILE', 'company_profiles', existing.id, null, req);
      return success(res, { id: existing.id }, 'Perfil da empresa actualizado com sucesso.');
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
        is_public == null ? 1 : (is_public ? 1 : 0),
      ]
    );

    await log(userId, 'CREATE_COMPANY_PROFILE', 'company_profiles', result.insertId, null, req);
    return created(res, { id: result.insertId }, 'Perfil da empresa criado com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao guardar perfil da empresa.', 500);
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
                 WHERE io.status="ativa" AND cp.is_approved=1`;
    const params = [];

    if (tipo) { query += ' AND io.tipo=?'; params.push(tipo); }
    if (search) { query += ' AND (io.titulo LIKE ? OR io.descricao LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ` ORDER BY io.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, 'Erro ao listar oportunidades.', 500);
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
      [id]
    );
    if (!rows.length) return notFound(res, 'Oportunidade não encontrada.');

    // Incrementar visualizações
    await pool.execute('UPDATE investment_opportunities SET views_count=views_count+1 WHERE id=?', [id]);

    return success(res, rows[0]);
  } catch (err) {
    return error(res, 'Erro ao obter oportunidade.', 500);
  }
};

/** POST /api/opportunities - Criar oportunidade (empresa) */
const createOpportunity = async (req, res) => {
  try {
    const userId = req.user.id;
    const [company] = await pool.execute('SELECT id, is_approved FROM company_profiles WHERE user_id=?', [userId]);
    if (!company.length) return badRequest(res, 'Perfil de empresa não encontrado.');
    if (!company[0].is_approved) return badRequest(res, 'A sua empresa ainda não foi aprovada.');

    // Verificar assinatura ativa
    const [sub] = await pool.execute(
      'SELECT id FROM subscriptions WHERE company_id=? AND status="ativa" AND data_fim >= CURDATE()',
      [company[0].id]
    );
    if (!sub.length) return badRequest(res, 'A sua assinatura está inativa. Renove para publicar oportunidades.');

    // Verificar duplicação
    const { tipo, titulo } = req.body;
    const [dup] = await pool.execute(
      'SELECT id FROM investment_opportunities WHERE company_id=? AND titulo=? AND status="ativa"',
      [company[0].id, titulo]
    );
    if (dup.length) return badRequest(res, 'Já existe uma oportunidade activa com este título.');

    const { descricao, valor, moeda, dados_especificos, imagem_url } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO investment_opportunities (company_id, tipo, titulo, descricao, valor, moeda, dados_especificos, imagem_url) VALUES (?,?,?,?,?,?,?,?)',
      [company[0].id, tipo, titulo, descricao, valor||null, moeda||'Kz', dados_especificos ? JSON.stringify(dados_especificos) : null, imagem_url||null]
    );

    await log(userId, 'CREATE_OPPORTUNITY', 'investment_opportunities', result.insertId, { tipo, titulo }, req);
    return created(res, { id: result.insertId }, 'Oportunidade publicada com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao criar oportunidade.', 500);
  }
};

/** POST /api/opportunities/:id/interest - Demonstrar interesse */
const expressInterest = async (req, res) => {
  try {
    const investorId = req.user.id;
    const { id: opportunityId } = req.params;
    const { mensagem } = req.body;

    const [opp] = await pool.execute(
      `SELECT io.*, cp.nome_empresa, cp.user_id as company_user_id, u.email as email_empresa, u.telefone as tel_empresa
       FROM investment_opportunities io
       LEFT JOIN company_profiles cp ON cp.id=io.company_id
       LEFT JOIN users u ON u.id=cp.user_id
       WHERE io.id=? AND io.status="ativa"`,
      [opportunityId]
    );
    if (!opp.length) return notFound(res, 'Oportunidade não encontrada.');

    // Verificar se já demonstrou interesse
    const [existing] = await pool.execute(
      'SELECT id FROM investor_interests WHERE investor_id=? AND opportunity_id=?',
      [investorId, opportunityId]
    );
    if (existing.length) return badRequest(res, 'Já demonstrou interesse nesta oportunidade.');

    const [result] = await pool.execute(
      'INSERT INTO investor_interests (investor_id, opportunity_id, mensagem) VALUES (?,?,?)',
      [investorId, opportunityId, mensagem||null]
    );

    // Notificar admins
    const [admins] = await pool.execute('SELECT email FROM users WHERE role="admin" AND status="ativo"');
    const [investor] = await pool.execute('SELECT nome, email FROM users WHERE id=?', [investorId]);

    const notifData = {
      nome_investidor: investor[0].nome,
      email_investidor: investor[0].email,
      nome_empresa: opp[0].nome_empresa,
      titulo_oportunidade: opp[0].titulo,
    };

    admins.forEach(admin => {
      sendInvestorInterestNotification(admin.email, notifData).catch(e => console.error('[NOTIF]', e));
    });

    // Criar notificação interna
    await pool.execute(
      'INSERT INTO notifications (user_id, tipo, titulo, mensagem) VALUES (?,?,?,?)',
      [opp[0].company_user_id, 'interest', 'Novo interesse de investidor!', `${investor[0].nome} demonstrou interesse em "${opp[0].titulo}".`]
    );

    await log(investorId, 'EXPRESS_INTEREST', 'investor_interests', result.insertId, { opportunityId }, req);
    return created(res, { interest_id: result.insertId }, 'Interesse registado! A nossa equipa irá contactá-lo em breve.');
  } catch (err) {
    return error(res, 'Erro ao registar interesse.', 500);
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
       ORDER BY ii.created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'Erro ao listar interesses.', 500);
  }
};

/** POST /api/admin/interests/:id/contract - Gerar contrato */
const generateContract = async (req, res) => {
  try {
    const { id: interestId } = req.params;

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
      [interestId]
    );

    if (!interests.length) return notFound(res, 'Interesse não encontrado.');
    const data = interests[0];

    // Verificar se contrato já existe
    const [existing] = await pool.execute('SELECT id FROM contracts WHERE interest_id=?', [interestId]);
    if (existing.length) return badRequest(res, 'Contrato já gerado para este interesse.');

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
      console.error('[PDF CONTRACT]', pdfErr.message);
    }

    const [result] = await pool.execute(
      `INSERT INTO contracts (interest_id, opportunity_id, investor_id, company_id, titulo, pdf_data, gerado_by)
       VALUES (?,?,?,?,?,?,?)`,
      [interestId, data.opportunity_id, data.investor_id, data.company_id, data.titulo_oportunidade, pdfBuffer, req.user.id]
    );

    await pool.execute('UPDATE investor_interests SET status="em_analise" WHERE id=?', [interestId]);

    // Enviar emails com o contrato
    sendContractEmail(data.email_empresa, data.nome_empresa, contractData, pdfBuffer)
      .then(() => pool.execute('UPDATE contracts SET enviado_email_empresa=1 WHERE id=?', [result.insertId]))
      .catch(e => console.error('[CONTRACT EMAIL EMPRESA]', e));

    sendContractEmail(data.email_investidor, data.nome_investidor, contractData, pdfBuffer)
      .then(() => pool.execute('UPDATE contracts SET enviado_email_investidor=1 WHERE id=?', [result.insertId]))
      .catch(e => console.error('[CONTRACT EMAIL INVESTIDOR]', e));

    await log(req.user.id, 'GENERATE_CONTRACT', 'contracts', result.insertId, { interestId }, req);
    return created(res, { contract_id: result.insertId }, 'Contrato gerado e enviado por email.');
  } catch (err) {
    console.error('[CONTRACT]', err);
    return error(res, 'Erro ao gerar contrato.', 500);
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
      [id]
    );
    if (!rows.length) return notFound(res, 'Contrato não encontrado.');

    const contract = rows[0];
    const canAccess = ['admin','employee'].includes(role) ||
                      contract.investor_id === userId ||
                      contract.company_user_id === userId;

    if (!canAccess) return res.status(403).json({ success: false, message: 'Acesso negado.' });

    if (contract.pdf_data) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contrato_${id}.pdf"`);
      return res.send(contract.pdf_data);
    }
    return notFound(res, 'PDF não disponível.');
  } catch (err) {
    return error(res, 'Erro ao obter contrato.', 500);
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
      [id]
    );
    if (!rows.length) return notFound(res, 'Contrato não encontrado.');
    const contract = rows[0];

    let updateField = '';
    if (role === 'investor' && contract.investor_id === userId && !contract.assinado_investidor) {
      updateField = 'assinado_investidor=1, assinado_investidor_at=NOW()';
    } else if (role === 'company' && contract.company_user_id === userId && !contract.assinado_empresa) {
      updateField = 'assinado_empresa=1, assinado_empresa_at=NOW()';
    } else {
      return badRequest(res, 'Não pode assinar este contrato ou já foi assinado.');
    }

    await pool.execute(`UPDATE contracts SET ${updateField} WHERE id=?`, [id]);

    // Verificar se ambos assinaram
    const [updated] = await pool.execute('SELECT * FROM contracts WHERE id=?', [id]);
    if (updated[0].assinado_empresa && updated[0].assinado_investidor) {
      await pool.execute('UPDATE contracts SET status="assinado_ambos" WHERE id=?', [id]);
      await pool.execute('UPDATE investor_interests SET status="aprovado" WHERE id=?', [contract.interest_id]);
    }

    await log(userId, 'SIGN_CONTRACT', 'contracts', id, null, req);
    return success(res, null, 'Contrato assinado com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao assinar contrato.', 500);
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

    if (status === 'pending') { query += ' AND cp.is_approved=0'; }
    else if (status === 'approved') { query += ' AND cp.is_approved=1'; }

    query += ` GROUP BY cp.id ORDER BY cp.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, 'Erro ao listar empresas.', 500);
  }
};

/** PUT /api/admin/companies/:id/approve - Aprovar/Rejeitar empresa */
const approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, motivo_rejeicao } = req.body;

    await pool.execute(
      'UPDATE company_profiles SET is_approved=?, approved_by=?, approved_at=NOW(), motivo_rejeicao=? WHERE id=?',
      [approved ? 1 : 0, req.user.id, motivo_rejeicao||null, id]
    );

    await log(req.user.id, approved ? 'APPROVE_COMPANY' : 'REJECT_COMPANY', 'company_profiles', id, { motivo_rejeicao }, req);
    return success(res, null, approved ? 'Empresa aprovada.' : 'Empresa rejeitada.');
  } catch (err) {
    return error(res, 'Erro ao processar empresa.', 500);
  }
};

/** POST /api/admin/subscriptions - Criar assinatura */
const createSubscription = async (req, res) => {
  try {
    const { company_id, plano, valor, data_inicio, data_fim } = req.body;
    if (!company_id || !plano || !valor || !data_inicio || !data_fim) {
      return badRequest(res, 'Todos os campos são obrigatórios.');
    }

    // Desativar assinaturas antigas
    await pool.execute('UPDATE subscriptions SET status="expirada" WHERE company_id=? AND status="ativa"', [company_id]);

    const [result] = await pool.execute(
      'INSERT INTO subscriptions (company_id, plano, valor, data_inicio, data_fim, created_by) VALUES (?,?,?,?,?,?)',
      [company_id, plano, valor, data_inicio, data_fim, req.user.id]
    );

    await log(req.user.id, 'CREATE_SUBSCRIPTION', 'subscriptions', result.insertId, { company_id, plano }, req);
    return created(res, { id: result.insertId }, 'Assinatura criada com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao criar assinatura.', 500);
  }
};

/** POST /api/companies/services - Adicionar serviço à empresa */
const addCompanyService = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, descricao } = req.body;

    const [company] = await pool.execute('SELECT id FROM company_profiles WHERE user_id=?', [userId]);
    if (!company.length) return notFound(res, 'Empresa não encontrada.');

    const [result] = await pool.execute(
      'INSERT INTO company_services (company_id, category_id, descricao) VALUES (?,?,?) ON DUPLICATE KEY UPDATE descricao=VALUES(descricao), ativo=1',
      [company[0].id, category_id, descricao||null]
    );

    return created(res, null, 'Serviço adicionado com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao adicionar serviço.', 500);
  }
};

module.exports = {
  uploadDocument, getMyCompany, saveCompanyProfile, listOpportunities, getOpportunity,
  createOpportunity, expressInterest, adminListInterests, generateContract,
  downloadContract, signContract, adminListCompanies, approveCompany,
  createSubscription, addCompanyService,
};

// ── Dashboard de Empresa ──────────────────────────────────────────────────────

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
      [req.user.id]
    );
    if (!cp) return notFound(res, 'Perfil de empresa não encontrado. Complete o registo.');
    return success(res, { perfil: cp });
  } catch (err) {
    return error(res, 'Erro ao obter perfil.', 500);
  }
};

/**
 * GET /api/empresa/stats
 * Estatísticas do dashboard da empresa
 */
const getEmpresaStats = async (req, res) => {
  try {
    const [[cp]] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?', [req.user.id]
    );
    if (!cp) return success(res, { total_oportunidades: 0, total_interessados: 0, total_vagas: 0, total_documentos: 0 });

    const [[ops]]    = await pool.execute('SELECT COUNT(*) as t FROM investment_opportunities WHERE company_id = ? AND status = "ativa"', [cp.id]);
    const [[ints]]   = await pool.execute('SELECT COUNT(*) as t FROM investor_interests ii LEFT JOIN investment_opportunities io ON io.id = ii.opportunity_id WHERE io.company_id = ?', [cp.id]);
    const [[vagas]]  = await pool.execute('SELECT COUNT(*) as t FROM company_job_postings WHERE company_id = ? AND status = "aprovada"', [cp.id]);
    const [[docs]]   = await pool.execute('SELECT COUNT(*) as t FROM company_documents WHERE company_id = ?', [cp.id]);

    return success(res, {
      total_oportunidades: ops.t,
      total_interessados:  ints.t,
      total_vagas:         vagas.t,
      total_documentos:    docs.t,
    });
  } catch (err) {
    return error(res, 'Erro ao obter estatísticas.', 500);
  }
};

/**
 * GET /api/empresa/oportunidades
 * Lista oportunidades da empresa autenticada
 */
const getEmpresaOportunidades = async (req, res) => {
  try {
    const [[cp]] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?', [req.user.id]
    );
    if (!cp) return success(res, { oportunidades: [] });

    const [rows] = await pool.execute(
      `SELECT io.*,
              (SELECT COUNT(*) FROM investor_interests WHERE opportunity_id = io.id) as num_interessados
       FROM investment_opportunities io
       WHERE io.company_id = ?
       ORDER BY io.created_at DESC`,
      [cp.id]
    );

    return success(res, { oportunidades: rows });
  } catch (err) {
    return error(res, 'Erro ao listar oportunidades.', 500);
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
      'SELECT id FROM company_profiles WHERE user_id = ?',
      [req.user.id]
    );
    if (!cp) return success(res, { interessados: [], total: 0 });

    const [[opportunity]] = await pool.execute(
      'SELECT id, titulo FROM investment_opportunities WHERE id = ? AND company_id = ?',
      [id, cp.id]
    );
    if (!opportunity) return notFound(res, 'Oportunidade não encontrada.');

    const [rows] = await pool.execute(
      `SELECT ii.id, ii.mensagem, ii.status, ii.created_at,
              u.id as investidor_id, u.nome, u.email, u.telefone,
              ip.areas_interesse, ip.descricao, ip.provincia, ip.municipio
       FROM investor_interests ii
       LEFT JOIN users u ON u.id = ii.investor_id
       LEFT JOIN investor_profiles ip ON ip.user_id = ii.investor_id
       WHERE ii.opportunity_id = ?
       ORDER BY ii.created_at DESC`,
      [id]
    );

    return success(res, {
      oportunidade: opportunity,
      interessados: rows,
      total: rows.length,
    });
  } catch (err) {
    return error(res, 'Erro ao listar interessados.', 500);
  }
};

/**
 * GET /api/empresa/documentos
 * Lista documentos enviados pela empresa
 */
const getEmpresaDocumentos = async (req, res) => {
  try {
    const [[cp]] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?', [req.user.id]
    );
    if (!cp) return success(res, { documentos: [] });

    const [rows] = await pool.execute(
      'SELECT * FROM company_documents WHERE company_id = ? ORDER BY created_at DESC',
      [cp.id]
    );

    return success(res, { documentos: rows });
  } catch (err) {
    return error(res, 'Erro ao listar documentos.', 500);
  }
};

/**
 * GET /api/empresa/assinatura
 * Retorna a assinatura activa da empresa
 */
const getEmpresaAssinatura = async (req, res) => {
  try {
    const [[cp]] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?', [req.user.id]
    );
    if (!cp) return success(res, { assinatura: null });

    const [[sub]] = await pool.execute(
      `SELECT * FROM subscriptions
       WHERE company_id = ? AND status = 'ativa' AND data_fim >= CURDATE()
       ORDER BY data_fim DESC LIMIT 1`,
      [cp.id]
    );

    return success(res, { assinatura: sub || null });
  } catch (err) {
    return error(res, 'Erro ao obter assinatura.', 500);
  }
};

// Adicionar ao exports existentes
Object.assign(module.exports, {
  getEmpresaPerfil, getEmpresaStats, getEmpresaOportunidades,
  getEmpresaDocumentos, getEmpresaAssinatura, getEmpresaOpportunityInterests,
});

// ── Dashboard de Investidor ───────────────────────────────────────────────────

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
      [req.user.id]
    );
    return success(res, { interesses: rows });
  } catch (err) {
    return error(res, 'Erro ao listar interesses.', 500);
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
      [req.user.id]
    );
    return success(res, { contratos: rows });
  } catch (err) {
    return error(res, 'Erro ao listar contratos.', 500);
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
      [req.user.id]
    );
    return success(res, { perfil: ip || null });
  } catch (err) {
    return error(res, 'Erro ao obter perfil.', 500);
  }
};

/**
 * PUT /api/investidor/perfil
 * Actualizar perfil do investidor
 */
const updateInvestidorPerfil = async (req, res) => {
  try {
    const { areas_interesse, descricao, provincia, municipio, is_public } = req.body;
    const [[ip]] = await pool.execute(
      'SELECT id FROM investor_profiles WHERE user_id = ?', [req.user.id]
    );
    if (ip) {
      await pool.execute(
        `UPDATE investor_profiles SET areas_interesse=?, descricao=?, provincia=?, municipio=?, is_public=?
         WHERE user_id=?`,
        [areas_interesse, descricao, provincia, municipio, is_public ? 1 : 0, req.user.id]
      );
    } else {
      await pool.execute(
        `INSERT INTO investor_profiles (user_id, areas_interesse, descricao, provincia, municipio, is_public)
         VALUES (?,?,?,?,?,?)`,
        [req.user.id, areas_interesse, descricao, provincia, municipio, is_public ? 1 : 0]
      );
    }
    return success(res, {}, 'Perfil actualizado com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao actualizar perfil.', 500);
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
      [id, req.user.id]
    );
    if (result.affectedRows === 0)
      return error(res, 'Interesse não encontrado ou não pode ser cancelado.', 404);
    return success(res, {}, 'Interesse cancelado.');
  } catch (err) {
    return error(res, 'Erro ao cancelar interesse.', 500);
  }
};

Object.assign(module.exports, {
  getInvestidorInteresses, getInvestidorContratos,
  getInvestidorPerfil, updateInvestidorPerfil, cancelarInteresse,
});
