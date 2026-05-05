/**
 * ULEZI XPI — Serviço de Notificações
 * Notificações internas no sistema + envio de emails com nodemailer
 * Eventos cobertos: registo, aprovação, interesses, contratos, suporte, assinaturas
 */

const { pool } = require("../config/database");
const nodemailer = require("nodemailer");

// ── Configuração do transportador de email ─────────────────────────────────
const criarTransportador = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null; // Email não configurado — funciona sem email
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
};

const transportador = criarTransportador();

// ── Template de email base ─────────────────────────────────────────────────
const htmlEmailBase = (titulo, corpo, cta = null) => `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${titulo}</title>
  <style>
    body{margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#111827}
    .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
    .header{background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:28px 32px;color:#fff}
    .header h1{margin:0;font-size:22px;font-weight:700}
    .header p{margin:6px 0 0;opacity:.9;font-size:14px}
    .body{padding:28px 32px}
    .body p{font-size:15px;line-height:1.7;color:#374151;margin:0 0 14px}
    .cta{display:inline-block;margin-top:8px;padding:12px 28px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px}
    .footer{padding:16px 32px;background:#f1f5f9;font-size:12px;color:#6b7280;text-align:center}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>ULEZI XPB</h1>
      <p>${titulo}</p>
    </div>
    <div class="body">
      ${corpo}
      ${cta ? `<a href="${cta.url}" class="cta">${cta.label}</a>` : ""}
    </div>
    <div class="footer">ULEZI XPI · Plataforma de negócios e formação · Este é um email automático.</div>
  </div>
</body>
</html>`;

/**
 * Envia email usando nodemailer (ou loga em desenvolvimento)
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!to) return;

  if (!transportador) {
    // Sem configuração SMTP — apenas loga
    console.log(`📧 [EMAIL] Para: ${to} | Assunto: ${subject}`);
    return;
  }

  try {
    await transportador.sendMail({
      from: process.env.EMAIL_FROM || "ULEZI XPI <noreply@ulezi.com>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[EMAIL_ERRO] Para: ${to} | ${err.message}`);
  }
};

/**
 * Cria uma notificação interna para um utilizador
 */
const createNotification = async (
  userId,
  tipo,
  titulo,
  mensagem,
  link = null,
) => {
  try {
    console.log(`[CREATE_NOTIFICATION] Inserindo: userId=${userId}, tipo=${tipo}, titulo=${titulo}`);
    const [result] = await pool.execute(
      "INSERT INTO notifications (user_id, tipo, titulo, mensagem, link) VALUES (?,?,?,?,?)",
      [userId, tipo, titulo, mensagem, link],
    );
    console.log(`[CREATE_NOTIFICATION] Sucesso: insertId=${result.insertId}`);
    return result;
  } catch (err) {
    console.error("[CREATE_NOTIFICATION] ERRO:", err.message);
    console.error("[CREATE_NOTIFICATION] Dados:", { userId, tipo, titulo, mensagem, link });
    throw err;
  }
};

/**
 * Cria notificação interna + envia email ao mesmo tempo
 */
const notificar = async (
  userId,
  tipo,
  titulo,
  mensagem,
  link = null,
  email = null,
  emailHtml = null,
) => {
  await createNotification(userId, tipo, titulo, mensagem, link);

  if (email && emailHtml) {
    await sendEmail({ to: email, subject: titulo, html: emailHtml });
  }
};

// ── Eventos específicos do sistema ─────────────────────────────────────────

/**
 * Notificação de boas-vindas após registo
 */
