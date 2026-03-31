/**
 * ULEZI XPB — Serviço de Notificações
 * Cria notificações no sistema e envia emails
 */

const { pool } = require('../config/database');

/**
 * Cria uma notificação interna para um utilizador
 */
const createNotification = async (userId, tipo, titulo, mensagem, link = null) => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, tipo, titulo, mensagem, link) VALUES (?,?,?,?,?)',
      [userId, tipo, titulo, mensagem, link]
    );
  } catch (error) {
    console.error('Erro ao criar notificação:', error.message);
  }
};

/**
 * Envia email (stub — em produção usar nodemailer)
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    // Em desenvolvimento, apenas loga o email
    console.log(`📧 Email para ${to}: ${subject}`);
    // Em produção, configurar nodemailer aqui
  } catch (error) {
    console.error('Erro ao enviar email:', error.message);
  }
};

/**
 * Gera link de WhatsApp
 */
const getWhatsAppLink = (phone, message) => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
};

module.exports = { createNotification, sendEmail, getWhatsAppLink };
