/**
 * Rotas de Consultoria
 * Módulo 7 - Negócios e Investimentos
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  listUserConsultations,
  listAllConsultations,
  getConsultation,
  createConsultation,
  scheduleConsultation,
  confirmConsultation,
  completeConsultation,
  cancelConsultation,
  getAvailableSlots,
  getConsultationStats
} = require('../controllers/consultation.controller');

// Rotas públicas (usuários logados)
router.use(authenticate);

router.get('/', listUserConsultations);
router.get('/:id', getConsultation);
router.post('/', createConsultation);
router.post('/:id/confirm', confirmConsultation);
router.put('/:id/cancel', cancelConsultation);

// Rotas administrativas
router.get('/admin/all', authorize('admin', 'employee'), listAllConsultations);
router.get('/admin/stats', authorize('admin', 'employee'), getConsultationStats);
router.get('/admin/available-slots', authorize('admin', 'employee'), getAvailableSlots);
router.put('/admin/:id/schedule', authorize('admin', 'employee'), scheduleConsultation);
router.post('/admin/:id/complete', authorize('admin', 'employee'), completeConsultation);

module.exports = router;
