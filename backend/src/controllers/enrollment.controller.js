/**
 * Controller de inscrições do módulo de formação.
 * Fluxo: aluno submete documentos > equipa analisa > só depois é gerado o recibo.
 */
const path = require('path');
const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { gerarReciboPDF } = require('../utils/pdf');
const { sendEnrollmentConfirmation } = require('../utils/email');
const { sendWhatsApp } = require('../utils/whatsapp');
const { createNotification } = require('../services/notification.service');
const { log } = require('../utils/audit');

const gerarNumeroInscricao = () => {
  const ano = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `UXB-${ano}-${rand}`;
};

const normalizarCaminhoUpload = (file) => {
  if (!file) return null;
  return `/uploads/${path.relative(process.env.UPLOAD_DIR || './uploads', file.path).replace(/\\/g, '/')}`;
};

const obterOferta = async ({ offeringId, courseId }) => {
  if (offeringId) {
    const [rows] = await pool.execute(
      `
      SELECT
        tcc.id AS offering_id,
        tcc.course_id,
        tcc.center_id,
        tcc.preco,
        tcc.carga_horaria,
        tcc.certificado_exigido,
        tcc.especificacoes,
        c.nome AS nome_curso,
        c.categoria,
        c.nivel,
        tc.nome AS nome_centro,
        tc.provincia,
        tc.municipio
      FROM training_center_courses tcc
      INNER JOIN courses c ON c.id = tcc.course_id
      INNER JOIN training_centers tc ON tc.id = tcc.center_id
      WHERE tcc.id = ? AND tcc.status = 'ativo' AND c.status = 'ativo' AND tc.status = 'ativo'
      `,
      [offeringId]
    );
    return rows[0] || null;
  }

  if (courseId) {
    const [rows] = await pool.execute(
      'SELECT id AS course_id, nome AS nome_curso, categoria, nivel, preco FROM courses WHERE id = ? AND status = "ativo"',
      [courseId]
    );
    return rows[0] || null;
  }

  return null;
};

const listarDestinatariosAdministrativos = async () => {
  const [admins] = await pool.execute(
    'SELECT id FROM users WHERE role IN ("admin", "employee") AND status = "ativo"'
  );
  return admins.map((item) => item.id);
};

const criarNotificacoesAdministrativas = async (titulo, mensagem, link = null) => {
  const admins = await listarDestinatariosAdministrativos();
  await Promise.all(admins.map((id) => createNotification(id, 'inscricao', titulo, mensagem, link)));
};

