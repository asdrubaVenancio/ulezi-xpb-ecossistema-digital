/**
 * Controller de Assinaturas para Empresas
 * Permite empresas visualizar, adquirir e renovar assinaturas
 */

const { pool } = require('../config/database');
const { success, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');
const { generateSubscriptionReceiptBuffer } = require('../services/pdf-company-modern');
const {
  sendSubscriptionApprovalEmail,
  sendSubscriptionRejectionEmail,
} = require('../utils/email');

const criarAssinaturaPendente = async ({
  companyId,
  userId,
  packageId,
  pkg,
  metodoPagamento = 'referencia',
  referenciaPagamento = null,
  comprovanteUrl = null,
}) => {
  const [existing] = await pool.execute(
    `SELECT id FROM subscriptions
     WHERE company_id = ? AND status IN ('ativa', 'pendente') AND data_fim >= CURDATE()`,
    [companyId]
  );

  if (existing.length > 0) {
    return { erro: 'Já existe uma assinatura ativa ou pendente para esta empresa.' };
  }

  const dataInicio = new Date();
  const dataFim = new Date();
  dataFim.setDate(dataFim.getDate() + Number(pkg.duracao_dias || 30));

  const [result] = await pool.execute(
    `INSERT INTO subscriptions
     (company_id, user_id, package_id, tipo_plano, data_inicio, data_fim,
      status, valor, valor_pago, moeda, metodo_pagamento, referencia_pagamento,
      pagamento_status, comprovante_url, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?, 'pendente', ?, ?)`,
    [
      companyId,
      userId,
      packageId,
      pkg.slug,
      dataInicio.toISOString().split('T')[0],
      dataFim.toISOString().split('T')[0],
      pkg.preco,
      pkg.preco,
      pkg.moeda,
      metodoPagamento,
      referenciaPagamento,
      comprovanteUrl,
      userId,
    ]
  );

  return {
    id: result.insertId,
    dataInicio: dataInicio.toISOString().split('T')[0],
    dataFim: dataFim.toISOString().split('T')[0],
  };
};

/**
 * GET /api/empresa/minha-assinatura
 * Retorna assinatura atual da empresa
 */
const getMySubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar empresa
    const [company] = await pool.execute(
      'SELECT id, nome_empresa, is_approved FROM company_profiles WHERE user_id = ?',
      [userId]
    );

    if (!company.length) {
      return notFound(res, 'Perfil de empresa não encontrado.');
    }

    const companyId = company[0].id;

    // Buscar assinatura ativa
    const [subscriptions] = await pool.execute(
      `SELECT s.*, sp.slug, sp.nome as package_name, sp.descricao as package_descricao,
              sp.preco as package_preco, sp.moeda as package_moeda,
              sp.consultorias_incluidas, sp.max_oportunidades_ativas, sp.max_vagas_ativas,
              sp.publicacoes_oportunidades_ilimitadas, sp.publicacoes_vagas_ilimitadas,
              sp.suporte_prioritario, sp.beneficios, sp.duracao_dias
       FROM subscriptions s
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE s.company_id = ? AND s.status = 'ativa' AND s.data_fim >= CURDATE()
       ORDER BY s.data_fim DESC
       LIMIT 1`,
      [companyId]
    );

    const [[latestSubscription]] = await pool.execute(
      `SELECT s.*, sp.slug, sp.nome as package_name, sp.descricao as package_descricao,
              sp.preco as package_preco, sp.moeda as package_moeda,
              sp.consultorias_incluidas, sp.max_oportunidades_ativas, sp.max_vagas_ativas,
              sp.publicacoes_oportunidades_ilimitadas, sp.publicacoes_vagas_ilimitadas,
              sp.suporte_prioritario, sp.beneficios, sp.duracao_dias
       FROM subscriptions s
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE s.company_id = ?
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [companyId]
    );

    // Contar uso dos privilégios
    let usage = {};
    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      
      // Contar oportunidades ativas
      const [oportunidades] = await pool.execute(
        'SELECT COUNT(*) as total FROM investment_opportunities WHERE company_id = ? AND status = "ativa"',
        [companyId]
      );

      // Contar vagas ativas
      const [vagas] = await pool.execute(
        'SELECT COUNT(*) as total FROM company_job_postings WHERE company_id = ? AND status = "aprovada"',
        [companyId]
      );

      // Contar consultorias no período
      const [consultorias] = await pool.execute(
        `SELECT COUNT(*) as total FROM consultations 
         WHERE user_id = ? AND status IN ('agendada', 'realizada', 'confirmada')
         AND created_at >= ?`,
        [userId, sub.data_inicio]
      );

      usage = {
        oportunidades_ativas: oportunidades[0].total,
        vagas_ativas: vagas[0].total,
        consultorias_usadas: consultorias[0].total,
        limite_oportunidades: sub.publicacoes_oportunidades_ilimitadas ? 'ilimitado' : sub.max_oportunidades_ativas,
        limite_vagas: sub.publicacoes_vagas_ilimitadas ? 'ilimitado' : sub.max_vagas_ativas,
        limite_consultorias: sub.consultorias_incluidas
      };
    }

    return success(res, {
      empresa: company[0],
      assinatura: subscriptions[0] || null,
      ultima_solicitacao: latestSubscription || null,
      tem_assinatura_ativa: subscriptions.length > 0,
      uso: usage
    });

  } catch (err) {
    console.error('[GET_MY_SUBSCRIPTION]', err);
    return error(res, 'Erro ao obter assinatura.', 500);
  }
};

/**
 * POST /api/empresa/assinar
 * Cria uma nova assinatura para a empresa (simulação de pagamento)
 */
const subscribe = async (req, res) => {
  try {
    const { package_id, metodo_pagamento = 'referencia' } = req.body;
    const userId = req.user.id;

    if (!package_id) {
      return badRequest(res, 'ID do pacote é obrigatório.');
    }

    // Buscar empresa
    const [company] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?',
      [userId]
    );
    if (!company.length) {
      return notFound(res, 'Perfil de empresa não encontrado.');
    }
    const companyId = company[0].id;

    // Buscar pacote
    const [packages] = await pool.execute(
      `SELECT * FROM subscription_packages 
       WHERE id = ? AND status = 'ativo' AND is_active = 1`,
      [package_id]
    );
    if (!packages.length) {
      return notFound(res, 'Pacote não encontrado ou indisponível.');
    }
    const pkg = packages[0];

    // Gerar referência de pagamento (simulada)
    const referencia = `ULEZI-${Date.now().toString().slice(-8)}-${Math.round(Math.random() * 999)}`;
    const criacao = await criarAssinaturaPendente({
      companyId,
      userId,
      packageId: package_id,
      pkg,
      metodoPagamento: metodo_pagamento,
      referenciaPagamento: referencia,
    });

    if (criacao.erro) {
      return badRequest(res, criacao.erro);
    }

    // Notificar admin sobre nova assinatura pendente
    const [admins] = await pool.execute(
      'SELECT id FROM users WHERE role = "admin" AND status = "ativo"'
    );
    for (const admin of admins) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'assinatura_pendente', 'Nova assinatura pendente',
                 CONCAT('Empresa #', ?, ' solicitou o plano ', ?, '. Referência: ', ?))`,
        [admin.id, companyId, pkg.nome, referencia]
      );
    }

    await log(userId, 'CREATE_SUBSCRIPTION_PENDING', 'subscriptions', criacao.id, { package_id, valor: pkg.preco }, req);

    return success(res, {
      assinatura_id: criacao.id,
      referencia_pagamento: referencia,
      valor: pkg.preco,
      moeda: pkg.moeda,
      data_vencimento: criacao.dataFim,
      mensagem: 'Assinatura criada. Aguardando confirmação de pagamento.'
    }, 201);

  } catch (err) {
    console.error('[SUBSCRIBE]', err);
    return error(res, 'Erro ao criar assinatura.', 500);
  }
};

