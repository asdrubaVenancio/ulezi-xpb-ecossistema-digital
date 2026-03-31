const success = (res, data = null, message = 'Operacao realizada com sucesso.', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    sucesso: true,
    message,
    mensagem: message,
    data,
    dados: data,
  });
};

const created = (res, data = null, message = 'Recurso criado com sucesso.') => {
  return res.status(201).json({
    success: true,
    sucesso: true,
    message,
    mensagem: message,
    data,
    dados: data,
  });
};

const error = (res, message = 'Erro interno.', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    sucesso: false,
    message,
    mensagem: message,
    ...(errors && { errors, erros: errors }),
  });
};

const notFound = (res, message = 'Recurso nao encontrado.') => {
  return res.status(404).json({
    success: false,
    sucesso: false,
    message,
    mensagem: message,
  });
};

const badRequest = (res, message = 'Dados invalidos.', errors = null) => {
  return res.status(400).json({
    success: false,
    sucesso: false,
    message,
    mensagem: message,
    ...(errors && { errors, erros: errors }),
  });
};

module.exports = { success, created, error, notFound, badRequest };
