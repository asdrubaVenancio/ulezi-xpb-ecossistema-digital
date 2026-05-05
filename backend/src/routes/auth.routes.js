const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  uploadFotoPerfil,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  uploadDocument,
  uploadAvatar,
} = require("../middlewares/upload.middleware");
const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validations/auth.validation");

const uploadCompanyRegistrationDocs = uploadDocument.fields([
  { name: "documento_alvara", maxCount: 1 },
  { name: "documento_nif", maxCount: 1 },
  { name: "documento_certidao", maxCount: 1 },
  { name: "documento_identificacao", maxCount: 1 },
]);

uploadCompanyRegistrationDocs.multipart = (req, res) => {
  if (req.files && req.files.documento_alvara && req.files.documento_alvara[0].size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "Arquivo muito grande. O tamanho máximo permitido é 5MB por documento.",
    });
  }
  if (req.files && req.files.documento_nif && req.files.documento_nif[0].size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "Arquivo muito grande. O tamanho máximo permitido é 5MB por documento.",
    });
  }
  if (req.files && req.files.documento_certidao && req.files.documento_certidao[0].size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "Arquivo muito grande. O tamanho máximo permitido é 5MB por documento.",
    });
  }
  if (req.files && req.files.documento_identificacao && req.files.documento_identificacao[0].size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "Arquivo muito grande. O tamanho máximo permitido é 5MB por documento.",
    });
  }
};

// Middleware de tratamento de erro do Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Arquivo muito grande. O tamanho máximo permitido é 5MB por documento.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erro no upload: ${err.message}`,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

router.post(
  "/register",
  uploadCompanyRegistrationDocs,
  handleMulterError,
  validate(registerSchema),
  register,
);
router.post(
  "/registar",
  uploadCompanyRegistrationDocs,
  handleMulterError,
  validate(registerSchema),
  register,
);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post(
  "/esqueci-password",
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/nova-password/:token",
  validate(resetPasswordSchema),
  resetPassword,
);
router.get("/me", authenticate, getMe);
router.get("/perfil", authenticate, getMe);
router.put("/profile", authenticate, updateProfile);
router.put("/perfil", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);
router.put("/password", authenticate, changePassword);

// Upload de foto de perfil
router.post(
  "/foto-perfil",
  authenticate,
  uploadAvatar.single("foto"),
  uploadFotoPerfil,
);
router.post(
  "/profile-photo",
  authenticate,
  uploadAvatar.single("foto"),
  uploadFotoPerfil,
);

module.exports = router;
