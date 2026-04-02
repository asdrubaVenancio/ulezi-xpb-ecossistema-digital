/**
 * Rotas de Gestão de Funcionários
 * Módulo 7 - Negócios e Investimentos
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  listAvailableForMediation,
  getEmployeeStats,
  addResponsibility,
  removeResponsibility
} = require('../controllers/employee.controller');

// Todas as rotas requerem autenticação e permissão de admin ou employee
router.use(authenticate, authorize('admin', 'employee'));

// Listagem e criação
router.get('/', listEmployees);
router.post('/', authorize('admin'), createEmployee);

// Estatísticas
router.get('/stats', getEmployeeStats);
router.get('/available-for-mediation', listAvailableForMediation);

// Operações individuais
router.get('/:id', getEmployee);
router.put('/:id', authorize('admin'), updateEmployee);
router.delete('/:id', authorize('admin'), deactivateEmployee);

// Responsabilidades
router.post('/:id/responsibilities', authorize('admin'), addResponsibility);
router.delete('/:id/responsibilities/:respId', authorize('admin'), removeResponsibility);

module.exports = router;
