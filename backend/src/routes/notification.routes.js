const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/auth.middleware');
const {
  listMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  countUnreadNotifications,
} = require('../controllers/notification.controller');

router.use(authenticate);

router.get('/', listMyNotifications);
router.get('/contagem-nao-lidas', countUnreadNotifications);
router.put('/marcar-todas', markAllMyNotificationsRead);
router.put('/:id/lida', markMyNotificationRead);
router.put('/:id/read', markMyNotificationRead);

module.exports = router;