const notificarBemVindo = async (userId, nome, email, role) => {
  const papelLabel =
    { student: "Estudante", company: "Empresa", investor: "Investidor" }[
      role
    ] || role;
  const titulo = "Bem-vindo à ULEZI XPB!";
  const mensagem = `Olá ${nome}, a sua conta de ${papelLabel} foi criada com sucesso. Explore a plataforma!`;

  const html = htmlEmailBase(
    titulo,
    `<p>Olá <strong>${nome}</strong>,</p>
     <p>A sua conta de <strong>${papelLabel}</strong> na ULEZI XPI foi criada com sucesso.</p>
     <p>Aceda à plataforma para explorar todas as funcionalidades disponíveis para o seu perfil.</p>`,
    {
      url: process.env.FRONTEND_URL || "http://localhost:3000",
      label: "Aceder à plataforma",
    },
  );

  await notificar(userId, "bem_vindo", titulo, mensagem, "/", email, html);
};

/**
 * Notificação de aprovação/rejeição de empresa
 */
const notificarDecisaoEmpresa = async (
  userId,
  email,
  nomeEmpresa,
  aprovada,
  motivo = null,
) => {
  const titulo = aprovada ? "Empresa aprovada!" : "Empresa não aprovada";
  const mensagem = aprovada
    ? `A empresa "${nomeEmpresa}" foi aprovada. Já pode publicar oportunidades e vagas.`
    : `A empresa "${nomeEmpresa}" não foi aprovada. Motivo: ${motivo || "Não especificado"}`;

  const corpo = aprovada
    ? `<p>Parabéns! A empresa <strong>${nomeEmpresa}</strong> foi aprovada pela equipa da ULEZI XPB.</p>
       <p>Já pode publicar oportunidades de investimento e vagas de emprego.</p>`
    : `<p>Infelizmente, a empresa <strong>${nomeEmpresa}</strong> não foi aprovada nesta fase.</p>
       ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ""}
       <p>Para mais informações, contacte o suporte.</p>`;

  const html = htmlEmailBase(
    titulo,
    corpo,
    aprovada
      ? {
          url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/painel/empresa`,
          label: "Ir para o painel",
        }
      : null,
  );

  await notificar(
    userId,
    aprovada ? "empresa_aprovada" : "empresa_rejeitada",
    titulo,
    mensagem,
    "/painel/empresa",
    email,
    html,
  );
};

/**
 * Notificação de novo interesse de investidor
 */
const notificarNovoInteresse = async (
  empresaUserId,
  empresaEmail,
  nomeEmpresa,
  nomeInvestidor,
  tituloOportunidade,
) => {
  const titulo = "Novo interesse na sua oportunidade";
  const mensagem = `O investidor ${nomeInvestidor} demonstrou interesse em "${tituloOportunidade}". A equipa iniciará a mediação.`;

  const html = htmlEmailBase(
    titulo,
    `<p>O investidor <strong>${nomeInvestidor}</strong> demonstrou interesse na sua oportunidade <strong>"${tituloOportunidade}"</strong>.</p>
     <p>A equipa da ULEZI XPI iniciará o processo de mediação e entrará em contacto em breve.</p>`,
  );

  await notificar(
    empresaUserId,
    "novo_interesse",
    titulo,
    mensagem,
    "/painel/empresa",
    empresaEmail,
    html,
  );
};

/**
 * Notificação de ticket de suporte atualizado
 */
const notificarTicketAtualizado = async (
  userId,
  email,
  ticketNumber,
  novoStatus,
) => {
  const statusLabel =
    {
      em_atendimento: "em atendimento",
      aguardando_resposta: "aguardando a sua resposta",
      resolvido: "resolvido",
      fechado: "fechado",
    }[novoStatus] || novoStatus;

  const titulo = `Ticket ${ticketNumber} — ${statusLabel}`;
  const mensagem = `O seu pedido de suporte #${ticketNumber} está agora ${statusLabel}.`;

  const html = htmlEmailBase(
    titulo,
    `<p>O seu pedido de suporte <strong>#${ticketNumber}</strong> foi actualizado.</p>
     <p>Estado actual: <strong>${statusLabel}</strong></p>`,
    {
      url: process.env.FRONTEND_URL || "http://localhost:3000",
      label: "Ver pedido de suporte",
    },
  );

  await notificar(
    userId,
    "ticket_atualizado",
    titulo,
    mensagem,
    null,
    email,
    html,
  );
};

/**
 * Notificação de assinatura a expirar em breve
 */
const notificarAssinaturaExpirar = async (
  userId,
  email,
  nomePlano,
  diasRestantes,
) => {
  const titulo = `Assinatura expira em ${diasRestantes} dia(s)`;
  const mensagem = `O seu plano "${nomePlano}" expira em ${diasRestantes} dia(s). Renove para manter o acesso.`;

  const html = htmlEmailBase(
    titulo,
    `<p>O seu plano <strong>${nomePlano}</strong> expira em <strong>${diasRestantes} dia(s)</strong>.</p>
     <p>Para manter o acesso a todas as funcionalidades, renove a sua assinatura.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/empresa/assinatura`,
      label: "Renovar assinatura",
    },
  );

  await notificar(
    userId,
    "assinatura_expirando",
    titulo,
    mensagem,
    "/empresa/assinatura",
    email,
    html,
  );
};

/**
 * Gera link de WhatsApp
 */
const getWhatsAppLink = (phone, message) => {
  const cleaned = String(phone || "").replace(/[^0-9]/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
};

/**
 * Notificação de nova oportunidade criada
 */
const notificarNovaOportunidade = async (
  userId,
  email,
  tituloOportunidade,
  tipoOportunidade,
) => {
  const titulo = "Oportunidade publicada com sucesso";
  const mensagem = `A sua oportunidade "${tituloOportunidade}" foi publicada e está agora visível para investidores.`;

  const html = htmlEmailBase(
    titulo,
    `<p>A sua oportunidade <strong>"${tituloOportunidade}"</strong> (${tipoOportunidade}) foi publicada com sucesso.</p>
     <p>Está agora visível para investidores na plataforma. Receberá notificações quando houver interessados.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/painel/empresa`,
      label: "Ver minhas oportunidades",
    },
  );

  await notificar(
    userId,
    "oportunidade_criada",
    titulo,
    mensagem,
    "/painel/empresa",
    email,
    html,
  );
};

/**
 * Notificação de nova vaga criada
 */
const notificarNovaVaga = async (
  userId,
  email,
  tituloVaga,
) => {
  const titulo = "Vaga publicada com sucesso";
  const mensagem = `A vaga "${tituloVaga}" foi publicada e está aguardando aprovação administrativa.`;

  const html = htmlEmailBase(
    titulo,
    `<p>A vaga <strong>"${tituloVaga}"</strong> foi criada com sucesso.</p>
     <p>Está agora aguardando aprovação administrativa. Receberá notificação quando for aprovada.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/painel/empresa`,
      label: "Ver minhas vagas",
    },
  );

  await notificar(
    userId,
    "vaga_criada",
    titulo,
    mensagem,
    "/painel/empresa",
    email,
    html,
  );
};

