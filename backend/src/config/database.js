/**
 * Configuração da Conexão com o MySQL
 * Utiliza pool de conexões para melhor desempenho
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexões com MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  // Suportar tanto DB_PASS como DB_PASSWORD
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ulezi2_xpb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4',
  multipleStatements: false, // Segurança: previne múltiplas queries numa só chamada
});

/**
 * Testa a conexão com a base de dados
 */
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    conn.release();
  } catch (error) {
    console.error('❌ Erro ao conectar ao MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
