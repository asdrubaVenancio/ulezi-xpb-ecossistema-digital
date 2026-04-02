/**
 * Serviço de Notificações de Assinatura
 * Módulo 7 - Negócios e Investimentos
 * 
 * Gerencia notificações automáticas de vencimento de assinaturas
 */

const { pool } = require('../config/database');
const { sendEmail } = require('../utils/email');

/**
 * Verifica assinaturas próximas do vencimento e envia notificações
 * Executado diariamente via cron job ou chamada manual
 */
const checkSubscriptionExpirations = async () => {
  try {
    const today = new Date();
    
    // Definir períodos de alerta
    const alertPeriods = [
      { days: 30, type: '30_dias', title: 'Assinatura vence em 30 dias' },
      { days: 15, type: '15_dias', title: 'Assinatura vence em 15 dias' },
      { days: 7, type: '7_dias', title: 'Assinatura vence em 7 dias' },
      { days: 3, type: '3_dias', title: 'Assinatura vence em 3 dias' },
      { days: 1, type: '1_dia', title: 'Assinatura vence amanhã' },
      { days: 0, type: 'vencida', title: 'Assinatura vencida hoje' }
    ];
    
    const notificationsSent = [];
    
    for (const period of alertPeriods) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + period.days);
      const dateString = targetDate.toISOString().split('T')[0];
      
      // Buscar assinaturas que vencem na data alvo
      const [subscriptions] = await pool.execute(
        `SELECT 
          s.id,
          s.data_fim,
          s.tipo_plano,
          s.status,
          u.id as user_id,
          u.nome,
          u.email,
          cp.nome_empresa,
          sp.nome as nome_plano,
          sp.preco,
          sp.moeda
         FROM subscriptions s
         INNER JOIN users u ON u.id = s.user_id
         INNER JOIN company_profiles cp ON cp.user_id = u.id
         LEFT JOIN subscription_packages sp ON sp.id = s.package_id
         WHERE DATE(s.data_fim) = ?
           AND s.status = 'ativa'
           AND NOT EXISTS (
             SELECT 1 FROM subscription_notifications sn 
             WHERE sn.subscription_id = s.id 
             AND sn.notification_type = ?
             AND DATE(sn.created_at) = CURDATE()
           )`,
        [dateString, period.type]
      );
      
      for (const sub of subscriptions) {
        // Criar notificação no sistema
        await pool.execute(
          `INSERT INTO subscription_notifications 
           (subscription_id, user_id, notification_type, title, message, dias_restantes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            sub.id,
            sub.user_id,
            period.type,
            period.title,
            buildNotificationMessage(sub, period.days, period.type),
            period.days
          ]
        );
        
        // Notificar no sistema
        await pool.execute(
          `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
           VALUES (?, 'assinatura_vencimento', ?, ?)`,
          [sub.user_id, period.title, buildNotificationMessage(sub, period.days, period.type)]
        );
        
        // Enviar email
        await sendExpirationEmail(sub, period.days, period.type);
        
        // Se venceu hoje, atualizar status da assinatura
        if (period.days === 0) {
          await pool.execute(
            'UPDATE subscriptions SET status = "vencida" WHERE id = ?',
            [sub.id]
          );
          
          // Notificar admin
          await pool.execute(
            `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
             SELECT id, 'assinatura_vencida', 'Assinatura vencida',
                    CONCAT('A assinatura de ', ?, ' venceu hoje.')
             FROM users WHERE role = 'admin'`,
            [sub.nome_empresa]
          );
        }
        
        notificationsSent.push({
          subscription_id: sub.id,
          empresa: sub.nome_empresa,
          tipo: period.type,
          dias_restantes: period.days
        });
      }
    }
    
    console.log(`[SUBSCRIPTION_NOTIFICATIONS] ${notificationsSent.length} notificações enviadas.`);
    return notificationsSent;
    
  } catch (err) {
    console.error('[CHECK_SUBSCRIPTION_EXPIRATIONS]', err);
    throw err;
  }
};

/**
 * Constrói mensagem de notificação
 */
const buildNotificationMessage = (subscription, days, type) => {
  const plano = subscription.nome_plano || subscription.tipo_plano || 'Assinatura';
  const valor = subscription.preco ? `${subscription.preco} ${subscription.moeda || 'Kz'}` : '';
  
  if (type === 'vencida') {
    return `Sua ${plano}${valor ? ` (${valor})` : ''} venceu hoje. Renove imediatamente para manter o acesso à plataforma.`;
  }
  
  if (days === 1) {
    return `Sua ${plano}${valor ? ` (${valor})` : ''} vence amanhã (${subscription.data_fim.toISOString().split('T')[0]}). Renove agora para evitar interrupções.`;
  }
  
  return `Sua ${plano}${valor ? ` (${valor})` : ''} vence em ${days} dias (${subscription.data_fim.toISOString().split('T')[0]}). Renove com antecedência para garantir a continuidade.`;
};

/**
 * Envia email de notificação de vencimento
 */
const sendExpirationEmail = async (subscription, days, type) => {
  const subject = type === 'vencida' 
    ? '⚠️ Sua assinatura venceu - ULEZI XPB'
    : days === 1
    ? '⏰ Sua assinatura vence amanhã - ULEZI XPB'
    : `📅 Lembrete: Assinatura vence em ${days} dias - ULEZI XPB`;
  
  const plano = subscription.nome_plano || subscription.tipo_plano || 'Assinatura';
  const dataVencimento = subscription.data_fim.toISOString().split('T')[0];
  
  const urgencyColor = type === 'vencida' ? '#e74c3c' : days <= 3 ? '#e67e22' : '#3498db';
  const urgencyText = type === 'vencida' ? 'VENCIDA' : days === 1 ? 'VENCE AMANHÃ' : `Vence em ${days} dias`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${urgencyColor}; padding: 20px; text-align: center; color: white;">
        <h1>⚠️ ${urgencyText}</h1>
      </div>
      
      <div style="padding: 20px; background: #f8f9fa;">
        <p>Olá <strong>${subscription.nome}</strong>,</p>
        
        <p>Este é um lembrete importante sobre sua assinatura na ULEZI XPB:</p>
        
        <div style="background: white; padding: 20px; border-left: 4px solid ${urgencyColor}; margin: 20px 0;">
          <h3 style="margin-top: 0;">${subscription.nome_empresa}</h3>
          <p><strong>Plano:</strong> ${plano}</p>
          <p><strong>Vencimento:</strong> ${dataVencimento}</p>
          ${subscription.preco ? `<p><strong>Valor:</strong> ${subscription.preco} ${subscription.moeda || 'Kz'}</p>` : ''}
        </div>
        
        ${type === 'vencida' ? `
          <div style="background: #fee; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>⚠️ Atenção:</strong> Sua assinatura está vencida. Você tem <strong>7 dias</strong> para renovar antes que sua conta seja suspensa.
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/assinatura/renovar" 
             style="background: ${urgencyColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            ${type === 'vencida' ? 'Renovar Agora' : 'Renovar Antecipadamente'}
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px;">
          Se precisar de ajuda, entre em contato com nosso suporte através do email suporte@ulezi.com ou WhatsApp.
        </p>
      </div>
    </div>
  `;
  
  try {
    await sendEmail({
      to: subscription.email,
      subject,
      html
    });
  } catch (e) {
    console.error('[EMAIL_EXPIRATION]', e);
  }
};

/**
 * Busca histórico de notificações de uma assinatura
 */
const getNotificationHistory = async (subscriptionId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        sn.*,
        u.nome as enviado_por_nome
       FROM subscription_notifications sn
       LEFT JOIN users u ON u.id = sn.sent_by
       WHERE sn.subscription_id = ?
       ORDER BY sn.created_at DESC`,
      [subscriptionId]
    );
    
    return rows;
  } catch (err) {
    console.error('[GET_NOTIFICATION_HISTORY]', err);
    throw err;
  }
};

