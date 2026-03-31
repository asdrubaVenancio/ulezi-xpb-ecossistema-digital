/**
 * Utilitário para geração de PDFs com PDFKit
 * 
 * Responsável pela geração de recibos de inscrição e contratos
 * com design profissional e informações dinâmicas.
 * 
 * @author ULEZI XPB Team
 * @version 2.0.0
 */
const PDFDocument = require('pdfkit');

/**
 * Formata valor monetário para exibição
 * @param {number} valor - Valor a formatar
 * @returns {string} Valor formatado
 */
const formatarMoeda = (valor) => {
  return valor ? `${Number(valor).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz` : '0,00 Kz';
};

/**
 * Formata data para exibição
 * @param {Date|string} data - Data a formatar
 * @returns {string} Data formatada
 */
const formatarData = (data) => {
  return data ? new Date(data).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : new Date().toLocaleDateString('pt-PT');
};

/**
 * Adiciona marca d'água ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {string} texto - Texto da marca d'água
 */
const adicionarMarcaDagua = (doc, texto = 'ULEZI XPB') => {
  doc.save();
  doc.fillOpacity(0.1);
  doc.fontSize(60).font('Helvetica-Bold').fillColor('#1FA7C9');
  doc.text(texto, doc.page.width / 2, doc.page.height / 2, {
    align: 'center',
    rotate: -45
  });
  doc.fillOpacity(1);
  doc.restore();
};

/**
 * Adiciona cabeçalho profissional ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {string} titulo - Título do documento
 */
const adicionarCabecalho = (doc, titulo) => {
  const COR_PRIMARIA = '#1FA7C9';
  const COR_ESCURA = '#374151';
  
  // Banner superior
  doc.rect(0, 0, doc.page.width, 100).fill(COR_PRIMARIA);
  
  // Logo e nome
  doc.fillColor('#FFFFFF');
  doc.fontSize(32).font('Helvetica-Bold').text('ULEZI XPB', 50, 30);
  doc.fontSize(14).font('Helvetica').text('Plataforma de Formação Profissional', 50, 65);
  
  // Informações de contato no canto superior direito
  doc.fontSize(10).font('Helvetica');
  doc.text('www.ulezixpb.com', doc.page.width - 150, 30, { align: 'right' });
  doc.text('info@ulezixpb.com', doc.page.width - 150, 45, { align: 'right' });
  doc.text('+244 923 000 000', doc.page.width - 150, 60, { align: 'right' });
  
  // Título do documento
  doc.fillColor(COR_ESCURA);
  doc.moveDown(2);
  doc.fontSize(24).font('Helvetica-Bold').text(titulo, { align: 'center' });
  
  // Linha decorativa
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(COR_PRIMARIA).lineWidth(2).stroke();
  doc.moveDown(1.5);
};

/**
 * Adiciona rodapé profissional ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {string} tipoDocumento - Tipo de documento para referencia
 */
const adicionarRodape = (doc, tipoDocumento = 'Documento') => {
  const y = doc.page.height - 80;
  
  // Linha superior do rodapé
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#D1D5DB').lineWidth(1).stroke();
  
  // Informações do documento
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#6B7280');
  doc.text(
    `${tipoDocumento} gerado eletronicamente em ${formatarData(new Date())} às ${new Date().toLocaleTimeString('pt-PT')}`,
    { align: 'center' }
  );
  doc.text('Documento válido sem assinatura digital - Sistema ULEZI XPB', { align: 'center' });
  doc.text('Para verificar autenticidade, contacte: info@ulezixpb.com | +244 923 000 000', { align: 'center' });
};

/**
 * Adiciona seção de informações ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {string} titulo - Título da seção
 * @param {Array} dados - Array de arrays [label, valor]
 */
const adicionarSecao = (doc, titulo, dados) => {
  const COR_PRIMARIA = '#1FA7C9';
  const COR_ESCURA = '#374151';
  const COR_CINZA = '#6B7280';
  
  // Título da seção
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COR_PRIMARIA).text(titulo);
  doc.moveDown(0.8);
  
  // Dados da seção
  dados.forEach(([label, valor]) => {
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COR_ESCURA).text(label, 50, doc.y, { continued: true, width: 150 });
    doc.font('Helvetica').fillColor(COR_CINZA).text(valor || 'N/A');
    doc.moveDown(0.3);
  });
  
  doc.moveDown(0.5);
};

