/**
 * ULEZI XPB — Serviço de Geração de PDFs
 * Gera recibos de inscrição e contratos de investimento
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// Garantir que pastas existem
['uploads/receipts', 'uploads/contracts'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Cores do sistema
const AZUL = '#1FA7C9';
const CINZA = '#374151';
const VERDE = '#22C55E';

/**
 * Gera recibo PDF após confirmação de pagamento
 */
const generateReceipt = async (data) => {
  const { numero_recibo, student_nome, student_email, student_telefone, curso_nome, preco, data: dt, numero_inscricao, receipt_id } = data;

  const filename = `recibo-${numero_recibo}.pdf`;
  const filepath = path.join('uploads/receipts', filename);
  const url = `/uploads/receipts/${filename}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // ── Cabeçalho ──
    doc.rect(0, 0, doc.page.width, 100).fill(AZUL);
    doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('ULEZI XPB', 50, 30);
    doc.fontSize(12).font('Helvetica').text('Ecossistema Digital Multifuncional', 50, 65);
    doc.fillColor(CINZA);

    // ── Título Recibo ──
    doc.rect(0, 100, doc.page.width, 50).fill('#F8FAFC');
    doc.fillColor(AZUL).fontSize(18).font('Helvetica-Bold').text('COMPROVATIVO DE INSCRIÇÃO', 50, 115, { align: 'center', width: doc.page.width - 100 });

    // ── Número e Data ──
    doc.fillColor(CINZA).fontSize(11).font('Helvetica')
      .text(`Número: ${numero_recibo}`, 50, 175)
      .text(`Data: ${new Date(dt).toLocaleDateString('pt-PT')}`, 400, 175);

    // Linha separadora
    doc.moveTo(50, 200).lineTo(doc.page.width - 50, 200).stroke('#CCCCCC');

    // ── Dados do Estudante ──
    doc.fillColor(AZUL).fontSize(13).font('Helvetica-Bold').text('DADOS DO ESTUDANTE', 50, 215);
    doc.fillColor(CINZA).fontSize(11).font('Helvetica');
    doc.text(`Nome: ${student_nome}`, 70, 240);
    doc.text(`Email: ${student_email}`, 70, 260);
    if (student_telefone) doc.text(`Telefone: ${student_telefone}`, 70, 280);

    // ── Dados do Curso ──
    doc.fillColor(AZUL).fontSize(13).font('Helvetica-Bold').text('DADOS DA INSCRIÇÃO', 50, 320);
    doc.fillColor(CINZA).fontSize(11).font('Helvetica');
    doc.text(`Curso: ${curso_nome}`, 70, 345);
    doc.text(`Número de Inscrição: ${numero_inscricao}`, 70, 365);

    // ── Valor ──
    doc.rect(50, 400, doc.page.width - 100, 60).fill('#F0FDF4');
    doc.fillColor(VERDE).fontSize(16).font('Helvetica-Bold')
      .text(`VALOR PAGO: ${parseFloat(preco).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`, 70, 420);

    // ── Rodapé ──
    doc.moveTo(50, doc.page.height - 100).lineTo(doc.page.width - 50, doc.page.height - 100).stroke('#CCCCCC');
    doc.fillColor(CINZA).fontSize(9).font('Helvetica')
      .text('Este documento é válido como comprovativo de pagamento.', 50, doc.page.height - 85, { align: 'center', width: doc.page.width - 100 })
      .text('Ulezi XPB — ulezixpb.com | suporte@ulezixpb.com', 50, doc.page.height - 65, { align: 'center', width: doc.page.width - 100 });

    doc.end();

    stream.on('finish', async () => {
      try {
        await pool.execute('UPDATE receipts SET pdf_url=? WHERE id=?', [url, receipt_id]);
        console.log(`✅ Recibo PDF gerado: ${filename}`);
        resolve(url);
      } catch (err) {
        reject(err);
      }
    });
    stream.on('error', reject);
  });
};

/**
 * Gera contrato PDF de investimento
 */
const generateContract = async (data) => {
  const {
    numero_contrato, contract_id,
    op_titulo, op_tipo, valor, percentagem, prazo_pagamento, taxa_retorno, garantias,
    nome_empresa, empresa_email, empresa_tel,
    investor_nome, investor_email, investor_tel
  } = data;

  const filename = `contrato-${numero_contrato}.pdf`;
  const filepath = path.join('uploads/contracts', filename);
  const url = `/uploads/contracts/${filename}`;

  const tipoLabels = {
    venda_empresa: 'Venda da Empresa',
    participacao: 'Venda de Participação Societária',
    licenciamento: 'Licenciamento de Marca',
    franquia: 'Franquia',
    investimento: 'Pedido de Investimento/Empréstimo'
  };

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // ── Cabeçalho ──
    doc.rect(0, 0, doc.page.width, 90).fill(AZUL);
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('ULEZI XPB', 60, 25);
    doc.fontSize(11).font('Helvetica').text('CONTRATO DE NEGÓCIO E INVESTIMENTO', 60, 58);
    doc.fillColor(CINZA);

    // ── Identificação ──
    doc.fillColor(CINZA).fontSize(10).font('Helvetica')
      .text(`N.º Contrato: ${numero_contrato}`, 60, 110)
      .text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, 400, 110);

    doc.moveTo(60, 130).lineTo(doc.page.width - 60, 130).stroke('#CCCCCC');

    // ── Objeto do Contrato ──
    doc.fillColor(AZUL).fontSize(13).font('Helvetica-Bold').text('OBJECTO DO CONTRATO', 60, 145);
    doc.fillColor(CINZA).fontSize(11).font('Helvetica')
      .text(`Tipo: ${tipoLabels[op_tipo] || op_tipo}`, 80, 168)
      .text(`Descrição: ${op_titulo}`, 80, 188);
    if (valor) doc.text(`Valor: ${parseFloat(valor).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`, 80, 208);
    if (percentagem) doc.text(`Percentagem: ${percentagem}%`, 80, 228);
    if (prazo_pagamento) doc.text(`Prazo: ${prazo_pagamento}`, 80, 248);
    if (taxa_retorno) doc.text(`Taxa de Retorno: ${taxa_retorno}%`, 80, 268);
    if (garantias) doc.text(`Garantias: ${garantias}`, 80, 288, { width: doc.page.width - 140 });

    let y = 330;
    doc.moveTo(60, y).lineTo(doc.page.width - 60, y).stroke('#CCCCCC');

    // ── Partes ──
    doc.fillColor(AZUL).fontSize(13).font('Helvetica-Bold').text('PARTES ENVOLVIDAS', 60, y + 15);

    doc.fillColor(CINZA).fontSize(11).font('Helvetica-Bold').text('EMPRESA (PARTE A):', 60, y + 40);
    doc.font('Helvetica')
      .text(`Nome: ${nome_empresa}`, 80, y + 60)
      .text(`Email: ${empresa_email}`, 80, y + 78)
      .text(`Telefone: ${empresa_tel}`, 80, y + 96);

    doc.font('Helvetica-Bold').text('INVESTIDOR (PARTE B):', 60, y + 125);
    doc.font('Helvetica')
      .text(`Nome: ${investor_nome}`, 80, y + 145)
      .text(`Email: ${investor_email}`, 80, y + 163)
      .text(`Telefone: ${investor_tel}`, 80, y + 181);

    // ── Termos ──
    doc.moveTo(60, y + 210).lineTo(doc.page.width - 60, y + 210).stroke('#CCCCCC');
    doc.fillColor(AZUL).fontSize(13).font('Helvetica-Bold').text('TERMOS E CONDIÇÕES', 60, y + 225);
    doc.fillColor(CINZA).fontSize(9).font('Helvetica').text(
      'O presente contrato é celebrado entre as partes acima identificadas, mediado pela Ulezi XPB. Ambas as partes concordam com os termos descritos e comprometem-se a cumprir as obrigações assumidas. A Ulezi XPB actua como intermediária e garante da transparência do processo.',
      60, y + 248, { width: doc.page.width - 120 }
    );

    // ── Assinaturas ──
    doc.moveTo(60, doc.page.height - 160).lineTo(doc.page.width - 60, doc.page.height - 160).stroke('#CCCCCC');
    doc.fillColor(AZUL).fontSize(12).font('Helvetica-Bold').text('ASSINATURAS', 60, doc.page.height - 145);

    doc.moveTo(80, doc.page.height - 90).lineTo(230, doc.page.height - 90).stroke(CINZA);
    doc.fillColor(CINZA).fontSize(9).font('Helvetica').text('Empresa', 80, doc.page.height - 80);

    doc.moveTo(280, doc.page.height - 90).lineTo(430, doc.page.height - 90).stroke(CINZA);
    doc.text('Investidor', 280, doc.page.height - 80);

    doc.moveTo(480, doc.page.height - 90).lineTo(doc.page.width - 60, doc.page.height - 90).stroke(CINZA);
    doc.text('Ulezi XPB', 480, doc.page.height - 80);

    doc.end();

    stream.on('finish', async () => {
      try {
        await pool.execute('UPDATE contracts SET pdf_url=? WHERE id=?', [url, contract_id]);
        console.log(`✅ Contrato PDF gerado: ${filename}`);
        resolve(url);
      } catch (err) {
        reject(err);
      }
    });
    stream.on('error', reject);
  });
};

module.exports = { generateReceipt, generateContract };
