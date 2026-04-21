/**
 * Validacoes de Autenticacao com Joi
 */
const Joi = require('joi');

const registerSchema = Joi.object({
  nome: Joi.string().min(3).max(120).required().messages({
    'string.min': 'O nome deve ter pelo menos 3 caracteres.',
    'string.max': 'O nome nao pode ter mais de 120 caracteres.',
    'any.required': 'O nome e obrigatorio.',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Introduza um email valido.',
    'any.required': 'O email e obrigatorio.',
  }),
  telefone: Joi.string().pattern(/^\+?[0-9\s\-()]{7,20}$/).optional().messages({
    'string.pattern.base': 'Introduza um numero de telefone valido.',
  }),
  password: Joi.string().min(8).max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required().messages({
      'string.min': 'A palavra-passe deve ter pelo menos 8 caracteres.',
      'string.pattern.base': 'A palavra-passe deve ter letras maiusculas, minusculas e numeros.',
      'any.required': 'A palavra-passe e obrigatoria.',
    }),
  role: Joi.string()
    .valid('student', 'company', 'investor', 'estudante', 'empresa', 'investidor')
    .required()
    .messages({
      'any.only': 'O tipo de utilizador deve ser: student/company/investor ou estudante/empresa/investidor.',
      'any.required': 'O tipo de utilizador e obrigatorio.',
    }),
  // Campo opcional para empresas
  nome_empresa: Joi.string().min(2).max(200).optional().allow('', null),
  nomeEmpresa:  Joi.string().min(2).max(200).optional().allow('', null),
  provincia: Joi.string().max(100).optional().allow('', null),
  municipio: Joi.string().max(100).optional().allow('', null),
  areas_interesse: Joi.string().max(1000).optional().allow('', null),
  descricao: Joi.string().max(3000).optional().allow('', null),
  sector: Joi.string().max(100).optional().allow('', null),
  nif: Joi.string().max(50).optional().allow('', null),
  tipo_empresa: Joi.string().valid('empresa', 'consultoria').optional().allow('', null),
  is_public: Joi.boolean().optional(),
}).custom((value, helpers) => {
  if ((value.role === 'company' || value.role === 'empresa') && !(value.nome_empresa || value.nomeEmpresa)) {
    return helpers.message('O nome da empresa e obrigatorio para contas empresariais.');
  }
  return value;
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Introduza um email valido.',
    'any.required': 'O email e obrigatorio.',
  }),
  password: Joi.string().required().messages({
    'any.required': 'A palavra-passe e obrigatoria.',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  confirmar_password: Joi.string().optional().allow('', null),
  confirmar: Joi.string().optional().allow('', null),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dados invalidos.',
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, validate };
