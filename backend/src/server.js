/**
 * ULEZI XPB - Servidor Principal
 * Ponto de entrada da aplicação backend
 */
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const { ensureTrainingModuleSchema } = require('./utils/training-module-schema');

// Importar rotas
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const paymentRoutes = require('./routes/payment.routes');
const businessRoutes = require('./routes/business.routes');
const communityRoutes = require('./routes/community.routes');
const adminRoutes = require('./routes/admin.routes');
const jobsRoutes  = require('./routes/jobs.routes');
const geographyRoutes = require('./routes/geography.routes');
const notificationRoutes = require('./routes/notification.routes');
const bankCoordinateRoutes = require('./routes/bank-coordinate.routes');

const app = express();

// ── Segurança ────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:8080',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Em desenvolvimento, permitir qualquer origem
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log(`[ERRO] CORS - Origem bloqueada: ${origin}`);
    console.log(`[INFO] Origens permitidas: ${allowedOrigins.join(', ')}`);
    return callback(new Error('Origem não permitida pelo CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas requisições. Tente novamente em 15 minutos.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Demasiadas tentativas de login. Aguarde 15 minutos.' },
});

app.use(globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/registar', authLimiter);

// ── Middlewares gerais ────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Pasta de uploads estática ─────────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || './uploads';
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(path.join(uploadDir, 'documents'), { recursive: true });
app.use('/uploads', express.static(path.resolve(uploadDir)));

// ── Rota de health check ──────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ulezi XPB API está operacional.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── Rotas da API ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/cursos', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/inscricoes', enrollmentRoutes);
app.use('/api/pagamentos', paymentRoutes);
app.use('/api', businessRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/comunidade', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vagas-empresa', jobsRoutes);
app.use('/api/geografia', geographyRoutes);
app.use('/api/notificacoes', notificationRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Rotas de Centros de Formação ─────────────────────────────────────────────────
const trainingCenterRoutes = require('./routes/training-center.routes');
const trainingOfferingRoutes = require('./routes/training-offering.routes');

app.use('/api/training-centers', trainingCenterRoutes);
app.use('/api/training-offerings', trainingOfferingRoutes);

// ── Rotas de Perfis de Usuários ─────────────────────────────────────────────────
const profileRoutes = require('./routes/profile.routes');
app.use('/api/profile', profileRoutes);

// ── Rotas de Coordenadas Bancárias ──────────────────────────────────────────────
app.use('/api/bank-coordinates', bankCoordinateRoutes);

// ── Tratamento de erros ───────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Inicialização ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await testConnection();
    await ensureTrainingModuleSchema();
    const server = app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║       ULEZI XPB - API Server           ║');
      console.log('╠════════════════════════════════════════╣');
      console.log(`║  🚀 Servidor rodando na porta ${PORT}     ║`);
      console.log(`║  🌍 Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(26)}║`);
      console.log(`║  📡 URL: http://localhost:${PORT}         ║`);
      console.log('╚════════════════════════════════════════╝\n');
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} já está em uso. Tente:`);
        console.error(`   1. Feche o outro processo usando a porta ${PORT}`);
        console.error(`   2. Use uma porta diferente: PORT=3001 npm run dev`);
      } else {
        console.error('❌ Erro no servidor:', err.message);
      }
      process.exit(1);
    });
    
    return server;
  } catch (err) {
    console.error('❌ Falha ao iniciar servidor:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = { app, start };