/**
 * Notificação de vaga aprovada
 */
const notificarVagaAprovada = async (
  userId,
  email,
  tituloVaga,
) => {
  const titulo = "Vaga aprovada";
  const mensagem = `A vaga "${tituloVaga}" foi aprovada e está agora publicada.`;

  const html = htmlEmailBase(
    titulo,
    `<p>A vaga <strong>"${tituloVaga}"</strong> foi aprovada pela equipa administrativa.</p>
     <p>Está agora visível para candidatos na plataforma.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/painel/empresa`,
      label: "Ver vaga",
    },
  );

  await notificar(
    userId,
    "vaga_aprovada",
    titulo,
    mensagem,
    "/painel/empresa",
    email,
    html,
  );
};

/**
 * Notificação de nova inscrição em curso
 */
const notificarNovaInscricao = async (
  userId,
  email,
  nomeCurso,
  nomeCentro,
) => {
  const titulo = "Inscrição realizada com sucesso";
  const mensagem = `Inscrição no curso "${nomeCurso}" confirmada. Aguardando pagamento.`;

  const html = htmlEmailBase(
    titulo,
    `<p>A sua inscrição no curso <strong>"${nomeCurso}"</strong> (${nomeCentro}) foi realizada com sucesso.</p>
     <p>Para confirmar a sua vaga, realize o pagamento conforme as instruções enviadas.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/painel/aluno`,
      label: "Ver inscrições",
    },
  );

  await notificar(
    userId,
    "inscricao_curso",
    titulo,
    mensagem,
    "/painel/aluno",
    email,
    html,
  );
};

