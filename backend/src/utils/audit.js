/**
 * Utilitário de Auditoria - Regista todas as ações críticas
 */
const { pool } = require('../config/database');

const log = async (userId, acao, entidade = null, entidadeId = null, dados = null, req = null) => {
  try {
    await pool.execute(
      'INSERT INTO audit_logs (user_id, acao, entidade, entidade_id, dados, ip, user_agent) VALUES (?,?,?,?,?,?,?)',
      [
        userId || null,
        acao,
        entidade || null,
        entidadeId || null,
        dados ? JSON.stringify(dados) : null,
        req?.ip || null,
        req?.headers?.['user-agent']?.substring(0, 255) || null,
      ]
    );
  } catch (err) {
    console.error('[AUDIT] Erro ao registar log:', err.message);
  }
};

module.exports = { log };
