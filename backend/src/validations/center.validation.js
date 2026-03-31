/**
 * Validações para Centros de Formação e Utilizadores Admin
 */
const Joi = require('joi');

const centerSchema = Joi.object({
  nome: Joi.string().min(3).max(200).required().messages({ 'any.required': 'Nome é obrigatório.' }),
  provincia: Joi.string().min(2).max(100).required().messages({ 'any.required': 'Província é obrigatória.' }),
  municipio: Joi.string().min(2).max(100).required().messages({ 'any.required': 'Município é obrigatório.' }),
  endereco: Joi.string().max(500).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
  telefone: Joi.string().pattern(/^\+?[0-9\s\-()]{7,20}$/).optional().allow('', null),
  descricao: Joi.string().max(1000).optional().allow('', null),
  cursos_associados: Joi.array().optional(),
});

const subscriptionSchema = Joi.object({
  company_id: Joi.number().integer().positive().required(),
  plano: Joi.string().valid('mensal','trimestral','anual').required(),
  valor: Joi.number().positive().required(),
  data_inicio: Joi.string().isoDate().required(),
  data_fim: Joi.string().isoDate().required(),
});

const jobSchema = Joi.object({
  titulo: Joi.string().min(3).max(255).required(),
  empresa: Joi.string().max(200).optional().allow('', null),
  descricao: Joi.string().min(10).required(),
  requisitos: Joi.string().optional().allow('', null),
  localizacao: Joi.string().max(200).optional().allow('', null),
  tipo: Joi.string().valid('efetivo','temporario','estagio','freelance').default('efetivo'),
  salario: Joi.string().max(100).optional().allow('', null),
  contacto: Joi.string().max(255).optional().allow('', null),
  expires_at: Joi.string().isoDate().optional().allow('', null),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos.',
      errors: error.details.map(d => d.message),
    });
  }
  next();
};

module.exports = { centerSchema, subscriptionSchema, jobSchema, validate };
