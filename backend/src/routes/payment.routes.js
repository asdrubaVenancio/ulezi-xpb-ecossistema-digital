const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { adminListPayments, adminValidatePayment } = require('../controllers/enrollment.controller');
const { pool } = require('../config/database');
const { success, error, badRequest, notFound } = require('../utils/response');

router.get('/admin', authenticate, authorize('admin', 'employee'), adminListPayments);
router.put('/admin/:id/validar', authenticate, authorize('admin', 'employee'), adminValidatePayment);

// Rotas de pagamento para utilizadores autenticados
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const compDir   = path.join(uploadDir, 'comprovativos');
fs.mkdirSync(compDir, { recursive: true });

const compStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, compDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `comp_${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const uploadComp = multer({
  storage:    compStorage,
  limits:     { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = ['.pdf','.jpg','.jpeg','.png'].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Apenas PDF, JPG e PNG são permitidos.'), ok);
  },
});

// GET /api/pagamentos/meus — pagamentos do utilizador autenticado
router.get('/meus', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, e.numero_inscricao, c.nome as nome_curso
       FROM payments p
       LEFT JOIN enrollments e ON e.id = p.enrollment_id
       LEFT JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    return success(res, { pagamentos: rows });
  } catch (err) {
    return error(res, 'Erro ao listar pagamentos.', 500);
  }
});

// POST /api/pagamentos/comprovativo — enviar comprovativo de pagamento
router.post('/comprovativo', authenticate, uploadComp.single('comprovativo'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      pagamento_id,
      valor_pago,
      data_pagamento,
      referencia_bancaria,
      banco_origem,
    } = req.body;

    if (!pagamento_id) return badRequest(res, 'O pagamento é obrigatório.');
    if (!valor_pago) return badRequest(res, 'O valor pago é obrigatório.');
    if (!data_pagamento) return badRequest(res, 'A data do pagamento é obrigatória.');
    if (!referencia_bancaria) return badRequest(res, 'A referência bancária é obrigatória.');
    if (!banco_origem) return badRequest(res, 'O banco de origem é obrigatório.');
    if (!req.file) return badRequest(res, 'O comprovativo é obrigatório.');

    const [[payment]] = await pool.execute(
      `SELECT p.id, p.enrollment_id, p.status, e.student_id
       FROM payments p
       INNER JOIN enrollments e ON e.id = p.enrollment_id
       WHERE p.id = ?`,
      [pagamento_id]
    );

    if (!payment) return notFound(res, 'Pagamento não encontrado.');
    if (payment.student_id !== studentId) return error(res, 'Acesso negado.', 403);
    if (payment.status === 'confirmado') return badRequest(res, 'Este pagamento já foi confirmado.');

    const comprovativoUrl = `/uploads/comprovativos/${req.file.filename}`;
    const referencia = `${banco_origem} | ${referencia_bancaria} | ${data_pagamento}`;

    await pool.execute(
      `UPDATE payments
       SET valor = ?, metodo = ?, referencia = ?, comprovativo_url = ?, status = 'pendente'
       WHERE id = ?`,
      [valor_pago, banco_origem, referencia, comprovativoUrl, pagamento_id]
    );

    return success(
      res,
      { pagamento_id: Number(pagamento_id), comprovativo_url: comprovativoUrl },
      'Comprovativo enviado com sucesso. Aguarda validação do administrador.'
    );
  } catch (err) {
    return error(res, 'Erro ao enviar comprovativo.', 500);
  }
});

// GET /api/pagamentos/:id/comprovativo — ver comprovativo
router.get('/:id/comprovativo', authenticate, async (req, res) => {
  try {
    const [[pag]] = await pool.execute(
      `SELECT p.*, e.student_id FROM payments p
       LEFT JOIN enrollments e ON e.id = p.enrollment_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!pag) return notFound(res, 'Pagamento não encontrado.');
    // Só o próprio ou admin podem ver
    if (pag.student_id !== req.user.id && !['admin','employee'].includes(req.user.role)) {
      return error(res, 'Acesso negado.', 403);
    }
    return success(res, { comprovativo_url: pag.comprovativo_url, status: pag.status });
  } catch (err) {
    return error(res, 'Erro ao obter comprovativo.', 500);
  }
});

// PUT /api/pagamentos/admin/:id/validar — admin valida pagamento
router.put('/admin/:id/validar', authenticate, authorize('admin','employee'), adminValidatePayment);

module.exports = router;
