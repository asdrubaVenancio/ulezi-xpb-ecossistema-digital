/**
 * Rotas de Mediação de Negócios
 * Módulo 7 - Negócios e Investimentos
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  listMediations,
  getMediation,
  createMediation,
  updateMediation,
  completeMediation,
  scheduleMeeting,
  cancelMeeting,
  getMediationStats
} = require('../controllers/mediation.controller');

// Todas as rotas requerem autenticação e permissão de admin ou employee
router.use(authenticate, authorize('admin', 'employee'));

// Listagem e estatísticas
router.get('/', listMediations);
router.get('/stats', getMediationStats);

// Operações individuais
router.get('/:id', getMediation);
router.post('/', createMediation);
router.put('/:id', updateMediation);
router.post('/:id/complete', completeMediation);

// Reuniões
router.post('/:id/meetings', scheduleMeeting);
router.post('/:id/meetings/:meetingId/cancel', cancelMeeting);

module.exports = router;
