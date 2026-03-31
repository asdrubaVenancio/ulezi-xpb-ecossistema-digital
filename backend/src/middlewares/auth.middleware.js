/**
 * Middleware de Autenticação JWT
 * Verifica se o token é válido e injeta os dados do utilizador no request
 */
const { verifyToken } = require('../config/jwt');
const { pool } = require('../config/database');

/**
 * Verifica se o utilizador está autenticado
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token de acesso não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verifica se o utilizador ainda existe e está ativo
    const [rows] = await pool.execute(
      'SELECT id, nome, email, role, status FROM users WHERE id = ? AND status = "ativo"',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Utilizador não encontrado ou inativo.' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado. Faça login novamente.' });
    }
    return res.status(401).json({ success: false, message: 'Token inválido.' });
  }
};

/**
 * Verifica se o utilizador tem um dos papéis permitidos
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Achatando array se for passado como array aninhado
    const allowedRoles = roles.flat();
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Não tem permissão para esta ação.'
      });
    }
    next();
  };
};

/**
 * Middleware opcional de autenticação (não bloqueia se não houver token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const [rows] = await pool.execute(
      'SELECT id, nome, email, role, status FROM users WHERE id = ? AND status = "ativo"',
      [decoded.id]
    );
    req.user = rows.length > 0 ? rows[0] : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { authenticate, authorize, optionalAuth };