/**
 * POST /api/empresa/assinar-com-comprovativo
 * Cria uma solicitação de assinatura já com comprovativo anexado.
 */
const subscribeWithProof = async (req, res) => {
  try {
    const { package_id, metodo_pagamento = 'transferencia', referencia_pagamento } = req.body;
    const userId = req.user.id;
    const comprovativo = req.file;

    if (!package_id) {
      return badRequest(res, 'O pacote de assinatura é obrigatório.');
    }

    if (!comprovativo) {
      return badRequest(res, 'O comprovativo de pagamento é obrigatório.');
    }

    const [company] = await pool.execute(
      'SELECT id, nome_empresa FROM company_profiles WHERE user_id = ?',
      [userId]
    );
    if (!company.length) {
      return notFound(res, 'Perfil de empresa não encontrado.');
    }

    const [packages] = await pool.execute(
      `SELECT * FROM subscription_packages
       WHERE id = ? AND status = 'ativo' AND is_active = 1`,
      [package_id]
    );
    if (!packages.length) {
      return notFound(res, 'Pacote não encontrado ou indisponível.');
    }

    const pkg = packages[0];
    const comprovanteUrl = `/uploads/payments/${comprovativo.filename}`;
    const referencia = referencia_pagamento?.trim() || `ASS-${Date.now()}`;

    const criacao = await criarAssinaturaPendente({
      companyId: company[0].id,
      userId,
      packageId: package_id,
      pkg,
      metodoPagamento: metodo_pagamento,
      referenciaPagamento: referencia,
      comprovanteUrl,
    });

    if (criacao.erro) {
      return badRequest(res, criacao.erro);
    }

    const [admins] = await pool.execute(
      'SELECT id FROM users WHERE role IN ("admin", "employee") AND status = "ativo"'
    );

    for (const admin of admins) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'assinatura_pendente', 'Nova assinatura com comprovativo',
                 CONCAT('A empresa ', ?, ' submeteu a assinatura do plano ', ?, ' com comprovativo para validação.'))`,
        [admin.id, company[0].nome_empresa, pkg.nome]
      );
    }

    await log(userId, 'CREATE_SUBSCRIPTION_WITH_PROOF', 'subscriptions', criacao.id, {
      package_id,
      referencia_pagamento: referencia,
      comprovante_url: comprovanteUrl,
    }, req);

    return success(res, {
      assinatura_id: criacao.id,
      comprovante_url: comprovanteUrl,
      referencia_pagamento: referencia,
      mensagem: 'Solicitação enviada com comprovativo. Aguarde a análise administrativa.',
    }, 201);
  } catch (err) {
    console.error('[SUBSCRIBE_WITH_PROOF]', err);
    return error(res, 'Erro ao enviar solicitação com comprovativo.', 500);
  }
};

/**
 * POST /api/empresa/renovar
 * Renova assinatura existente
 */
const renewSubscription = async (req, res) => {
  try {
    const { package_id } = req.body;
    const userId = req.user.id;

    // Buscar empresa
    const [company] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?',
      [userId]
    );
    if (!company.length) {
      return notFound(res, 'Perfil de empresa não encontrado.');
    }
    const companyId = company[0].id;

    // Buscar assinatura atual
    const [current] = await pool.execute(
      `SELECT s.*, sp.duracao_dias, sp.preco, sp.moeda
       FROM subscriptions s
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE s.company_id = ? AND s.status IN ('ativa', 'vencida', 'expirada')
       ORDER BY s.data_fim DESC
       LIMIT 1`,
      [companyId]
    );

    if (!current.length) {
      return badRequest(res, 'Não existe assinatura anterior para renovar. Faça uma nova assinatura.');
    }

    // Determinar pacote (mesmo ou upgrade)
    let pkg;
    if (package_id) {
      const [packages] = await pool.execute(
        `SELECT * FROM subscription_packages 
         WHERE id = ? AND status = 'ativo' AND is_active = 1`,
        [package_id]
      );
      if (!packages.length) {
        return notFound(res, 'Pacote não encontrado.');
      }
      pkg = packages[0];
    } else {
      // Renovando mesmo pacote
      pkg = { 
        id: current[0].package_id, 
        duracao_dias: current[0].duracao_dias || 30,
        preco: current[0].preco,
        moeda: current[0].moeda || 'AOA',
        nome: current[0].tipo_plano
      };
    }

    // Calcular nova data (a partir da data fim atual ou hoje, o que for maior)
    const hoje = new Date();
    const dataFimAtual = new Date(current[0].data_fim);
    const dataInicio = dataFimAtual > hoje ? dataFimAtual : hoje;
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + pkg.duracao_dias);

    // Expirar assinatura antiga
    await pool.execute(
      'UPDATE subscriptions SET status = "expirada" WHERE id = ?',
      [current[0].id]
    );

    // Criar nova assinatura
    const [result] = await pool.execute(
      `INSERT INTO subscriptions 
       (company_id, user_id, package_id, tipo_plano, data_inicio, data_fim,
        status, valor_pago, moeda, metodo_pagamento, pagamento_status, is_renewal, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'pendente', ?, ?, 'referencia', 'pendente', 1, ?)`,
      [
        companyId, userId, pkg.id, current[0].tipo_plano,
        dataInicio.toISOString().split('T')[0],
        dataFim.toISOString().split('T')[0],
        pkg.preco, pkg.moeda, userId
      ]
    );

    await log(userId, 'RENEW_SUBSCRIPTION', 'subscriptions', result.insertId, { package_id: pkg.id, valor: pkg.preco }, req);

    return success(res, {
      assinatura_id: result.insertId,
      mensagem: 'Renovação solicitada. Aguardando confirmação de pagamento.',
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0]
    }, 201);

  } catch (err) {
    console.error('[RENEW_SUBSCRIPTION]', err);
    return error(res, 'Erro ao renovar assinatura.', 500);
  }
};

/**
 * GET /api/empresa/historico-assinaturas
 * Histórico de assinaturas da empresa
 */
const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [company] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?',
      [userId]
    );
    if (!company.length) {
      return notFound(res, 'Perfil de empresa não encontrado.');
    }

    const [subscriptions] = await pool.execute(
      `SELECT s.*, sp.nome as package_name, sp.preco as package_preco
       FROM subscriptions s
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE s.company_id = ?
       ORDER BY s.created_at DESC`,
      [company[0].id]
    );

    return success(res, { historico: subscriptions });

  } catch (err) {
    console.error('[SUBSCRIPTION_HISTORY]', err);
    return error(res, 'Erro ao obter histórico.', 500);
  }
};

/**
 * GET /api/admin/company-subscriptions
 * Lista solicitações e assinaturas empresariais para análise administrativa
 */
const listAdminSubscriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 50, pesquisa } = req.query;
    const offset = (Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10);
    const where = [];
    const params = [];

    if (status) {
      where.push('s.status = ?');
      params.push(status);
    }

    if (pesquisa) {
      where.push('(cp.nome_empresa LIKE ? OR u.nome LIKE ? OR u.email LIKE ? OR sp.nome LIKE ?)');
      const termo = `%${pesquisa}%`;
      params.push(termo, termo, termo, termo);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT
         s.id,
         s.company_id,
         s.user_id,
         s.package_id,
         s.tipo_plano,
         s.data_inicio,
         s.data_fim,
         s.status,
         s.valor_pago,
         s.moeda,
         s.metodo_pagamento,
         s.referencia_pagamento,
         s.pagamento_status,
         s.comprovante_url,
         s.comprovante_visualizado_em,
         s.auto_renovar,
         s.created_at,
         s.approved_at,
         s.motivo_rejeicao,
         cp.nome_empresa,
         cp.is_approved as empresa_aprovada,
         u.nome as representante_nome,
         u.email as representante_email,
         sp.nome as pacote_nome,
         sp.slug as pacote_slug,
         sp.consultorias_incluidas,
         sp.max_oportunidades_ativas,
         sp.max_vagas_ativas,
         sp.publicacoes_oportunidades_ilimitadas,
         sp.publicacoes_vagas_ilimitadas,
         sp.suporte_prioritario,
         aprovador.nome as aprovado_por_nome
       FROM subscriptions s
       INNER JOIN company_profiles cp ON cp.id = s.company_id
       INNER JOIN users u ON u.id = s.user_id
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       LEFT JOIN users aprovador ON aprovador.id = s.approved_by
       ${whereClause}
       ORDER BY
         FIELD(s.status, 'pendente', 'ativa', 'vencida', 'expirada', 'cancelada', 'renovada'),
         s.created_at DESC
       LIMIT ${Number.parseInt(limit, 10)} OFFSET ${Math.max(0, offset)}`,
      params
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM subscriptions s
       INNER JOIN company_profiles cp ON cp.id = s.company_id
       INNER JOIN users u ON u.id = s.user_id
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       ${whereClause}`,
      params
    );

    const [[summary]] = await pool.execute(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
         SUM(CASE WHEN status = 'ativa' THEN 1 ELSE 0 END) as ativas,
         SUM(CASE WHEN status IN ('vencida', 'expirada') THEN 1 ELSE 0 END) as expiradas,
         SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas
       FROM subscriptions`
    );

    return success(res, {
      assinaturas: rows,
      total: countRows[0]?.total || rows.length,
      resumo: summary,
      pagina: Number.parseInt(page, 10),
      limite: Number.parseInt(limit, 10),
    });
  } catch (err) {
    console.error('[LIST_ADMIN_SUBSCRIPTIONS]', err);
    return error(res, 'Erro ao listar assinaturas empresariais.', 500);
  }
};

