/**
 * Rotas para Centros de Formação Profissional
 * 
 * Define todos os endpoints relacionados com a gestão de centros
 * de formação, incluindo CRUD, associações e consultas públicas.
 * 
 * @author ULEZI XPB Team
 * @version 1.0.0
 */

const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../validations/center.validation');
const {
  // Admin endpoints
  createTrainingCenter,
  listTrainingCenters,
  getTrainingCenter,
  updateTrainingCenter,
  deleteTrainingCenter,
  associateCourses,
  removeCourseAssociation,
  
  // Public endpoints
  listPublicTrainingCenters
} = require('../controllers/training-center.controller');

const router = express.Router();

// ─── Rotas Públicas ────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/training-centers
 * @desc    Listar centros de formação disponíveis para alunos
 * @access  Público
 */
router.get('/', listPublicTrainingCenters);

// ─── Rotas Administrativas ───────────────────────────────────────────────────────────
// Middleware de autenticação e autorização para todas as rotas admin
router.use('/admin', authenticate, authorize(['admin', 'employee']));

/**
 * @route   POST /api/admin/training-centers
 * @desc    Criar novo centro de formação
 * @access  Privado (Admin/Employee)
 */
router.post('/admin', validate(require('../validations/center.validation').centerSchema), createTrainingCenter);

/**
 * @route   GET /api/admin/training-centers
 * @desc    Listar todos os centros de formação com filtros
 * @access  Privado (Admin/Employee)
 */
router.get('/admin', listTrainingCenters);

/**
 * @route   GET /api/admin/training-centers/:id
 * @desc    Obter detalhes completos de um centro de formação
 * @access  Privado (Admin/Employee)
 */
router.get('/admin/:id', getTrainingCenter);

/**
 * @route   PUT /api/admin/training-centers/:id
 * @desc    Atualizar dados de um centro de formação
 * @access  Privado (Admin/Employee)
 */
router.put('/admin/:id', validate(require('../validations/center.validation').centerSchema), updateTrainingCenter);

/**
 * @route   DELETE /api/admin/training-centers/:id
 * @desc    Excluir (soft delete) um centro de formação
 * @access  Privado (Admin/Employee)
 */
router.delete('/admin/:id', deleteTrainingCenter);

/**
 * @route   POST /api/admin/training-centers/:id/courses
 * @desc    Associar múltiplos cursos a um centro de formação
 * @access  Privado (Admin/Employee)
 */
router.post('/admin/:id/courses', associateCourses);

/**
 * @route   DELETE /api/admin/training-centers/:id/courses/:courseId
 * @desc    Remover associação de um curso com um centro
 * @access  Privado (Admin/Employee)
 */
router.delete('/admin/:id/courses/:courseId', removeCourseAssociation);

module.exports = router;
