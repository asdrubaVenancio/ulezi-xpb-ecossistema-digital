/**
 * Rotas de Notificações de Assinatura (Admin)
 * Módulo 7 - Negócios e Investimentos
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  listNotifications,
  runExpirationCheck,
  runAutoRenewals,
  getNotificationStats,
  getNotification,
  resendNotification,
  getPendingExpirations
} = require('../controllers/subscription-notification.controller');

// Todas as rotas requerem autenticação e permissão de admin
router.use(authenticate, authorize('admin'));

// Listagem e estatísticas
router.get('/', listNotifications);
router.get('/stats', getNotificationStats);
router.get('/pending-expirations', getPendingExpirations);

// Operações manuais
router.post('/check', runExpirationCheck);
router.post('/auto-renew', runAutoRenewals);

// Operações individuais
router.get('/:id', getNotification);
router.post('/:id/resend', resendNotification);

module.exports = router;
