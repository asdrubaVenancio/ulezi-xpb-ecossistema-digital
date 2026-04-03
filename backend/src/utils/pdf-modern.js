const PDFDocument = require('pdfkit');

const COLORS = {
  primary: '#1FA7C9',
  text: '#374151',
  muted: '#6B7280',
  border: '#D1D5DB',
  surface: '#F8FAFC',
  highlight: '#EFF6FF',
  success: '#F0FDF4',
};

const money = (value) => `${Number(value || 0).toLocaleString('pt-AO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} Kz`;

const dateText = (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const buildDoc = (meta, title) => {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    info: {
      Author: 'ULEZI XPB',
      Creator: 'ULEZI XPB Sistema',
      ...meta,
    },
  });

  doc.on('pageAdded', () => drawHeader(doc, title));
  return doc;
};

const ensureSpace = (doc, height = 120) => {
  if (doc.y + height > doc.page.height - 85) doc.addPage();
};

const drawHeader = (doc, title) => {
  doc.save();
  doc.rect(0, 0, doc.page.width, 84).fill(COLORS.primary);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(24).text('ULEZI XPB', 50, 24);
  doc.font('Helvetica').fontSize(10).text('Formacao, negocios e investimento', 50, 52);
  doc.text('www.ulezixpb.com', 50, 66);
  doc.restore();

  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(19).text(title, 50, 108, {
    width: doc.page.width - 100,
    align: 'center',
  });
  doc.moveTo(50, 138).lineTo(doc.page.width - 50, 138).strokeColor(COLORS.primary).lineWidth(1.5).stroke();
  doc.y = 155;
};

const drawFooter = (doc, label) => {
  const y = doc.page.height - 52;
  doc.moveTo(50, y - 8).lineTo(doc.page.width - 50, y - 8).strokeColor(COLORS.border).lineWidth(1).stroke();
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8);
  doc.text(`${label} gerado em ${dateText(new Date())}`, 50, y, { width: doc.page.width - 100, align: 'center' });
  doc.text('Documento emitido eletronicamente pela plataforma ULEZI XPB.', 50, y + 12, {
    width: doc.page.width - 100,
    align: 'center',
  });
};

const rowsSection = (doc, title, rows) => {
  const items = rows.filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!items.length) return;
  ensureSpace(doc, 70 + (items.length * 18));
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12).text(title, 50, doc.y);
  doc.moveDown(0.55);

  items.forEach(([label, value]) => {
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text).text(label, 50, y, { width: 150 });
    doc.font('Helvetica').fillColor(COLORS.muted).text(String(value), 205, y, {
      width: doc.page.width - 255,
      align: 'left',
    });
    doc.moveDown(0.5);
  });

  doc.moveDown(0.9);
};

const boxSection = (doc, title, rows, fillColor = COLORS.highlight) => {
  const items = rows.filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!items.length) return;
  const height = 42 + (items.length * 18);
  ensureSpace(doc, height + 18);
  const top = doc.y;

  doc.save();
  doc.roundedRect(45, top, doc.page.width - 90, height, 8).fillAndStroke(fillColor, COLORS.border);
  doc.restore();

  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12).text(title, 60, top + 12);
  let y = top + 32;
  items.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text).text(label, 60, y, { width: 140 });
    doc.font('Helvetica').fillColor(COLORS.muted).text(String(value), 195, y, { width: doc.page.width - 255 });
    y += 18;
  });
  doc.y = top + height + 14;
};

const paragraphSection = (doc, title, body) => {
  if (!body) return;
  ensureSpace(doc, 120);
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12).text(title, 50, doc.y);
  doc.moveDown(0.45);
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.text).text(String(body), 50, doc.y, {
    width: doc.page.width - 100,
    align: 'justify',
    lineGap: 3,
  });
  doc.moveDown(1);
};

const bulletSection = (doc, title, bullets) => {
  const items = bullets.filter(Boolean);
  if (!items.length) return;
  ensureSpace(doc, 65 + (items.length * 16));
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12).text(title, 50, doc.y);
  doc.moveDown(0.45);
  items.forEach((item) => {
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.text).text(`- ${item}`, 60, doc.y, {
      width: doc.page.width - 120,
      lineGap: 2,
    });
    doc.moveDown(0.35);
  });
  doc.moveDown(0.8);
};

