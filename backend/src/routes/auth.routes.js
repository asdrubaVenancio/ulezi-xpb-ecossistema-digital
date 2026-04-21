const express = require("express");
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

router.post(
  "/register",
  uploadCompanyRegistrationDocs,
  validate(registerSchema),
  register,
);
router.post(
  "/registar",
  uploadCompanyRegistrationDocs,
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
