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

const saudacao = (nome) => `Ol&aacute; <strong>${nome || 'utilizador'}</strong>,`;

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
 * Email de onboarding de funcionário com senha temporária
 */
const sendEmployeeOnboardingEmail = async ({ nome, email, passwordTemporaria }) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#1FA7C9;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">ULEZI XPB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Conta de funcionário criada</p>
      </div>
      <div style="padding:30px">
        <h2 style="color:#374151">Bem-vindo(a), ${nome}!</h2>
        <p style="color:#6B7280;line-height:1.6">Foi criada uma conta de funcionário para si na plataforma Ulezi XPB.</p>
        <div style="background:#F8FAFC;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;color:#374151"><strong>Email:</strong> ${email}</p>
          <p style="margin:0;color:#374151"><strong>Senha temporária:</strong> ${passwordTemporaria}</p>
        </div>
        <p style="color:#6B7280;line-height:1.6">No primeiro login será obrigatório alterar esta senha antes de aceder à área de trabalho.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/entrar" style="display:inline-block;background:#1FA7C9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Entrar na plataforma
        </a>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Conta de funcionário criada - Ulezi XPB',
    html,
  });
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
        <p style="color:#6B7280">${saudacao(data.nome_aluno)}</p>
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
        <p style="color:#6B7280">${saudacao(recipientName)}</p>
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

/**
 * Email de agendamento de reunião de mediação
 */
