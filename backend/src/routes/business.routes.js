/**
 * Rotas de Negócios, Investimentos e Contratos
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadPayment } = require('../middlewares/upload.middleware');
const {
  uploadDocument, getMyCompany, listOpportunities, getOpportunity,
  saveCompanyProfile, createOpportunity, expressInterest, adminListInterests, generateContract,
  downloadContract, signContract, adminListCompanies, approveCompany,
  createSubscription, addCompanyService, listCompanyServices, updateCompanyService, deleteCompanyService,
} = require('../controllers/business.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { requireActiveSubscription, requirePrivilege, requireApprovedCompany } = require('../middlewares/subscription.middleware');
const { validate, opportunitySchema } = require('../validations/opportunity.validation');

// Pasta para documentos de empresas
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const docsDir = path.join(uploadDir, 'documents');
fs.mkdirSync(docsDir, { recursive: true });

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, docsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc_${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const docFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Tipo de ficheiro não permitido. Use PDF, JPG ou PNG.'), false);
};

const uploadDoc = multer({
  storage: docStorage,
  fileFilter: docFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ── Empresa ───────────────────────────────────────────────────────────────────
router.post('/companies/documents', authenticate, authorize('company'), uploadDoc.single('documento'), uploadDocument);
router.get('/companies/my', authenticate, authorize('company'), getMyCompany);
router.post('/companies', authenticate, authorize('company'), saveCompanyProfile);
router.post('/companies/services', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, addCompanyService);
router.get('/companies/services', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, listCompanyServices);
router.put('/companies/services/:id', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, updateCompanyService);
router.delete('/companies/services/:id', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, deleteCompanyService);
router.post('/empresas', authenticate, authorize('company'), saveCompanyProfile);
router.get('/empresas/minha', authenticate, authorize('company'), getMyCompany);
router.post('/empresas/documentos', authenticate, authorize('company'), uploadDoc.single('documento'), uploadDocument);
router.post('/empresas/servicos', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, addCompanyService);
router.get('/empresas/servicos', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, listCompanyServices);
router.put('/empresas/servicos/:id', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, updateCompanyService);
router.delete('/empresas/servicos/:id', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, deleteCompanyService);

// ── Oportunidades ─────────────────────────────────────────────────────────────
router.get('/opportunities', listOpportunities);
router.get('/opportunities/:id', getOpportunity);
router.post('/opportunities', authenticate, authorize('company'), requireActiveSubscription, requirePrivilege('oportunidades'), validate(opportunitySchema), createOpportunity);
router.post('/opportunities/:id/interest', authenticate, authorize('investor'), expressInterest);
router.get('/oportunidades', listOpportunities);
router.get('/oportunidades/:id', getOpportunity);
router.post('/oportunidades', authenticate, authorize('company'), requireActiveSubscription, requirePrivilege('oportunidades'), validate(opportunitySchema), createOpportunity);
router.post('/oportunidades/:id/interesse', authenticate, authorize('investor'), expressInterest);

// ── Contratos ─────────────────────────────────────────────────────────────────
router.get('/contracts/:id/download', authenticate, downloadContract);
router.post('/contracts/:id/sign', authenticate, authorize('company', 'investor'), signContract);
router.get('/contratos/:id/download', authenticate, downloadContract);
router.post('/contratos/:id/sign', authenticate, authorize('company', 'investor'), signContract);

// ── Admin ─────────────────────────────────────────────────────────────────────
const {
  listPackages, getPackage, createPackage, updatePackage, approvePackage, deletePackage
} = require('../controllers/subscription-package.controller');

router.get('/admin/companies', authenticate, authorize('admin', 'employee'), adminListCompanies);
router.put('/admin/companies/:id/approve', authenticate, authorize('admin', 'employee'), approveCompany);
router.post('/admin/subscriptions', authenticate, authorize('admin', 'employee'), createSubscription);
router.get('/admin/interests', authenticate, authorize('admin', 'employee'), adminListInterests);
router.post('/admin/interests/:id/contract', authenticate, authorize('admin', 'employee'), generateContract);
router.get('/admin/empresas', authenticate, authorize('admin', 'employee'), adminListCompanies);
router.put('/admin/empresas/:id/aprovar', authenticate, authorize('admin', 'employee'), approveCompany);
router.post('/admin/assinaturas', authenticate, authorize('admin', 'employee'), createSubscription);
router.get('/admin/investimentos', authenticate, authorize('admin', 'employee'), adminListInterests);
router.post('/admin/investimentos/:id/contrato', authenticate, authorize('admin', 'employee'), generateContract);

// Rotas de gestão de pacotes de assinatura
router.get('/admin/subscription-packages', authenticate, authorize('admin', 'employee'), listPackages);
router.post('/admin/subscription-packages', authenticate, authorize('admin', 'employee'), createPackage);
router.get('/admin/subscription-packages/:id', authenticate, authorize('admin', 'employee'), getPackage);
router.put('/admin/subscription-packages/:id', authenticate, authorize('admin', 'employee'), updatePackage);
router.put('/admin/subscription-packages/:id/approve', authenticate, authorize('admin'), approvePackage);
router.delete('/admin/subscription-packages/:id', authenticate, authorize('admin'), deletePackage);

module.exports = router;

// ── Dashboard empresa (/api/empresa/*) ────────────────────────────────────────
const {
  getEmpresaPerfil, getEmpresaStats, getEmpresaOportunidades,
  getEmpresaDocumentos, getEmpresaAssinatura, getEmpresaContratos, getEmpresaOpportunityInterests,
} = require('../controllers/business.controller');
const {
  listActivePackages
} = require('../controllers/subscription-package.controller');
const {
  getMySubscription, subscribe, renewSubscription, getSubscriptionHistory,
  listAdminSubscriptions, approveSubscription, rejectSubscription, deleteSubscription, subscribeWithProof, viewSubscriptionProof,
} = require('../controllers/company-subscription.controller');

// Rotas públicas (perfil pode ser atualizado sem assinatura)
router.get('/empresa/perfil',        authenticate, authorize('company'), getEmpresaPerfil);
router.get('/empresa/stats',         authenticate, authorize('company'), requireActiveSubscription, getEmpresaStats);
router.get('/empresa/oportunidades', authenticate, authorize('company'), requireActiveSubscription, getEmpresaOportunidades);
router.get('/empresa/oportunidades/:id/interessados', authenticate, authorize('company'), requireActiveSubscription, getEmpresaOpportunityInterests);
router.get('/empresa/servicos', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, listCompanyServices);
router.put('/empresa/servicos/:id', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, updateCompanyService);
router.delete('/empresa/servicos/:id', authenticate, authorize('company'), requireActiveSubscription, requireApprovedCompany, deleteCompanyService);
router.get('/empresa/contratos',     authenticate, authorize('company'), getEmpresaContratos);
router.get('/empresa/documentos',    authenticate, authorize('company'), getEmpresaDocumentos);
router.post('/empresa/documentos',   authenticate, authorize('company'), uploadDoc.single('documento'), uploadDocument);
router.get('/empresa/assinatura',    authenticate, authorize('company'), getEmpresaAssinatura);

// Rotas de assinatura (acessíveis sem assinatura ativa)
router.get('/empresa/minha-assinatura', authenticate, authorize('company'), getMySubscription);
router.get('/empresa/historico-assinaturas', authenticate, authorize('company'), getSubscriptionHistory);
router.get('/subscription-packages', authenticate, authorize('company', 'investor'), listActivePackages);
router.post('/empresa/assinar', authenticate, authorize('company'), subscribe);
router.post('/empresa/assinar-com-comprovativo', authenticate, authorize('company'), uploadPayment.single('comprovativo'), subscribeWithProof);
router.post('/empresa/renovar', authenticate, authorize('company'), renewSubscription);

// Gestão administrativa de assinaturas empresariais
router.get('/admin/company-subscriptions', authenticate, authorize('admin', 'employee'), listAdminSubscriptions);
router.get('/admin/company-subscriptions/:id/proof', authenticate, authorize('admin', 'employee'), viewSubscriptionProof);
router.put('/admin/company-subscriptions/:id/approve', authenticate, authorize('admin', 'employee'), approveSubscription);
router.put('/admin/company-subscriptions/:id/reject', authenticate, authorize('admin', 'employee'), rejectSubscription);
router.delete('/admin/company-subscriptions/:id', authenticate, authorize('admin'), deleteSubscription);

// ── Dashboard investidor (/api/investidor/*) ──────────────────────────────────
const {
  getInvestidorInteresses, getInvestidorContratos,
  getInvestidorPerfil, updateInvestidorPerfil, cancelarInteresse,
} = require('../controllers/business.controller');

router.get('/investidor/interesses',       authenticate, authorize('investor'), getInvestidorInteresses);
router.get('/investidor/contratos',        authenticate, authorize('investor'), getInvestidorContratos);
router.get('/investidor/perfil',           authenticate, authorize('investor'), getInvestidorPerfil);
router.put('/investidor/perfil',           authenticate, authorize('investor'), updateInvestidorPerfil);
router.delete('/investidor/interesses/:id', authenticate, authorize('investor'), cancelarInteresse);
