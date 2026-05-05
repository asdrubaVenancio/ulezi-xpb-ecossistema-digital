/**
 * Rotas para Ofertas de Cursos em Centros de Formação
 * 
 * Define todos os endpoints relacionados com a gestão de ofertas
 * específicas de cursos, incluindo preços, carga horária e exigências.
 * 
 * @author Asdruba developer
 * @version 1.0.0
 */

const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  // Admin endpoints
  createTrainingOffering,
  listTrainingOfferings,
  getTrainingOffering,
  updateTrainingOffering,
  deleteTrainingOffering,
  
  // Public endpoints
  listPublicTrainingOfferings
} = require('../controllers/training-offering.controller');

const router = express.Router();

// ─── Rotas Públicas ────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/training-offerings
 * @desc    Listar ofertas de cursos disponíveis para alunos
 * @access  Público
 */
router.get('/', listPublicTrainingOfferings);

// ─── Rotas Administrativas ───────────────────────────────────────────────────────────
// Middleware de autenticação e autorização para todas as rotas admin
router.use('/admin', authenticate, authorize(['admin', 'employee']));

/**
 * @route   POST /api/admin/training-offerings
 * @desc    Criar nova oferta de curso
 * @access  Privado (Admin/Employee)
 */
router.post('/admin', createTrainingOffering);

/**
 * @route   GET /api/admin/training-offerings
 * @desc    Listar todas as ofertas de cursos com filtros
 * @access  Privado (Admin/Employee)
 */
router.get('/admin', listTrainingOfferings);

/**
 * @route   GET /api/admin/training-offerings/:id
 * @desc    Obter detalhes completos de uma oferta de curso
 * @access  Privado (Admin/Employee)
 */
router.get('/admin/:id', getTrainingOffering);

/**
 * @route   PUT /api/admin/training-offerings/:id
 * @desc    Atualizar dados de uma oferta de curso
 * @access  Privado (Admin/Employee)
 */
router.put('/admin/:id', updateTrainingOffering);

/**
 * @route   DELETE /api/admin/training-offerings/:id
 * @desc    Desativar oferta de curso
 * @access  Privado (Admin/Employee)
 */
router.delete('/admin/:id', deleteTrainingOffering);

module.exports = router;