const sendMediationMeetingScheduledEmail = async ({
  to,
  nome,
  titulo,
  contraparte,
  dataReuniao,
  horaInicio,
  tipoReuniao,
  mediador,
}) => {
  if (!to) {
    return { success: false, skipped: true };
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0EA5E9;padding:28px;text-align:center">
        <h1 style="color:#fff;margin:0">ULEZI XPB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Reuni&atilde;o de media&ccedil;&atilde;o agendada</p>
      </div>
      <div style="padding:28px">
        <p style="color:#374151">${saudacao(nome)}</p>
        <p style="color:#6B7280;line-height:1.6">
          Foi agendada uma reunião de mediação para dar seguimento à oportunidade
          <strong>${titulo}</strong>.
        </p>
        <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:18px 0">
          <p style="margin:6px 0;color:#374151"><strong>Data:</strong> ${dataReuniao}</p>
          <p style="margin:6px 0;color:#374151"><strong>Hora:</strong> ${horaInicio}</p>
          <p style="margin:6px 0;color:#374151"><strong>Tipo:</strong> ${tipoReuniao}</p>
          <p style="margin:6px 0;color:#374151"><strong>Contraparte:</strong> ${contraparte}</p>
          <p style="margin:6px 0;color:#374151"><strong>Mediador:</strong> ${mediador || 'Equipa Ulezi XPB'}</p>
        </div>
        <p style="color:#6B7280;line-height:1.6">
          O contacto continuará a ser acompanhado pela equipa administrativa da plataforma.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Reuniao de mediacao agendada - ${titulo}`,
    html,
  });
};

/**
 * Email de aprovação de empresa
 */
const sendCompanyApprovalEmail = async (email, empresaData) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#22C55E;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">ULEZI XPB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Empresa Aprovada!</p>
      </div>
      <div style="padding:30px">
        <h2 style="color:#374151">🎉 Parabéns, ${empresaData.nome_empresa}!</h2>
        <p style="color:#6B7280;line-height:1.6">A sua empresa foi aprovada com sucesso na plataforma Ulezi XPB.</p>
        <p style="color:#6B7280;line-height:1.6">Agora pode aceder a todas as funcionalidades disponíveis para empresas, incluindo:</p>
        <ul style="color:#6B7280;line-height:1.8">
          <li>Publicar oportunidades de investimento</li>
          <li>Gerir vagas de emprego</li>
          <li>Aceder ao módulo de consultoria</li>
          <li>Conectar-se com investidores</li>
        </ul>
        <div style="background:#F8FAFC;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:0;color:#374151"><strong>Empresa:</strong> ${empresaData.nome_empresa}</p>
          <p style="margin:8px 0 0;color:#374151"><strong>NIF:</strong> ${empresaData.nif || 'Não informado'}</p>
          <p style="margin:8px 0 0;color:#374151"><strong>Data de aprovação:</strong> ${new Date().toLocaleDateString('pt-AO')}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/empresa/dashboard" style="display:inline-block;background:#22C55E;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Aceder ao Painel da Empresa
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:20px">
          Nota: Para utilizar todas as funcionalidades, será necessário adquirir um plano de assinatura.
        </p>
      </div>
      <div style="background:#F8FAFC;padding:20px;text-align:center">
        <p style="color:#9CA3AF;font-size:12px;margin:0">© 2026 Ulezi XPB. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: '🎉 Sua empresa foi aprovada na Ulezi XPB!', html });
};

/**
 * Email de rejeição de empresa com motivo
 */
const sendCompanyRejectionEmail = async (email, empresaData) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#EF4444;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">ULEZI XPB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Análise de Cadastro</p>
      </div>
      <div style="padding:30px">
        <h2 style="color:#374151">Cadastro Rejeitado</h2>
        <p style="color:#6B7280;line-height:1.6">Ol&aacute;, <strong>${empresaData.nome_empresa}</strong>.</p>
        <p style="color:#6B7280;line-height:1.6">Após análise da documentação enviada, informamos que o cadastro da sua empresa não pôde ser aprovado neste momento.</p>
        
        <div style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;color:#991B1B;font-weight:bold">Motivo da rejeição:</p>
          <p style="margin:0;color:#374151;line-height:1.6">${empresaData.motivo}</p>
        </div>

        <p style="color:#6B7280;line-height:1.6">Você pode corrigir as informações e submeter novamente através da plataforma.</p>
        
        <div style="background:#F8FAFC;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:0;color:#374151"><strong>Empresa:</strong> ${empresaData.nome_empresa}</p>
          <p style="margin:8px 0 0;color:#374151"><strong>NIF:</strong> ${empresaData.nif || 'Não informado'}</p>
          <p style="margin:8px 0 0;color:#374151"><strong>Data de análise:</strong> ${new Date().toLocaleDateString('pt-AO')}</p>
        </div>

        <a href="${process.env.FRONTEND_URL}/empresa/perfil" style="display:inline-block;background:#374151;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Atualizar Cadastro
        </a>
        
        <p style="color:#9CA3AF;font-size:12px;margin-top:20px">
          Em caso de dúvidas, entre em contacto com o suporte através da plataforma.
        </p>
      </div>
      <div style="background:#F8FAFC;padding:20px;text-align:center">
        <p style="color:#9CA3AF;font-size:12px;margin:0">© 2026 Ulezi XPB. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Cadastro Rejeitado - Ulezi XPB', html });
};

/**
 * Email de aprovação da assinatura com recibo em anexo.
 */
const sendSubscriptionApprovalEmail = async (email, dados, pdfBuffer) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#22C55E;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">ULEZI XPB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Assinatura Aprovada</p>
      </div>
      <div style="padding:30px">
        <h2 style="color:#374151">Pagamento confirmado com sucesso</h2>
        <p style="color:#6B7280;line-height:1.6">Ol&aacute;, <strong>${dados.nome_empresa}</strong>.</p>
        <p style="color:#6B7280;line-height:1.6">A sua assinatura do plano <strong>${dados.pacote_nome}</strong> foi aprovada e já está activa na plataforma.</p>
        <div style="background:#F8FAFC;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:4px 0;color:#374151"><strong>Referência:</strong> ${dados.referencia_pagamento || 'N/D'}</p>
          <p style="margin:4px 0;color:#374151"><strong>Valor:</strong> ${dados.valor_pago} ${dados.moeda || 'AOA'}</p>
          <p style="margin:4px 0;color:#374151"><strong>Validade:</strong> ${dados.data_inicio} até ${dados.data_fim}</p>
        </div>
        <p style="color:#6B7280;line-height:1.6">O recibo de pagamento segue em anexo neste email.</p>
        <a href="${process.env.FRONTEND_URL}/empresa/assinatura" style="display:inline-block;background:#22C55E;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Ver assinatura
        </a>
      </div>
    </div>
  `;

  const attachments = pdfBuffer ? [{
    filename: `recibo_assinatura_${dados.numero_recibo || dados.id}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf',
  }] : [];

  return sendEmail({
    to: email,
    subject: `Assinatura aprovada - ${dados.pacote_nome}`,
    html,
    attachments,
  });
};

/**
 * Email de rejeição da assinatura com motivo.
 */
const sendSubscriptionRejectionEmail = async (email, dados) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#EF4444;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">ULEZI XPB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Solicitação de Assinatura Rejeitada</p>
      </div>
      <div style="padding:30px">
        <h2 style="color:#374151">Não foi possível aprovar a assinatura</h2>
        <p style="color:#6B7280;line-height:1.6">Ol&aacute;, <strong>${dados.nome_empresa}</strong>.</p>
        <p style="color:#6B7280;line-height:1.6">A sua solicitação do plano <strong>${dados.pacote_nome}</strong> foi analisada, mas não pôde ser aprovada neste momento.</p>
        <div style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;color:#991B1B;font-weight:bold">Motivo da rejeição:</p>
          <p style="margin:0;color:#374151;line-height:1.6">${dados.motivo_rejeicao}</p>
        </div>
        <p style="color:#6B7280;line-height:1.6">Pode corrigir o comprovativo ou actualizar os dados e submeter novamente a solicitação.</p>
        <a href="${process.env.FRONTEND_URL}/empresa/assinatura" style="display:inline-block;background:#374151;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Rever solicitação
        </a>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Solicitação de assinatura rejeitada - ${dados.pacote_nome}`,
    html,
  });
};

/**
 * Email de rejeicao de inscricao em curso
 * Enviado quando uma inscricao e rejeitada com o motivo da rejeicao
 */
const sendEnrollmentRejectionEmail = async ({ email, nome, nomeCurso, motivoRejeicao }) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#dc2626;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">ULEZI XPB</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Inscrição Rejeitada</p>
      </div>
      <div style="padding:30px">
        <h2 style="color:#374151">Olá ${nome || 'Estudante'},</h2>
        <p style="color:#6B7280;line-height:1.6">Lamentamos informar que a sua inscrição no curso <strong>${nomeCurso}</strong> foi rejeitada.</p>
        
        <div style="background:#FEF2F2;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #dc2626">
          <p style="margin:0 0 8px;color:#374151;font-weight:bold">Motivo da rejeição:</p>
          <p style="margin:0;color:#6B7280;line-height:1.6">${motivoRejeicao}</p>
        </div>
        
        <div style="background:#F8FAFC;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:0 0 12px;color:#374151;font-weight:bold">Como reenviar a sua inscrição:</p>
          <ol style="color:#6B7280;line-height:1.6;margin:0;padding-left:20px">
            <li>Aceda à sua área de estudante na plataforma ULEZI XPB</li>
            <li>Navegue até à secção "Inscrições" ou "Cursos"</li>
            <li>Localize a inscrição rejeitada e clique em "Ver detalhes"</li>
            <li>Corrija o problema indicado acima</li>
            <li>Clique em "Reenviar documentos" ou "Nova inscrição"</li>
            <li>Aguarde nova análise pela nossa equipa</li>
          </ol>
        </div>
        
        <p style="color:#6B7280;line-height:1.6">Se tiver alguma dúvida ou precisar de assistência, por favor contacte o nosso suporte através da plataforma.</p>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/painel/aluno" style="display:inline-block;background:#1FA7C9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Aceder ao Painel do Aluno
        </a>
      </div>
      <div style="background:#F8FAFC;padding:20px;text-align:center">
        <p style="color:#9CA3AF;font-size:12px;margin:0">© 2026 Ulezi XPB. Todos os direitos reservados.</p>
        <p style="color:#9CA3AF;font-size:12px;margin:8px 0 0">Este é um email automático, por favor não responda.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Inscrição Rejeitada - ${nomeCurso}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendEmployeeOnboardingEmail,
  sendEnrollmentConfirmation,
  sendEnrollmentRejectionEmail,
  sendInvestorInterestNotification,
  sendContractEmail,
  sendMediationMeetingScheduledEmail,
  sendCompanyApprovalEmail,
  sendCompanyRejectionEmail,
  sendSubscriptionApprovalEmail,
  sendSubscriptionRejectionEmail,
};