/**
 * Notificação de pagamento confirmado
 */
const notificarPagamentoConfirmado = async (
  userId,
  email,
  nomeCurso,
  valor,
) => {
  const titulo = "Pagamento confirmado";
  const mensagem = `Pagamento de ${valor}Kz confirmado para o curso "${nomeCurso}".`;

  const html = htmlEmailBase(
    titulo,
    `<p>O seu pagamento de <strong>${valor}Kz</strong> para o curso <strong>"${nomeCurso}"</strong> foi confirmado.</p>
     <p>A sua inscrição está agora completa. Pode descarregar o recibo na sua área pessoal.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/painel/aluno`,
      label: "Ver recibo",
    },
  );

  await notificar(
    userId,
    "pagamento_confirmado",
    titulo,
    mensagem,
    "/painel/aluno",
    email,
    html,
  );
};

/**
 * Notificação de consultoria agendada
 */
const notificarConsultoriaAgendada = async (
  userId,
  email,
  tema,
  data,
  hora,
  nomeConsultoria,
) => {
  const titulo = "Consultoria agendada";
  const mensagem = `Consultoria "${tema}" agendada para ${data} às ${hora} com ${nomeConsultoria}.`;

  const html = htmlEmailBase(
    titulo,
    `<p>A sua consultoria <strong>"${tema}"</strong> foi agendada.</p>
     <p><strong>Data:</strong> ${data}<br><strong>Hora:</strong> ${hora}<br><strong>Consultoria:</strong> ${nomeConsultoria}</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/painel/empresa`,
      label: "Ver consultoria",
    },
  );

  await notificar(
    userId,
    "consultoria_agendada",
    titulo,
    mensagem,
    "/painel/empresa",
    email,
    html,
  );
};

/**
 * Notificação de contrato gerado
 */
const notificarContratoGerado = async (
  userId,
  email,
  tipoContrato,
  numeroContrato,
) => {
  const titulo = "Contrato gerado";
  const mensagem = `Contrato ${tipoContrato} #${numeroContrato} foi gerado e está disponível para download.`;

  const html = htmlEmailBase(
    titulo,
    `<p>O contrato <strong>${tipoContrato} #${numeroContrato}</strong> foi gerado com sucesso.</p>
     <p>Está disponível para download na sua área pessoal.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/painel/empresa`,
      label: "Ver contrato",
    },
  );

  await notificar(
    userId,
    "contrato_gerado",
    titulo,
    mensagem,
    "/painel/empresa",
    email,
    html,
  );
};

const notificarDocumentosReenviados = async (
  adminEmail,
  alunoNome,
  cursoNome,
  numeroInscricao,
) => {
  const titulo = "Documentos reenviados para análise";
  const mensagem = `O aluno ${alunoNome} reenviou documentos para a inscrição no curso "${cursoNome}". Análise necessária.`;

  const html = htmlEmailBase(
    titulo,
    `<p>O aluno <strong>${alunoNome}</strong> reenviou documentos para análise.</p>
     <p><strong>Curso:</strong> ${cursoNome}</p>
     <p><strong>Inscrição:</strong> ${numeroInscricao}</p>
     <p>Os documentos foram actualizados e aguardam a sua revisão.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/admin/inscricoes`,
      label: "Ver inscrição",
    },
  );

  await sendEmail({
    to: adminEmail,
    subject: titulo,
    html,
  }).catch(() => null);
};