/**
 * PUT /api/admin/company-subscriptions/:id/approve
 * Confirma o pagamento e activa a assinatura da empresa
 */
const approveSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const [[subscription]] = await pool.execute(
      `SELECT s.*, cp.user_id as company_user_id, cp.nome_empresa, u.nome as representante_nome, u.email as representante_email, sp.nome as package_name
       FROM subscriptions s
       INNER JOIN company_profiles cp ON cp.id = s.company_id
       INNER JOIN users u ON u.id = cp.user_id
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE s.id = ?`,
      [id]
    );

    if (!subscription) {
      return notFound(res, 'Assinatura não encontrada.');
    }

    if (subscription.status !== 'pendente') {
      return badRequest(res, 'Apenas assinaturas pendentes podem ser aprovadas.');
    }

    if (!subscription.comprovante_url) {
      return badRequest(res, 'A assinatura não possui comprovativo anexado.');
    }

    if (!subscription.comprovante_visualizado_em) {
      return badRequest(res, 'O comprovativo deve ser visualizado antes da aprovação.');
    }

    await pool.execute(
      `UPDATE subscriptions
       SET status = 'expirada'
       WHERE company_id = ? AND status = 'ativa' AND id <> ?`,
      [subscription.company_id, id]
    );

    await pool.execute(
      `UPDATE subscriptions
       SET status = 'ativa',
           pagamento_status = 'confirmado',
           approved_by = ?,
           approved_at = NOW(),
           motivo_rejeicao = NULL
       WHERE id = ?`,
      [adminId, id]
    );

    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'assinatura_aprovada', 'Assinatura activada',
         CONCAT('O pacote ', ?, ' foi activado para a sua empresa. O acesso completo já está disponível.'))`,
      [subscription.company_user_id, subscription.package_name || subscription.tipo_plano || 'selecionado']
    );

    const numeroRecibo = `SUB-${String(subscription.id).padStart(6, '0')}`;
    const reciboBuffer = await generateSubscriptionReceiptBuffer({
      id: subscription.id,
      numero_recibo: numeroRecibo,
      nome_empresa: subscription.nome_empresa,
      representante_nome: subscription.representante_nome || subscription.nome_empresa,
      representante_email: subscription.representante_email || '',
      pacote_nome: subscription.package_name || subscription.tipo_plano || 'Plano',
      valor_pago: subscription.valor_pago,
      moeda: subscription.moeda,
      data_inicio: subscription.data_inicio,
      data_fim: subscription.data_fim,
      referencia_pagamento: subscription.referencia_pagamento,
    });

    if (subscription.representante_email) {
      await sendSubscriptionApprovalEmail(subscription.representante_email, {
        id: subscription.id,
        numero_recibo: numeroRecibo,
        nome_empresa: subscription.nome_empresa,
        pacote_nome: subscription.package_name || subscription.tipo_plano || 'Plano',
        valor_pago: subscription.valor_pago,
        moeda: subscription.moeda,
        data_inicio: subscription.data_inicio,
        data_fim: subscription.data_fim,
        referencia_pagamento: subscription.referencia_pagamento,
      }, reciboBuffer);
    }

    await log(adminId, 'APPROVE_SUBSCRIPTION', 'subscriptions', id, { status: 'ativa' }, req);
    return success(res, null, 'Assinatura aprovada e activada com sucesso.');
  } catch (err) {
    console.error('[APPROVE_SUBSCRIPTION]', err);
    return error(res, 'Erro ao aprovar assinatura.', 500);
  }
};

/**
 * PUT /api/admin/company-subscriptions/:id/reject
 * Rejeita uma solicitação de assinatura
 */
const rejectSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const adminId = req.user.id;

    if (!motivo?.trim()) {
      return badRequest(res, 'O motivo da rejeição é obrigatório.');
    }

    const [[subscription]] = await pool.execute(
      `SELECT s.*, cp.user_id as company_user_id, cp.nome_empresa, u.email as representante_email, sp.nome as package_name
       FROM subscriptions s
       INNER JOIN company_profiles cp ON cp.id = s.company_id
       INNER JOIN users u ON u.id = cp.user_id
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE s.id = ?`,
      [id]
    );

    if (!subscription) {
      return notFound(res, 'Assinatura não encontrada.');
    }

    if (subscription.status !== 'pendente') {
      return badRequest(res, 'Apenas assinaturas pendentes podem ser rejeitadas.');
    }

    if (!subscription.comprovante_url) {
      return badRequest(res, 'A assinatura não possui comprovativo anexado.');
    }

    if (!subscription.comprovante_visualizado_em) {
      return badRequest(res, 'O comprovativo deve ser visualizado antes da rejeição.');
    }

    await pool.execute(
      `UPDATE subscriptions
       SET status = 'cancelada',
           approved_by = ?,
           approved_at = NOW(),
           motivo_rejeicao = ?
       WHERE id = ?`,
      [adminId, motivo.trim(), id]
    );

    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'assinatura_rejeitada', 'Assinatura rejeitada',
         CONCAT('A solicitação do pacote ', ?, ' foi rejeitada. Motivo: ', ?))`,
      [subscription.company_user_id, subscription.package_name || subscription.tipo_plano || 'selecionado', motivo.trim()]
    );

    if (subscription.representante_email) {
      await sendSubscriptionRejectionEmail(subscription.representante_email, {
        nome_empresa: subscription.nome_empresa,
        pacote_nome: subscription.package_name || subscription.tipo_plano || 'Plano',
        motivo_rejeicao: motivo.trim(),
      });
    }

    await log(adminId, 'REJECT_SUBSCRIPTION', 'subscriptions', id, { motivo: motivo.trim() }, req);
    return success(res, null, 'Assinatura rejeitada com sucesso.');
  } catch (err) {
    console.error('[REJECT_SUBSCRIPTION]', err);
    return error(res, 'Erro ao rejeitar assinatura.', 500);
  }
};

