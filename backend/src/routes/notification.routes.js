const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/auth.middleware');
const {
  listMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
} = require('../controllers/notification.controller');

router.use(authenticate);

router.get('/', listMyNotifications);
router.put('/marcar-todas', markAllMyNotificationsRead);
router.put('/:id/lida', markMyNotificationRead);
router.put('/:id/read', markMyNotificationRead);

module.exports = router;
