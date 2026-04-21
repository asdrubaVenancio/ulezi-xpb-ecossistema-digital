/**
 * ULEZI XPB - Rotas do painel administrativo
 * Mantidas em monólito modular com aliases em português e inglês.
 */
const express = require("express");
const router = express.Router();

const {
  getDashboard,
  listUsers,
  updateUserStatus,
  listTrainingCenters,
  createTrainingCenter,
  assignCourseToCenter,
  updateTrainingCenterV2,
  deleteTrainingCenterV2,
  saveCenterCourseOffering,
  listCenterCourseOfferings,
  updateCenterCourseOffering,
  deleteCenterCourseOffering,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAuditLogs,
  listAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  listAdminOpportunities,
  listAdminCompanies,
  getAdminCompany,
  viewCompanyDocument,
  approveCompany,
  rejectCompany,
  createSubscription,
  listAdminContracts,
  listAdminPayments,
  confirmPayment,
  listCompanyJobsAdmin,
  approveCompanyJob,
  rejectCompanyJob,
  getSettings,
  updateSettings,
  listSystemFiles,
  generateSystemList,
} = require("../controllers/admin.controller");

const {
  adminListEnrollments,
  assignCenter,
  viewEnrollmentDocument,
  reviewEnrollment,
} = require("../controllers/enrollment.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

router.use(authenticate, authorize("admin", "employee"));

router.get("/dashboard", getDashboard);
router.get("/stats", getDashboard);

router.get("/users", listUsers);
router.get("/utilizadores", listUsers);
router.put("/users/:id/status", authorize("admin"), updateUserStatus);
router.put("/utilizadores/:id/status", authorize("admin"), updateUserStatus);

router.get("/training-centers", listTrainingCenters);
router.get("/centros", listTrainingCenters);
router.post("/training-centers", createTrainingCenter);
router.post("/centros", createTrainingCenter);
router.put("/training-centers/:id", updateTrainingCenterV2);
router.put("/centros/:id", updateTrainingCenterV2);
router.delete(
  "/training-centers/:id",
  authorize("admin"),
  deleteTrainingCenterV2,
);
router.delete("/centros/:id", authorize("admin"), deleteTrainingCenterV2);
router.get("/training-centers/:id/courses", listCenterCourseOfferings);
router.get("/centros/:id/cursos", listCenterCourseOfferings);
router.post("/training-centers/:id/courses", saveCenterCourseOffering);
router.post("/centros/:id/cursos", saveCenterCourseOffering);
router.put(
  "/training-centers/:centerId/courses/:offeringId",
  updateCenterCourseOffering,
);
router.put("/centros/:centerId/cursos/:offeringId", updateCenterCourseOffering);
router.delete(
  "/training-centers/:centerId/courses/:offeringId",
  deleteCenterCourseOffering,
);
router.delete(
  "/centros/:centerId/cursos/:offeringId",
  deleteCenterCourseOffering,
);

router.get("/courses", listAdminCourses);
router.get("/cursos", listAdminCourses);
router.post("/courses", createAdminCourse);
router.post("/cursos", createAdminCourse);
router.put("/courses/:id", updateAdminCourse);
router.put("/cursos/:id", updateAdminCourse);

router.get("/empresas", listAdminCompanies);
router.get("/empresas/documentos/:documentId/visualizar", viewCompanyDocument);
router.get("/empresas/:id", getAdminCompany);
router.put("/empresas/:id/aprovar", authorize("admin"), approveCompany);
router.put("/empresas/:id/rejeitar", authorize("admin"), rejectCompany);
router.post("/empresas/:id/assinatura", authorize("admin"), createSubscription);

router.get("/opportunities", listAdminOpportunities);
router.get("/oportunidades", listAdminOpportunities);

router.get("/contratos", listAdminContracts);
router.get("/contracts", listAdminContracts);

router.get("/pagamentos", listAdminPayments);
router.get("/payments", listAdminPayments);
router.put("/pagamentos/:id/confirmar", authorize("admin"), confirmPayment);
router.put("/payments/:id/confirm", authorize("admin"), confirmPayment);

router.get("/inscricoes", adminListEnrollments);
router.get("/enrollments", adminListEnrollments);
router.put("/inscricoes/:id/centro", assignCenter);
router.put("/enrollments/:id/assign-center", assignCenter);
router.get("/inscricoes/:id/documento", viewEnrollmentDocument);
router.get("/enrollments/:id/document", viewEnrollmentDocument);
router.put("/inscricoes/:id/revisao", reviewEnrollment);
router.put("/enrollments/:id/review", reviewEnrollment);

router.get("/vagas-empresa", listCompanyJobsAdmin);
router.put("/vagas-empresa/:id/aprovar", approveCompanyJob);
router.put("/vagas-empresa/:id/rejeitar", rejectCompanyJob);

router.get("/notifications", listNotifications);
router.get("/notificacoes", listNotifications);
router.put("/notifications/:id/read", markNotificationRead);
router.put("/notificacoes/:id/lida", markNotificationRead);
router.put("/notifications/read-all", markAllNotificationsRead);
router.put("/notificacoes/marcar-todas", markAllNotificationsRead);

router.get("/audit-logs", authorize("admin"), getAuditLogs);
router.get("/auditoria", authorize("admin"), getAuditLogs);

router.get("/configuracoes", authorize("admin"), getSettings);
router.put("/configuracoes", authorize("admin"), updateSettings);

// Ficheiros do sistema (com filtros e paginação)
router.get("/ficheiros", listSystemFiles);
router.get("/files", listSystemFiles);

// Geração de listas (admin + secretário validado no controller)
router.get("/listas/:tipo", generateSystemList);
router.get("/lists/:tipo", generateSystemList);

module.exports = router;
