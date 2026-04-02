-- =============================================================================
-- MÓDULO 7: NEGÓCIOS E INVESTIMENTOS
-- Estrutura de Banco de Dados - Funcionários, Visitas, Mediação, Suporte
-- =============================================================================

-- =============================================================================
-- 1. TABELA DE FUNCIONÁRIOS (EMPLOYEES)
-- =============================================================================
-- Extende a tabela users com informações específicas de funcionários

CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  departamento VARCHAR(100) DEFAULT 'Geral',
  cargo VARCHAR(100) NOT NULL,
  responsabilidades JSON DEFAULT NULL,
  data_contratacao DATE DEFAULT CURRENT_DATE,
  tipo_contrato ENUM('efetivo', 'temporario', 'estagio', 'freelancer') DEFAULT 'efetivo',
  salario DECIMAL(12,2) DEFAULT NULL,
  horario_trabalho VARCHAR(50) DEFAULT '09:00-18:00',
  supervisor_id INT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  observacoes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. TABELA DE RESPONSABILIDADES/FUNÇÕES DOS FUNCIONÁRIOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS employee_responsibilities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  tipo_responsabilidade ENUM('verificacao_documentos', 'visitas_presenciais', 'mediacao_negocios', 'suporte_cliente', 'consultoria', 'gestao_assinaturas', 'administrativo') NOT NULL,
  descricao TEXT DEFAULT NULL,
  prioridade INT DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. TABELA DE VISITAS DE VERIFICAÇÃO FÍSICA
-- =============================================================================

