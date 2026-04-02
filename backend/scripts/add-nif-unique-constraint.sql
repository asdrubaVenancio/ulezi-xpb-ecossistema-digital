-- Adicionar UNIQUE constraint no campo NIF da tabela companies
-- para evitar duplicidade de empresas com o mesmo NIF

-- Primeiro verificar se já existem NIFs duplicados
SELECT nif, COUNT(*) as quantidade
FROM company_profiles
WHERE nif IS NOT NULL AND nif != ''
GROUP BY nif
HAVING COUNT(*) > 1;

-- Se houver duplicados, limpar mantendo apenas o registro mais recente de cada NIF
-- (Descomente e execute apenas se necessário)
-- DELETE c1 FROM company_profiles c1
-- INNER JOIN company_profiles c2 
-- WHERE c1.nif = c2.nif 
--   AND c1.id > c2.id;

-- Adicionar índice UNIQUE no campo nif
-- Nota: Isso vai falhar se houver NIFs duplicados
ALTER TABLE company_profiles 
ADD UNIQUE INDEX idx_nif_unico (nif);

-- Opcional: também adicionar índice para pesquisa rápida
ALTER TABLE company_profiles 
ADD INDEX idx_nif (nif);