/** POST /api/enrollments - Criar inscrição com comprovativo e documentos */
const createEnrollment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      course_id,
      offering_id,
      municipio_aluno,
      provincia_aluno,
      observacoes,
      referencia_bancaria,
      banco_origem,
      data_pagamento,
      valor_pago,
    } = req.body;

    const oferta = await obterOferta({ offeringId: offering_id, courseId: course_id });
    if (!oferta) {
      return notFound(res, 'Curso ou oferta do centro não encontrada.');
    }

    const comprovativoPagamento = req.files?.comprovativo_pagamento?.[0];
    const documentoRequisito = req.files?.documento_requisito?.[0];

    if (!comprovativoPagamento) {
      return badRequest(res, 'O comprovativo de pagamento é obrigatório.');
    }

    if (oferta.certificado_exigido && !documentoRequisito) {
      return badRequest(res, 'Este curso exige o envio de certificado ou documento obrigatório.');
    }

    const [existing] = await pool.execute(
      `
      SELECT id
      FROM enrollments
      WHERE student_id = ?
        AND course_id = ?
        AND status IN ('pendente', 'em_analise', 'confirmada')
      `,
      [studentId, oferta.course_id]
    );

    if (existing.length) {
      return badRequest(res, 'Já existe uma inscrição em andamento para este curso.');
    }

    const numeroInscricao = gerarNumeroInscricao();
    const valor = Number(valor_pago || oferta.preco || 0);
    const comprovativoUrl = normalizarCaminhoUpload(comprovativoPagamento);
    const documentoUrl = normalizarCaminhoUpload(documentoRequisito);

    const [result] = await pool.execute(
      `
      INSERT INTO enrollments
        (numero_inscricao, student_id, course_id, center_id, offering_id, municipio_aluno, provincia_aluno, observacoes,
         documento_requisito_url, documento_requisito_nome, documento_requisito_mime, status, payment_status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        numeroInscricao,
        studentId,
        oferta.course_id,
        oferta.center_id || null,
        oferta.offering_id || null,
        municipio_aluno || null,
        provincia_aluno || null,
        observacoes || null,
        documentoUrl,
        documentoRequisito?.originalname || null,
        documentoRequisito?.mimetype || null,
        'pendente',
        'pendente',
      ]
    );

    const referencia = [banco_origem, referencia_bancaria, data_pagamento].filter(Boolean).join(' | ') || null;

    const [paymentResult] = await pool.execute(
      `
      INSERT INTO payments
        (enrollment_id, valor, metodo, referencia, comprovativo_url, status)
      VALUES (?,?,?,?,?,?)
      `,
      [
        result.insertId,
        valor,
        'transferencia',
        referencia,
        comprovativoUrl,
        'pendente',
      ]
    );

    await criarNotificacoesAdministrativas(
      'Nova inscrição para validação',
      `Existe uma nova inscrição (${numeroInscricao}) à espera de análise documental.`,
      '/admin?secao=inscricoes'
    );

    await createNotification(
      studentId,
      'inscricao',
      'Inscrição submetida',
      `A sua inscrição ${numeroInscricao} foi submetida e aguarda validação administrativa.`,
      '/dashboard/aluno'
    );

    await log(
      studentId,
      'CREATE_ENROLLMENT',
      'enrollments',
      result.insertId,
      { course_id: oferta.course_id, offering_id: oferta.offering_id || null, numero_inscricao: numeroInscricao },
      req
    );

    return created(
      res,
      {
        enrollment_id: result.insertId,
        payment_id: paymentResult.insertId,
        numero_inscricao: numeroInscricao,
        status: 'pendente',
      },
      'Inscrição submetida com sucesso. Aguarde a validação administrativa.'
    );
  } catch (err) {
    console.error('[ENROLLMENT_CREATE]', err);
    return error(res, 'Erro ao criar inscrição.', 500);
  }
};

/** GET /api/enrollments/me - Inscrições do estudante */
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const [rows] = await pool.execute(
      `
      SELECT
        e.*,
        c.nome AS nome_curso,
        c.categoria,
        c.nivel,
        tc.nome AS nome_centro,
        tc.municipio AS municipio_centro,
        tc.provincia AS provincia_centro,
        tcc.preco AS preco_oferta,
        tcc.carga_horaria,
        tcc.certificado_exigido,
        tcc.especificacoes,
        p.id AS pagamento_id,
        p.valor AS valor_pago,
        p.metodo,
        p.status AS status_pagamento,
        p.comprovativo_url,
        p.created_at AS data_pagamento,
        r.numero_recibo,
        r.id AS recibo_id
      FROM enrollments e
      LEFT JOIN courses c ON c.id = e.course_id
      LEFT JOIN training_centers tc ON tc.id = e.center_id
      LEFT JOIN training_center_courses tcc ON tcc.id = e.offering_id
      LEFT JOIN payments p ON p.enrollment_id = e.id
      LEFT JOIN receipts r ON r.enrollment_id = e.id
      WHERE e.student_id = ?
      ORDER BY e.created_at DESC
      `,
      [studentId]
    );

    return success(
      res,
      rows.map((row) => ({
        ...row,
        criado_em: row.created_at,
        exige_documento: !!row.certificado_exigido,
      }))
    );
  } catch (err) {
    console.error('[ENROLLMENT_ME]', err);
    return error(res, 'Erro ao listar inscrições.', 500);
  }
};

/** POST /api/enrollments/:id/payment - Compatibilidade para actualizar comprovativo */
const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const comprovativoPagamento = req.files?.comprovativo_pagamento?.[0] || req.file;

    if (!comprovativoPagamento) {
      return badRequest(res, 'O comprovativo de pagamento é obrigatório.');
    }

    const [[enrollment]] = await pool.execute(
      `
      SELECT e.id, e.student_id, p.id AS payment_id
      FROM enrollments e
      LEFT JOIN payments p ON p.enrollment_id = e.id
      WHERE e.id = ?
      `,
      [id]
    );

    if (!enrollment) {
      return notFound(res, 'Inscrição não encontrada.');
    }
    if (enrollment.student_id !== studentId) {
      return error(res, 'Acesso negado.', 403);
    }

    const comprovativoUrl = normalizarCaminhoUpload(comprovativoPagamento);
    await pool.execute(
      'UPDATE payments SET comprovativo_url = ?, status = "pendente" WHERE id = ?',
      [comprovativoUrl, enrollment.payment_id]
    );

    await pool.execute(
      'UPDATE enrollments SET comprovativo_visualizado_em = NULL, status = "em_analise", payment_status = "pendente" WHERE id = ?',
      [id]
    );

    return success(res, { comprovativo_url: comprovativoUrl }, 'Comprovativo actualizado com sucesso.');
  } catch (err) {
    console.error('[ENROLLMENT_PAYMENT]', err);
    return error(res, 'Erro ao actualizar comprovativo.', 500);
  }
};

/** GET /api/enrollments/:id/receipt - Descarregar recibo */
const downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `
      SELECT r.*, e.student_id
      FROM receipts r
      INNER JOIN enrollments e ON e.id = r.enrollment_id
      WHERE r.enrollment_id = ?
      `,
      [id]
    );

    if (!rows.length) {
      return notFound(res, 'Recibo não encontrado.');
    }

    const canView = rows[0].student_id === req.user.id || ['admin', 'employee'].includes(req.user.role);
    if (!canView) {
      return error(res, 'Acesso negado.', 403);
    }

    if (!rows[0].pdf_data) {
      return notFound(res, 'PDF do recibo não disponível.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recibo_${rows[0].numero_recibo}.pdf"`);
    return res.send(rows[0].pdf_data);
  } catch (err) {
    console.error('[RECEIPT_DOWNLOAD]', err);
    return error(res, 'Erro ao obter recibo.', 500);
  }
};