/**
 * Adiciona caixa destacada para informações importantes
 * @param {PDFDocument} doc - Documento PDF
 * @param {string} titulo - Título da caixa
 * @param {Array} dados - Array de arrays [label, valor]
 */
const adicionarCaixaDestaque = (doc, titulo, dados) => {
  const COR_PRIMARIA = '#1FA7C9';
  const COR_ESCURA = '#374151';
  const COR_CINZA = '#6B7280';
  
  // Caixa de destaque
  const y = doc.y;
  doc.rect(45, y, 505, 80 + (dados.length * 15)).fill('#F0F9FF').stroke();
  
  // Título
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COR_PRIMARIA).text(titulo, 60, y + 15);
  doc.moveDown(0.5);
  
  // Dados
  dados.forEach(([label, valor]) => {
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COR_ESCURA).text(label, 60, doc.y, { continued: true, width: 150 });
    doc.font('Helvetica').fillColor(COR_CINZA).text(valor || 'N/A');
    doc.moveDown(0.3);
  });
  
  doc.moveDown(1);
};

/**
 * Gera recibo de inscrição em PDF melhorado
 * @param {Object} dados - Dados da inscrição
 * @returns {Promise<Buffer>} Buffer com o PDF gerado
 */
const gerarReciboPDF = (dados) => {
  return new Promise((resolve, reject) => {
    const buffers = [];
    const doc = new PDFDocument({ 
      margin: 50, 
      size: 'A4',
      info: {
        Title: `Recibo de Inscrição - ${dados.numero_inscricao}`,
        Author: 'ULEZI XPB',
        Subject: 'Comprovante de Inscrição em Curso',
        Creator: 'ULEZI XPB Sistema'
      }
    });

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Adicionar marca d'água
    adicionarMarcaDagua(doc, 'RECIBO');
    
    // Cabeçalho profissional
    adicionarCabecalho(doc, 'RECIBO DE INSCRIÇÃO');
    
    // Número de referência
    doc.fontSize(12).font('Helvetica').fillColor('#6B7280');
    doc.text(`Nº de Referência: ${dados.numero_inscricao}`, { align: 'center' });
    doc.moveDown(1);

    // Seção de dados do aluno
    const dadosAluno = [
      ['Nome Completo:', dados.nome_aluno],
      ['Email:', dados.email_aluno],
      ['Telefone:', dados.telefone_aluno || 'Não informado'],
      ['Província:', dados.provincia_aluno || 'Não informada'],
      ['Município:', dados.municipio_aluno || 'Não informado']
    ];
    adicionarSecao(doc, 'DADOS DO ALUNO', dadosAluno);

    // Seção de dados do curso
    const dadosCurso = [
      ['Curso:', dados.nome_curso],
      ['Categoria:', dados.categoria_curso || 'N/A'],
      ['Nível:', dados.nivel_curso || 'N/A'],
      ['Centro de Formação:', dados.centro_formacao || 'A ser definido'],
      ['Localização:', `${dados.municipio_centro || 'N/A'}, ${dados.provincia_centro || 'N/A'}`],
      ['Carga Horária:', dados.duracao_curso ? `${dados.duracao_curso} horas` : 'N/A']
    ];
    adicionarSecao(doc, 'DADOS DO CURSO', dadosCurso);

    // Caixa de destaque para pagamento
    const dadosPagamento = [
      ['Valor Pago:', formatarMoeda(dados.valor_pago)],
      ['Método de Pagamento:', dados.metodo_pagamento || 'Transferência Bancária'],
      ['Data de Confirmação:', formatarData(dados.data_pagamento)],
      ['Status do Pagamento:', '✓ CONFIRMADO'],
      ['Moeda:', 'Kwanza (Kz)']
    ];
    adicionarCaixaDestaque(doc, 'INFORMAÇÕES DE PAGAMENTO', dadosPagamento);

    // Termos e condições
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1FA7C9').text('TERMOS E CONDIÇÕES');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#374151');
    
    const termos = [
      '1. Este recibo comprova a inscrição e pagamento efetuado no sistema ULEZI XPB.',
      '2. A inscrição está sujeita à confirmação do centro de formação e disponibilidade de vagas.',
      '3. O aluno deverá apresentar este documento no primeiro dia de aulas.',
      '4. Em caso de cancelamento, consulte nossa política de reembolso.',
      '5. Dúvidas? Contacte-nos: info@ulezixpb.com | +244 923 000 000'
    ];
    
    termos.forEach(termo => {
      doc.text(termo, { align: 'justify' });
      doc.moveDown(0.3);
    });

    // Rodapé profissional
    adicionarRodape(doc, 'Recibo de Inscrição');

    // Finalizar documento
    doc.end();
  });
};

