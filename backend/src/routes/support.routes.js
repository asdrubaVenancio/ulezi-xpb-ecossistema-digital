/**
 * Rotas de Suporte (Tickets)
 * Módulo 7 - Negócios e Investimentos
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  listUserTickets,
  listAllTickets,
  getTicket,
  createTicket,
  addMessage,
  assignTicket,
  updateStatus,
  updatePriority,
  getTicketStats
} = require('../controllers/support.controller');

// Rotas públicas (usuários logados)
router.use(authenticate);

router.get('/tickets', listUserTickets);
router.get('/tickets/:id', getTicket);
router.post('/tickets', createTicket);
router.post('/tickets/:id/messages', addMessage);

// Rotas administrativas
router.get('/admin/tickets', authorize('admin', 'employee'), listAllTickets);
router.get('/admin/tickets/stats', authorize('admin', 'employee'), getTicketStats);
router.put('/admin/tickets/:id/assign', authorize('admin', 'employee'), assignTicket);
router.put('/admin/tickets/:id/status', authorize('admin', 'employee'), updateStatus);
router.put('/admin/tickets/:id/priority', authorize('admin', 'employee'), updatePriority);

module.exports = router;