/**
 * GET /api/admin/company-subscriptions/:id/proof
 * Devolve o comprovativo e marca-o como visualizado.
 */
const viewSubscriptionProof = async (req, res) => {
  try {
    const { id } = req.params;

    const [[subscription]] = await pool.execute(
      `SELECT s.id, s.comprovante_url, s.comprovante_visualizado_em
       FROM subscriptions s
       WHERE s.id = ?`,
      [id]
    );

    if (!subscription) {
      return notFound(res, 'Assinatura não encontrada.');
    }

    if (!subscription.comprovante_url) {
      return notFound(res, 'Comprovativo não encontrado.');
    }

    if (!subscription.comprovante_visualizado_em) {
      await pool.execute(
        'UPDATE subscriptions SET comprovante_visualizado_em = NOW() WHERE id = ?',
        [id]
      );
      subscription.comprovante_visualizado_em = new Date().toISOString();
    }

    return success(res, {
      url: subscription.comprovante_url,
      visualizado_em: subscription.comprovante_visualizado_em,
    });
  } catch (err) {
    console.error('[VIEW_SUBSCRIPTION_PROOF]', err);
    return error(res, 'Erro ao obter comprovativo da assinatura.', 500);
  }
};

module.exports = {
  getMySubscription,
  subscribe,
  subscribeWithProof,
  renewSubscription,
  getSubscriptionHistory,
  listAdminSubscriptions,
  approveSubscription,
  rejectSubscription,
  viewSubscriptionProof,
};
