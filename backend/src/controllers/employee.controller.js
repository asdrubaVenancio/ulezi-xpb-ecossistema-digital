/**
 * Controller de GestÃ£o de FuncionÃ¡rios
 * MÃ³dulo 7 - NegÃ³cios e Investimentos
 * 
 * Funcionalidades:
 * - CRUD de funcionÃ¡rios
 * - GestÃ£o de responsabilidades/funÃ§Ãµes
 * - AtribuiÃ§Ã£o a processos de mediaÃ§Ã£o
 * - Perfis de acesso
 */

const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');
const { sendEmployeeOnboardingEmail } = require('../utils/email');
const bcrypt = require('bcrypt');

const EMPLOYEE_DEFAULT_PASSWORD = process.env.EMPLOYEE_DEFAULT_PASSWORD || 'Ulezi@2026';
const RESTRICTED_CARGOS = new Set(['administrador', 'admin']);

const normalizeCargo = (cargo) => String(cargo || '').trim().toLowerCase();

const isRestrictedCargo = (cargo) => RESTRICTED_CARGOS.has(normalizeCargo(cargo));

const ensurePasswordChangeColumn = async (connection) => {
  try {
    const [rows] = await connection.execute(`SHOW COLUMNS FROM users LIKE 'password_change_required'`);
    if (!rows.length) {
      await connection.execute(
        `ALTER TABLE users ADD COLUMN password_change_required TINYINT(1) NOT NULL DEFAULT 0`
      );
    }
  } catch (err) {
    if (!String(err.message || '').includes('Duplicate column name')) {
      throw err;
    }
  }
};

const insertResponsibilities = async (connection, employeeId, responsabilidades = []) => {
  if (!Array.isArray(responsabilidades) || responsabilidades.length === 0) return;

  const values = [];
  const placeholders = responsabilidades.map((responsabilidade, index) => {
    values.push(
      employeeId,
      responsabilidade.tipo,
      responsabilidade.descricao || null,
      responsabilidade.prioridade || index + 1
    );
    return '(?, ?, ?, ?)';
  });

  await connection.execute(
    `INSERT INTO employee_responsibilities (employee_id, tipo_responsabilidade, descricao, prioridade)
     VALUES ${placeholders.join(', ')}`,
    values
  );
};

/**
 * GET /api/admin/employees
 * Lista todos os funcionÃ¡rios com filtros
 */
const listEmployees = async (req, res) => {
  try {
    const { 
      status = 'active', 
      departamento, 
      cargo,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status === 'active') {
      whereClause += ' AND e.is_active = 1';
    } else if (status === 'inactive') {
      whereClause += ' AND e.is_active = 0';
    }
    
    if (departamento) {
      whereClause += ' AND e.departamento = ?';
      params.push(departamento);
    }
    
    if (cargo) {
      whereClause += ' AND e.cargo LIKE ?';
      params.push(`%${cargo}%`);
    }
    
    // Query principal
    const [rows] = await pool.execute(
      `SELECT 
        e.id,
        e.user_id,
        u.nome,
        u.email,
        u.telefone,
        e.departamento,
        e.cargo,
        e.data_contratacao,
        e.tipo_contrato,
        e.horario_trabalho,
        e.is_active,
        e.created_at,
        e.updated_at,
        s.nome as supervisor_nome
       FROM employees e
       INNER JOIN users u ON u.id = e.user_id
       LEFT JOIN employees se ON se.id = e.supervisor_id
       LEFT JOIN users s ON s.id = se.user_id
       ${whereClause}
       ORDER BY e.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );
    
    // Contagem total
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM employees e
       ${whereClause}`,
      params
    );
    
    // Buscar responsabilidades para cada funcionÃ¡rio
    const employeesWithResponsibilities = await Promise.all(
      rows.map(async (emp) => {
        const [resps] = await pool.execute(
          `SELECT tipo_responsabilidade, descricao, is_active
           FROM employee_responsibilities
           WHERE employee_id = ? AND is_active = 1`,
          [emp.id]
        );
        return {
          ...emp,
          responsabilidades: resps.map(r => ({
            tipo: r.tipo_responsabilidade,
            descricao: r.descricao
          }))
        };
      })
    );
    
    return success(res, {
      funcionarios: employeesWithResponsibilities,
      total: countRows[0].total,
      pagina: parseInt(page),
      limite: parseInt(limit)
    });
    
  } catch (err) {
    console.error('[LIST_EMPLOYEES]', err);
    return error(res, 'Erro ao listar funcionÃ¡rios.', 500);
  }
};

