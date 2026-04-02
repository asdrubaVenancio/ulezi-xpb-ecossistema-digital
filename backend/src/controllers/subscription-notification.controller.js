/**
 * Controller de Notificações de Assinatura (Admin)
 * Módulo 7 - Negócios e Investimentos
 * 
 * Endpoints administrativos para gerenciar notificações de assinaturas
 */

const { pool } = require('../config/database');
const { success, error, notFound, badRequest } = require('../utils/response');
const { 
  checkSubscriptionExpirations, 
  getNotificationHistory,
  processAutoRenewals 
} = require('../services/subscription-notification.service');
const { log } = require('../utils/audit');

/**
 * GET /api/admin/subscription-notifications
 * Lista notificações de vencimento enviadas
 */
const listNotifications = async (req, res) => {
  try {
    const { 
      notification_type, 
      status, 
      company_id,
      data_inicio,
      data_fim,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (notification_type) {
      whereClause += ' AND sn.notification_type = ?';
      params.push(notification_type);
    }
    
    if (status) {
      whereClause += ' AND sn.status = ?';
      params.push(status);
    }
    
    if (data_inicio) {
      whereClause += ' AND DATE(sn.created_at) >= ?';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      whereClause += ' AND DATE(sn.created_at) <= ?';
      params.push(data_fim);
    }
    
    if (company_id) {
      whereClause += ' AND s.user_id IN (SELECT user_id FROM company_profiles WHERE id = ?)';
      params.push(company_id);
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        sn.id,
        sn.notification_type,
        sn.title,
        sn.message,
        sn.dias_restantes,
        sn.email_sent,
        sn.email_sent_at,
        sn.status,
        sn.created_at,
        s.id as subscription_id,
        s.data_fim,
        s.tipo_plano,
        u.nome,
        u.email,
        cp.nome_empresa,
        sp.nome as nome_plano
       FROM subscription_notifications sn
       INNER JOIN subscriptions s ON s.id = sn.subscription_id
       INNER JOIN users u ON u.id = sn.user_id
       INNER JOIN company_profiles cp ON cp.user_id = u.id
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       ${whereClause}
       ORDER BY sn.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );
    
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM subscription_notifications sn
       INNER JOIN subscriptions s ON s.id = sn.subscription_id
       ${whereClause}`,
      params
    );
    
    // Resumo por tipo
    const [summary] = await pool.execute(
      `SELECT 
        notification_type,
        COUNT(*) as total,
        COUNT(CASE WHEN email_sent = 1 THEN 1 END) as enviados_email
       FROM subscription_notifications
       WHERE DATE(created_at) = CURDATE()
       GROUP BY notification_type`
    );
    
    return success(res, {
      notificacoes: rows,
      total: countRows[0].total,
      pagina: parseInt(page),
      limite: parseInt(limit),
      resumo_hoje: summary
    });
    
  } catch (err) {
    console.error('[LIST_SUBSCRIPTION_NOTIFICATIONS]', err);
    return error(res, 'Erro ao listar notificações.', 500);
  }
};

/**
 * POST /api/admin/subscription-notifications/check
 * Executa verificação manual de vencimentos
 */
const runExpirationCheck = async (req, res) => {
  try {
    const notifications = await checkSubscriptionExpirations();
    
    await log(req.user.id, 'RUN_EXPIRATION_CHECK', 'subscription_notifications', null, { count: notifications.length }, req);
    
    return success(res, {
      message: 'Verificação executada com sucesso.',
      notificacoes_enviadas: notifications.length,
      detalhes: notifications
    });
    
  } catch (err) {
    console.error('[RUN_EXPIRATION_CHECK]', err);
    return error(res, 'Erro ao executar verificação.', 500);
  }
};

/**
 * POST /api/admin/subscription-notifications/auto-renew
 * Processa renovações automáticas
 */
const runAutoRenewals = async (req, res) => {
  try {
    const renewals = await processAutoRenewals();
    
    await log(req.user.id, 'RUN_AUTO_RENEWALS', 'subscriptions', null, { count: renewals.length }, req);
    
    return success(res, {
      message: 'Renovações automáticas processadas.',
      renovacoes_processadas: renewals.length,
      detalhes: renewals
    });
    
  } catch (err) {
    console.error('[RUN_AUTO_RENEWALS]', err);
    return error(res, 'Erro ao processar renovações.', 500);
  }
};

/**
 * GET /api/admin/subscription-notifications/stats
 * Estatísticas de notificações
 */
const getNotificationStats = async (req, res) => {
  try {
    // Estatísticas gerais
    const [[generalStats]] = await pool.execute(
      `SELECT 
        COUNT(*) as total_notificacoes,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as hoje,
        COUNT(CASE WHEN email_sent = 1 THEN 1 END) as emails_enviados,
        COUNT(CASE WHEN email_sent = 0 THEN 1 END) as emails_pendentes
       FROM subscription_notifications`
    );
    
    // Por tipo de notificação
    const [byType] = await pool.execute(
      `SELECT 
        notification_type,
        COUNT(*) as total,
        COUNT(CASE WHEN email_sent = 1 THEN 1 END) as com_email
       FROM subscription_notifications
       GROUP BY notification_type
       ORDER BY total DESC`
    );
    
    // Assinaturas próximas do vencimento (próximos 30 dias)
    const [upcomingExpirations] = await pool.execute(
      `SELECT 
        COUNT(CASE WHEN DATE(data_fim) = CURDATE() THEN 1 END) as vencem_hoje,
        COUNT(CASE WHEN DATE(data_fim) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 1 END) as vencem_amanha,
        COUNT(CASE WHEN DATE(data_fim) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as vencem_7_dias,
        COUNT(CASE WHEN DATE(data_fim) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as vencem_30_dias
       FROM subscriptions
       WHERE status = 'ativa'`
    );
    
    // Taxa de renovação
    const [[renewalRate]] = await pool.execute(
      `SELECT 
        COUNT(CASE WHEN status = 'renovada' THEN 1 END) as renovadas,
        COUNT(CASE WHEN status = 'vencida' THEN 1 END) as vencidas,
        COUNT(*) as total
       FROM subscriptions
       WHERE DATE(data_fim) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)`
    );
    
    const taxaRenovacao = renewalRate.total > 0 
      ? Math.round((renewalRate.renovadas / renewalRate.total) * 100) 
      : 0;
    
    return success(res, {
      estatisticas_gerais: generalStats,
      por_tipo: byType,
      vencimentos_proximos: upcomingExpirations[0],
      taxa_renovacao: {
        percentual: taxaRenovacao,
        renovadas: renewalRate.renovadas,
        vencidas: renewalRate.vencidas
      }
    });
    
  } catch (err) {
    console.error('[NOTIFICATION_STATS]', err);
    return error(res, 'Erro ao obter estatísticas.', 500);
  }
};

/**
 * GET /api/admin/subscription-notifications/:id
 * Detalhes de uma notificação específica
 */
const getNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT 
        sn.*,
        s.data_fim,
        s.data_inicio,
        s.tipo_plano,
        s.valor_pago,
        s.moeda,
        u.nome,
        u.email,
        u.telefone,
        cp.nome_empresa,
        cp.nif,
        sp.nome as nome_plano,
        sp.descricao as descricao_plano
       FROM subscription_notifications sn
       INNER JOIN subscriptions s ON s.id = sn.subscription_id
       INNER JOIN users u ON u.id = sn.user_id
       INNER JOIN company_profiles cp ON cp.user_id = u.id
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE sn.id = ?`,
      [id]
    );
    
    if (!rows.length) {
      return notFound(res, 'Notificação não encontrada.');
    }
    
    return success(res, { notificacao: rows[0] });
    
  } catch (err) {
    console.error('[GET_NOTIFICATION]', err);
    return error(res, 'Erro ao obter notificação.', 500);
  }
};

/**
 * POST /api/admin/subscription-notifications/:id/resend
 * Reenvia uma notificação
 */
const resendNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [notification] = await pool.execute(
      `SELECT sn.*, u.email, u.nome, cp.nome_empresa
       FROM subscription_notifications sn
       INNER JOIN users u ON u.id = sn.user_id
       INNER JOIN company_profiles cp ON cp.user_id = u.id
       WHERE sn.id = ?`,
      [id]
    );
    
    if (!notification.length) {
      return notFound(res, 'Notificação não encontrada.');
    }
    
    const notif = notification[0];
    
    // Reenviar email
    const { sendEmail } = require('../utils/email');
    await sendEmail({
      to: notif.email,
      subject: `[REENVIO] ${notif.title} - ULEZI XPB`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Olá ${notif.nome},</p>
          <p><strong>Este é um reenvio da notificação:</strong></p>
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-left: 4px solid #3498db;">
            <h3>${notif.title}</h3>
            <p>${notif.message}</p>
          </div>
        </div>
      `
    });
    
    // Atualizar status
    await pool.execute(
      'UPDATE subscription_notifications SET email_sent = 1, email_sent_at = NOW(), status = "reenviada" WHERE id = ?',
      [id]
    );
    
    await log(req.user.id, 'RESEND_NOTIFICATION', 'subscription_notifications', id, {}, req);
    
    return success(res, { message: 'Notificação reenviada com sucesso.' });
    
  } catch (err) {
    console.error('[RESEND_NOTIFICATION]', err);
    return error(res, 'Erro ao reenviar notificação.', 500);
  }
};

/**
 * GET /api/admin/subscription-notifications/pending-expirations
 * Lista assinaturas pendentes de notificação
 */
const getPendingExpirations = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        s.id,
        s.data_fim,
        DATEDIFF(s.data_fim, CURDATE()) as dias_restantes,
        s.tipo_plano,
        u.nome,
        u.email,
        cp.nome_empresa,
        sp.nome as nome_plano,
        sp.preco,
        sp.moeda,
        CASE 
          WHEN DATEDIFF(s.data_fim, CURDATE()) <= 0 THEN 'vencida'
          WHEN DATEDIFF(s.data_fim, CURDATE()) <= 3 THEN 'critico'
          WHEN DATEDIFF(s.data_fim, CURDATE()) <= 7 THEN 'urgente'
          WHEN DATEDIFF(s.data_fim, CURDATE()) <= 15 THEN 'alerta'
          ELSE 'normal'
        END as nivel_urgencia
       FROM subscriptions s
       INNER JOIN users u ON u.id = s.user_id
       INNER JOIN company_profiles cp ON cp.user_id = u.id
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE s.status = 'ativa'
         AND DATEDIFF(s.data_fim, CURDATE()) <= 30
         AND DATEDIFF(s.data_fim, CURDATE()) >= -7
       ORDER BY s.data_fim ASC`
    );
    
    // Agrupar por nível de urgência
    const grouped = {
      vencidas: rows.filter(r => r.nivel_urgencia === 'vencida'),
      critico: rows.filter(r => r.nivel_urgencia === 'critico'),
      urgente: rows.filter(r => r.nivel_urgencia === 'urgente'),
      alerta: rows.filter(r => r.nivel_urgencia === 'alerta'),
      normal: rows.filter(r => r.nivel_urgencia === 'normal')
    };
    
    return success(res, {
      total_pendentes: rows.length,
      por_urgencia: grouped,
      lista_completa: rows
    });
    
  } catch (err) {
    console.error('[PENDING_EXPIRATIONS]', err);
    return error(res, 'Erro ao listar vencimentos pendentes.', 500);
  }
};

module.exports = {
  listNotifications,
  runExpirationCheck,
  runAutoRenewals,
  getNotificationStats,
  getNotification,
  resendNotification,
  getPendingExpirations
};