/**
 * Gera certificado de conclusão de curso em PDF
 * @param {Object} dados - Dados do certificado
 * @returns {Promise<Buffer>} Buffer com o PDF gerado
 */
const gerarCertificadoPDF = (dados) => {
  return new Promise((resolve, reject) => {
    const buffers = [];
    const doc = new PDFDocument({ 
      margin: 60, 
      size: 'A4',
      layout: 'landscape',
      info: {
        Title: `Certificado - ${dados.nome_curso}`,
        Author: 'ULEZI XPB',
        Subject: 'Certificado de Conclusão de Curso',
        Creator: 'ULEZI XPB Sistema'
      }
    });

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Design de certificado
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#F8FAFC');
    
    // Borda decorativa
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).lineWidth(3).stroke('#1FA7C9');
    doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).lineWidth(1).stroke('#1FA7C9');
    
    // Marca d'água
    adicionarMarcaDagua(doc, 'CERTIFICADO');
    
    // Título principal
    doc.fontSize(36).font('Helvetica-Bold').fillColor('#1FA7C9');
    doc.text('CERTIFICADO DE CONCLUSÃO', { align: 'center' });
    
    doc.fontSize(24).font('Helvetica').fillColor('#374151');
    doc.text('DE CURSO PROFISSIONAL', { align: 'center' });
    doc.moveDown(1);
    
    // Texto de certificação
    doc.fontSize(16).font('Helvetica').fillColor('#374151');
    doc.text('Certificamos que', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#1FA7C9');
    doc.text(dados.nome_aluno.toUpperCase(), { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(16).font('Helvetica').fillColor('#374151');
    doc.text('concluiu com êxito o curso', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1FA7C9');
    doc.text(dados.nome_curso.toUpperCase(), { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(16).font('Helvetica').fillColor('#374151');
    doc.text(`com carga horária de ${dados.carga_horaria} horas`, { align: 'center' });
    doc.moveDown(1);
    
    // Informações adicionais
    doc.fontSize(14).font('Helvetica').fillColor('#6B7280');
    doc.text(`Realizado em: ${dados.centro_formacao}`, { align: 'center' });
    doc.text(`Período: ${dados.data_inicio} a ${dados.data_fim}`, { align: 'center' });
    doc.moveDown(1.5);
    
    // Data de emissão
    doc.fontSize(12).font('Helvetica').fillColor('#6B7280');
    doc.text(`Emitido em ${formatarData(new Date())}`, { align: 'center' });
    
    // Assinaturas
    const yAssinaturas = doc.page.height - 120;
    doc.fontSize(12).font('Helvetica').fillColor('#374151');
    
    // Assinatura do diretor
    doc.text('_________________________', 100, yAssinaturas, { align: 'center' });
    doc.text('Assinatura do Diretor', 100, yAssinaturas + 20, { align: 'center' });
    doc.text(dados.nome_diretor || 'Diretor do Centro', 100, yAssinaturas + 40, { align: 'center' });
    
    // Assinatura do aluno
    doc.text('_________________________', doc.page.width - 100, yAssinaturas, { align: 'center' });
    doc.text('Assinatura do Aluno', doc.page.width - 100, yAssinaturas + 20, { align: 'center' });
    doc.text(dados.nome_aluno, doc.page.width - 100, yAssinaturas + 40, { align: 'center' });
    
    // Selo de autenticidade
    doc.fontSize(10).font('Helvetica').fillColor('#6B7280');
    doc.text(`Código de Autenticidade: ${dados.codigo_autenticidade}`, { align: 'center' });
    doc.text('Verifique em: www.ulezixpb.com/validar', { align: 'center' });

    doc.end();
  });
};

/**
 * Gera contrato de investimento em PDF melhorado
 * @param {Object} dados - Dados do contrato
 * @returns {Promise<Buffer>} Buffer com o PDF gerado
 */
const gerarContratoPDF = (dados) => {
  return new Promise((resolve, reject) => {
    const buffers = [];
    const doc = new PDFDocument({ 
      margin: 60, 
      size: 'A4',
      info: {
        Title: `Contrato de Investimento - ${dados.id}`,
        Author: 'ULEZI XPB',
        Subject: 'Contrato de Investimento',
        Creator: 'ULEZI XPB Sistema'
      }
    });

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Marca d'água
    adicionarMarcaDagua(doc, 'CONTRATO');
    
    // Cabeçalho profissional
    adicionarCabecalho(doc, 'CONTRATO DE INVESTIMENTO');
    
    // Número de referência
    doc.fontSize(12).font('Helvetica').fillColor('#6B7280');
    doc.text(`Referência: INV-${dados.id} | Data: ${formatarData(new Date())}`, { align: 'center' });
    doc.moveDown(1);

    // Seção das partes contratantes
    const dadosEmpresa = [
      ['Nome da Empresa:', dados.nome_empresa],
      ['NIF:', dados.nif_empresa || 'N/A'],
      ['Email:', dados.email_empresa],
      ['Telefone:', dados.telefone_empresa || 'N/A'],
      ['Endereço:', dados.endereco_empresa || 'N/A']
    ];
    adicionarSecao(doc, 'PRIMEIRA PARTE (EMPRESA)', dadosEmpresa);

    const dadosInvestidor = [
      ['Nome do Investidor:', dados.nome_investidor],
      ['Email:', dados.email_investidor],
      ['Telefone:', dados.telefone_investidor || 'N/A'],
      ['Tipo de Investidor:', dados.tipo_investidor || 'Pessoa Física'],
      ['NIF/BI:', dados.documento_investidor || 'N/A']
    ];
    adicionarSecao(doc, 'SEGUNDA PARTE (INVESTIDOR)', dadosInvestidor);

    // Objeto do contrato
    const dadosOportunidade = [
      ['Título da Oportunidade:', dados.titulo_oportunidade],
      ['Tipo de Investimento:', dados.tipo_oportunidade],
      ['Valor do Investimento:', formatarMoeda(dados.valor)],
      ['Percentagem:', dados.percentagem || 'N/A'],
      ['Prazo de Retorno:', dados.prazo_retorno || 'N/A']
    ];
    adicionarSecao(doc, 'OBJETO DO CONTRATO', dadosOportunidade);

    // Descrição detalhada
    if (dados.descricao_oportunidade) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1FA7C9').text('DESCRIÇÃO DA OPORTUNIDADE');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor('#374151');
      doc.text(dados.descricao_oportunidade, { align: 'justify' });
      doc.moveDown(1);
    }

    // Termos e condições
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1FA7C9').text('TERMOS E CONDIÇÕES');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#374151');
    
    const termos = [
      '1. As partes reconhecem e concordam com os termos estabelecidos neste contrato.',
      '2. A ULEZI XPB atua exclusivamente como plataforma mediadora, não sendo responsável pelo cumprimento das obrigações.',
      '3. O investidor declara ter conhecimento dos riscos associados ao investimento.',
      '4. As partes comprometem-se a manter sigilo sobre as informações confidenciais.',
      '5. Em caso de litígio, as partes concordam com a jurisdição dos tribunais de Luanda, Angola.',
      '6. Este contrato pode ser alterado mediante acordo mútuo por escrito.',
      '7. O contrato entra em vigor na data da assinatura por ambas as partes.'
    ];
    
    termos.forEach(termo => {
      doc.text(termo, { align: 'justify' });
      doc.moveDown(0.3);
    });

    // Assinaturas
    doc.moveDown(2);
    const yAssinaturas = doc.y;
    
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#374151');
    doc.text('ASSINATURAS', { align: 'center' });
    doc.moveDown(1);
    
    // Assinatura da empresa
    doc.fontSize(10).font('Helvetica').fillColor('#6B7280');
    doc.text('_________________________________________', 60, yAssinaturas);
    doc.text('Representante Legal da Empresa', 60, yAssinaturas + 20);
    doc.text(`Nome: ${dados.nome_empresa}`, 60, yAssinaturas + 35, { width: 200 });
    doc.text(`Data: __/__/____`, 60, yAssinaturas + 50);
    
    // Assinatura do investidor
    doc.text('_________________________________________', 320, yAssinaturas);
    doc.text('Investidor', 320, yAssinaturas + 20);
    doc.text(`Nome: ${dados.nome_investidor}`, 320, yAssinaturas + 35, { width: 200 });
    doc.text(`Data: __/__/____`, 320, yAssinaturas + 50);

    // Rodapé profissional
    adicionarRodape(doc, 'Contrato de Investimento');

    doc.end();
  });
};

module.exports = { 
  gerarReciboPDF, 
  gerarContratoPDF, 
  gerarCertificadoPDF,
  formatarMoeda,
  formatarData
};
