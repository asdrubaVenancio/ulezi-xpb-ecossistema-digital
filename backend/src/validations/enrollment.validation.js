const Joi = require('joi');

const enrollmentSchema = Joi.object({
  course_id: Joi.number().integer().positive().optional().allow(null),
  offering_id: Joi.number().integer().positive().optional().allow(null),
  center_id: Joi.number().integer().positive().optional().allow(null),
  municipio_aluno: Joi.string().max(100).optional().allow('', null),
  provincia_aluno: Joi.string().max(100).optional().allow('', null),
  observacoes: Joi.string().max(500).optional().allow('', null),
  referencia_bancaria: Joi.string().max(150).optional().allow('', null),
  banco_origem: Joi.string().max(150).optional().allow('', null),
  data_pagamento: Joi.date().iso().optional().allow('', null),
  valor_pago: Joi.number().positive().optional().allow(null),
});

const paymentSchema = Joi.object({
  metodo: Joi.string().valid('transferencia', 'referencia', 'multibanco', 'dinheiro', 'outro').required(),
  referencia: Joi.string().max(100).optional().allow('', null),
  valor: Joi.number().positive().required(),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos.',
      errors: error.details.map((detail) => detail.message),
    });
  }

  if (!req.body.course_id && !req.body.offering_id) {
    return res.status(400).json({
      success: false,
      message: 'Informe o curso ou a oferta do centro.',
      errors: ['Informe o curso ou a oferta do centro.'],
    });
  }

  next();
};

module.exports = { enrollmentSchema, paymentSchema, validate };