/** GET /api/admin/enrollments - Listar todas as inscrições */
const adminListEnrollments = async (req, res) => {
  try {
    const { course_id, center_id, status } = req.query;
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || req.query.limite || 50, 10);
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        e.*,
        u.nome AS nome_aluno,
        u.email,
        u.telefone,
        c.nome AS nome_curso,
        tc.nome AS nome_centro,
        tcc.preco AS preco_oferta,
        tcc.carga_horaria,
        tcc.certificado_exigido,
        p.id AS pagamento_id,
        p.valor AS valor_pago,
        p.status AS status_pagamento,
        p.comprovativo_url,
        r.numero_recibo
      FROM enrollments e
      LEFT JOIN users u ON u.id = e.student_id
      LEFT JOIN courses c ON c.id = e.course_id
      LEFT JOIN training_centers tc ON tc.id = e.center_id
      LEFT JOIN training_center_courses tcc ON tcc.id = e.offering_id
      LEFT JOIN payments p ON p.enrollment_id = e.id
      LEFT JOIN receipts r ON r.enrollment_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) {
      query += ' AND e.course_id = ?';
      params.push(course_id);
    }
    if (center_id) {
      query += ' AND e.center_id = ?';
      params.push(center_id);
    }
    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    } else {
      // Por padrão, mostrar inscrições pendentes - usar valores válidos do ENUM
      query += ' AND e.status IN (?, ?, ?)';
      params.push('pendente', 'confirmada', 'concluida');
    }

    query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    console.log('[ADMIN_LIST] Query:', query);
    console.log('[ADMIN_LIST] Params:', params);
    console.log('[ADMIN_LIST] Params count:', params.length);

    // Verificar todas as inscrições primeiro
    const [allRows] = await pool.execute('SELECT id, status, course_id, student_id FROM enrollments LIMIT 10');
    console.log('[ADMIN_LIST] Todas as inscrições:', allRows);

    const [rows] = await pool.query(query, params);

    return success(
      res,
      rows.map((row) => ({
        ...row,
        exige_documento: !!row.certificado_exigido,
        documentos_visualizados: {
          comprovativo: !!row.comprovativo_visualizado_em,
          requisito: !!row.documento_visualizado_em,
        },
        pode_decidir:
          !!row.comprovativo_visualizado_em &&
          (!row.certificado_exigido || !!row.documento_visualizado_em),
      }))
    );
  } catch (err) {
    console.error('[ENROLLMENT_ADMIN_LIST]', err);
    return error(res, 'Erro ao listar inscrições.', 500);
  }
};