const signatureSection = (doc, columns) => {
  ensureSpace(doc, 120);
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12).text('ASSINATURAS', 50, doc.y);
  doc.moveDown(1.2);
  const baseY = doc.y;
  const width = 210;
  const gap = 40;

  columns.forEach((column, index) => {
    const x = 55 + (index * (width + gap));
    doc.moveTo(x, baseY + 28).lineTo(x + width, baseY + 28).strokeColor(COLORS.text).lineWidth(1).stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text).text(column.label, x, baseY + 34, { width });
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted).text(column.name, x, baseY + 48, { width });
  });

  doc.moveDown(5);
};

const gerarReciboPDF = (data) => new Promise((resolve, reject) => {
  const chunks = [];
  const doc = buildDoc({
    Title: `Recibo de inscricao - ${data.numero_inscricao}`,
    Subject: 'Recibo de inscricao',
  }, 'RECIBO DE INSCRICAO');

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  drawHeader(doc, 'RECIBO DE INSCRICAO');
  boxSection(doc, 'REFERENCIA', [
    ['Numero', data.numero_inscricao || 'N/D'],
    ['Data de emissao', dateText(data.data_pagamento || new Date())],
  ]);
  rowsSection(doc, 'DADOS DO ALUNO', [
    ['Nome completo', data.nome_aluno || 'N/D'],
    ['Email', data.email_aluno || 'N/D'],
    ['Telefone', data.telefone_aluno || 'Nao informado'],
    ['Provincia', data.provincia_aluno || 'Nao informada'],
    ['Municipio', data.municipio_aluno || 'Nao informado'],
  ]);
  rowsSection(doc, 'DADOS DA INSCRICAO', [
    ['Curso', data.nome_curso || 'N/D'],
    ['Categoria', data.categoria_curso || 'Nao informada'],
    ['Nivel', data.nivel_curso || 'Nao informado'],
    ['Centro de formacao', data.centro_formacao || 'A definir'],
    ['Carga horaria', data.duracao_curso ? `${data.duracao_curso} horas` : 'Nao informada'],
  ]);
  boxSection(doc, 'PAGAMENTO', [
    ['Valor pago', money(data.valor_pago)],
    ['Metodo', data.metodo_pagamento || 'Transferencia bancaria'],
    ['Data de confirmacao', dateText(data.data_pagamento)],
    ['Estado', 'Confirmado'],
  ], COLORS.success);
  bulletSection(doc, 'OBSERVACOES IMPORTANTES', [
    'Este recibo comprova a inscricao e a confirmacao do pagamento.',
    'O documento pode ser solicitado pelo centro de formacao.',
    'Em caso de duvida, utilize os canais oficiais da plataforma.',
  ]);
  drawFooter(doc, 'Recibo de inscricao');
  doc.end();
});

