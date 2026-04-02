/**
 * Script para corrigir duplicatas de documentos e adicionar constraint UNIQUE
 * Execute no MySQL
 */

-- 1. Verificar duplicatas existentes
SELECT 
  company_id, 
  tipo, 
  COUNT(*) as quantidade,
  GROUP_CONCAT(id ORDER BY created_at DESC) as ids
FROM company_documents 
GROUP BY company_id, tipo 
HAVING COUNT(*) > 1;

-- 2. Criar tabela temporária com os IDs a manter (mais recente de cada tipo)
CREATE TEMPORARY TABLE IF NOT EXISTS docs_a_manter AS
SELECT 
  company_id,
  tipo,
  MAX(id) as id_manter
FROM company_documents
GROUP BY company_id, tipo;

-- 3. Remover duplicatas (manter apenas o mais recente)
DELETE FROM company_documents
WHERE id NOT IN (SELECT id_manter FROM docs_a_manter);

-- 4. Verificar se ainda existem duplicatas
SELECT 
  company_id, 
  tipo, 
  COUNT(*) as quantidade
FROM company_documents 
GROUP BY company_id, tipo 
HAVING COUNT(*) > 1;

-- 5. Adicionar constraint UNIQUE para prevenir futuras duplicatas
-- Nota: Se já existir um índice UNIQUE, este comando vai falhar (o que é esperado)
ALTER TABLE company_documents 
ADD UNIQUE INDEX uk_company_tipo (company_id, tipo);

-- 6. Verificar documentos após limpeza
SELECT 
  cd.id,
  cd.company_id,
  cd.tipo,
  cd.nome_ficheiro,
  cd.status_verificacao,
  cp.nome_empresa
FROM company_documents cd
LEFT JOIN company_profiles cp ON cp.id = cd.company_id
ORDER BY cd.company_id, cd.tipo;