/**
 * Notificacao de ativacao de conta (apos verificacao de email)
 */
const notificarContaAtivada = async (userId, email, nome) => {
  const titulo = "Conta ativada com sucesso";
  const mensagem = `Olá ${nome}, a sua conta foi ativada. Já pode aceder a todas as funcionalidades da plataforma.`;

  const html = htmlEmailBase(
    titulo,
    `<p>Olá <strong>${nome}</strong>,</p>
     <p>A sua conta na <strong>ULEZI XPB</strong> foi ativada com sucesso.</p>
     <p>Já pode aceder a todas as funcionalidades da plataforma de acordo com o seu perfil.</p>`,
    {
      url: process.env.FRONTEND_URL || "http://localhost:3000",
      label: "Aceder à plataforma",
    },
  );

  await notificar(userId, "conta_ativada", titulo, mensagem, "/", email, html);
};

/**
 * Notificacao de resultado de negociacao (para empresa e investidor)
 */
const notificarResultadoNegociacao = async (
  userId,
  email,
  nome,
  tipoResultado,
  tituloOportunidade,
  detalhes = null,
) => {
  const resultados = {
    aprovada: { titulo: "Negociação aprovada", msg: `A negociação para "${tituloOportunidade}" foi aprovada.` },
    rejeitada: { titulo: "Negociação não concretizada", msg: `A negociação para "${tituloOportunidade}" não foi concretizada.` },
    pendente: { titulo: "Negociação em analise", msg: `A negociação para "${tituloOportunidade}" está em análise administrativa.` },
    concluida: { titulo: "Negociação concluida", msg: `A negociação para "${tituloOportunidade}" foi concluída com sucesso.` },
  };

  const resultado = resultados[tipoResultado] || resultados.pendente;
  const link = userId ? "/painel/empresa" : "/painel/investidor";

  const html = htmlEmailBase(
    resultado.titulo,
    `<p>Olá <strong>${nome}</strong>,</p>
     <p>${resultado.msg}</p>
     ${detalhes ? `<p><strong>Detalhes:</strong> ${detalhes}</p>` : ""}
     <p>Pode acompanhar o estado da negociação na sua área pessoal.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}${link}`,
      label: "Ver negociações",
    },
  );

  await notificar(userId, `negociacao_${tipoResultado}`, resultado.titulo, resultado.msg, link, email, html);
};

/**
 * Notificacao de reuniao/agenda agendada
 */
const notificarReuniaoAgendada = async (
  userId,
  email,
  nome,
  tipoReuniao,
  data,
  hora,
  local = null,
  linkVideo = null,
) => {
  const titulo = `${tipoReuniao} agendada`;
  const mensagem = `${tipoReuniao} agendada para ${data} às ${hora}.${local ? ` Local: ${local}` : ""}`;

  const html = htmlEmailBase(
    titulo,
    `<p>Olá <strong>${nome}</strong>,</p>
     <p>Uma <strong>${tipoReuniao}</strong> foi agendada.</p>
     <p><strong>Data:</strong> ${data}<br><strong>Hora:</strong> ${hora}</p>
     ${local ? `<p><strong>Local:</strong> ${local}</p>` : ""}
     ${linkVideo ? `<p><strong>Link da reunião:</strong> <a href="${linkVideo}">${linkVideo}</a></p>` : ""}
     <p>Por favor, confirme a sua presença na plataforma.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/agenda`,
      label: "Ver agenda",
    },
  );

  await notificar(userId, "reuniao_agendada", titulo, mensagem, "/agenda", email, html);
};

/**
 * Notificacao de lembrete de reuniao (enviado 24h antes)
 */
