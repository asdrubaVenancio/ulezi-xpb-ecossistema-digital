/**
 * Rotas de inscrições do módulo de formação.
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  createEnrollment,
  getMyEnrollments,
  processPayment,
  downloadReceipt,
  adminListEnrollments,
  viewEnrollmentDocument,
  reviewEnrollment,
  assignCenter,
  substituirDocumentos,
} = require('../controllers/enrollment.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate, enrollmentSchema } = require('../validations/enrollment.validation');

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const enrollmentsDir = path.join(uploadDir, 'inscricoes');
fs.mkdirSync(enrollmentsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, enrollmentsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `inscricao_${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const permitidos = ['.pdf', '.jpg', '.jpeg', '.png'];
  if (!permitidos.includes(ext)) {
    return cb(new Error('Tipo de ficheiro não permitido. Use PDF, JPG ou PNG.'), false);
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadInscricao = upload.fields([
  { name: 'comprovativo_pagamento', maxCount: 1 },
  { name: 'documento_requisito', maxCount: 1 },
]);

router.post('/', authenticate, authorize('student'), uploadInscricao, validate(enrollmentSchema), createEnrollment);
router.get('/minhas', authenticate, authorize('student'), getMyEnrollments);
router.get('/me', authenticate, authorize('student'), getMyEnrollments);
router.post('/:id/payment', authenticate, authorize('student'), uploadInscricao, processPayment);
router.get('/:id/receipt', authenticate, downloadReceipt);
router.put('/:id/documentos', authenticate, authorize('student'), upload.fields([
  { name: 'comprovativo', maxCount: 1 },
  { name: 'documento_requisito', maxCount: 1 }
]), substituirDocumentos);

router.delete('/:id', authenticate, authorize('student'), async (req, res) => {
  const { pool } = require('../config/database');
  const { success, error, notFound } = require('../utils/response');

  try {
    const { id } = req.params;
    const [[enrollment]] = await pool.execute(
      'SELECT id, student_id, status, payment_status FROM enrollments WHERE id = ?',
      [id]
    );

    if (!enrollment) {
      return notFound(res, 'Inscrição não encontrada.');
    }
    if (enrollment.student_id !== req.user.id) {
      return error(res, 'Acesso negado.', 403);
    }
    if (enrollment.payment_status === 'pago') {
      return error(res, 'Não é possível cancelar uma inscrição já aprovada.', 422);
    }

    await pool.execute('UPDATE enrollments SET status = "cancelada" WHERE id = ?', [id]);
    return success(res, {}, 'Inscrição cancelada com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao cancelar inscrição.', 500);
  }
});

router.post('/:id/avaliar', authenticate, authorize('student'), async (req, res) => {
  const { pool } = require('../config/database');
  const { success, error, notFound } = require('../utils/response');

  try {
    const { id } = req.params;
    const { nota, comentario } = req.body;

    if (!nota || nota < 1 || nota > 5) {
      return error(res, 'Nota deve ser entre 1 e 5.', 422);
    }

    const [[enrollment]] = await pool.execute(
      'SELECT id, student_id, course_id, status FROM enrollments WHERE id = ?',
      [id]
    );

    if (!enrollment) {
      return notFound(res, 'Inscrição não encontrada.');
    }
    if (enrollment.student_id !== req.user.id) {
      return error(res, 'Acesso negado.', 403);
    }
    if (enrollment.status !== 'concluida') {
      return error(res, 'Só pode avaliar cursos concluídos.', 422);
    }

    await pool.execute(
      `
      INSERT INTO course_reviews (enrollment_id, student_id, course_id, nota, comentario)
      VALUES (?,?,?,?,?)
      ON DUPLICATE KEY UPDATE nota = VALUES(nota), comentario = VALUES(comentario)
      `,
      [id, req.user.id, enrollment.course_id, nota, comentario]
    );

    return success(res, {}, 'Avaliação registada com sucesso. Obrigado!');
  } catch (err) {
    return error(res, 'Erro ao registar avaliação.', 500);
  }
});

router.get('/admin/all', authenticate, authorize('admin', 'employee'), adminListEnrollments);
router.get('/admin/:id/documento', authenticate, authorize('admin', 'employee'), viewEnrollmentDocument);
router.put('/admin/:id/review', authenticate, authorize('admin', 'employee'), reviewEnrollment);
router.put('/admin/:id/assign-center', authenticate, authorize('admin', 'employee'), assignCenter);

module.exports = router;