/**
 * GET /api/admin/employees/:id
 * ObtÃ©m detalhes de um funcionÃ¡rio especÃ­fico
 */
const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT 
        e.id,
        e.user_id,
        u.nome,
        u.email,
        u.telefone,
        u.status as user_status,
        e.departamento,
        e.cargo,
        e.responsabilidades,
        e.data_contratacao,
        e.tipo_contrato,
        e.salario,
        e.horario_trabalho,
        e.supervisor_id,
        e.is_active,
        e.observacoes,
        e.created_at,
        e.updated_at,
        s.nome as supervisor_nome
       FROM employees e
       INNER JOIN users u ON u.id = e.user_id
       LEFT JOIN employees se ON se.id = e.supervisor_id
       LEFT JOIN users s ON s.id = se.user_id
       WHERE e.id = ?`,
      [id]
    );
    
    if (!rows.length) {
      return notFound(res, 'FuncionÃ¡rio nÃ£o encontrado.');
    }
    
    const employee = rows[0];
    
    // Buscar responsabilidades ativas
    const [responsibilities] = await pool.execute(
      `SELECT id, tipo_responsabilidade, descricao, prioridade
       FROM employee_responsibilities
       WHERE employee_id = ? AND is_active = 1
       ORDER BY prioridade ASC`,
      [id]
    );
    
    // Buscar estatÃ­sticas do funcionÃ¡rio
    const [stats] = await pool.execute(
      `SELECT 
        (SELECT COUNT(*) FROM mediations WHERE employee_id = ? AND status IN ('pendente', 'em_analise', 'em_andamento')) as mediacoes_ativas,
        (SELECT COUNT(*) FROM mediations WHERE employee_id = ? AND status = 'concluida') as mediacoes_concluidas,
        (SELECT COUNT(*) FROM company_visits WHERE employee_id = ? AND status = 'agendada') as visitas_agendadas,
        (SELECT COUNT(*) FROM company_visits WHERE employee_id = ? AND status = 'realizada' AND resultado = 'aprovado') as visitas_aprovadas,
        (SELECT COUNT(*) FROM support_tickets WHERE employee_id = ? AND status IN ('aberto', 'em_atendimento')) as tickets_ativos`,
      [id, id, id, id, id]
    );
    
    return success(res, {
      funcionario: {
        ...employee,
        responsabilidades: responsibilities,
        estatisticas: stats[0]
      }
    });
    
  } catch (err) {
    console.error('[GET_EMPLOYEE]', err);
    return error(res, 'Erro ao obter funcionÃ¡rio.', 500);
  }
};

/**
 * POST /api/admin/employees
 * Cria um novo funcionÃ¡rio
 */
const createEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    await ensurePasswordChangeColumn(connection);
    
    const {
      nome,
      email,
      telefone,
      password,
      departamento = 'Geral',
      cargo,
      data_contratacao = new Date().toISOString().split('T')[0],
      tipo_contrato = 'efetivo',
      salario,
      horario_trabalho = '09:00-18:00',
      supervisor_id,
      responsabilidades = [],
      observacoes
    } = req.body;
    
    // ValidaÃ§Ãµes
    if (!nome || !email || !cargo) {
      await connection.rollback();
      return badRequest(res, 'Nome, email e cargo sÃ£o obrigatÃ³rios.');
    }

    if (isRestrictedCargo(cargo)) {
      await connection.rollback();
      return badRequest(res, 'O cargo Administrador nao pode ser cadastrado por esta tela. Utilize Secretario ou outro cargo operacional.');
    }
    
    // Verificar se email jÃ¡ existe
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser.length > 0) {
      await connection.rollback();
      return badRequest(res, 'Email jÃ¡ registrado.');
    }
    
    // Criar hash da senha
    const temporaryPassword = password || EMPLOYEE_DEFAULT_PASSWORD;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(temporaryPassword, saltRounds);
    
    // Criar usuÃ¡rio
    const [userResult] = await connection.execute(
      `INSERT INTO users (nome, email, telefone, password_hash, role, status, email_verificado, password_change_required)
       VALUES (?, ?, ?, ?, 'employee', 'ativo', 1, 1)`,
      [nome, email, telefone || null, passwordHash]
    );
    
    const userId = userResult.insertId;
    
    // Criar funcionÃ¡rio
    const [empResult] = await connection.execute(
      `INSERT INTO employees 
       (user_id, departamento, cargo, data_contratacao, tipo_contrato, salario, horario_trabalho, supervisor_id, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, departamento, cargo, data_contratacao, tipo_contrato, salario || null, horario_trabalho, supervisor_id || null, observacoes || null]
    );
    
    const employeeId = empResult.insertId;
    
    await insertResponsibilities(connection, employeeId, responsabilidades);
    
    await connection.commit();

    const emailResult = await sendEmployeeOnboardingEmail({
      nome,
      email,
      passwordTemporaria: temporaryPassword,
    }).catch((emailErr) => {
      console.error('[EMPLOYEE_ONBOARDING_EMAIL]', emailErr);
      return { success: false, error: emailErr.message };
    });

    const emailEnviado = Boolean(emailResult?.success) && !emailResult?.simulated;
    
    await log(req.user.id, 'CREATE_EMPLOYEE', 'employees', employeeId, { nome, email, cargo }, req);
    
    return created(res, { 
      id: employeeId, 
      user_id: userId,
      password_temporaria: temporaryPassword,
      email_enviado: emailEnviado,
      email_simulado: Boolean(emailResult?.simulated),
      email_erro: emailResult?.success ? null : (emailResult?.error || 'Falha no envio do email.'),
      message: emailEnviado
        ? 'FuncionÃ¡rio criado com sucesso.'
        : 'FuncionÃ¡rio criado, mas o email com as credenciais nÃ£o foi enviado.'
    }, emailEnviado
      ? 'FuncionÃ¡rio criado com sucesso.'
      : 'FuncionÃ¡rio criado, mas o email com as credenciais nÃ£o foi enviado.');
    
  } catch (err) {
    await connection.rollback();
    console.error('[CREATE_EMPLOYEE]', err);
    return error(res, 'Erro ao criar funcionÃ¡rio.', 500);
  } finally {
    connection.release();
  }
};

