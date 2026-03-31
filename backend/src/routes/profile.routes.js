/**
 * Rotas para Perfis de Usuários
 * 
 * Define todos os endpoints relacionados com a gestão e visualização
 * de perfis detalhados para alunos, empresas e investidores.
 * 
 * @author ULEZI XPB Team
 * @version 2.0.0
 */

const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  getMyProfile,
  updateMyProfile
} = require('../controllers/profile.controller');

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticate);

/**
 * @route   GET /api/profile/me
 * @desc    Obter perfil completo do usuário autenticado
 * @access  Privado (Autenticado)
 * 
 * Retorna informações detalhadas do perfil baseado no tipo de usuário:
 * - Aluno: dados pessoais, estatísticas de formação, inscrições recentes
 * - Empresa: dados empresariais, estatísticas de vagas, oportunidades
 * - Investidor: dados de investimento, estatísticas, portfólio
 * - Admin: estatísticas do sistema, atividades recentes
 */
router.get('/me', getMyProfile);

/**
 * @route   PUT /api/profile/me
 * @desc    Atualizar perfil do usuário autenticado
 * @access  Privado (Autenticado)
 * 
 * Permite atualizar informações do perfil baseado no tipo de usuário.
 * Campos permitidos variam conforme o papel:
 * - Aluno: biografia, interesses, habilidades, formação, experiência
 * - Empresa: descrição, missão, visão, valores, serviços, certificações
 * - Investidor: biografia, preferências, experiência, objetivos
 * - Todos: nome, telefone (dados básicos do usuário)
 */
router.put('/me', updateMyProfile);

module.exports = router;
