const express = require('express');
const router = express.Router();
const { listProfiles, findByService, listServiceCategories, listJobs, getJob, createJob } = require('../controllers/community.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/profiles', listProfiles);
router.get('/perfis', listProfiles);
router.get('/services', findByService);
router.get('/servicos', findByService);
router.get('/services/categories', listServiceCategories);
router.get('/servicos/categorias', listServiceCategories);
router.get('/jobs', listJobs);
router.get('/vagas', listJobs);
router.get('/jobs/:id', getJob);
router.get('/vagas/:id', getJob);
// Admin
router.post('/admin/jobs', authenticate, authorize('admin','employee'), createJob);
router.post('/admin/vagas', authenticate, authorize('admin','employee'), createJob);
module.exports = router;
