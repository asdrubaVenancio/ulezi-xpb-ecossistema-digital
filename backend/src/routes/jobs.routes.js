/**
 * ULEZI XPB — Rotas de Vagas de Emprego
 * Empresas publicam vagas; admins aprovam antes de ficarem visíveis
 */
const express = require('express');
const router  = express.Router();
const {
  listPublicJobs, getPublicJob,
  listMyJobs, createJob, updateJob, deleteJob,
  adminListJobs, approveJob, rejectJob,
} = require('../controllers/jobs.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Rotas empresa
router.get('/minhas/vagas', authenticate, authorize('company'), listMyJobs);
router.post('/',             authenticate, authorize('company'), createJob);
router.put('/:id',           authenticate, authorize('company'), updateJob);
router.delete('/:id',        authenticate, authorize('company'), deleteJob);

// Rotas admin
router.get('/admin/todas',        authenticate, authorize('admin','employee'), adminListJobs);
router.put('/admin/:id/approve',  authenticate, authorize('admin','employee'), approveJob);
router.put('/admin/:id/reject',   authenticate, authorize('admin','employee'), rejectJob);

// Rotas públicas ficam por último para não capturarem caminhos específicos.
router.get('/',    listPublicJobs);
router.get('/:id', getPublicJob);

module.exports = router;