const notificarLembreteReuniao = async (
  userId,
  email,
  nome,
  tipoReuniao,
  data,
  hora,
) => {
  const titulo = `Lembrete: ${tipoReuniao} amanhã`;
  const mensagem = `Lembrete: Tem ${tipoReuniao} agendada para amanhã, ${data} às ${hora}.`;

  const html = htmlEmailBase(
    titulo,
    `<p>Olá <strong>${nome}</strong>,</p>
     <p>Este é um lembrete da sua <strong>${tipoReuniao}</strong> agendada.</p>
     <p><strong>Data:</strong> ${data}<br><strong>Hora:</strong> ${hora}</p>
     <p>Não se esqueça de participar!</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/agenda`,
      label: "Ver detalhes",
    },
  );

  await notificar(userId, "lembrete_reuniao", titulo, mensagem, "/agenda", email, html);
};

/**
 * Notificacao de novo candidato a vaga
 */
const notificarNovoCandidato = async (
  userId,
  email,
  nomeEmpresa,
  nomeCandidato,
  tituloVaga,
) => {
  const titulo = "Novo candidato para a sua vaga";
  const mensagem = `${nomeCandidato} candidatou-se à vaga "${tituloVaga}".`;

  const html = htmlEmailBase(
    titulo,
    `<p>Olá <strong>${nomeEmpresa}</strong>,</p>
     <p>O candidato <strong>${nomeCandidato}</strong> candidatou-se à vaga <strong>"${tituloVaga}"</strong>.</p>
     <p>Aceda à plataforma para ver o CV e detalhes da candidatura.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/painel/empresa`,
      label: "Ver candidaturas",
    },
  );

  await notificar(userId, "novo_candidato", titulo, mensagem, "/painel/empresa", email, html);
};

/**
 * Notificacao de status de candidatura (para o candidato)
 */
const notificarStatusCandidatura = async (
  userId,
  email,
  nomeCandidato,
  tituloVaga,
  status,
  feedback = null,
) => {
  const statusLabels = {
    em_analise: { titulo: "Candidatura em analise", msg: `A sua candidatura para "${tituloVaga}" está em análise.` },
    aprovada: { titulo: "Candidatura aprovada", msg: `Parabéns! A sua candidatura para "${tituloVaga}" foi aprovada.` },
    rejeitada: { titulo: "Candidatura nao selecionada", msg: `A sua candidatura para "${tituloVaga}" não foi selecionada nesta fase.` },
    entrevista: { titulo: "Convite para entrevista", msg: `Foi convocado para uma entrevista para a vaga "${tituloVaga}".` },
  };

  const estado = statusLabels[status] || statusLabels.em_analise;

  const html = htmlEmailBase(
    estado.titulo,
    `<p>Olá <strong>${nomeCandidato}</strong>,</p>
     <p>${estado.msg}</p>
     ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ""}
     <p>Aceda à plataforma para mais detalhes.</p>`,
    {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/painel/aluno`,
      label: "Ver candidaturas",
    },
  );

  await notificar(userId, `candidatura_${status}`, estado.titulo, estado.msg, "/painel/aluno", email, html);
};

module.exports = {
  createNotification,
  sendEmail,
  notificar,
  notificarBemVindo,
  notificarContaAtivada,
  notificarDecisaoEmpresa,
  notificarNovoInteresse,
  notificarResultadoNegociacao,
  notificarReuniaoAgendada,
  notificarLembreteReuniao,
  notificarTicketAtualizado,
  notificarAssinaturaExpirar,
  notificarNovaOportunidade,
  notificarNovaVaga,
  notificarVagaAprovada,
  notificarNovoCandidato,
  notificarStatusCandidatura,
  notificarNovaInscricao,
  notificarPagamentoConfirmado,
  notificarConsultoriaAgendada,
  notificarContratoGerado,
  notificarDocumentosReenviados,
  getWhatsAppLink,
};