/**
 * Renovação automática de assinaturas (se configurado)
 */
const processAutoRenewals = async () => {
  try {
    // Buscar assinaturas com auto-renovação ativada que vencem hoje
    const [subscriptions] = await pool.execute(
      `SELECT 
        s.*,
        u.nome,
        u.email,
        cp.nome_empresa,
        sp.duracao_dias,
        sp.preco,
        sp.moeda
       FROM subscriptions s
       INNER JOIN users u ON u.id = s.user_id
       INNER JOIN company_profiles cp ON cp.user_id = u.id
       INNER JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE DATE(s.data_fim) = CURDATE()
         AND s.status = 'ativa'
         AND s.auto_renovar = 1`
    );
    
    const renewalsProcessed = [];
    
    for (const sub of subscriptions) {
      try {
        // Calcular nova data de fim
        const novaDataFim = new Date(sub.data_fim);
        novaDataFim.setDate(novaDataFim.getDate() + (sub.duracao_dias || 30));
        
        // Criar nova assinatura
        await pool.execute(
          `INSERT INTO subscriptions 
           (user_id, package_id, tipo_plano, data_inicio, data_fim, status, valor_pago, moeda)
           VALUES (?, ?, ?, CURDATE(), ?, 'ativa', ?, ?)`,
          [sub.user_id, sub.package_id, sub.tipo_plano, novaDataFim, sub.preco, sub.moeda]
        );
        
        // Desativar assinatura antiga
        await pool.execute(
          'UPDATE subscriptions SET status = "renovada" WHERE id = ?',
          [sub.id]
        );
        
        // Notificar usuário
        await pool.execute(
          `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
           VALUES (?, 'assinatura_renovada', 'Assinatura renovada automaticamente',
                   CONCAT('Sua assinatura foi renovada automaticamente até ', ?, '. Valor: ', ?, ' ', ?))`,
          [sub.user_id, novaDataFim.toISOString().split('T')[0], sub.preco, sub.moeda]
        );
        
        renewalsProcessed.push({
          subscription_id: sub.id,
          empresa: sub.nome_empresa,
          nova_data_fim: novaDataFim
        });
        
      } catch (renewErr) {
        console.error(`[AUTO_RENEWAL_ERROR] Subscription ${sub.id}:`, renewErr);
        
        // Notificar falha na renovação
        await pool.execute(
          `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
           VALUES (?, 'renovacao_falhou', 'Falha na renovação automática',
                   'Não foi possível renovar sua assinatura automaticamente. Por favor, renove manualmente.')`,
          [sub.user_id]
        );
      }
    }
    
    console.log(`[AUTO_RENEWALS] ${renewalsProcessed.length} assinaturas renovadas.`);
    return renewalsProcessed;
    
  } catch (err) {
    console.error('[PROCESS_AUTO_RENEWALS]', err);
    throw err;
  }
};

module.exports = {
  checkSubscriptionExpirations,
  getNotificationHistory,
  processAutoRenewals
};
