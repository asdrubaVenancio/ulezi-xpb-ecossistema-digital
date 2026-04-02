/**
 * Controller de Consultoria
 * Módulo 7 - Negócios e Investimentos
 * 
 * Gerencia sessões de consultoria empresarial e para investidores
 */

const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');

/**
 * GET /api/consultations
 * Lista consultas do usuário logado
 */
const listUserConsultations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE c.user_id = ?';
    const params = [userId];
    
    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        c.id,
        c.tipo_consultoria,
        c.tema,
        c.status,
        c.data_agendada,
        c.hora_inicio,
        c.hora_fim,
        c.duracao_minutos,
        c.valor,
        c.created_at,
        emp.nome as consultor_nome,
        e.cargo as consultor_cargo,
        CASE 
          WHEN c.status = 'agendada' AND c.data_agendada < CURDATE() THEN 'atrasada'
          WHEN c.status = 'agendada' AND c.data_agendada = CURDATE() THEN 'hoje'
          ELSE c.status
        END as situacao
       FROM consultations c
       LEFT JOIN employees e ON e.id = c.employee_id
       LEFT JOIN users emp ON emp.id = e.user_id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );
    
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM consultations c ${whereClause}`,
      params
    );
    
    return success(res, {
      consultas: rows,
      total: countRows[0].total,
      pagina: parseInt(page),
      limite: parseInt(limit)
    });
    
  } catch (err) {
    console.error('[LIST_USER_CONSULTATIONS]', err);
    return error(res, 'Erro ao listar consultas.', 500);
  }
};

/**
 * GET /api/admin/consultations
 * Lista todas as consultas (admin)
 */
const listAllConsultations = async (req, res) => {
  try {
    const { 
      status, 
      tipo_consultoria, 
      employee_id,
      data_inicio,
      data_fim,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }
    
    if (tipo_consultoria) {
      whereClause += ' AND c.tipo_consultoria = ?';
      params.push(tipo_consultoria);
    }
    
    if (employee_id) {
      whereClause += ' AND c.employee_id = ?';
      params.push(employee_id);
    }
    
    if (data_inicio) {
      whereClause += ' AND c.data_agendada >= ?';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      whereClause += ' AND c.data_agendada <= ?';
      params.push(data_fim);
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        c.*,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.role as usuario_tipo,
        emp.nome as consultor_nome,
        e.cargo as consultor_cargo,
        CASE 
          WHEN c.status = 'agendada' AND c.data_agendada < CURDATE() THEN 'atrasada'
          WHEN c.status = 'agendada' AND c.data_agendada = CURDATE() THEN 'hoje'
          ELSE c.status
        END as situacao
       FROM consultations c
       INNER JOIN users u ON u.id = c.user_id
       LEFT JOIN employees e ON e.id = c.employee_id
       LEFT JOIN users emp ON emp.id = e.user_id
       ${whereClause}
       ORDER BY 
         FIELD(c.status, 'pendente', 'agendada', 'confirmada', 'realizada'),
         c.data_agendada ASC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );
    
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM consultations c ${whereClause}`,
      params
    );
    
    return success(res, {
      consultas: rows,
      total: countRows[0].total,
      pagina: parseInt(page),
      limite: parseInt(limit)
    });
    
  } catch (err) {
    console.error('[LIST_ALL_CONSULTATIONS]', err);
    return error(res, 'Erro ao listar consultas.', 500);
  }
};

/**
 * GET /api/consultations/:id
 * Obtém detalhes de uma consulta
 */
const getConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
    
    const [rows] = await pool.execute(
      `SELECT 
        c.*,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.telefone as usuario_telefone,
        emp.nome as consultor_nome,
        emp.email as consultor_email,
        emp.telefone as consultor_telefone,
        e.cargo as consultor_cargo
       FROM consultations c
       INNER JOIN users u ON u.id = c.user_id
       LEFT JOIN employees e ON e.id = c.employee_id
       LEFT JOIN users emp ON emp.id = e.user_id
       WHERE c.id = ? ${!isAdmin ? 'AND c.user_id = ?' : ''}`,
      isAdmin ? [id] : [id, userId]
    );
    
    if (!rows.length) {
      return notFound(res, 'Consulta não encontrada.');
    }
    
    return success(res, { consulta: rows[0] });
    
  } catch (err) {
    console.error('[GET_CONSULTATION]', err);
    return error(res, 'Erro ao obter consulta.', 500);
  }
};

/**
 * POST /api/consultations
 * Solicita uma nova consulta
 */
const createConsultation = async (req, res) => {
  try {
    const { 
      tipo_consultoria, 
      tema, 
      descricao, 
      preferencia_data,
      preferencia_horario,
      duracao_solicitada = 60
    } = req.body;
    const userId = req.user.id;
    
    if (!tipo_consultoria || !tema || !descricao) {
      return badRequest(res, 'Tipo, tema e descrição são obrigatórios.');
    }
    
    // Verificar limite de consultas pendentes por usuário
    const [[pendingCount]] = await pool.execute(
      `SELECT COUNT(*) as total FROM consultations 
       WHERE user_id = ? AND status IN ('pendente', 'agendada')`,
      [userId]
    );
    
    if (pendingCount.total >= 3) {
      return badRequest(res, 'Você já tem 3 consultas pendentes. Aguarde o atendimento antes de solicitar novas.');
    }
    
    const [result] = await pool.execute(
      `INSERT INTO consultations 
       (user_id, tipo_consultoria, tema, descricao, preferencia_data, preferencia_horario, duracao_solicitada, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [userId, tipo_consultoria, tema, descricao, preferencia_data || null, preferencia_horario || null, duracao_solicitada]
    );
    
    // Notificar admins
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       SELECT id, 'nova_consulta', 'Nova solicitação de consultoria',
              CONCAT('Nova consulta solicitada: ', ?, ' - ', ?)
       FROM users WHERE role IN ('admin', 'employee')`,
      [tipo_consultoria, tema]
    );
    
    await log(userId, 'CREATE_CONSULTATION', 'consultations', result.insertId, { tipo_consultoria, tema }, req);
    
    return created(res, {
      id: result.insertId,
      message: 'Consulta solicitada com sucesso. Aguarde o agendamento.'
    });
    
  } catch (err) {
    console.error('[CREATE_CONSULTATION]', err);
    return error(res, 'Erro ao solicitar consulta.', 500);
  }
};

/**
 * PUT /api/admin/consultations/:id/schedule
 * Agenda uma consulta
 */
const scheduleConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      employee_id, 
      data_agendada, 
      hora_inicio, 
      hora_fim,
      link_reuniao,
      local_reuniao,
      valor
    } = req.body;
    
    if (!employee_id || !data_agendada || !hora_inicio) {
      return badRequest(res, 'Consultor, data e horário são obrigatórios.');
    }
    
    const [consultation] = await pool.execute(
      'SELECT * FROM consultations WHERE id = ?',
      [id]
    );
    
    if (!consultation.length) {
      return notFound(res, 'Consulta não encontrada.');
    }
    
    // Verificar disponibilidade do consultor
    const [conflict] = await pool.execute(
      `SELECT id FROM consultations 
       WHERE employee_id = ? 
         AND data_agendada = ? 
         AND status IN ('agendada', 'confirmada')
         AND ((hora_inicio <= ? AND hora_fim > ?) OR (hora_inicio < ? AND hora_fim >= ?))`,
      [employee_id, data_agendada, hora_fim, hora_inicio, hora_fim, hora_inicio]
    );
    
    if (conflict.length > 0) {
      return badRequest(res, 'O consultor já tem uma consulta agendada neste horário.');
    }
    
    // Calcular duração
    const [inicioH, inicioM] = hora_inicio.split(':').map(Number);
    const [fimH, fimM] = hora_fim.split(':').map(Number);
    const duracao = ((fimH * 60 + fimM) - (inicioH * 60 + inicioM));
    
    await pool.execute(
      `UPDATE consultations SET
        employee_id = ?,
        data_agendada = ?,
        hora_inicio = ?,
        hora_fim = ?,
        duracao_minutos = ?,
        link_reuniao = ?,
        local_reuniao = ?,
        valor = ?,
        status = 'agendada',
        updated_at = NOW()
       WHERE id = ?`,
      [employee_id, data_agendada, hora_inicio, hora_fim, duracao, link_reuniao || null, local_reuniao || null, valor || null, id]
    );
    
    // Notificar usuário
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'consulta_agendada', 'Consultoria agendada',
               CONCAT('Sua consulta de ', ?, ' foi agendada para ', ?, ' às ', ?))`,
      [consultation[0].user_id, consultation[0].tipo_consultoria, data_agendada, hora_inicio]
    );
    
    // Notificar consultor
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       SELECT user_id, 'consulta_atribuida', 'Nova consulta atribuída',
              CONCAT('Uma consulta de ', ?, ' foi agendada para você em ', ?, ' às ', ?)
       FROM employees WHERE id = ?`,
      [consultation[0].tipo_consultoria, data_agendada, hora_inicio, employee_id]
    );
    
    await log(req.user.id, 'SCHEDULE_CONSULTATION', 'consultations', id, { employee_id, data_agendada }, req);
    
    return success(res, { message: 'Consulta agendada com sucesso.' });
    
  } catch (err) {
    console.error('[SCHEDULE_CONSULTATION]', err);
    return error(res, 'Erro ao agendar consulta.', 500);
  }
};

/**
 * POST /api/consultations/:id/confirm
 * Usuário confirma presença
 */
const confirmConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const [consultation] = await pool.execute(
      'SELECT * FROM consultations WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!consultation.length) {
      return notFound(res, 'Consulta não encontrada.');
    }
    
    if (consultation[0].status !== 'agendada') {
      return badRequest(res, 'Apenas consultas agendadas podem ser confirmadas.');
    }
    
    await pool.execute(
      'UPDATE consultations SET status = "confirmada" WHERE id = ?',
      [id]
    );
    
    // Notificar consultor
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       SELECT user_id, 'consulta_confirmada', 'Consulta confirmada pelo cliente',
              'O cliente confirmou presença na consulta agendada.'
       FROM employees WHERE id = ?`,
      [consultation[0].employee_id]
    );
    
    return success(res, { message: 'Presença confirmada com sucesso.' });
    
  } catch (err) {
    console.error('[CONFIRM_CONSULTATION]', err);
    return error(res, 'Erro ao confirmar consulta.', 500);
  }
};

/**
 * POST /api/admin/consultations/:id/complete
 * Completa uma consulta
 */
const completeConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      resumo,
      recomendacoes,
      proximos_passos,
      material_compartilhado,
      valor_cobrado
    } = req.body;
    
    const [consultation] = await pool.execute(
      'SELECT * FROM consultations WHERE id = ?',
      [id]
    );
    
    if (!consultation.length) {
      return notFound(res, 'Consulta não encontrada.');
    }
    
    await pool.execute(
      `UPDATE consultations SET
        status = 'realizada',
        resumo = ?,
        recomendacoes = ?,
        proximos_passos = ?,
        material_compartilhado = ?,
        valor = COALESCE(?, valor),
        updated_at = NOW()
       WHERE id = ?`,
      [
        resumo || null,
        recomendacoes || null,
        proximos_passos || null,
        material_compartilhado ? JSON.stringify(material_compartilhado) : null,
        valor_cobrado,
        id
      ]
    );
    
    // Notificar usuário
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'consulta_realizada', 'Consultoria realizada',
               'Sua sessão de consultoria foi concluída. Verifique o resumo enviado.')`,
      [consultation[0].user_id]
    );
    
    await log(req.user.id, 'COMPLETE_CONSULTATION', 'consultations', id, {}, req);
    
    return success(res, { message: 'Consulta completada com sucesso.' });
    
  } catch (err) {
    console.error('[COMPLETE_CONSULTATION]', err);
    return error(res, 'Erro ao completar consulta.', 500);
  }
};

/**
 * PUT /api/consultations/:id/cancel
 * Cancela uma consulta
 */
const cancelConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
    
    const [consultation] = await pool.execute(
      `SELECT * FROM consultations WHERE id = ? ${!isAdmin ? 'AND user_id = ?' : ''}`,
      isAdmin ? [id] : [id, userId]
    );
    
    if (!consultation.length) {
      return notFound(res, 'Consulta não encontrada.');
    }
    
    if (consultation[0].status === 'realizada') {
      return badRequest(res, 'Não é possível cancelar uma consulta já realizada.');
    }
    
    await pool.execute(
      'UPDATE consultations SET status = "cancelada", motivo_cancelamento = ? WHERE id = ?',
      [motivo || 'Cancelado pelo usuário', id]
    );
    
    // Notificar a outra parte
    if (isAdmin) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'consulta_cancelada', 'Consultoria cancelada',
                 CONCAT('Sua consulta foi cancelada. Motivo: ', ?))`,
        [consultation[0].user_id, motivo || 'Entre em contato para reagendar']
      );
    } else if (consultation[0].employee_id) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         SELECT user_id, 'consulta_cancelada', 'Consulta cancelada pelo cliente',
                CONCAT('Motivo: ', ?)
         FROM employees WHERE id = ?`,
        [motivo || 'Sem motivo informado', consultation[0].employee_id]
      );
    }
    
    await log(userId, 'CANCEL_CONSULTATION', 'consultations', id, { motivo }, req);
    
    return success(res, { message: 'Consulta cancelada com sucesso.' });
    
  } catch (err) {
    console.error('[CANCEL_CONSULTATION]', err);
    return error(res, 'Erro ao cancelar consulta.', 500);
  }
};

/**
 * GET /api/admin/consultations/available-slots
 * Retorna horários disponíveis para agendamento
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { employee_id, data } = req.query;
    
    if (!employee_id || !data) {
      return badRequest(res, 'Consultor e data são obrigatórios.');
    }
    
    // Buscar consultas já agendadas
    const [consultations] = await pool.execute(
      `SELECT hora_inicio, hora_fim 
       FROM consultations 
       WHERE employee_id = ? 
         AND data_agendada = ? 
         AND status IN ('agendada', 'confirmada')`,
      [employee_id, data]
    );
    
    // Definir horário de trabalho (9h às 18h)
    const horarioTrabalho = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];
    
    // Filtrar horários ocupados
    const horariosOcupados = consultations.map(c => ({
      inicio: c.hora_inicio,
      fim: c.hora_fim
    }));
    
    const availableSlots = horarioTrabalho.filter(hora => {
      return !horariosOcupados.some(ocupado => {
        return hora >= ocupado.inicio && hora < ocupado.fim;
      });
    });
    
    return success(res, { horarios_disponiveis: availableSlots });
    
  } catch (err) {
    console.error('[AVAILABLE_SLOTS]', err);
    return error(res, 'Erro ao obter horários disponíveis.', 500);
  }
};

/**
 * GET /api/admin/consultations/stats
 * Estatísticas de consultorias
 */
const getConsultationStats = async (req, res) => {
  try {
    // Estatísticas gerais
    const [[general]] = await pool.execute(
      `SELECT 
        COUNT(*) as total_consultas,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status IN ('agendada', 'confirmada') THEN 1 END) as agendadas,
        COUNT(CASE WHEN status = 'realizada' THEN 1 END) as realizadas,
        COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as canceladas,
        COALESCE(SUM(valor), 0) as receita_total,
        AVG(CASE WHEN status = 'realizada' THEN duracao_minutos END) as duracao_media
       FROM consultations`
    );
    
    // Por tipo
    const [byType] = await pool.execute(
      `SELECT 
        tipo_consultoria,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'realizada' THEN 1 END) as realizadas,
        COALESCE(SUM(valor), 0) as receita
       FROM consultations
       GROUP BY tipo_consultoria
       ORDER BY total DESC`
    );
    
    // Por consultor
    const [byConsultant] = await pool.execute(
      `SELECT 
        e.id,
        u.nome,
        COUNT(*) as total,
        COUNT(CASE WHEN c.status = 'realizada' THEN 1 END) as realizadas,
        COALESCE(SUM(c.valor), 0) as receita
       FROM consultations c
       INNER JOIN employees e ON e.id = c.employee_id
       INNER JOIN users u ON u.id = e.user_id
       GROUP BY e.id
       ORDER BY total DESC`
    );
    
    // Consultas por mês
    const [byMonth] = await pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as mes,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'realizada' THEN 1 END) as realizadas,
        COALESCE(SUM(valor), 0) as receita
       FROM consultations
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY mes`
    );
    
    return success(res, {
      estatisticas_gerais: general,
      por_tipo: byType,
      por_consultor: byConsultant,
      por_mes: byMonth
    });
    
  } catch (err) {
    console.error('[CONSULTATION_STATS]', err);
    return error(res, 'Erro ao obter estatísticas.', 500);
  }
};

module.exports = {
  listUserConsultations,
  listAllConsultations,
  getConsultation,
  createConsultation,
  scheduleConsultation,
  confirmConsultation,
  completeConsultation,
  cancelConsultation,
  getAvailableSlots,
  getConsultationStats
};