/** GET /api/admin/enrollments/:id/documento - Visualizar documento e marcar leitura */
const viewEnrollmentDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo } = req.query;

    const [[enrollment]] = await pool.execute(
      `
      SELECT
        e.id,
        e.student_id,
        e.documento_requisito_url,
        e.documento_requisito_nome,
        p.comprovativo_url
      FROM enrollments e
      LEFT JOIN payments p ON p.enrollment_id = e.id
      WHERE e.id = ?
      `,
      [id]
    );

    if (!enrollment) {
      return notFound(res, 'Inscrição não encontrada.');
    }

    if (tipo === 'comprovativo') {
      console.log('[VIEW_DOC] Comprovativo URL:', enrollment.comprovativo_url);
      if (!enrollment.comprovativo_url) {
        return notFound(res, 'Comprovativo não encontrado.');
      }

      if (['admin', 'employee'].includes(req.user.role)) {
        await pool.execute('UPDATE enrollments SET comprovativo_visualizado_em = NOW() WHERE id = ?', [id]);
      }

      return success(res, { url: enrollment.comprovativo_url, tipo });
    }

    if (tipo === 'documento') {
      if (!enrollment.documento_requisito_url) {
        return notFound(res, 'Documento obrigatório não encontrado.');
      }

      if (['admin', 'employee'].includes(req.user.role)) {
        await pool.execute('UPDATE enrollments SET documento_visualizado_em = NOW() WHERE id = ?', [id]);
      }

      return success(res, {
        url: enrollment.documento_requisito_url,
        nome: enrollment.documento_requisito_nome,
        tipo,
      });
    }

    return badRequest(res, 'Tipo de documento inválido.');
  } catch (err) {
    console.error('[ENROLLMENT_VIEW_DOC]', err);
    return error(res, 'Erro ao obter documento.', 500);
  }
};

const gerarReciboAprovacao = async (enrollmentId) => {
  const [[dados]] = await pool.execute(
    `
    SELECT
      e.numero_inscricao,
      u.nome AS nome_aluno,
      u.email,
      u.telefone,
      e.municipio_aluno,
      e.provincia_aluno,
      c.nome AS nome_curso,
      c.categoria AS categoria_curso,
      tc.nome AS centro_formacao,
      tc.municipio AS municipio_centro,
      tcc.carga_horaria AS duracao_curso,
      p.valor AS valor_pago,
      p.metodo AS metodo_pagamento
    FROM enrollments e
    INNER JOIN users u ON u.id = e.student_id
    INNER JOIN courses c ON c.id = e.course_id
    LEFT JOIN training_centers tc ON tc.id = e.center_id
    LEFT JOIN training_center_courses tcc ON tcc.id = e.offering_id
    LEFT JOIN payments p ON p.enrollment_id = e.id
    WHERE e.id = ?
    `,
    [enrollmentId]
  );

  const pdfBuffer = await gerarReciboPDF({
    ...dados,
    data_pagamento: new Date(),
  });

  const numeroRecibo = `REC-${dados.numero_inscricao}`;

  await pool.execute(
    `
    INSERT INTO receipts (enrollment_id, numero_recibo, pdf_data)
    VALUES (?,?,?)
    ON DUPLICATE KEY UPDATE
      numero_recibo = VALUES(numero_recibo),
      pdf_data = VALUES(pdf_data)
    `,
    [enrollmentId, numeroRecibo, pdfBuffer]
  );

  sendEnrollmentConfirmation(dados.email, {
    nome_aluno: dados.nome_aluno,
    nome_curso: dados.nome_curso,
    centro: dados.centro_formacao,
    valor: dados.valor_pago,
    numero_inscricao: dados.numero_inscricao,
  }, pdfBuffer).catch((err) => console.error('[EMAIL_ENROLLMENT]', err.message));

  if (dados.telefone) {
    sendWhatsApp(
      dados.telefone,
      `Inscrição aprovada na ULEZI XPB. Curso: ${dados.nome_curso}. Número: ${dados.numero_inscricao}. Recibo: ${numeroRecibo}.`
    ).catch((err) => console.error('[WHATSAPP_ENROLLMENT]', err.message));
  }

  return { numeroRecibo, pdfBuffer, dados };
};

