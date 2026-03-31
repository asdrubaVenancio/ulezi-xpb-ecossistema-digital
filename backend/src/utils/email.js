/**
 * Serviço de envio de Emails via Nodemailer
 */
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuração do transportador SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587,
  secure: (process.env.SMTP_SECURE || process.env.EMAIL_SECURE) === 'true',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

/**
 * Envia email genérico
 */
const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log('[EMAIL] Email não configurado. Simulando envio para:', to);
      return { success: true, simulated: true };
    }
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Ulezi XPB" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to, subject, html, text, attachments
    });
    console.log('[EMAIL] Enviado para:', to, '| MessageID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EMAIL] Erro ao enviar:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Email de boas-vindas após registo
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#1FA7C9;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">ULEZI XPB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Ecossistema Digital Multifuncional</p>
      </div>
      <div style="padding:30px">
        <h2 style="color:#374151">Bem-vindo(a), ${user.nome}! 🎉</h2>
        <p style="color:#6B7280;line-height:1.6">A sua conta foi criada com sucesso na plataforma Ulezi XPB.</p>
        <p style="color:#6B7280;line-height:1.6">Pode agora aceder a todos os serviços disponíveis.</p>
        <div style="background:#F8FAFC;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:0;color:#374151"><strong>Email:</strong> ${user.email}</p>
          <p style="margin:8px 0 0;color:#374151"><strong>Perfil:</strong> ${user.role}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}" style="display:inline-block;background:#1FA7C9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Aceder à Plataforma
        </a>
      </div>
      <div style="background:#F8FAFC;padding:20px;text-align:center">
        <p style="color:#9CA3AF;font-size:12px;margin:0">© 2026 Ulezi XPB. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Bem-vindo à Ulezi XPB! 🎉', html });
};

/**
 * Email de confirmação de inscrição com recibo em PDF
 */
const sendEnrollmentConfirmation = async (email, data, pdfBuffer) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1FA7C9;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0">ULEZI XPB</h1>
      </div>
      <div style="padding:30px">
        <h2 style="color:#374151">Inscrição Confirmada! ✅</h2>
        <p style="color:#6B7280">Olá <strong>${data.nome_aluno}</strong>,</p>
        <p style="color:#6B7280">A sua inscrição no curso <strong>${data.nome_curso}</strong> foi confirmada com sucesso.</p>
        <div style="background:#F8FAFC;border-radius:8px;padding:20px;margin:20px 0">
          <h3 style="margin:0 0 12px;color:#374151">Detalhes da Inscrição</h3>
          <p style="margin:4px 0;color:#374151">📚 <strong>Curso:</strong> ${data.nome_curso}</p>
          <p style="margin:4px 0;color:#374151">🏫 <strong>Centro:</strong> ${data.centro || 'A ser atribuído'}</p>
          <p style="margin:4px 0;color:#374151">💰 <strong>Valor pago:</strong> ${data.valor} Kz</p>
          <p style="margin:4px 0;color:#374151">📋 <strong>Nº Inscrição:</strong> ${data.numero_inscricao}</p>
        </div>
        <p style="color:#6B7280">O recibo em PDF está em anexo a este email.</p>
      </div>
    </div>
  `;
  const attachments = pdfBuffer ? [{
    filename: `recibo_${data.numero_inscricao}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }] : [];
  return sendEmail({ to: email, subject: `Inscrição confirmada - ${data.nome_curso}`, html, attachments });
};

/**
 * Email de notificação de interesse de investidor
 */
const sendInvestorInterestNotification = async (adminEmail, data) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#F59E0B;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0">ULEZI XPB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Módulo de Negócios</p>
      </div>
      <div style="padding:30px">
        <h2 style="color:#374151">⚡ Novo Interesse de Investidor!</h2>
        <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px;margin:16px 0;border-radius:4px">
          <p style="margin:4px 0;color:#374151"><strong>Investidor:</strong> ${data.nome_investidor}</p>
          <p style="margin:4px 0;color:#374151"><strong>Email:</strong> ${data.email_investidor}</p>
          <p style="margin:4px 0;color:#374151"><strong>Empresa:</strong> ${data.nome_empresa}</p>
          <p style="margin:4px 0;color:#374151"><strong>Oportunidade:</strong> ${data.titulo_oportunidade}</p>
        </div>
        <p style="color:#6B7280">Aceda ao painel administrativo para gerir este processo.</p>
        <a href="${process.env.FRONTEND_URL}/admin" style="display:inline-block;background:#F59E0B;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Ver no Painel Admin
        </a>
      </div>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject: '⚡ Novo interesse de investidor!', html });
};

/**
 * Email com contrato PDF
 */
const sendContractEmail = async (email, recipientName, contractData, pdfBuffer) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#374151;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0">ULEZI XPB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Contrato de Investimento</p>
      </div>
      <div style="padding:30px">
        <h2 style="color:#374151">📄 Contrato Gerado</h2>
        <p style="color:#6B7280">Olá <strong>${recipientName}</strong>,</p>
        <p style="color:#6B7280">O contrato referente à oportunidade <strong>${contractData.titulo}</strong> foi gerado.</p>
        <p style="color:#6B7280">O contrato em PDF está em anexo. Após análise, poderá proceder à assinatura digital na plataforma.</p>
        <a href="${process.env.FRONTEND_URL}" style="display:inline-block;background:#374151;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Assinar na Plataforma
        </a>
      </div>
    </div>
  `;
  const attachments = pdfBuffer ? [{
    filename: `contrato_${contractData.id}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }] : [];
  return sendEmail({ to: email, subject: `Contrato de Investimento - ${contractData.titulo}`, html, attachments });
};

module.exports = { sendEmail, sendWelcomeEmail, sendEnrollmentConfirmation, sendInvestorInterestNotification, sendContractEmail };
