/**
 * Compatibilidade do schema do módulo de formação.
 * Mantém o monólito funcional mesmo sem um sistema formal de migrations.
 */
const { pool } = require('../config/database');

const hasColumn = async (tableName, columnName) => {
  try {
    const [rows] = await pool.execute(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
    return rows.length > 0;
  } catch (error) {
    // Tabela não existe ainda
    return false;
  }
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  const exists = await hasColumn(tableName, columnName);
  if (!exists) {
    try {
      await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    } catch (error) {
      // Silenciosamente ignorar erros de coluna duplicada
      if (!error.message.includes('Duplicate column name')) {
        console.log(`⚠️  Aviso: Não foi possível adicionar coluna ${columnName} à tabela ${tableName}: ${error.message}`);
      }
    }
  }
};

const ensureTrainingModuleSchema = async () => {
  // Ofertas do curso por centro, com preço e exigências específicas.
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS training_center_courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      center_id INT NOT NULL,
      course_id INT NOT NULL,
      preco DECIMAL(12,2) NOT NULL DEFAULT 0,
      carga_horaria INT NULL,
      modalidade ENUM('presencial','online') NOT NULL DEFAULT 'presencial',
      certificado_exigido TINYINT(1) NOT NULL DEFAULT 0,
      especificacoes TEXT NULL,
      status ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_center_course (center_id, course_id),
      INDEX idx_tcc_center (center_id),
      INDEX idx_tcc_course (course_id)
    )
  `);

  await addColumnIfMissing('enrollments', 'offering_id', 'INT NULL AFTER center_id');
  await addColumnIfMissing('training_centers', 'descricao', 'TEXT NULL AFTER telefone');
  await addColumnIfMissing('training_center_courses', 'modalidade', `ENUM('presencial','online') NOT NULL DEFAULT 'presencial' AFTER carga_horaria`);
  await addColumnIfMissing('enrollments', 'documento_requisito_url', 'VARCHAR(255) NULL AFTER observacoes');
  await addColumnIfMissing('enrollments', 'documento_requisito_nome', 'VARCHAR(255) NULL AFTER documento_requisito_url');
  await addColumnIfMissing('enrollments', 'documento_requisito_mime', 'VARCHAR(120) NULL AFTER documento_requisito_nome');
  await addColumnIfMissing('enrollments', 'comprovativo_visualizado_em', 'DATETIME NULL AFTER documento_requisito_mime');
  await addColumnIfMissing('enrollments', 'documento_visualizado_em', 'DATETIME NULL AFTER comprovativo_visualizado_em');
  await addColumnIfMissing('enrollments', 'motivo_rejeicao', 'TEXT NULL AFTER documento_visualizado_em');
  await addColumnIfMissing('enrollments', 'aprovado_by', 'INT NULL AFTER motivo_rejeicao');
  await addColumnIfMissing('enrollments', 'aprovado_at', 'DATETIME NULL AFTER aprovado_by');

  try {
    const [legacyLinks] = await pool.execute(`
      SELECT cc.center_id, cc.course_id, c.preco, c.duracao
      FROM center_courses cc
      INNER JOIN courses c ON c.id = cc.course_id
    `);

    for (const link of legacyLinks) {
      await pool.execute(
        `INSERT INTO training_center_courses
          (center_id, course_id, preco, carga_horaria, certificado_exigido, especificacoes, created_by)
         VALUES (?, ?, ?, ?, 0, NULL, 1)
         ON DUPLICATE KEY UPDATE
           preco = COALESCE(training_center_courses.preco, VALUES(preco)),
           carga_horaria = COALESCE(training_center_courses.carga_horaria, VALUES(carga_horaria))`,
        [
          link.center_id,
          link.course_id,
          Number(link.preco || 0),
          link.duracao ? parseInt(link.duracao, 10) || null : null,
        ]
      );
    }
  } catch (error) {
    console.log('⚠️  Aviso: Não foi possível migrar dados de center_courses (tabela pode não existir ainda)');
  }
};

module.exports = { ensureTrainingModuleSchema };