/** PUT /api/admin/enrollments/:id/review - Aprovar ou rejeitar inscrição */
const reviewEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const aprovado = req.body.aprovado === true || req.body.approved === true;
    const motivoRejeicao = req.body.motivo_rejeicao || req.body.motivo || null;

    const [[enrollment]] = await pool.execute(
      `
      SELECT
        e.*,
        u.id AS student_id,
        tcc.certificado_exigido,
        p.id AS pagamento_id,
        p.comprovativo_url
      FROM enrollments e
      INNER JOIN users u ON u.id = e.student_id
      LEFT JOIN training_center_courses tcc ON tcc.id = e.offering_id
      LEFT JOIN payments p ON p.enrollment_id = e.id
      WHERE e.id = ?
      `,
      [id]
    );

    if (!enrollment) {
      return notFound(res, 'Inscrição não encontrada.');
    }

    if (!aprovado && (!motivoRejeicao || motivoRejeicao.trim().length < 10)) {
      return badRequest(res, 'O motivo de rejeição é obrigatório e deve ter pelo menos 10 caracteres.');
    }

    if (aprovado) {
      if (!enrollment.comprovativo_url || !enrollment.comprovativo_visualizado_em) {
        return badRequest(res, 'O comprovativo de pagamento precisa ser visualizado antes da aprovação.');
      }

      if (enrollment.certificado_exigido) {
        if (!enrollment.documento_requisito_url) {
          return badRequest(res, 'O documento obrigatório ainda não foi enviado pelo aluno.');
        }
        if (!enrollment.documento_visualizado_em) {
          return badRequest(res, 'O documento obrigatório precisa ser visualizado antes da aprovação.');
        }
      }

      await pool.execute(
        `
        UPDATE enrollments
        SET status = 'confirmada',
            payment_status = 'pago',
            motivo_rejeicao = NULL,
            aprovado_by = ?,
            aprovado_at = NOW()
        WHERE id = ?
        `,
        [req.user.id, id]
      );

      await pool.execute(
        'UPDATE payments SET status = "confirmado", confirmado_by = ?, confirmado_at = NOW() WHERE enrollment_id = ?',
        [req.user.id, id]
      );

      const { numeroRecibo } = await gerarReciboAprovacao(id);

      await createNotification(
        enrollment.student_id,
        'inscricao',
        'Inscrição aprovada',
        `A sua inscrição foi aprovada. O recibo ${numeroRecibo} já está disponível no histórico.`,
        '/dashboard/aluno'
      );
    } else {
      await pool.execute(
        `
        UPDATE enrollments
        SET status = 'rejeitada',
            payment_status = 'rejeitado',
            motivo_rejeicao = ?,
            aprovado_by = ?,
            aprovado_at = NOW()
        WHERE id = ?
        `,
        [motivoRejeicao, req.user.id, id]
      );

      await pool.execute(
        'UPDATE payments SET status = "rejeitado", confirmado_by = ?, confirmado_at = NOW() WHERE enrollment_id = ?',
        [req.user.id, id]
      );

      await createNotification(
        enrollment.student_id,
        'inscricao',
        'Inscrição rejeitada',
        `A sua inscrição foi rejeitada. Motivo: ${motivoRejeicao}`,
        '/dashboard/aluno'
      );
    }

    await log(
      req.user.id,
      aprovado ? 'APPROVE_ENROLLMENT' : 'REJECT_ENROLLMENT',
      'enrollments',
      id,
      { motivo_rejeicao: motivoRejeicao },
      req
    );

    return success(res, null, aprovado ? 'Inscrição aprovada com sucesso.' : 'Inscrição rejeitada com sucesso.');
  } catch (err) {
    console.error('[ENROLLMENT_REVIEW]', err);
    return error(res, 'Erro ao validar inscrição.', 500);
  }
};