CREATE TABLE IF NOT EXISTS company_visits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  employee_id INT NOT NULL,
  data_visita DATE NOT NULL,
  hora_visita TIME DEFAULT NULL,
  endereco_visita VARCHAR(255) DEFAULT NULL,
  status ENUM('agendada', 'confirmada', 'realizada', 'reagendada', 'cancelada') DEFAULT 'agendada',
  resultado ENUM('pendente', 'aprovado', 'reprovado', 'condicional') DEFAULT 'pendente',
  observacoes TEXT DEFAULT NULL,
  relatorio_visita TEXT DEFAULT NULL,
  documentos_verificados JSON DEFAULT NULL,
  fotos_local VARCHAR(500) DEFAULT NULL,
  recomendacoes TEXT DEFAULT NULL,
  motivo_rejeicao VARCHAR(500) DEFAULT NULL,
  requer_segunda_visita TINYINT(1) DEFAULT 0,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_realizacao TIMESTAMP NULL DEFAULT NULL,
  created_by INT NOT NULL,
  
  FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. TABELA DE MEDIAÇÕES (PROCESSO DE NEGOCIAÇÃO)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mediations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  interest_id INT NOT NULL,
  employee_id INT NOT NULL,
  company_id INT NOT NULL,
  investor_id INT NOT NULL,
  status ENUM('pendente', 'em_analise', 'agendada', 'em_andamento', 'concluida', 'cancelada') DEFAULT 'pendente',
  etapa_atual ENUM('triagem', 'documentacao', 'reuniao_inicial', 'negociacao', 'contrato', 'assinatura', 'concluido') DEFAULT 'triagem',
  data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_conclusao TIMESTAMP NULL DEFAULT NULL,
  prioridade ENUM('baixa', 'media', 'alta', 'urgente') DEFAULT 'media',
  observacoes_internas TEXT DEFAULT NULL,
  resultado_final ENUM('pendente', 'sucesso', 'insucesso', 'cancelado') DEFAULT 'pendente',
  motivo_cancelamento VARCHAR(500) DEFAULT NULL,
  valor_negociado DECIMAL(15,2) DEFAULT NULL,
  percentagem_negociado DECIMAL(5,2) DEFAULT NULL,
  termos_adicionais JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (interest_id) REFERENCES investor_interests(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. TABELA DE REUNIÕES AGENDADAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mediation_id INT NOT NULL,
  employee_id INT NOT NULL,
  company_id INT NOT NULL,
  investor_id INT NOT NULL,
  data_reuniao DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME DEFAULT NULL,
  local_reuniao VARCHAR(255) DEFAULT NULL,
  tipo_reuniao ENUM('presencial', 'video_chamada', 'telefonica') DEFAULT 'presencial',
  link_video VARCHAR(255) DEFAULT NULL,
  status ENUM('agendada', 'confirmada', 'realizada', 'cancelada', 'reagendada') DEFAULT 'agendada',
  objetivo TEXT DEFAULT NULL,
  pauta TEXT DEFAULT NULL,
  resultado TEXT DEFAULT NULL,
  observacoes TEXT DEFAULT NULL,
  lembretes_enviados JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mediation_id) REFERENCES mediations(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
6. TABELA DE TICKETS DE SUPORTE
=============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  employee_id INT DEFAULT NULL,
  categoria ENUM('tecnico', 'comercial', 'financeiro', 'documentacao', 'reclamacao', 'outro') NOT NULL,
  subcategoria VARCHAR(100) DEFAULT NULL,
  assunto VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  status ENUM('aberto', 'em_atendimento', 'aguardando_cliente', 'resolvido', 'fechado', 'cancelado') DEFAULT 'aberto',
  prioridade ENUM('baixa', 'media', 'alta', 'urgente') DEFAULT 'media',
  canal_entrada ENUM('web', 'email', 'telefone', 'presencial') DEFAULT 'web',
  origem ENUM('empresa', 'investidor', 'aluno', 'visitante') NOT NULL,
  anexos JSON DEFAULT NULL,
  tempo_resposta_primeira INT DEFAULT NULL,
  tempo_resolucao INT DEFAULT NULL,
  avaliacao_satisfacao INT DEFAULT NULL,
  comentario_avaliacao VARCHAR(500) DEFAULT NULL,
  data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atendimento TIMESTAMP NULL DEFAULT NULL,
  data_resolucao TIMESTAMP NULL DEFAULT NULL,
  data_fechamento TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. TABELA DE MENSAGENS DE SUPORTE
-- =============================================================================

CREATE TABLE IF NOT EXISTS support_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  remetente_id INT NOT NULL,
  tipo_remetente ENUM('cliente', 'funcionario', 'sistema') NOT NULL,
  mensagem TEXT NOT NULL,
  anexos JSON DEFAULT NULL,
  is_internal TINYINT(1) DEFAULT 0,
  lida TINYINT(1) DEFAULT 0,
  data_leitura TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (remetente_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. TABELA DE CONSULTORIAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS consultations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  employee_id INT DEFAULT NULL,
  tipo_cliente ENUM('empresa', 'investidor') NOT NULL,
  tipo_consultoria ENUM('juridica', 'financeira', 'estratégica', 'marketing', 'tecnológica', 'gestao') NOT NULL,
  modalidade ENUM('presencial', 'video_chamada', 'telefonica') NOT NULL,
  data_agendada DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME DEFAULT NULL,
  local_consultoria VARCHAR(255) DEFAULT NULL,
  link_video VARCHAR(255) DEFAULT NULL,
  status ENUM('agendada', 'confirmada', 'realizada', 'cancelada', 'reagendada') DEFAULT 'agendada',
  valor DECIMAL(12,2) DEFAULT NULL,
  moeda VARCHAR(10) DEFAULT 'Kz',
  pago TINYINT(1) DEFAULT 0,
  comprovativo_pagamento VARCHAR(255) DEFAULT NULL,
  motivo_consultoria TEXT NOT NULL,
  resultado TEXT DEFAULT NULL,
  recomendacoes TEXT DEFAULT NULL,
  documentos_gerados JSON DEFAULT NULL,
  avaliacao_cliente INT DEFAULT NULL,
  comentario_cliente VARCHAR(500) DEFAULT NULL,
  incluida_no_pacote TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. TABELA DE PACOTES DE ASSINATURA (ATUALIZAÇÃO)
-- =============================================================================
-- Adiciona campos à tabela subscriptions existente

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pacote_slug VARCHAR(50) DEFAULT 'padrao';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS beneficios JSON DEFAULT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS consultorias_incluidas INT DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS suporte_prioritario TINYINT(1) DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS data_cancelamento TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS motivo_cancelamento VARCHAR(500) DEFAULT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renovacao_automatica TINYINT(1) DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notificacoes_enviadas JSON DEFAULT NULL;

-- =============================================================================
-- 10. TABELA DE TIPOS/PACOTES DE ASSINATURA
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_packages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT DEFAULT NULL,
  valor DECIMAL(12,2) NOT NULL,
  moeda VARCHAR(10) DEFAULT 'Kz',
  duracao_meses INT NOT NULL,
  consultorias_incluidas INT DEFAULT 0,
  suporte_prioritario TINYINT(1) DEFAULT 0,
  publicacoes_oportunidades_ilimitadas TINYINT(1) DEFAULT 1,
  max_oportunidades_ativas INT DEFAULT 10,
  beneficios JSON DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  ordem INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. ÍNDICES PARA PERFORMANCE
-- =============================================================================

CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_status ON employees(is_active);
CREATE INDEX idx_employees_departamento ON employees(departamento);

CREATE INDEX idx_company_visits_company ON company_visits(company_id);
CREATE INDEX idx_company_visits_employee ON company_visits(employee_id);
CREATE INDEX idx_company_visits_status ON company_visits(status);
CREATE INDEX idx_company_visits_data ON company_visits(data_visita);

CREATE INDEX idx_mediation_interest ON mediations(interest_id);
CREATE INDEX idx_mediation_employee ON mediations(employee_id);
CREATE INDEX idx_mediation_status ON mediations(status);

CREATE INDEX idx_meetings_mediation ON scheduled_meetings(mediation_id);
CREATE INDEX idx_meetings_employee ON scheduled_meetings(employee_id);
CREATE INDEX idx_meetings_data ON scheduled_meetings(data_reuniao);
CREATE INDEX idx_meetings_status ON scheduled_meetings(status);

CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_employee ON support_tickets(employee_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_categoria ON support_tickets(categoria);

CREATE INDEX idx_consultations_cliente ON consultations(cliente_id);
CREATE INDEX idx_consultations_employee ON consultations(employee_id);
CREATE INDEX idx_consultations_data ON consultations(data_agendada);

-- =============================================================================
-- 12. DADOS INICIAIS - PACOTES DE ASSINATURA
-- =============================================================================

INSERT INTO subscription_packages (slug, nome, descricao, valor, duracao_meses, consultorias_incluidas, suporte_prioritario, max_oportunidades_ativas, beneficios) VALUES
('basico', 'Básico', 'Acesso básico à plataforma com publicação limitada de oportunidades', 50000.00, 6, 0, 0, 3, '["Perfil público", "Publicação de vagas de emprego", "Suporte por email"]'),
('profissional', 'Profissional', 'Acesso completo com suporte prioritário e consultorias incluídas', 150000.00, 12, 2, 1, 10, '["Perfil público", "Publicação de vagas de emprego", "Suporte prioritário", "2 consultorias/anuais", "Destaque nas buscas"]'),
('empresarial', 'Empresarial', 'Solução completa para grandes empresas com recursos ilimitados', 350000.00, 12, 6, 1, NULL, '["Perfil público", "Publicação ilimitada", "Suporte prioritário", "6 consultorias/anuais", "Destaque premium", "Relatórios avançados", "Gestor de conta dedicado"]')
ON DUPLICATE KEY UPDATE 
  nome = VALUES(nome),
  descricao = VALUES(descricao),
  valor = VALUES(valor);

-- =============================================================================
-- 13. TRIGGER PARA NOTIFICAÇÕES DE VENCIMENTO DE ASSINATURA
-- =============================================================================

DELIMITER //

CREATE TRIGGER IF NOT EXISTS trg_subscription_expiry_notification
BEFORE UPDATE ON subscriptions
FOR EACH ROW
BEGIN
  -- Notifica quando a assinatura está prestes a expirar (7, 3, 1 dias)
  IF OLD.status = 'ativa' AND NEW.data_fim <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN
    IF JSON_SEARCH(OLD.notificacoes_enviadas, 'one', 'vencimento_7dias') IS NULL THEN
      INSERT INTO notifications (user_id, tipo, titulo, mensagem)
      SELECT cp.user_id, 'assinatura_vencimento', 'Sua assinatura expira em breve',
             CONCAT('A sua assinatura expira em ', DATEDIFF(NEW.data_fim, CURDATE()), ' dias. Renove para continuar usando a plataforma.')
      FROM company_profiles cp WHERE cp.id = NEW.company_id;
      
      SET NEW.notificacoes_enviadas = JSON_ARRAY_APPEND(
        IFNULL(OLD.notificacoes_enviadas, JSON_ARRAY()), 
        '$', 
        JSON_OBJECT('tipo', 'vencimento_7dias', 'data', NOW())
      );
    END IF;
  END IF;
  
  -- Atualiza status para expirada quando passar a data
  IF NEW.data_fim < CURDATE() AND NEW.status = 'ativa' THEN
    SET NEW.status = 'expirada';
  END IF;
END//

DELIMITER ;

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
