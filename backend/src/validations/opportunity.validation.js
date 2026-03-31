const Joi = require('joi');

const opportunitySchema = Joi.object({
  tipo: Joi.string().valid('venda_empresa','participacao','licenciamento','franquia','investimento').required(),
  titulo: Joi.string().min(5).max(255).required(),
  descricao: Joi.string().min(20).required(),
  valor: Joi.number().positive().optional().allow(null),
  moeda: Joi.string().max(10).default('Kz'),
  dados_especificos: Joi.object().optional().allow(null),
  imagem_url: Joi.string().uri().optional().allow('', null),
});

const interestSchema = Joi.object({
  mensagem: Joi.string().max(1000).optional().allow('', null),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ success: false, message: 'Dados inválidos.', errors: error.details.map(d => d.message) });
  }
  next();
};

module.exports = { opportunitySchema, interestSchema, validate };
