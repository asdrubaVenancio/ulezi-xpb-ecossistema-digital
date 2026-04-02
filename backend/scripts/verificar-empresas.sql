/**
 * Script de verificação e correção para empresas pendentes
 * Execute no MySQL para verificar se há empresas pendentes
 */

-- Verificar se a tabela company_profiles existe
SHOW TABLES LIKE 'company_profiles';

-- Verificar estrutura da tabela
DESCRIBE company_profiles;

-- Verificar empresas pendentes (is_approved = 0 e sem motivo de rejeição)
SELECT 
  id, 
  nome_empresa, 
  is_approved, 
  motivo_rejeicao, 
  created_at 
FROM company_profiles 
WHERE is_approved = 0 
  AND motivo_rejeicao IS NULL;

-- Contar empresas pendentes
SELECT COUNT(*) as total_pendentes 
FROM company_profiles 
WHERE is_approved = 0 
  AND motivo_rejeicao IS NULL;

-- Verificar todas as empresas e seus estados
SELECT 
  id, 
  nome_empresa, 
  is_approved,
  CASE 
    WHEN is_approved = 1 THEN 'aprovada'
    WHEN is_approved = 0 AND motivo_rejeicao IS NOT NULL THEN 'rejeitada'
    WHEN is_approved = 0 AND motivo_rejeicao IS NULL THEN 'pendente'
    ELSE 'desconhecido'
  END as estado,
  motivo_rejeicao,
  created_at
FROM company_profiles 
ORDER BY created_at DESC;
