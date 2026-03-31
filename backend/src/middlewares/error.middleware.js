/**
 * Middleware Global de Tratamento de Erros
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERRO] ${new Date().toISOString()} - ${err.message}`);
  console.error(err.stack);

  // Erro de validação do MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Registo duplicado. Este email ou NIF já existe no sistema.'
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token inválido.' });
  }

  // Erro de validação Joi
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos.',
      errors: err.details.map(d => d.message)
    });
  }

  // Erro genérico
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erro interno do servidor.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para rotas não encontradas
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.originalUrl} não encontrada.`
  });
};

module.exports = { errorHandler, notFound };