/** PUT /api/admin/enrollments/:id/assign-center - Atribuir centro */
const assignCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { center_id, offering_id } = req.body;

    if (!center_id && !offering_id) {
      return badRequest(res, 'Informe o centro de formação ou a oferta do centro.');
    }

    let centerId = center_id || null;
    let offeringId = offering_id || null;

    if (offeringId) {
      const [[offering]] = await pool.execute(
        'SELECT id, center_id FROM training_center_courses WHERE id = ? AND status = "ativo"',
        [offeringId]
      );
      if (!offering) {
        return notFound(res, 'Oferta do centro não encontrada.');
      }
      centerId = offering.center_id;
      offeringId = offering.id;
    }

    const [centers] = await pool.execute('SELECT id FROM training_centers WHERE id = ? AND status = "ativo"', [centerId]);
    if (!centers.length) {
      return notFound(res, 'Centro de formação não encontrado.');
    }

    await pool.execute(
      'UPDATE enrollments SET center_id = ?, offering_id = COALESCE(?, offering_id), assigned_by = ?, assigned_at = NOW() WHERE id = ?',
      [centerId, offeringId, req.user.id, id]
    );

    await log(req.user.id, 'ASSIGN_CENTER', 'enrollments', id, { center_id: centerId, offering_id: offeringId }, req);
    return success(res, null, 'Centro atribuído com sucesso.');
  } catch (err) {
    console.error('[ENROLLMENT_ASSIGN_CENTER]', err);
    return error(res, 'Erro ao atribuir centro.', 500);
  }
};

const adminListPayments = async (req, res) => {
  try {
    const status = req.query.status;
    const page = parseInt(req.query.page || req.query.pagina || 1, 10);
    const limit = parseInt(req.query.limit || req.query.limite || 50, 10);
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        p.id,
        p.enrollment_id,
        p.valor,
        p.metodo,
        p.referencia,
        p.status,
        p.created_at,
        p.comprovativo_url,
        u.nome AS nome_utilizador,
        c.nome AS nome_curso
      FROM payments p
      LEFT JOIN enrollments e ON e.id = p.enrollment_id
      LEFT JOIN users u ON u.id = e.student_id
      LEFT JOIN courses c ON c.id = e.course_id
      WHERE 1 = 1
    `;
    const params = [];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);
    return success(res, {
      pagamentos: rows.map((row) => ({
        ...row,
        criado_em: row.created_at,
        data: row.created_at,
      })),
      total: rows.length,
      pagina: page,
      limite: limit,
    });
  } catch (err) {
    console.error('[PAYMENT_ADMIN_LIST]', err);
    return error(res, 'Erro ao listar pagamentos.', 500);
  }
};

const adminValidatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const aprovado = req.body.aprovado === true || req.body.approved === true;
    const motivoRejeicao = req.body.motivo_rejeicao || req.body.motivo || null;

    const [[payment]] = await pool.execute('SELECT enrollment_id FROM payments WHERE id = ?', [id]);
    if (!payment) {
      return notFound(res, 'Pagamento não encontrado.');
    }

    return reviewEnrollment(
      {
        ...req,
        params: { id: payment.enrollment_id },
        body: { aprovado, motivo_rejeicao: motivoRejeicao },
      },
      res
    );
  } catch (err) {
    console.error('[PAYMENT_VALIDATE]', err);
    return error(res, 'Erro ao validar pagamento.', 500);
  }
};

module.exports = {
  createEnrollment,
  getMyEnrollments,
  processPayment,
  downloadReceipt,
  adminListEnrollments,
  viewEnrollmentDocument,
  reviewEnrollment,
  assignCenter,
  adminListPayments,
  adminValidatePayment,
};
