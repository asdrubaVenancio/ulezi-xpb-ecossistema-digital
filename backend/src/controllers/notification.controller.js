/**
 * Controller de Notificações do Utilizador
 * Permite listar e marcar notificações como lidas fora do painel admin.
 */
const { pool } = require('../config/database');
const { success, error } = require('../utils/response');

const listMyNotifications = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, tipo, titulo, mensagem, link, lida, lida_at, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );

    return success(res, {
      notificacoes: rows,
      nao_lidas: rows.filter((item) => !item.lida).length,
    });
  } catch (err) {
    return error(res, 'Erro ao listar notificações.', 500);
  }
};

const markMyNotificationRead = async (req, res) => {
  try {
    await pool.execute(
      `UPDATE notifications
       SET lida = 1, lida_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    return success(res, {}, 'Notificação marcada como lida.');
  } catch (err) {
    return error(res, 'Erro ao actualizar notificação.', 500);
  }
};

const markAllMyNotificationsRead = async (req, res) => {
  try {
    await pool.execute(
      `UPDATE notifications
       SET lida = 1, lida_at = COALESCE(lida_at, NOW())
       WHERE user_id = ? AND (lida IS NULL OR lida = 0)`,
      [req.user.id]
    );

    return success(res, {}, 'Todas as notificações foram marcadas como lidas.');
  } catch (err) {
    return error(res, 'Erro ao actualizar notificações.', 500);
  }
};

module.exports = {
  listMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
};
