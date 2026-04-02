/**
 * Rotas de Visitas de Verificação Física
 * Módulo 7 - Negócios e Investimentos
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  listVisits,
  getVisit,
  scheduleVisit,
  updateVisit,
  completeVisit,
  cancelVisit,
  getVisitCalendar,
  getVisitStats
} = require('../controllers/visit.controller');

// Todas as rotas requerem autenticação e permissão de admin ou employee
router.use(authenticate, authorize('admin', 'employee'));

// Listagem e estatísticas
router.get('/', listVisits);
router.get('/stats', getVisitStats);
router.get('/calendar/:month', getVisitCalendar);

// Operações individuais
router.get('/:id', getVisit);
router.post('/', scheduleVisit);
router.put('/:id', updateVisit);
router.post('/:id/complete', completeVisit);
router.delete('/:id', cancelVisit);

module.exports = router;
