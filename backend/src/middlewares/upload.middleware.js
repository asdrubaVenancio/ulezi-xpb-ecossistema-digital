/**
 * ULEZI XPI — Middleware de Upload de Ficheiros
 * Configuração do Multer para documentos, logos e comprovativos
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Criar diretórios de upload se não existirem
const dirs = [
  "uploads/documents",
  "uploads/receipts",
  "uploads/contracts",
  "uploads/logos",
  "uploads/payments",
];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Criar diretório de avatares se não existir
if (!fs.existsSync("uploads/avatars")) {
  fs.mkdirSync("uploads/avatars", { recursive: true });
}

/**
 * Cria storage para uma pasta específica
 */
const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `uploads/${folder}`);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${folder}-${unique}${ext}`);
    },
  });

// Filtro de tipos de ficheiro
const fileFilter = (allowed) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de ficheiro não permitido. Permitidos: ${allowed.join(", ")}`,
      ),
      false,
    );
  }
};

// Upload de documentos (PDF, JPG, PNG)
const uploadDocument = multer({
  storage: createStorage("documents"),
  fileFilter: fileFilter([".pdf", ".jpg", ".jpeg", ".png"]),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Upload de logos (JPG, PNG, WEBP)
const uploadLogo = multer({
  storage: createStorage("logos"),
  fileFilter: fileFilter([".jpg", ".jpeg", ".png", ".webp"]),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// Upload de comprovativos de pagamento
const uploadPayment = multer({
  storage: createStorage("payments"),
  fileFilter: fileFilter([".pdf", ".jpg", ".jpeg", ".png"]),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

// Upload de foto de perfil (JPG, PNG, WEBP — 2MB máximo)
const uploadAvatar = multer({
  storage: createStorage("avatars"),
  fileFilter: fileFilter([".jpg", ".jpeg", ".png", ".webp"]),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = { uploadDocument, uploadLogo, uploadPayment, uploadAvatar };
