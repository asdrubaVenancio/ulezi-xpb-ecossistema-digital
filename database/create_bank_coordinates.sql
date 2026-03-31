-- Script para criar a tabela de coordenadas bancárias
-- Execute este script no seu banco de dados MySQL

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

-- Inserir coordenadas de exemplo (opcional)
-- Substitua o ID do usuário (1) pelo ID de um administrador válido
INSERT INTO bank_coordinates (tipo, titulo, numero, titular, banco, descricao, is_active, ordem, created_by) VALUES
('IBAN', 'Conta Principal BFA', 'AO06 0040 0000 1234 5678 9012 3', 'ULEZI XPB, LDA', 'BFA', 'Transferência bancária via IBAN', 1, 1, 1),
('MULTICAIXA_EXPRESS', 'Multicaixa Express', '000 123 456', 'ULEZI XPB', NULL, 'Envio via Multicaixa Express', 1, 2, 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