/**
 * PUT /api/admin/employees/:id
 * Atualiza um funcionÃ¡rio existente
 */
const updateEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const {
      nome,
      email,
      telefone,
      departamento,
      cargo,
      tipo_contrato,
      salario,
      horario_trabalho,
      supervisor_id,
      is_active,
      observacoes,
      responsabilidades
    } = req.body;
    
    const [existing] = await connection.execute(
      'SELECT id, user_id FROM employees WHERE id = ?',
      [id]
    );
    
    if (!existing.length) {
      await connection.rollback();
      return notFound(res, 'Funcionário não encontrado.');
    }

    if (email) {
      const [emailOwner] = await connection.execute(
        'SELECT id FROM users WHERE email = ? AND id <> ?',
        [email, existing[0].user_id]
      );

      if (emailOwner.length > 0) {
        await connection.rollback();
        return badRequest(res, 'Email já registrado.');
      }
    }

    if (cargo !== undefined && isRestrictedCargo(cargo)) {
      await connection.rollback();
      return badRequest(res, 'O cargo Administrador nao pode ser cadastrado por esta tela. Utilize Secretario ou outro cargo operacional.');
    }

    const userUpdates = [];
    const userParams = [];

    if (nome !== undefined) { userUpdates.push('nome = ?'); userParams.push(nome); }
    if (email !== undefined) { userUpdates.push('email = ?'); userParams.push(email); }
    if (telefone !== undefined) { userUpdates.push('telefone = ?'); userParams.push(telefone || null); }

    if (userUpdates.length > 0) {
      userParams.push(existing[0].user_id);
      await connection.execute(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
        userParams
      );
    }
    
    const updates = [];
    const params = [];
    
    if (departamento !== undefined) { updates.push('departamento = ?'); params.push(departamento); }
    if (cargo !== undefined) { updates.push('cargo = ?'); params.push(cargo); }
    if (tipo_contrato !== undefined) { updates.push('tipo_contrato = ?'); params.push(tipo_contrato); }
    if (salario !== undefined) { updates.push('salario = ?'); params.push(salario); }
    if (horario_trabalho !== undefined) { updates.push('horario_trabalho = ?'); params.push(horario_trabalho); }
    if (supervisor_id !== undefined) { updates.push('supervisor_id = ?'); params.push(supervisor_id || null); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (observacoes !== undefined) { updates.push('observacoes = ?'); params.push(observacoes || null); }
    
    if (updates.length > 0) {
      params.push(id);
      await connection.execute(
        `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }
    
    if (Array.isArray(responsabilidades)) {
      await connection.execute(
        'UPDATE employee_responsibilities SET is_active = 0 WHERE employee_id = ?',
        [id]
      );

      await insertResponsibilities(connection, id, responsabilidades);
    }
    
    await connection.commit();
    
    await log(req.user.id, 'UPDATE_EMPLOYEE', 'employees', id, { nome, email, departamento, cargo }, req);
    
    return success(res, { message: 'Funcionário atualizado com sucesso.' });
    
  } catch (err) {
    await connection.rollback();
    console.error('[UPDATE_EMPLOYEE]', err);
    return error(res, 'Erro ao atualizar funcionário.', 500);
  } finally {
    connection.release();
  }
};

/**
 * DELETE /api/admin/employees/:id
 * Desativa um funcionário (soft delete)
 */
const deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const [existing] = await pool.execute(
      `SELECT e.id, e.user_id, u.nome
       FROM employees e
       INNER JOIN users u ON u.id = e.user_id
       WHERE e.id = ?`,
      [id]
    );
    
    if (!existing.length) {
      return notFound(res, 'Funcionário não encontrado.');
    }
    
    await pool.execute(
      'UPDATE employees SET is_active = 0 WHERE id = ?',
      [id]
    );
    
    await pool.execute(
      'UPDATE users SET status = "inativo" WHERE id = ?',
      [existing[0].user_id]
    );
    
    await log(req.user.id, 'DEACTIVATE_EMPLOYEE', 'employees', id, { motivo }, req);
    
    return success(res, { message: 'Funcionário desativado com sucesso.' });
    
  } catch (err) {
    console.error('[DEACTIVATE_EMPLOYEE]', err);
    return error(res, 'Erro ao desativar funcionário.', 500);
  }
};
/**
 * GET /api/admin/employees/available-for-mediation
 * Lista funcionÃ¡rios disponÃ­veis para mediaÃ§Ã£o
 */
const listAvailableForMediation = async (req, res) => {
  try {
    const { tipo_responsabilidade = 'mediacao_negocios' } = req.query;
    
    const [rows] = await pool.execute(
      `SELECT 
        e.id,
        u.nome,
        u.email,
        e.departamento,
        e.cargo,
        (SELECT COUNT(*) FROM mediations WHERE employee_id = e.id AND status IN ('pendente', 'em_analise', 'em_andamento')) as mediacoes_ativas
       FROM employees e
       INNER JOIN users u ON u.id = e.user_id
       INNER JOIN employee_responsibilities er ON er.employee_id = e.id
       WHERE e.is_active = 1
         AND er.tipo_responsabilidade = ?
         AND er.is_active = 1
       ORDER BY mediacoes_ativas ASC, e.created_at DESC`,
      [tipo_responsabilidade]
    );
    
    return success(res, { funcionarios: rows });
    
  } catch (err) {
    console.error('[LIST_AVAILABLE_MEDIATION]', err);
    return error(res, 'Erro ao listar funcionÃ¡rios disponÃ­veis.', 500);
  }
};

/**
 * GET /api/admin/employees/stats
 * EstatÃ­sticas gerais dos funcionÃ¡rios
 */
const getEmployeeStats = async (req, res) => {
  try {
    // EstatÃ­sticas gerais
    const [[stats]] = await pool.execute(
      `SELECT 
        COUNT(*) as total_funcionarios,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as ativos,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inativos,
        COUNT(DISTINCT departamento) as total_departamentos
       FROM employees`
    );
    
    // Por departamento
    const [byDepartment] = await pool.execute(
      `SELECT 
        departamento,
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as ativos
       FROM employees
       GROUP BY departamento
       ORDER BY total DESC`
    );
    
    // FuncionÃ¡rios mais ativos (mediaÃ§Ãµes)
    const [mostActive] = await pool.execute(
      `SELECT 
        e.id,
        u.nome,
        COUNT(m.id) as total_mediacoes,
        COUNT(CASE WHEN m.status = 'concluida' THEN 1 END) as mediacoes_concluidas
       FROM employees e
       INNER JOIN users u ON u.id = e.user_id
       LEFT JOIN mediations m ON m.employee_id = e.id
       WHERE e.is_active = 1
       GROUP BY e.id
       ORDER BY total_mediacoes DESC
       LIMIT 10`
    );
    
    return success(res, {
      estatisticas_gerais: stats,
      por_departamento: byDepartment,
      funcionarios_mais_ativos: mostActive
    });
    
  } catch (err) {
    console.error('[EMPLOYEE_STATS]', err);
    return error(res, 'Erro ao obter estatÃ­sticas.', 500);
  }
};

/**
 * POST /api/admin/employees/:id/responsibilities
 * Adiciona uma responsabilidade a um funcionÃ¡rio
 */
const addResponsibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_responsabilidade, descricao, prioridade = 1 } = req.body;
    
    if (!tipo_responsabilidade) {
      return badRequest(res, 'Tipo de responsabilidade Ã© obrigatÃ³rio.');
    }
    
    const [result] = await pool.execute(
      `INSERT INTO employee_responsibilities 
       (employee_id, tipo_responsabilidade, descricao, prioridade)
       VALUES (?, ?, ?, ?)`,
      [id, tipo_responsabilidade, descricao || null, prioridade]
    );
    
    await log(req.user.id, 'ADD_RESPONSIBILITY', 'employee_responsibilities', result.insertId, { employee_id: id, tipo: tipo_responsabilidade }, req);
    
    return created(res, { id: result.insertId, message: 'Responsabilidade adicionada.' });
    
  } catch (err) {
    console.error('[ADD_RESPONSIBILITY]', err);
    return error(res, 'Erro ao adicionar responsabilidade.', 500);
  }
};

/**
 * DELETE /api/admin/employees/:id/responsibilities/:respId
 * Remove uma responsabilidade
 */
const removeResponsibility = async (req, res) => {
  try {
    const { id, respId } = req.params;
    
    await pool.execute(
      'UPDATE employee_responsibilities SET is_active = 0 WHERE id = ? AND employee_id = ?',
      [respId, id]
    );
    
    await log(req.user.id, 'REMOVE_RESPONSIBILITY', 'employee_responsibilities', respId, { employee_id: id }, req);
    
    return success(res, { message: 'Responsabilidade removida.' });
    
  } catch (err) {
    console.error('[REMOVE_RESPONSIBILITY]', err);
    return error(res, 'Erro ao remover responsabilidade.', 500);
  }
};

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  listAvailableForMediation,
  getEmployeeStats,
  addResponsibility,
  removeResponsibility
};


