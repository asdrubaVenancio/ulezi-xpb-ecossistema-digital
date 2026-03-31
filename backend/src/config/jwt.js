/**
 * Configuração JWT - JSON Web Tokens
 */
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'ulezi_xpb_secret';
const EXPIRES_IN = process.env.JWT_EXPIRES || process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${SECRET}_refresh`;
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES || '7d';

/**
 * Gera um token JWT para o utilizador
 */
const generateToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
};

/**
 * Gera refresh token com segredo e expiração próprios.
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};

/**
 * Verifica e decodifica um token JWT
 */
const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

/**
 * Verifica refresh token.
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
};
