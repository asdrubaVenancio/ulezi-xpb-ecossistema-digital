-- ============================================================
-- ULEZI XPB - Schema Completo da Base de Dados MySQL
-- Versão 1.0 | Fevereiro 2026
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS ulezi2_xpb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ulezi2_xpb;

-- ─── UTILIZADORES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(120) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  telefone     VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role         ENUM('student','company','investor','admin','employee') NOT NULL DEFAULT 'student',
  status       ENUM('ativo','inativo','bloqueado') NOT NULL DEFAULT 'ativo',
  email_verificado TINYINT(1) DEFAULT 0,
  foto_perfil  VARCHAR(255),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PERFIS DE ESTUDANTES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL UNIQUE,
  municipio    VARCHAR(100),
  provincia    VARCHAR(100),
  data_nascimento DATE,
  genero       ENUM('masculino','feminino','outro'),
  bio          TEXT,
  is_public    TINYINT(1) DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PERFIS DE EMPRESAS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_profiles (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL UNIQUE,
  nome_empresa    VARCHAR(200) NOT NULL,
  nif             VARCHAR(50) UNIQUE,
  descricao       TEXT,
  sector          VARCHAR(100),
  provincia       VARCHAR(100),
  municipio       VARCHAR(100),
  endereco        TEXT,
  website         VARCHAR(255),
  is_approved     TINYINT(1) DEFAULT 0,
  approved_by     INT UNSIGNED,
  approved_at     DATETIME,
  motivo_rejeicao TEXT,
  is_public       TINYINT(1) DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_approved (is_approved),
  INDEX idx_sector (sector)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PERFIS DE INVESTIDORES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investor_profiles (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id            INT UNSIGNED NOT NULL UNIQUE,
  areas_interesse    TEXT,
  descricao          TEXT,
  provincia          VARCHAR(100),
  municipio          VARCHAR(100),
  is_public          TINYINT(1) DEFAULT 1,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── TOKENS DE RECUPERAÇÃO DE SENHA ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used       TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CURSOS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(200) NOT NULL,
  descricao   TEXT,
  preco       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duracao     VARCHAR(50),
  categoria   VARCHAR(100),
  nivel       ENUM('basico','intermedio','avancado') DEFAULT 'basico',
  imagem_url  VARCHAR(255),
  status      ENUM('ativo','inativo') DEFAULT 'ativo',
  created_by  INT UNSIGNED,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CENTROS DE FORMAÇÃO ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_centers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(200) NOT NULL,
  provincia   VARCHAR(100) NOT NULL,
  municipio   VARCHAR(100) NOT NULL,
  endereco    TEXT,
  email       VARCHAR(150),
  telefone    VARCHAR(20),
  status      ENUM('ativo','inativo') DEFAULT 'ativo',
  created_by  INT UNSIGNED,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_provincia (provincia),
  INDEX idx_municipio (municipio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CURSOS POR CENTRO ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS center_courses (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  center_id   INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_center_course (center_id, course_id),
  FOREIGN KEY (center_id) REFERENCES training_centers(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── INSCRIÇÕES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero_inscricao VARCHAR(20) NOT NULL UNIQUE,
  student_id       INT UNSIGNED NOT NULL,
  course_id        INT UNSIGNED NOT NULL,
  center_id        INT UNSIGNED,
  municipio_aluno  VARCHAR(100),
  provincia_aluno  VARCHAR(100),
  status           ENUM('pendente','confirmada','cancelada','concluida') DEFAULT 'pendente',
  payment_status   ENUM('pendente','pago','reembolsado') DEFAULT 'pendente',
  observacoes      TEXT,
  assigned_by      INT UNSIGNED,
  assigned_at      DATETIME,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (center_id) REFERENCES training_centers(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_course (course_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PAGAMENTOS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id   INT UNSIGNED NOT NULL,
  valor           DECIMAL(10,2) NOT NULL,
  metodo          ENUM('transferencia','referencia','multibanco','dinheiro','outro') DEFAULT 'outro',
  referencia      VARCHAR(100),
  comprovativo_url VARCHAR(255),
  status          ENUM('pendente','confirmado','rejeitado','reembolsado') DEFAULT 'pendente',
  confirmado_by   INT UNSIGNED,
  confirmado_at   DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (confirmado_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── RECIBOS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id      INT UNSIGNED NOT NULL UNIQUE,
  numero_recibo      VARCHAR(30) NOT NULL UNIQUE,
  pdf_url            VARCHAR(255),
  pdf_data           LONGBLOB,
  enviado_email      TINYINT(1) DEFAULT 0,
  enviado_whatsapp   TINYINT(1) DEFAULT 0,
  enviado_email_at   DATETIME,
  enviado_whatsapp_at DATETIME,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── DOCUMENTOS DE EMPRESAS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_documents (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id          INT UNSIGNED NOT NULL,
  tipo                ENUM('alvara','nif','certidao','identificacao','outro') NOT NULL,
  nome_ficheiro       VARCHAR(255),
  url_ficheiro        VARCHAR(255) NOT NULL,
  status_verificacao  ENUM('pendente','aprovado','rejeitado') DEFAULT 'pendente',
  verificado_by       INT UNSIGNED,
  verificado_at       DATETIME,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (verificado_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ASSINATURAS DE EMPRESAS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   INT UNSIGNED NOT NULL,
  plano        ENUM('mensal','trimestral','anual') NOT NULL DEFAULT 'mensal',
  valor        DECIMAL(10,2) NOT NULL,
  data_inicio  DATE NOT NULL,
  data_fim     DATE NOT NULL,
  status       ENUM('ativa','expirada','cancelada') DEFAULT 'ativa',
  created_by   INT UNSIGNED,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_company (company_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── OPORTUNIDADES DE INVESTIMENTO ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investment_opportunities (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       INT UNSIGNED NOT NULL,
  tipo             ENUM('venda_empresa','participacao','licenciamento','franquia','investimento') NOT NULL,
  titulo           VARCHAR(255) NOT NULL,
  descricao        TEXT NOT NULL,
  valor            DECIMAL(15,2),
  moeda            VARCHAR(10) DEFAULT 'Kz',
  dados_especificos JSON,
  imagem_url       VARCHAR(255),
  status           ENUM('ativa','pausada','concluida','cancelada') DEFAULT 'ativa',
  views_count      INT UNSIGNED DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  INDEX idx_company (company_id),
  INDEX idx_tipo (tipo),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── INTERESSES DE INVESTIDORES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investor_interests (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  investor_id      INT UNSIGNED NOT NULL,
  opportunity_id   INT UNSIGNED NOT NULL,
  mensagem         TEXT,
  status           ENUM('pendente','em_analise','aprovado','rejeitado','concluido') DEFAULT 'pendente',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_investor_opp (investor_id, opportunity_id),
  FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (opportunity_id) REFERENCES investment_opportunities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CONTRATOS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  interest_id           INT UNSIGNED NOT NULL,
  opportunity_id        INT UNSIGNED NOT NULL,
  investor_id           INT UNSIGNED NOT NULL,
  company_id            INT UNSIGNED NOT NULL,
  titulo                VARCHAR(255) NOT NULL,
  conteudo              LONGTEXT,
  pdf_url               VARCHAR(255),
  pdf_data              LONGBLOB,
  status                ENUM('gerado','enviado','assinado_empresa','assinado_investidor','assinado_ambos','cancelado') DEFAULT 'gerado',
  assinado_empresa      TINYINT(1) DEFAULT 0,
  assinado_investidor   TINYINT(1) DEFAULT 0,
  assinado_empresa_at   DATETIME,
  assinado_investidor_at DATETIME,
  enviado_email_empresa      TINYINT(1) DEFAULT 0,
  enviado_email_investidor   TINYINT(1) DEFAULT 0,
  enviado_whatsapp_empresa   TINYINT(1) DEFAULT 0,
  enviado_whatsapp_investidor TINYINT(1) DEFAULT 0,
  gerado_by             INT UNSIGNED,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (interest_id) REFERENCES investor_interests(id) ON DELETE CASCADE,
  FOREIGN KEY (opportunity_id) REFERENCES investment_opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (gerado_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CATEGORIAS DE SERVIÇOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL UNIQUE,
  descricao   TEXT,
  icone       VARCHAR(50) DEFAULT 'briefcase',
  status      ENUM('ativo','inativo') DEFAULT 'ativo',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── SERVIÇOS POR EMPRESA ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_services (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   INT UNSIGNED NOT NULL,
  category_id  INT UNSIGNED NOT NULL,
  descricao    TEXT,
  ativo        TINYINT(1) DEFAULT 1,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_company_service (company_id, category_id),
  FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── VAGAS DE EMPREGO ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_postings (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo       VARCHAR(255) NOT NULL,
  empresa      VARCHAR(200),
  descricao    TEXT NOT NULL,
  requisitos   TEXT,
  localizacao  VARCHAR(200),
  tipo         ENUM('efetivo','temporario','estagio','freelance') DEFAULT 'efetivo',
  salario      VARCHAR(100),
  contacto     VARCHAR(255),
  status       ENUM('ativa','encerrada') DEFAULT 'ativa',
  admin_id     INT UNSIGNED,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  tipo        VARCHAR(50) NOT NULL,
  titulo      VARCHAR(200) NOT NULL,
  mensagem    TEXT NOT NULL,
  lida        TINYINT(1) DEFAULT 0,
  lida_at     DATETIME,
  link        VARCHAR(255),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_lida (user_id, lida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── SOLICITAÇÕES DE CONSULTORIA ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultancy_requests (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  requester_id INT UNSIGNED NOT NULL,
  tipo         VARCHAR(100),
  descricao    TEXT NOT NULL,
  status       ENUM('pendente','em_analise','aprovado','concluido','rejeitado') DEFAULT 'pendente',
  pago         TINYINT(1) DEFAULT 0,
  valor        DECIMAL(10,2) DEFAULT 0.00,
  resposta     TEXT,
  atendido_by  INT UNSIGNED,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (atendido_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── LOGS DE AUDITORIA ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED,
  acao        VARCHAR(100) NOT NULL,
  entidade    VARCHAR(100),
  entidade_id INT UNSIGNED,
  dados       JSON,
  ip          VARCHAR(45),
  user_agent  TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_acao (acao),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ─── VAGAS PUBLICADAS POR EMPRESAS (aprovação obrigatória) ────────────────────
CREATE TABLE IF NOT EXISTS company_job_postings (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      INT UNSIGNED NOT NULL,
  titulo          VARCHAR(255) NOT NULL,
  descricao       TEXT NOT NULL,
  requisitos      TEXT,
  localizacao     VARCHAR(200),
  tipo            ENUM('efetivo','temporario','estagio','freelance') DEFAULT 'efetivo',
  salario         VARCHAR(100),
  contacto        VARCHAR(255),
  status          ENUM('pendente','aprovada','rejeitada','encerrada') DEFAULT 'pendente',
  motivo_rejeicao TEXT,
  aprovado_by     INT UNSIGNED,
  aprovado_at     DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME,
  FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (aprovado_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── AVALIAÇÕES DE CURSOS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_reviews (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT UNSIGNED NOT NULL UNIQUE,
  student_id  INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED NOT NULL,
  nota        TINYINT UNSIGNED NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario  TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CONFIGURAÇÕES DO SISTEMA ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chave       VARCHAR(100) NOT NULL UNIQUE,
  valor       TEXT,
  descricao   VARCHAR(255),
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── MENSAGENS ENTRE UTILIZADORES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sender_id   INT UNSIGNED NOT NULL,
  receiver_id INT UNSIGNED NOT NULL,
  conteudo    TEXT NOT NULL,
  lida        TINYINT(1) DEFAULT 0,
  lida_at     DATETIME,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender   (sender_id),
  INDEX idx_receiver (receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── COORDENADAS BANCÁRIAS ──────────────────────────────────────────────────────
-- Tabela para armazenar dados bancários para pagamentos de inscrições
CREATE TABLE IF NOT EXISTS bank_coordinates (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo             ENUM('IBAN', 'MULTICAIXA_EXPRESS', 'CONTA_BANCARIA', 'OUTRO') NOT NULL,
  titulo           VARCHAR(100) NOT NULL,
  numero           VARCHAR(50) NOT NULL,
  titular          VARCHAR(200) NOT NULL,
  banco            VARCHAR(100),
  descricao        TEXT,
  is_active        TINYINT(1) DEFAULT 1,
  ordem            INT UNSIGNED DEFAULT 0,
  created_by       INT UNSIGNED NOT NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_tipo (tipo),
  INDEX idx_ativo (is_active),
  INDEX idx_ordem (ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