const gerarCertificadoPDF = (data) => new Promise((resolve, reject) => {
  const chunks = [];
  const doc = new PDFDocument({
    margin: 60,
    size: 'A4',
    layout: 'landscape',
    info: {
      Title: `Certificado - ${data.nome_curso}`,
      Author: 'ULEZI XPB',
      Creator: 'ULEZI XPB Sistema',
      Subject: 'Certificado de conclusao',
    },
  });

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#F8FAFC');
  doc.roundedRect(28, 28, doc.page.width - 56, doc.page.height - 56, 16).lineWidth(3).stroke(COLORS.primary);
  doc.roundedRect(40, 40, doc.page.width - 80, doc.page.height - 80, 12).lineWidth(1).stroke(COLORS.border);
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(34).text('CERTIFICADO DE CONCLUSAO', 0, 80, { align: 'center' });
  doc.font('Helvetica').fontSize(18).fillColor(COLORS.text).text('Curso profissional', 0, 124, { align: 'center' });
  doc.font('Helvetica').fontSize(16).text('Certificamos que', 0, 188, { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.primary).text((data.nome_aluno || '').toUpperCase(), 0, 224, { align: 'center' });
  doc.font('Helvetica').fontSize(16).fillColor(COLORS.text).text('concluiu com aproveitamento o curso', 0, 276, { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(24).fillColor(COLORS.primary).text((data.nome_curso || '').toUpperCase(), 0, 310, { align: 'center' });
  doc.font('Helvetica').fontSize(14).fillColor(COLORS.muted).text(`Carga horaria: ${data.carga_horaria || 'N/D'} horas`, 0, 356, { align: 'center' });
  doc.text(`Centro: ${data.centro_formacao || 'ULEZI XPB'}`, 0, 378, { align: 'center' });
  doc.text(`Periodo: ${data.data_inicio || 'N/D'} a ${data.data_fim || 'N/D'}`, 0, 400, { align: 'center' });
  doc.text(`Emitido em ${dateText(new Date())}`, 0, 432, { align: 'center' });
  doc.moveTo(120, 492).lineTo(320, 492).strokeColor(COLORS.text).stroke();
  doc.moveTo(doc.page.width - 320, 492).lineTo(doc.page.width - 120, 492).strokeColor(COLORS.text).stroke();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.text).text('Direcao da formacao', 120, 502, { width: 200, align: 'center' });
  doc.text('Aluno', doc.page.width - 320, 502, { width: 200, align: 'center' });
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted).text(data.nome_diretor || 'Responsavel institucional', 120, 518, { width: 200, align: 'center' });
  doc.text(data.nome_aluno || '', doc.page.width - 320, 518, { width: 200, align: 'center' });
  doc.text(`Codigo de autenticidade: ${data.codigo_autenticidade || 'N/D'}`, 0, 560, { align: 'center' });
  doc.end();
});

const gerarContratoPDF = (data) => new Promise((resolve, reject) => {
  const chunks = [];
  const doc = buildDoc({
    Title: `Contrato de investimento - ${data.id}`,
    Subject: 'Contrato de investimento',
  }, 'CONTRATO DE INVESTIMENTO');

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  drawHeader(doc, 'CONTRATO DE INVESTIMENTO');
  boxSection(doc, 'IDENTIFICACAO DO DOCUMENTO', [
    ['Referencia', `INV-${data.id || 'N/D'}`],
    ['Data de emissao', dateText(new Date())],
    ['Titulo da oportunidade', data.titulo || data.titulo_oportunidade || 'N/D'],
  ]);
  rowsSection(doc, 'PARTE 1 - EMPRESA', [
    ['Nome da empresa', data.nome_empresa || 'N/D'],
    ['NIF', data.nif_empresa || 'Nao informado'],
    ['Email', data.email_empresa || 'Nao informado'],
    ['Telefone', data.telefone_empresa || 'Nao informado'],
    ['Endereco', data.endereco_empresa || 'Nao informado'],
  ]);
  rowsSection(doc, 'PARTE 2 - INVESTIDOR', [
    ['Nome do investidor', data.nome_investidor || 'N/D'],
    ['Email', data.email_investidor || 'Nao informado'],
    ['Telefone', data.telefone_investidor || 'Nao informado'],
    ['Tipo de investidor', data.tipo_investidor || 'Nao informado'],
    ['Documento', data.documento_investidor || 'Nao informado'],
  ]);
  rowsSection(doc, 'DETALHES DO ACORDO', [
    ['Tipo de investimento', data.tipo_oportunidade || 'Nao informado'],
    ['Valor negociado', money(data.valor)],
    ['Percentagem', data.percentagem || 'Nao definida'],
    ['Prazo de retorno', data.prazo_retorno || 'Nao definido'],
  ]);
  paragraphSection(doc, 'DESCRICAO DA OPORTUNIDADE', data.descricao_oportunidade || data.descricao);
  bulletSection(doc, 'CLAUSULAS PRINCIPAIS', [
    'As partes reconhecem que este documento formaliza o acordo obtido no processo de mediacao.',
    'A empresa e o investidor comprometem-se a cumprir as obrigacoes assumidas neste instrumento.',
    'A ULEZI XPB atua como plataforma mediadora e registradora do processo.',
    'Qualquer alteracao posterior deve ser formalizada por escrito entre as partes.',
    'O contrato entra em vigor na data da assinatura pelas partes envolvidas.',
  ]);
  signatureSection(doc, [
    { label: 'Representante da empresa', name: data.nome_empresa || 'Empresa' },
    { label: 'Investidor', name: data.nome_investidor || 'Investidor' },
  ]);
  drawFooter(doc, 'Contrato de investimento');
  doc.end();
});

module.exports = {
  gerarReciboPDF,
  gerarContratoPDF,
  gerarCertificadoPDF,
  formatarMoeda: money,
  formatarData: dateText,
};
