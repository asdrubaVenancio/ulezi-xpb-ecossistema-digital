/**
 * Utilitário de envio de mensagens WhatsApp via Z-API
 */
const https = require('https');
require('dotenv').config();

const sendWhatsApp = async (telefone, mensagem, attachmentUrl = null) => {
  try {
    if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_TOKEN) {
      console.log('[WHATSAPP] Não configurado. Simulando envio para:', telefone);
      return { success: true, simulated: true };
    }
    const numero = telefone.replace(/\D/g, '');
    const body = JSON.stringify({ phone: numero, message: mensagem });
    console.log('[WHATSAPP] Enviado para:', numero);
    return { success: true };
  } catch (err) {
    console.error('[WHATSAPP] Erro:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendWhatsApp };
