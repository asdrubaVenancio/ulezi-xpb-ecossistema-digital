/**
 * Controller de Visitas de Verificação Física
 * Módulo 7 - Negócios e Investimentos
 * 
 * Gerencia o processo de visitas presenciais para validação de empresas
 */

const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');
const { sendEmail } = require('../utils/email');

/**
 * GET /api/admin/visits
 * Lista todas as visitas agendadas com filtros
 */
const listVisits = async (req, res) => {
  try {
    const {
      status,
      resultado,
      employee_id,
      company_id,
      data_inicio,
      data_fim,
      page = 1,
      limit = 20
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND cv.status = ?';
      params.push(status);
    }
    
    if (resultado) {
      whereClause += ' AND cv.resultado = ?';
      params.push(resultado);
    }
    
    if (employee_id) {
      whereClause += ' AND cv.employee_id = ?';
      params.push(employee_id);
    }
    
    if (company_id) {
      whereClause += ' AND cv.company_id = ?';
      params.push(company_id);
    }
    
    if (data_inicio) {
      whereClause += ' AND cv.data_visita >= ?';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      whereClause += ' AND cv.data_visita <= ?';
      params.push(data_fim);
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        cv.id,
        cv.company_id,
        cv.employee_id,
        cv.data_visita,
        cv.hora_visita,
        cv.endereco_visita,
        cv.status,
        cv.resultado,
        cv.observacoes,
        cv.relatorio_visita,
        cv.requer_segunda_visita,
        cv.data_criacao,
        cv.data_realizacao,
        cp.nome_empresa,
        cp.provincia,
        cp.municipio,
        cp.endereco as endereco_empresa,
        u.nome as nome_funcionario,
        creator.nome as criado_por
       FROM company_visits cv
       INNER JOIN company_profiles cp ON cp.id = cv.company_id
       INNER JOIN employees e ON e.id = cv.employee_id
       INNER JOIN users u ON u.id = e.user_id
       INNER JOIN users creator ON creator.id = cv.created_by
       ${whereClause}
       ORDER BY cv.data_visita DESC, cv.hora_visita ASC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );
    
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM company_visits cv ${whereClause}`,
      params
    );
    
    return success(res, {
      visitas: rows,
      total: countRows[0].total,
      pagina: parseInt(page),
      limite: parseInt(limit)
    });
    
  } catch (err) {
    console.error('[LIST_VISITS]', err);
    return error(res, 'Erro ao listar visitas.', 500);
  }
};

/**
 * GET /api/admin/visits/:id
 * Obtém detalhes de uma visita específica
 */
const getVisit = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT 
        cv.*,
        cp.nome_empresa,
        cp.descricao,
        cp.sector,
        cp.provincia,
        cp.municipio,
        cp.endereco,
        cp.nif,
        u.nome as nome_funcionario,
        u.email as email_funcionario,
        u.telefone as telefone_funcionario,
        creator.nome as criado_por_nome
       FROM company_visits cv
       INNER JOIN company_profiles cp ON cp.id = cv.company_id
       INNER JOIN employees e ON e.id = cv.employee_id
       INNER JOIN users u ON u.id = e.user_id
       INNER JOIN users creator ON creator.id = cv.created_by
       WHERE cv.id = ?`,
      [id]
    );
    
    if (!rows.length) {
      return notFound(res, 'Visita não encontrada.');
    }
    
    // Buscar documentos da empresa
    const [documents] = await pool.execute(
      `SELECT id, tipo, nome_ficheiro, url_ficheiro, status_verificacao, created_at
       FROM company_documents
       WHERE company_id = ?`,
      [rows[0].company_id]
    );
    
    return success(res, {
      visita: rows[0],
      documentos_empresa: documents
    });
    
  } catch (err) {
    console.error('[GET_VISIT]', err);
    return error(res, 'Erro ao obter visita.', 500);
  }
};

/**
 * POST /api/admin/visits
 * Agenda uma nova visita de verificação
 */
const scheduleVisit = async (req, res) => {
  try {
    const {
      company_id,
      employee_id,
      data_visita,
      hora_visita,
      endereco_visita,
      observacoes
    } = req.body;
    
    // Validações
    if (!company_id || !employee_id || !data_visita) {
      return badRequest(res, 'Empresa, funcionário e data da visita são obrigatórios.');
    }
    
    // Verificar se empresa existe
    const [company] = await pool.execute(
      'SELECT id, nome_empresa, user_id FROM company_profiles WHERE id = ?',
      [company_id]
    );
    
    if (!company.length) {
      return notFound(res, 'Empresa não encontrada.');
    }
    
    // Verificar se funcionário existe e está ativo
    const [employee] = await pool.execute(
      `SELECT e.id, u.nome, u.email
       FROM employees e
       INNER JOIN users u ON u.id = e.user_id
       WHERE e.id = ? AND e.is_active = 1`,
      [employee_id]
    );
    
    if (!employee.length) {
      return badRequest(res, 'Funcionário não encontrado ou inativo.');
    }
    
    // Verificar disponibilidade do funcionário
    const [existingVisit] = await pool.execute(
      `SELECT id FROM company_visits 
       WHERE employee_id = ? AND data_visita = ? AND hora_visita = ? AND status != 'cancelada'`,
      [employee_id, data_visita, hora_visita]
    );
    
    if (existingVisit.length > 0) {
      return badRequest(res, 'Funcionário já tem visita agendada neste horário.');
    }
    
    // Criar visita
    const [result] = await pool.execute(
      `INSERT INTO company_visits 
       (company_id, employee_id, data_visita, hora_visita, endereco_visita, observacoes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [company_id, employee_id, data_visita, hora_visita || null, endereco_visita || null, observacoes || null, req.user.id]
    );
    
    // Notificar funcionário
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
       SELECT user_id, 'visita_agendada', 'Nova visita agendada',
              CONCAT('Visita à empresa ', ?, ' agendada para ', ?, ' às ', ?), ?
       FROM employees WHERE id = ?`,
      [company[0].nome_empresa, data_visita, hora_visita || 'a definir', '/painel/admin', employee_id]
    );
    
    // Notificar empresa
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
       VALUES (?, 'visita_agendada', 'Visita de verificação agendada',
               CONCAT('Uma visita de verificação foi agendada para ', ?, '. O funcionário ', ?, ' será o responsável.'), ?)`,
      [company[0].user_id, data_visita, employee[0].nome, '/painel/empresa']
    );
    
    // Enviar email para funcionário
    sendEmail({
      to: employee[0].email,
      subject: 'Nova Visita de Verificação Agendada - ULEZI XPB',
      html: `
        <h2>Nova Visita Agendada</h2>
        <p>Olá ${employee[0].nome},</p>
        <p>Uma visita de verificação foi agendada:</p>
        <ul>
          <li><strong>Empresa:</strong> ${company[0].nome_empresa}</li>
          <li><strong>Data:</strong> ${data_visita}</li>
          <li><strong>Hora:</strong> ${hora_visita || 'A definir'}</li>
          <li><strong>Endereço:</strong> ${endereco_visita || 'Sede da empresa'}</li>
        </ul>
        <p>Prepare o roteiro de verificação e documentos necessários.</p>
      `
    }).catch(e => console.error('[EMAIL VISIT]', e));
    
    await log(req.user.id, 'SCHEDULE_VISIT', 'company_visits', result.insertId, { company_id, employee_id, data_visita }, req);
    
    return created(res, {
      id: result.insertId,
      message: 'Visita agendada com sucesso.',
      visita: {
        empresa: company[0].nome_empresa,
        funcionario: employee[0].nome,
        data_visita,
        hora_visita
      }
    });
    
  } catch (err) {
    console.error('[SCHEDULE_VISIT]', err);
    return error(res, 'Erro ao agendar visita.', 500);
  }
};

/**
 * PUT /api/admin/visits/:id
 * Atualiza uma visita (reagendamento ou alterações)
 */
const updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      data_visita,
      hora_visita,
      endereco_visita,
      employee_id,
      observacoes,
      status
    } = req.body;
    
    const [existing] = await pool.execute(
      'SELECT * FROM company_visits WHERE id = ?',
      [id]
    );
    
    if (!existing.length) {
      return notFound(res, 'Visita não encontrada.');
    }
    
    const updates = [];
    const params = [];
    
    if (data_visita !== undefined) { updates.push('data_visita = ?'); params.push(data_visita); }
    if (hora_visita !== undefined) { updates.push('hora_visita = ?'); params.push(hora_visita); }
    if (endereco_visita !== undefined) { updates.push('endereco_visita = ?'); params.push(endereco_visita); }
    if (employee_id !== undefined) { updates.push('employee_id = ?'); params.push(employee_id); }
    if (observacoes !== undefined) { updates.push('observacoes = ?'); params.push(observacoes); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    
    if (updates.length === 0) {
      return badRequest(res, 'Nenhum campo para atualizar.');
    }
    
    params.push(id);
    await pool.execute(
      `UPDATE company_visits SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    await log(req.user.id, 'UPDATE_VISIT', 'company_visits', id, { status, data_visita }, req);
    
    return success(res, { message: 'Visita atualizada com sucesso.' });
    
  } catch (err) {
    console.error('[UPDATE_VISIT]', err);
    return error(res, 'Erro ao atualizar visita.', 500);
  }
};

/**
 * POST /api/admin/visits/:id/complete
 * Completa uma visita com relatório e resultado
 */
const completeVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      resultado,
      relatorio_visita,
      documentos_verificados,
      fotos_local,
      recomendacoes,
      motivo_rejeicao,
      requer_segunda_visita
    } = req.body;
    
    if (!resultado || !['aprovado', 'reprovado', 'condicional'].includes(resultado)) {
      return badRequest(res, 'Resultado deve ser: aprovado, reprovado ou condicional.');
    }
    
    const [existing] = await pool.execute(
      `SELECT cv.*, cp.nome_empresa, cp.user_id, u.nome as nome_funcionario
       FROM company_visits cv
       INNER JOIN company_profiles cp ON cp.id = cv.company_id
       INNER JOIN employees e ON e.id = cv.employee_id
       INNER JOIN users u ON u.id = e.user_id
       WHERE cv.id = ?`,
      [id]
    );
    
    if (!existing.length) {
      return notFound(res, 'Visita não encontrada.');
    }
    
    const visit = existing[0];
    
    // Atualizar visita
    await pool.execute(
      `UPDATE company_visits SET
        resultado = ?,
        relatorio_visita = ?,
        documentos_verificados = ?,
        fotos_local = ?,
        recomendacoes = ?,
        motivo_rejeicao = ?,
        requer_segunda_visita = ?,
        status = 'realizada',
        data_realizacao = NOW()
       WHERE id = ?`,
      [
        resultado,
        relatorio_visita || null,
        documentos_verificados ? JSON.stringify(documentos_verificados) : null,
        fotos_local || null,
        recomendacoes || null,
        motivo_rejeicao || null,
        requer_segunda_visita ? 1 : 0,
        id
      ]
    );
    
    // Se aprovado, atualizar status da empresa para "em aprovação final"
    if (resultado === 'aprovado' && !requer_segunda_visita) {
      await pool.execute(
        `UPDATE company_profiles SET
         status_verificacao = 'aprovado_visita',
         visita_verificacao_id = ?
         WHERE id = ?`,
        [id, visit.company_id]
      );
      
      // Notificar admin para aprovação final
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
         SELECT id, 'aprovacao_final', 'Empresa aprovada na visita',
                CONCAT('A empresa ', ?, ' foi aprovada na visita de verificação. Aguardando aprovação final.'), ?
         FROM users WHERE role = 'admin'`,
        [visit.nome_empresa, '/painel/admin']
      );
    }
    
    // Se reprovado
    if (resultado === 'reprovado') {
      await pool.execute(
        `UPDATE company_profiles SET status_verificacao = 'reprovado_visita' WHERE id = ?`,
        [visit.company_id]
      );
      
      // Notificar empresa
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
         VALUES (?, 'visita_reprovada', 'Visita de verificação não aprovada',
                 CONCAT('A visita de verificação não foi aprovada. Motivo: ', ?), ?)`,
        [visit.user_id, motivo_rejeicao || 'Não atende aos requisitos da plataforma.', '/painel/empresa']
      );
    }
    
    await log(req.user.id, 'COMPLETE_VISIT', 'company_visits', id, { resultado }, req);
    
    return success(res, {
      message: 'Visita concluída com sucesso.',
      resultado,
      proximo_passo: resultado === 'aprovado' && !requer_segunda_visita
        ? 'Aguardando aprovação final do administrador'
        : resultado === 'reprovado'
        ? 'Empresa notificada da rejeição'
        : 'Aguardando segunda visita'
    });
    
  } catch (err) {
    console.error('[COMPLETE_VISIT]', err);
    return error(res, 'Erro ao completar visita.', 500);
  }
};

/**
 * DELETE /api/admin/visits/:id
 * Cancela uma visita
 */
const cancelVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const [existing] = await pool.execute(
      'SELECT * FROM company_visits WHERE id = ?',
      [id]
    );
    
    if (!existing.length) {
      return notFound(res, 'Visita não encontrada.');
    }
    
    if (existing[0].status === 'realizada') {
      return badRequest(res, 'Não é possível cancelar uma visita já realizada.');
    }
    
    await pool.execute(
      'UPDATE company_visits SET status = "cancelada", observacoes = CONCAT(observacoes, "\nCancelada: ", ?) WHERE id = ?',
      [motivo || 'Sem motivo', id]
    );
    
    await log(req.user.id, 'CANCEL_VISIT', 'company_visits', id, { motivo }, req);
    
    return success(res, { message: 'Visita cancelada com sucesso.' });
    
  } catch (err) {
    console.error('[CANCEL_VISIT]', err);
    return error(res, 'Erro ao cancelar visita.', 500);
  }
};

/**
 * GET /api/admin/visits/calendar/:month
 * Retorna visitas para o calendário (mês específico)
 */
const getVisitCalendar = async (req, res) => {
  try {
    const { month } = req.params; // formato: YYYY-MM
    const { employee_id } = req.query;
    
    const [year, monthNum] = month.split('-');
    
    let whereClause = 'WHERE YEAR(data_visita) = ? AND MONTH(data_visita) = ?';
    const params = [year, monthNum];
    
    if (employee_id) {
      whereClause += ' AND cv.employee_id = ?';
      params.push(employee_id);
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        cv.id,
        cv.data_visita,
        cv.hora_visita,
        cv.status,
        cv.resultado,
        cp.nome_empresa,
        cp.provincia,
        u.nome as nome_funcionario
       FROM company_visits cv
       INNER JOIN company_profiles cp ON cp.id = cv.company_id
       INNER JOIN employees e ON e.id = cv.employee_id
       INNER JOIN users u ON u.id = e.user_id
       ${whereClause}
       ORDER BY cv.data_visita, cv.hora_visita`,
      params
    );
    
    // Agrupar por data
    const grouped = rows.reduce((acc, visit) => {
      const date = visit.data_visita.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(visit);
      return acc;
    }, {});
    
    return success(res, {
      mes: month,
      visitas_por_dia: grouped,
      total: rows.length
    });
    
  } catch (err) {
    console.error('[VISIT_CALENDAR]', err);
    return error(res, 'Erro ao obter calendário.', 500);
  }
};

/**
 * GET /api/admin/visits/stats
 * Estatísticas de visitas
 */
const getVisitStats = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (data_inicio && data_fim) {
      dateFilter = 'WHERE data_visita BETWEEN ? AND ?';
      params.push(data_inicio, data_fim);
    }
    
    // Estatísticas gerais
    const [[stats]] = await pool.execute(
      `SELECT 
        COUNT(*) as total_visitas,
        COUNT(CASE WHEN status = 'agendada' THEN 1 END) as agendadas,
        COUNT(CASE WHEN status = 'realizada' THEN 1 END) as realizadas,
        COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as canceladas,
        COUNT(CASE WHEN resultado = 'aprovado' THEN 1 END) as aprovadas,
        COUNT(CASE WHEN resultado = 'reprovado' THEN 1 END) as reprovadas,
        COUNT(CASE WHEN resultado = 'condicional' THEN 1 END) as condicionais
       FROM company_visits
       ${dateFilter}`,
      params
    );
    
    // Por funcionário
    const [byEmployee] = await pool.execute(
      `SELECT 
        e.id,
        u.nome,
        COUNT(*) as total,
        COUNT(CASE WHEN cv.resultado = 'aprovado' THEN 1 END) as aprovadas,
        COUNT(CASE WHEN cv.resultado = 'reprovado' THEN 1 END) as reprovadas
       FROM company_visits cv
       INNER JOIN employees e ON e.id = cv.employee_id
       INNER JOIN users u ON u.id = e.user_id
       ${dateFilter.replace('WHERE', 'WHERE cv.')}
       GROUP BY e.id
       ORDER BY total DESC`,
      params
    );
    
    // Visitas próximas (próximos 7 dias)
    const [upcoming] = await pool.execute(
      `SELECT 
        cv.id,
        cv.data_visita,
        cv.hora_visita,
        cp.nome_empresa,
        cp.provincia,
        u.nome as nome_funcionario
       FROM company_visits cv
       INNER JOIN company_profiles cp ON cp.id = cv.company_id
       INNER JOIN employees e ON e.id = cv.employee_id
       INNER JOIN users u ON u.id = e.user_id
       WHERE cv.data_visita BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         AND cv.status = 'agendada'
       ORDER BY cv.data_visita, cv.hora_visita
       LIMIT 10`
    );
    
    return success(res, {
      estatisticas_gerais: stats,
      por_funcionario: byEmployee,
      proximas_visitas: upcoming
    });
    
  } catch (err) {
    console.error('[VISIT_STATS]', err);
    return error(res, 'Erro ao obter estatísticas.', 500);
  }
};

module.exports = {
  listVisits,
  getVisit,
  scheduleVisit,
  updateVisit,
  completeVisit,
  cancelVisit,
  getVisitCalendar,
  getVisitStats
};
