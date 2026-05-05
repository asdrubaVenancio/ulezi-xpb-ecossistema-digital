const PDFDocument = require('pdfkit');

const COLORS = {
  primary: '#1FA7C9',
  text: '#374151',
  muted: '#6B7280',
  border: '#D1D5DB',
  surface: '#F8FAFC',
  success: '#F0FDF4',
};

const formatMoney = (value, currency = 'AOA') => `${Number(value || 0).toLocaleString('pt-AO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} ${currency}`;

const formatDate = (value) => new Date(value).toLocaleDateString('pt-PT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const sectionRows = (doc, title, rows) => {
  const items = rows.filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!items.length) return;
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12).text(title, 50, doc.y);
  doc.moveDown(0.5);
  items.forEach(([label, value]) => {
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text).text(label, 50, y, { width: 150 });
    doc.font('Helvetica').fillColor(COLORS.muted).text(String(value), 205, y, { width: doc.page.width - 255 });
    doc.moveDown(0.5);
  });
  doc.moveDown(0.8);
};

const boxRows = (doc, title, rows) => {
  const top = doc.y;
  const items = rows.filter(([, value]) => value !== undefined && value !== null && value !== '');
  const height = 42 + (items.length * 18);
  doc.roundedRect(45, top, doc.page.width - 90, height, 8).fillAndStroke(COLORS.success, COLORS.border);
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12).text(title, 60, top + 12);
  let y = top + 32;
  items.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text).text(label, 60, y, { width: 130 });
    doc.font('Helvetica').fillColor(COLORS.muted).text(String(value), 195, y, { width: doc.page.width - 255 });
    y += 18;
  });
  doc.y = top + height + 14;
};

const generateSubscriptionReceiptBuffer = async (data) => new Promise((resolve, reject) => {
  const chunks = [];
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `Recibo de assinatura - ${data.numero_recibo}`,
      Author: 'ULEZI XPI',
      Creator: 'ULEZI XPI Sistema',
      Subject: 'Recibo de assinatura empresarial',
    },
  });

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.rect(0, 0, doc.page.width, 84).fill(COLORS.primary);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(24).text('ULEZI XPB', 50, 24);
  doc.font('Helvetica').fontSize(10).text('Recibo de assinatura empresarial', 50, 54);
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(19).text('RECIBO DE ASSINATURA', 50, 108, {
    width: doc.page.width - 100,
    align: 'center',
  });
  doc.moveTo(50, 138).lineTo(doc.page.width - 50, 138).strokeColor(COLORS.primary).lineWidth(1.5).stroke();
  doc.y = 156;

  boxRows(doc, 'REFERENCIA', [
    ['Numero', data.numero_recibo || 'N/D'],
    ['Data de emissao', formatDate(new Date())],
    ['Referencia de pagamento', data.referencia_pagamento || 'N/D'],
  ]);

  sectionRows(doc, 'DADOS DA EMPRESA', [
    ['Empresa', data.nome_empresa || 'N/D'],
    ['Representante', data.representante_nome || 'Nao informado'],
    ['Email', data.representante_email || 'Nao informado'],
  ]);

  sectionRows(doc, 'DADOS DO PLANO', [
    ['Plano', data.pacote_nome || 'N/D'],
    ['Inicio da vigencia', data.data_inicio ? formatDate(data.data_inicio) : 'N/D'],
    ['Fim da vigencia', data.data_fim ? formatDate(data.data_fim) : 'N/D'],
  ]);

  boxRows(doc, 'VALOR CONFIRMADO', [
    ['Total pago', formatMoney(data.valor_pago, data.moeda || 'AOA')],
    ['Estado', 'Pagamento confirmado'],
  ]);

  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9);
  doc.text('Este recibo comprova a aprovacao e o pagamento da assinatura empresarial.', 50, doc.page.height - 70, {
    width: doc.page.width - 100,
    align: 'center',
  });
  doc.text('Documento emitido eletronicamente pela plataforma ULEZI XPB.', 50, doc.page.height - 56, {
    width: doc.page.width - 100,
    align: 'center',
  });
  doc.end();
});

module.exports = { generateSubscriptionReceiptBuffer };
