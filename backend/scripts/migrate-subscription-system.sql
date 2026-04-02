/**
 * Script de migração para adicionar campos necessários ao sistema de assinaturas
 * Execute no MySQL
 */

-- Adicionar campos à tabela subscription_packages para workflow de aprovação
ALTER TABLE subscription_packages 
ADD COLUMN IF NOT EXISTS status ENUM('ativo', 'inativo', 'pendente', 'rejeitado') DEFAULT 'ativo' AFTER is_active,
ADD COLUMN IF NOT EXISTS created_by INT UNSIGNED NULL AFTER status,
ADD COLUMN IF NOT EXISTS approved_by INT UNSIGNED NULL AFTER created_by,
ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL AFTER approved_by,
ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT NULL AFTER approved_at;

-- Adicionar campos à tabela subscriptions para controle de pagamento
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS package_id INT UNSIGNED NULL AFTER company_id,
ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NULL AFTER package_id,
ADD COLUMN IF NOT EXISTS tipo_plano VARCHAR(100) NULL AFTER user_id,
ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(12,2) NULL AFTER valor,
ADD COLUMN IF NOT EXISTS moeda VARCHAR(10) NOT NULL DEFAULT 'AOA' AFTER valor_pago,
ADD COLUMN IF NOT EXISTS metodo_pagamento VARCHAR(50) NULL AFTER moeda,
ADD COLUMN IF NOT EXISTS referencia_pagamento VARCHAR(100) NULL AFTER metodo_pagamento,
ADD COLUMN IF NOT EXISTS pagamento_status ENUM('pendente', 'confirmado', 'falhou', 'reembolsado') DEFAULT 'confirmado' AFTER referencia_pagamento,
ADD COLUMN IF NOT EXISTS comprovante_url VARCHAR(255) NULL AFTER pagamento_status,
ADD COLUMN IF NOT EXISTS auto_renovar TINYINT(1) NOT NULL DEFAULT 0 AFTER comprovante_url,
ADD COLUMN IF NOT EXISTS is_renewal TINYINT(1) NOT NULL DEFAULT 0 AFTER auto_renovar,
ADD COLUMN IF NOT EXISTS renovada_de INT UNSIGNED NULL AFTER is_renewal;

-- Adicionar campos de privilégios à tabela subscription_packages
ALTER TABLE subscription_packages
ADD COLUMN IF NOT EXISTS max_vagas_ativas INT DEFAULT 3 AFTER max_oportunidades_ativas,
ADD COLUMN IF NOT EXISTS publicacoes_vagas_ilimitadas TINYINT(1) DEFAULT 0 AFTER publicacoes_oportunidades_ilimitadas;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_status ON subscriptions(company_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package ON subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON subscription_packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_created_by ON subscription_packages(created_by);

-- Atualizar assinaturas existentes (migração de dados)
UPDATE subscriptions s
SET package_id = (
  SELECT id FROM subscription_packages 
  WHERE slug = s.plano OR nome = s.plano 
  LIMIT 1
)
WHERE package_id IS NULL AND EXISTS (
  SELECT 1 FROM subscription_packages WHERE slug = s.plano OR nome = s.plano
);

-- Definir tipo_plano baseado no plano
UPDATE subscriptions SET tipo_plano = plano WHERE tipo_plano IS NULL;

-- Definir valor_pago baseado no valor
UPDATE subscriptions SET valor_pago = valor WHERE valor_pago IS NULL;

-- Verificar estrutura atualizada
SELECT 
  'subscription_packages' as tabela,
  COLUMN_NAME as coluna,
  DATA_TYPE as tipo,
  IS_NULLABLE as nulo,
  COLUMN_DEFAULT as padrao
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'subscription_packages'
ORDER BY ORDINAL_POSITION;

SELECT 
  'subscriptions' as tabela,
  COLUMN_NAME as coluna,
  DATA_TYPE as tipo,
  IS_NULLABLE as nulo,
  COLUMN_DEFAULT as padrao
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'subscriptions'
ORDER BY ORDINAL_POSITION;
