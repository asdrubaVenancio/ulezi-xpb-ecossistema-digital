/**
 * Compatibilidade do schema do módulo 7 (Negócios e Investimentos).
 * Garante que o monólito funcione mesmo em bases de dados antigas ou incompletas.
 */
const { pool } = require('../config/database');

const tableExists = async (tableName) => {
  try {
    const [rows] = await pool.execute('SHOW TABLES LIKE ?', [tableName]);
    return rows.length > 0;
  } catch (error) {
    return false;
  }
};

const hasColumn = async (tableName, columnName) => {
  try {
    const [rows] = await pool.execute(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
    return rows.length > 0;
  } catch (error) {
    return false;
  }
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  const exists = await hasColumn(tableName, columnName);
  if (exists) return;

  try {
    await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  } catch (error) {
    if (!String(error.message).includes('Duplicate column name')) {
      console.log(`⚠️  Aviso: não foi possível adicionar ${columnName} em ${tableName}: ${error.message}`);
    }
  }
};

const runSafe = async (sql, label) => {
  try {
    await pool.execute(sql);
  } catch (error) {
    console.log(`⚠️  Aviso: não foi possível aplicar ajuste ${label}: ${error.message}`);
  }
};

const ensureEmployeesSchema = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS employees (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL UNIQUE,
      departamento VARCHAR(100) DEFAULT 'Geral',
      cargo VARCHAR(100) NOT NULL,
      responsabilidades JSON DEFAULT NULL,
      data_contratacao DATE DEFAULT (CURRENT_DATE),
      tipo_contrato ENUM('efetivo', 'temporario', 'estagio', 'pj') DEFAULT 'efetivo',
      salario DECIMAL(12,2) DEFAULT NULL,
      horario_trabalho VARCHAR(50) DEFAULT '09:00-18:00',
      supervisor_id INT UNSIGNED DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 1,
      observacoes TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_employees_supervisor FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS employee_responsibilities (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id INT UNSIGNED NOT NULL,
      tipo_responsabilidade ENUM('verificacao_documentos', 'verificacao_fisica', 'mediacao_negocios', 'suporte_clientes', 'consultoria', 'assinaturas', 'administrativo') NOT NULL,
      descricao TEXT DEFAULT NULL,
      prioridade INT DEFAULT 1,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_employee_resp_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await runSafe('CREATE INDEX idx_employees_user_id ON employees(user_id)', 'idx_employees_user_id');
  await runSafe('CREATE INDEX idx_employees_status ON employees(is_active)', 'idx_employees_status');
  await runSafe('CREATE INDEX idx_employee_resp_employee ON employee_responsibilities(employee_id)', 'idx_employee_resp_employee');
};

const ensureVisitsSchema = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS company_visits (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      company_id INT UNSIGNED NOT NULL,
      employee_id INT UNSIGNED NOT NULL,
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
      created_by INT UNSIGNED NOT NULL,
      CONSTRAINT fk_company_visits_company FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
      CONSTRAINT fk_company_visits_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
      CONSTRAINT fk_company_visits_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await addColumnIfMissing('company_profiles', 'status_verificacao', `ENUM('pendente', 'em_analise', 'aprovado_visita', 'reprovado_visita') DEFAULT 'pendente'`);
  await addColumnIfMissing('company_profiles', 'visita_verificacao_id', 'INT UNSIGNED NULL');

  await runSafe('CREATE INDEX idx_company_visits_company ON company_visits(company_id)', 'idx_company_visits_company');
  await runSafe('CREATE INDEX idx_company_visits_employee ON company_visits(employee_id)', 'idx_company_visits_employee');
  await runSafe('CREATE INDEX idx_company_visits_status ON company_visits(status)', 'idx_company_visits_status');
};

const ensureMediationsSchema = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS mediations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      interest_id INT UNSIGNED NOT NULL,
      employee_id INT UNSIGNED NOT NULL,
      company_id INT UNSIGNED NOT NULL,
      investor_id INT UNSIGNED NOT NULL,
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
      CONSTRAINT fk_mediations_interest FOREIGN KEY (interest_id) REFERENCES investor_interests(id) ON DELETE CASCADE,
      CONSTRAINT fk_mediations_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
      CONSTRAINT fk_mediations_company FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
      CONSTRAINT fk_mediations_investor FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS scheduled_meetings (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      mediation_id INT UNSIGNED NOT NULL,
      employee_id INT UNSIGNED NOT NULL,
      company_id INT UNSIGNED NOT NULL,
      investor_id INT UNSIGNED NOT NULL,
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
      CONSTRAINT fk_scheduled_meetings_mediation FOREIGN KEY (mediation_id) REFERENCES mediations(id) ON DELETE CASCADE,
      CONSTRAINT fk_scheduled_meetings_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
      CONSTRAINT fk_scheduled_meetings_company FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
      CONSTRAINT fk_scheduled_meetings_investor FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await addColumnIfMissing('mediations', 'mediator_user_id', 'INT UNSIGNED NULL AFTER employee_id');
  await addColumnIfMissing('scheduled_meetings', 'mediator_user_id', 'INT UNSIGNED NULL AFTER employee_id');

  await runSafe(
    'ALTER TABLE mediations MODIFY COLUMN employee_id INT UNSIGNED NULL',
    'mediations_employee_nullable'
  );
  await runSafe(
    'ALTER TABLE scheduled_meetings MODIFY COLUMN employee_id INT UNSIGNED NULL',
    'scheduled_meetings_employee_nullable'
  );

  await runSafe(`
    ALTER TABLE investor_interests
    MODIFY COLUMN status ENUM('pendente','em_analise','em_mediacao','aprovado','rejeitado','cancelado','concluido') DEFAULT 'pendente'
  `, 'alter_investor_interests_status');
};

const ensureSupportSchema = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ticket_number VARCHAR(40) NOT NULL UNIQUE,
      user_id INT UNSIGNED NOT NULL,
      employee_id INT UNSIGNED DEFAULT NULL,
      assunto VARCHAR(255) NOT NULL,
      categoria ENUM('tecnico', 'comercial', 'financeiro', 'documentacao', 'reclamacao', 'outro') NOT NULL,
      prioridade ENUM('baixa', 'media', 'alta', 'urgente') DEFAULT 'media',
      status ENUM('aberto', 'em_atendimento', 'aguardando_resposta', 'resolvido', 'fechado') DEFAULT 'aberto',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      closed_at TIMESTAMP NULL DEFAULT NULL,
      CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_support_tickets_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT UNSIGNED NOT NULL,
      sender_id INT UNSIGNED NOT NULL,
      mensagem TEXT NOT NULL,
      anexos JSON DEFAULT NULL,
      is_internal TINYINT(1) DEFAULT 0,
      lida TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_support_messages_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
      CONSTRAINT fk_support_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const ensureCompanyDocumentsReviewSchema = async () => {
  await addColumnIfMissing('company_documents', 'visualizado_at', 'DATETIME NULL AFTER verificado_at');
  await addColumnIfMissing('company_documents', 'visualizado_by', 'INT UNSIGNED NULL AFTER visualizado_at');
};

const ensureConsultancySchema = async () => {
  // Verificar se a tabela company_profiles existe
  const companyProfilesExists = await tableExists('company_profiles');
  if (!companyProfilesExists) {
    console.log('⚠️  Tabela company_profiles não existe. Pulando migração de consultoria.');
    return;
  }

  console.log('🔧 Aplicando migrações de consultoria...');

  await addColumnIfMissing('company_profiles', 'tipo_empresa', `ENUM('empresa','consultoria') NOT NULL DEFAULT 'empresa' AFTER website`);
  await addColumnIfMissing('company_profiles', 'consultoria_descricao', 'TEXT NULL AFTER tipo_empresa');

  // Verificar se as colunas foram adicionadas
  const tipoEmpresaExists = await hasColumn('company_profiles', 'tipo_empresa');
  if (tipoEmpresaExists) {
    console.log('✅ Coluna tipo_empresa verificada/adicionada com sucesso');
  } else {
    console.log('❌ Falha ao adicionar coluna tipo_empresa');
  }

  await addColumnIfMissing('subscription_packages', 'package_category', `ENUM('empresa','consultoria','recarga_consultoria') NOT NULL DEFAULT 'empresa' AFTER nome`);
  await addColumnIfMissing('subscription_packages', 'target_role', `ENUM('company','investor','consultancy','all') NOT NULL DEFAULT 'company' AFTER package_category`);
  await addColumnIfMissing('subscription_packages', 'consultation_recharge_credits', 'INT NOT NULL DEFAULT 0 AFTER consultorias_incluidas');

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS consultation_credit_transactions (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      owner_user_id INT UNSIGNED NOT NULL,
      owner_company_id INT UNSIGNED NULL,
      subscription_id INT UNSIGNED NULL,
      package_id INT UNSIGNED NULL,
      consultation_id INT UNSIGNED NULL,
      transaction_type ENUM('assinatura','recarga','consumo','ajuste') NOT NULL,
      quantity INT NOT NULL,
      unit_value DECIMAL(12,2) NULL,
      total_value DECIMAL(12,2) NULL,
      description VARCHAR(255) NULL,
      metadata JSON NULL,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_consultation_credit_owner_user FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_consultation_credit_owner_company FOREIGN KEY (owner_company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
      CONSTRAINT fk_consultation_credit_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
      CONSTRAINT fk_consultation_credit_package FOREIGN KEY (package_id) REFERENCES subscription_packages(id) ON DELETE SET NULL,
      CONSTRAINT fk_consultation_credit_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS consultation_recharge_requests (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      requester_user_id INT UNSIGNED NOT NULL,
      requester_company_id INT UNSIGNED NULL,
      package_id INT UNSIGNED NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      unit_value DECIMAL(12,2) NULL,
      total_value DECIMAL(12,2) NULL,
      status ENUM('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
      payment_reference VARCHAR(120) NULL,
      proof_url VARCHAR(255) NULL,
      notes TEXT NULL,
      approved_by INT UNSIGNED NULL,
      approved_at DATETIME NULL,
      rejection_reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_consultation_recharge_user FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_consultation_recharge_company FOREIGN KEY (requester_company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
      CONSTRAINT fk_consultation_recharge_package FOREIGN KEY (package_id) REFERENCES subscription_packages(id) ON DELETE RESTRICT,
      CONSTRAINT fk_consultation_recharge_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS consultancy_availability (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      company_id INT UNSIGNED NOT NULL,
      dia_semana TINYINT NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fim TIME NOT NULL,
      capacidade_atendimentos INT NOT NULL DEFAULT 1,
      duracao_slot_minutos INT NOT NULL DEFAULT 60,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_consultancy_availability_company FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await runSafe('CREATE INDEX idx_consultancy_availability_company ON consultancy_availability(company_id)', 'idx_consultancy_availability_company');
  await runSafe('CREATE INDEX idx_consultancy_availability_day ON consultancy_availability(dia_semana, is_active)', 'idx_consultancy_availability_day');
  await runSafe('CREATE INDEX idx_consultation_credit_owner ON consultation_credit_transactions(owner_user_id, owner_company_id)', 'idx_consultation_credit_owner');
  await runSafe('CREATE INDEX idx_consultation_recharge_status ON consultation_recharge_requests(status, created_at)', 'idx_consultation_recharge_status');
};

const ensureConsultationsSchema = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS consultations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      employee_id INT UNSIGNED DEFAULT NULL,
      tipo_consultoria VARCHAR(120) NOT NULL,
      tema VARCHAR(255) NOT NULL,
      descricao TEXT NOT NULL,
      preferencia_data DATE DEFAULT NULL,
      preferencia_horario VARCHAR(50) DEFAULT NULL,
      duracao_solicitada INT DEFAULT 60,
      data_agendada DATE DEFAULT NULL,
      hora_inicio TIME DEFAULT NULL,
      hora_fim TIME DEFAULT NULL,
      duracao_minutos INT DEFAULT NULL,
      link_reuniao VARCHAR(255) DEFAULT NULL,
      local_reuniao VARCHAR(255) DEFAULT NULL,
      status ENUM('pendente', 'agendada', 'confirmada', 'realizada', 'cancelada') DEFAULT 'pendente',
      valor DECIMAL(12,2) DEFAULT NULL,
      resumo TEXT DEFAULT NULL,
      recomendacoes TEXT DEFAULT NULL,
      proximos_passos TEXT DEFAULT NULL,
      material_compartilhado JSON DEFAULT NULL,
      motivo_cancelamento TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_consultations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_consultations_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await addColumnIfMissing('consultations', 'consultancy_company_id', 'INT UNSIGNED NULL AFTER user_id');
  await addColumnIfMissing('consultations', 'requester_company_id', 'INT UNSIGNED NULL AFTER consultancy_company_id');
  await addColumnIfMissing('consultations', 'requested_by_role', `ENUM('company','investor') NOT NULL DEFAULT 'company' AFTER requester_company_id`);
  await addColumnIfMissing('consultations', 'slot_date', 'DATE NULL AFTER preferencia_horario');
  await addColumnIfMissing('consultations', 'slot_confirmed_at', 'DATETIME NULL AFTER slot_date');
  await addColumnIfMissing('consultations', 'credits_consumed', 'INT NOT NULL DEFAULT 0 AFTER valor');
  await addColumnIfMissing('consultations', 'credit_source', `ENUM('assinatura','recarga','manual') NULL AFTER credits_consumed`);
  await addColumnIfMissing('consultations', 'request_channel', `ENUM('plataforma','admin') NOT NULL DEFAULT 'plataforma' AFTER credit_source`);
  await addColumnIfMissing('consultations', 'requested_at', 'DATETIME NULL AFTER request_channel');

  await runSafe(
    'ALTER TABLE consultations MODIFY COLUMN status ENUM(\'pendente\',\'agendada\',\'confirmada\',\'realizada\',\'cancelada\',\'rejeitada\') DEFAULT \'pendente\'',
    'consultations_status_extended'
  );

  await runSafe(
    'ALTER TABLE consultations ADD CONSTRAINT fk_consultations_consultancy_company FOREIGN KEY (consultancy_company_id) REFERENCES company_profiles(id) ON DELETE SET NULL',
    'fk_consultations_consultancy_company'
  );
  await runSafe(
    'ALTER TABLE consultations ADD CONSTRAINT fk_consultations_requester_company FOREIGN KEY (requester_company_id) REFERENCES company_profiles(id) ON DELETE SET NULL',
    'fk_consultations_requester_company'
  );

  await runSafe('CREATE INDEX idx_consultations_consultancy_company ON consultations(consultancy_company_id)', 'idx_consultations_consultancy_company');
  await runSafe('CREATE INDEX idx_consultations_slot ON consultations(slot_date, hora_inicio, status)', 'idx_consultations_slot');
};

const ensureSubscriptionsCompatibility = async () => {
  await addColumnIfMissing('subscriptions', 'user_id', 'INT UNSIGNED NULL AFTER company_id');
  await addColumnIfMissing('subscriptions', 'package_id', 'INT UNSIGNED NULL AFTER user_id');
  await addColumnIfMissing('subscriptions', 'tipo_plano', 'VARCHAR(100) NULL AFTER package_id');
  await addColumnIfMissing('subscriptions', 'valor_pago', 'DECIMAL(12,2) NULL AFTER valor');
  await addColumnIfMissing('subscriptions', 'moeda', `VARCHAR(10) NOT NULL DEFAULT 'AOA' AFTER valor_pago`);
  await addColumnIfMissing('subscriptions', 'metodo_pagamento', `VARCHAR(50) NULL AFTER moeda`);
  await addColumnIfMissing('subscriptions', 'referencia_pagamento', `VARCHAR(100) NULL AFTER metodo_pagamento`);
  await addColumnIfMissing('subscriptions', 'pagamento_status', `ENUM('pendente','confirmado','falhou','reembolsado') DEFAULT 'confirmado' AFTER referencia_pagamento`);
  await addColumnIfMissing('subscriptions', 'comprovante_url', `VARCHAR(255) NULL AFTER pagamento_status`);
  await addColumnIfMissing('subscriptions', 'comprovante_visualizado_em', 'DATETIME NULL AFTER comprovante_url');
  await addColumnIfMissing('subscriptions', 'auto_renovar', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER comprovante_url');
  await addColumnIfMissing('subscriptions', 'is_renewal', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER auto_renovar');
  await addColumnIfMissing('subscriptions', 'renovada_de', 'INT UNSIGNED NULL AFTER is_renewal');
  await addColumnIfMissing('subscriptions', 'approved_by', 'INT UNSIGNED NULL AFTER renovada_de');
  await addColumnIfMissing('subscriptions', 'approved_at', 'DATETIME NULL AFTER approved_by');
  await addColumnIfMissing('subscriptions', 'motivo_rejeicao', 'TEXT NULL AFTER approved_at');

  await runSafe(`
    ALTER TABLE subscriptions
    MODIFY COLUMN status ENUM('ativa','expirada','cancelada','vencida','renovada','pendente') DEFAULT 'ativa'
  `, 'alter_subscriptions_status');

  const [subsSemUser] = await pool.execute(`
    SELECT s.id, cp.user_id
    FROM subscriptions s
    INNER JOIN company_profiles cp ON cp.id = s.company_id
    WHERE s.user_id IS NULL
  `);

  for (const sub of subsSemUser) {
    await pool.execute('UPDATE subscriptions SET user_id = ? WHERE id = ?', [sub.user_id, sub.id]);
  }

  const [subsSemTipo] = await pool.execute('SELECT id, plano FROM subscriptions WHERE tipo_plano IS NULL');
  for (const sub of subsSemTipo) {
    await pool.execute('UPDATE subscriptions SET tipo_plano = ? WHERE id = ?', [sub.plano || 'plano_padrao', sub.id]);
  }

  const [subsSemValorPago] = await pool.execute('SELECT id, valor FROM subscriptions WHERE valor_pago IS NULL');
  for (const sub of subsSemValorPago) {
    await pool.execute('UPDATE subscriptions SET valor_pago = ? WHERE id = ?', [sub.valor || 0, sub.id]);
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS subscription_packages (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(50) NOT NULL UNIQUE,
      nome VARCHAR(100) NOT NULL,
      descricao TEXT DEFAULT NULL,
      preco DECIMAL(12,2) NOT NULL,
      moeda VARCHAR(10) DEFAULT 'AOA',
      duracao_dias INT NOT NULL DEFAULT 30,
      duracao_meses INT NOT NULL DEFAULT 1,
      consultorias_incluidas INT DEFAULT 0,
      suporte_prioritario TINYINT(1) DEFAULT 0,
      publicacoes_oportunidades_ilimitadas TINYINT(1) DEFAULT 1,
      max_oportunidades_ativas INT DEFAULT 10,
      publicacoes_vagas_ilimitadas TINYINT(1) DEFAULT 0,
      max_vagas_ativas INT DEFAULT 3,
      beneficios JSON DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 1,
      status ENUM('ativo','inativo','pendente','rejeitado') DEFAULT 'ativo',
      created_by INT UNSIGNED NULL,
      approved_by INT UNSIGNED NULL,
      approved_at DATETIME NULL,
      motivo_rejeicao TEXT NULL,
      ordem INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await addColumnIfMissing('subscription_packages', 'slug', 'VARCHAR(50) NULL');
  await addColumnIfMissing('subscription_packages', 'nome', 'VARCHAR(100) NULL');
  await addColumnIfMissing('subscription_packages', 'descricao', 'TEXT NULL');
  await addColumnIfMissing('subscription_packages', 'preco', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
  await addColumnIfMissing('subscription_packages', 'moeda', `VARCHAR(10) NOT NULL DEFAULT 'AOA'`);
  await addColumnIfMissing('subscription_packages', 'duracao_dias', 'INT NOT NULL DEFAULT 30');
  await addColumnIfMissing('subscription_packages', 'duracao_meses', 'INT NOT NULL DEFAULT 1');
  await addColumnIfMissing('subscription_packages', 'consultorias_incluidas', 'INT DEFAULT 0');
  await addColumnIfMissing('subscription_packages', 'suporte_prioritario', 'TINYINT(1) DEFAULT 0');
  await addColumnIfMissing('subscription_packages', 'publicacoes_oportunidades_ilimitadas', 'TINYINT(1) DEFAULT 1');
  await addColumnIfMissing('subscription_packages', 'max_oportunidades_ativas', 'INT DEFAULT 10');
  await addColumnIfMissing('subscription_packages', 'publicacoes_vagas_ilimitadas', 'TINYINT(1) DEFAULT 0');
  await addColumnIfMissing('subscription_packages', 'max_vagas_ativas', 'INT DEFAULT 3');
  await addColumnIfMissing('subscription_packages', 'beneficios', 'JSON NULL');
  await addColumnIfMissing('subscription_packages', 'is_active', 'TINYINT(1) DEFAULT 1');
  await addColumnIfMissing('subscription_packages', 'status', `ENUM('ativo','inativo','pendente','rejeitado') DEFAULT 'ativo'`);
  await addColumnIfMissing('subscription_packages', 'created_by', 'INT UNSIGNED NULL');
  await addColumnIfMissing('subscription_packages', 'approved_by', 'INT UNSIGNED NULL');
  await addColumnIfMissing('subscription_packages', 'approved_at', 'DATETIME NULL');
  await addColumnIfMissing('subscription_packages', 'motivo_rejeicao', 'TEXT NULL');
  await addColumnIfMissing('subscription_packages', 'ordem', 'INT DEFAULT 0');
  await addColumnIfMissing('subscription_packages', 'created_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');
  await addColumnIfMissing('subscription_packages', 'updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS subscription_notifications (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      subscription_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      notification_type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      dias_restantes INT DEFAULT NULL,
      email_sent TINYINT(1) DEFAULT 0,
      email_sent_at DATETIME DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'pendente',
      sent_by INT UNSIGNED DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_subscription_notifications_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
      CONSTRAINT fk_subscription_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_subscription_notifications_sender FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await addColumnIfMissing('subscription_notifications', 'notification_type', 'VARCHAR(50) NOT NULL DEFAULT "manual"');
  await addColumnIfMissing('subscription_notifications', 'title', 'VARCHAR(255) NOT NULL DEFAULT "Notificação de assinatura"');
  await addColumnIfMissing('subscription_notifications', 'message', 'TEXT NULL');
  await addColumnIfMissing('subscription_notifications', 'dias_restantes', 'INT NULL');
  await addColumnIfMissing('subscription_notifications', 'email_sent', 'TINYINT(1) DEFAULT 0');
  await addColumnIfMissing('subscription_notifications', 'email_sent_at', 'DATETIME NULL');
  await addColumnIfMissing('subscription_notifications', 'status', 'VARCHAR(50) DEFAULT "pendente"');
  await addColumnIfMissing('subscription_notifications', 'sent_by', 'INT UNSIGNED NULL');

  // Os pacotes podem ser inseridos manualmente pelo admin mais tarde.
  // Aqui apenas garantimos que exista pelo menos um plano base sem impedir o arranque.
  await runSafe(`
    INSERT INTO subscription_packages
      (slug, nome, descricao, preco, moeda, duracao_dias, duracao_meses, consultorias_incluidas, suporte_prioritario, publicacoes_oportunidades_ilimitadas, max_oportunidades_ativas, beneficios, is_active, ordem)
    SELECT
      'basico',
      'Básico',
      'Plano básico para presença inicial na plataforma.',
      50000,
      'AOA',
      30,
      1,
      0,
      0,
      1,
      3,
      JSON_ARRAY('Perfil público', 'Vagas de emprego'),
      1,
      1
    FROM DUAL
    WHERE NOT EXISTS (
      SELECT 1 FROM subscription_packages WHERE slug = 'basico'
    )
  `, 'seed_subscription_package_basico');
};

const ensureBusinessModuleSchema = async () => {
  await ensureEmployeesSchema();
  await ensureVisitsSchema();
  await ensureMediationsSchema();
  await ensureSupportSchema();
  await ensureConsultancySchema();
  await ensureConsultationsSchema();
  await ensureCompanyDocumentsReviewSchema();
  await ensureSubscriptionsCompatibility();
};

module.exports = { ensureBusinessModuleSchema };
