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
  listActiveConsultancies,
  listProviderConsultations,
  getConsultation,
  createConsultation,
  scheduleConsultation,
  rescheduleConsultation,
  confirmConsultation,
  completeConsultation,
  cancelConsultation,
  getAvailableSlots,
  getConsultationStats,
  getProviderAvailability,
  getConsultancyAvailability,
  saveProviderAvailability,
  getCreditSummary,
  requestRecharge,
  listRechargeRequests,
  approveRechargeRequest,
  rejectRechargeRequest,
} = require('../controllers/consultation-v2.controller');

// Rotas públicas (usuários logados)
router.use(authenticate);

router.get('/consultancies', listActiveConsultancies);
router.get('/provider/requests', authorize('company'), listProviderConsultations);
router.get('/provider/availability', authorize('company'), getProviderAvailability);
router.put('/provider/availability', authorize('company'), saveProviderAvailability);
router.get('/available-slots', authorize('company', 'investor', 'admin', 'employee'), getAvailableSlots);
router.get('/credits/me', authorize('company', 'investor'), getCreditSummary);
router.post('/credits/recharges', authorize('company', 'investor'), requestRecharge);
router.get('/:consultancyId/availability', authorize('company', 'investor', 'admin', 'employee'), getConsultancyAvailability);

// Rotas administrativas
router.get('/admin/all', authorize('admin', 'employee'), listAllConsultations);
router.get('/admin/stats', authorize('admin', 'employee'), getConsultationStats);
router.get('/admin/available-slots', authorize('admin', 'employee'), getAvailableSlots);
router.get('/admin/recharges', authorize('admin', 'employee'), listRechargeRequests);
router.put('/admin/recharges/:id/approve', authorize('admin', 'employee'), approveRechargeRequest);
router.put('/admin/recharges/:id/reject', authorize('admin', 'employee'), rejectRechargeRequest);
router.put('/admin/:id/schedule', authorize('admin', 'employee'), scheduleConsultation);
router.post('/admin/:id/complete', authorize('admin', 'employee'), completeConsultation);

router.get('/', listUserConsultations);
router.post('/', createConsultation);
router.post('/:id/confirm', confirmConsultation);
router.put('/:id/reschedule', authorize('company', 'investor', 'admin', 'employee'), rescheduleConsultation);
router.put('/:id/cancel', cancelConsultation);
router.get('/:id', getConsultation);

module.exports = router;
