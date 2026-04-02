/**
 * Controller de Suporte (Tickets)
 * Módulo 7 - Negócios e Investimentos
 * 
 * Gerencia tickets de suporte e atendimento ao cliente
 */

const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');

/**
 * GET /api/support/tickets
 * Lista tickets do usuário logado
 */
const listUserTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE st.user_id = ?';
    const params = [userId];
    
    if (status) {
      whereClause += ' AND st.status = ?';
      params.push(status);
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        st.id,
        st.ticket_number,
        st.assunto,
        st.categoria,
        st.prioridade,
        st.status,
        st.created_at,
        st.updated_at,
        st.closed_at,
        COUNT(sm.id) as total_mensagens,
        COUNT(CASE WHEN sm.is_internal = 0 AND sm.lida = 0 AND sm.sender_id != ? THEN 1 END) as nao_lidas
       FROM support_tickets st
       LEFT JOIN support_messages sm ON sm.ticket_id = st.id
       ${whereClause}
       GROUP BY st.id
       ORDER BY 
         FIELD(st.status, 'aberto', 'em_atendimento', 'aguardando_resposta', 'resolvido', 'fechado'),
         FIELD(st.prioridade, 'urgente', 'alta', 'media', 'baixa'),
         st.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      [...params, userId]
    );
    
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM support_tickets st ${whereClause}`,
      params
    );
    
    return success(res, {
      tickets: rows,
      total: countRows[0].total,
      pagina: parseInt(page),
      limite: parseInt(limit)
    });
    
  } catch (err) {
    console.error('[LIST_USER_TICKETS]', err);
    return error(res, 'Erro ao listar tickets.', 500);
  }
};

/**
 * GET /api/admin/support/tickets
 * Lista todos os tickets (admin)
 */
const listAllTickets = async (req, res) => {
  try {
    const { 
      status, 
      categoria, 
      prioridade,
      employee_id,
      user_id,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND st.status = ?';
      params.push(status);
    }
    
    if (categoria) {
      whereClause += ' AND st.categoria = ?';
      params.push(categoria);
    }
    
    if (prioridade) {
      whereClause += ' AND st.prioridade = ?';
      params.push(prioridade);
    }
    
    if (employee_id) {
      whereClause += ' AND st.employee_id = ?';
      params.push(employee_id);
    }
    
    if (user_id) {
      whereClause += ' AND st.user_id = ?';
      params.push(user_id);
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        st.id,
        st.ticket_number,
        st.assunto,
        st.categoria,
        st.prioridade,
        st.status,
        st.created_at,
        st.updated_at,
        st.closed_at,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.role as usuario_tipo,
        emp.nome as funcionario_nome,
        COUNT(sm.id) as total_mensagens,
        MAX(sm.created_at) as ultima_atualizacao
       FROM support_tickets st
       INNER JOIN users u ON u.id = st.user_id
       LEFT JOIN employees e ON e.id = st.employee_id
       LEFT JOIN users emp ON emp.id = e.user_id
       LEFT JOIN support_messages sm ON sm.ticket_id = st.id
       ${whereClause}
       GROUP BY st.id
       ORDER BY 
         FIELD(st.status, 'aberto', 'em_atendimento', 'aguardando_resposta'),
         FIELD(st.prioridade, 'urgente', 'alta', 'media', 'baixa'),
         st.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );
    
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM support_tickets st ${whereClause}`,
      params
    );
    
    return success(res, {
      tickets: rows,
      total: countRows[0].total,
      pagina: parseInt(page),
      limite: parseInt(limit)
    });
    
  } catch (err) {
    console.error('[LIST_ALL_TICKETS]', err);
    return error(res, 'Erro ao listar tickets.', 500);
  }
};

/**
 * GET /api/support/tickets/:id
 * Obtém detalhes de um ticket
 */
const getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
    
    const [rows] = await pool.execute(
      `SELECT 
        st.*,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.telefone as usuario_telefone,
        u.role as usuario_tipo,
        emp.nome as funcionario_nome,
        emp.email as funcionario_email
       FROM support_tickets st
       INNER JOIN users u ON u.id = st.user_id
       LEFT JOIN employees e ON e.id = st.employee_id
       LEFT JOIN users emp ON emp.id = e.user_id
       WHERE st.id = ? ${!isAdmin ? 'AND st.user_id = ?' : ''}`,
      isAdmin ? [id] : [id, userId]
    );
    
    if (!rows.length) {
      return notFound(res, 'Ticket não encontrado.');
    }
    
    const ticket = rows[0];
    
    // Buscar mensagens
    const [messages] = await pool.execute(
      `SELECT 
        sm.*,
        sender.nome as sender_nome,
        sender.role as sender_role
       FROM support_messages sm
       INNER JOIN users sender ON sender.id = sm.sender_id
       WHERE sm.ticket_id = ?
       ORDER BY sm.created_at ASC`,
      [id]
    );
    
    // Marcar mensagens como lidas (se for o usuário do ticket)
    if (!isAdmin) {
      await pool.execute(
        `UPDATE support_messages SET lida = 1 
         WHERE ticket_id = ? AND sender_id != ? AND lida = 0`,
        [id, userId]
      );
    }
    
    return success(res, { ticket, messages });
    
  } catch (err) {
    console.error('[GET_TICKET]', err);
    return error(res, 'Erro ao obter ticket.', 500);
  }
};

/**
 * POST /api/support/tickets
 * Cria um novo ticket
 */
const createTicket = async (req, res) => {
  try {
    const { assunto, categoria, prioridade = 'media', descricao, anexos } = req.body;
    const userId = req.user.id;
    
    if (!assunto || !categoria || !descricao) {
      return badRequest(res, 'Assunto, categoria e descrição são obrigatórios.');
    }
    
    // Gerar número do ticket
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const [result] = await pool.execute(
      `INSERT INTO support_tickets 
       (ticket_number, user_id, assunto, categoria, prioridade)
       VALUES (?, ?, ?, ?, ?)`,
      [ticketNumber, userId, assunto, categoria, prioridade]
    );
    
    const ticketId = result.insertId;
    
    // Adicionar primeira mensagem
    await pool.execute(
      `INSERT INTO support_messages 
       (ticket_id, sender_id, mensagem, anexos)
       VALUES (?, ?, ?, ?)`,
      [ticketId, userId, descricao, anexos ? JSON.stringify(anexos) : null]
    );
    
    // Notificar admins
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       SELECT id, 'novo_ticket', 'Novo ticket de suporte',
              CONCAT('Novo ticket #', ?, ': ', ?)
       FROM users WHERE role IN ('admin', 'employee')`,
      [ticketNumber, assunto]
    );
    
    await log(userId, 'CREATE_TICKET', 'support_tickets', ticketId, { ticket_number: ticketNumber }, req);
    
    return created(res, {
      id: ticketId,
      ticket_number: ticketNumber,
      message: 'Ticket criado com sucesso.'
    });
    
  } catch (err) {
    console.error('[CREATE_TICKET]', err);
    return error(res, 'Erro ao criar ticket.', 500);
  }
};

/**
 * POST /api/support/tickets/:id/messages
 * Adiciona mensagem a um ticket
 */
const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensagem, anexos, is_internal = false } = req.body;
    const senderId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
    
    if (!mensagem) {
      return badRequest(res, 'Mensagem é obrigatória.');
    }
    
    // Verificar se ticket existe e usuário tem acesso
    const [ticket] = await pool.execute(
      `SELECT st.*, u.email as user_email, u.nome as user_nome
       FROM support_tickets st
       INNER JOIN users u ON u.id = st.user_id
       WHERE st.id = ? ${!isAdmin ? 'AND st.user_id = ?' : ''}`,
      isAdmin ? [id] : [id, senderId]
    );
    
    if (!ticket.length) {
      return notFound(res, 'Ticket não encontrado.');
    }
    
    const tk = ticket[0];
    
    // Verificar se ticket está fechado
    if (tk.status === 'fechado' && !isAdmin) {
      return badRequest(res, 'Não é possível adicionar mensagens a um ticket fechado.');
    }
    
    // Inserir mensagem
    const [result] = await pool.execute(
      `INSERT INTO support_messages 
       (ticket_id, sender_id, mensagem, anexos, is_internal)
       VALUES (?, ?, ?, ?, ?)`,
      [id, senderId, mensagem, anexos ? JSON.stringify(anexos) : null, isAdmin ? is_internal : 0]
    );
    
    // Atualizar status do ticket
    let newStatus;
    if (isAdmin) {
      newStatus = 'aguardando_resposta';
    } else {
      newStatus = 'em_atendimento';
    }
    
    await pool.execute(
      'UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );
    
    // Notificar o outro lado
    if (isAdmin) {
      // Notificar usuário
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'resposta_ticket', 'Nova resposta no seu ticket',
                 CONCAT('O suporte respondeu ao ticket #', ?))`,
        [tk.user_id, tk.ticket_number]
      );
    } else {
      // Notificar funcionários
      if (tk.employee_id) {
        await pool.execute(
          `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
           SELECT user_id, 'novo_comentario', 'Novo comentário no ticket',
                  CONCAT('O usuário respondeu ao ticket #', ?)
           FROM employees WHERE id = ?`,
          [tk.ticket_number, tk.employee_id]
        );
      } else {
        await pool.execute(
          `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
           SELECT id, 'novo_comentario', 'Novo comentário no ticket',
                  CONCAT('O usuário respondeu ao ticket #', ?)
           FROM users WHERE role IN ('admin', 'employee')`,
          [tk.ticket_number]
        );
      }
    }
    
    await log(senderId, 'ADD_MESSAGE', 'support_messages', result.insertId, { ticket_id: id }, req);
    
    return created(res, { id: result.insertId, message: 'Mensagem adicionada.' });
    
  } catch (err) {
    console.error('[ADD_MESSAGE]', err);
    return error(res, 'Erro ao adicionar mensagem.', 500);
  }
};

/**
 * PUT /api/admin/support/tickets/:id/assign
 * Atribui ticket a um funcionário
 */
const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id } = req.body;
    
    const [ticket] = await pool.execute(
      'SELECT * FROM support_tickets WHERE id = ?',
      [id]
    );
    
    if (!ticket.length) {
      return notFound(res, 'Ticket não encontrado.');
    }
    
    await pool.execute(
      'UPDATE support_tickets SET employee_id = ?, status = "em_atendimento", updated_at = NOW() WHERE id = ?',
      [employee_id, id]
    );
    
    // Notificar funcionário
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       SELECT user_id, 'ticket_atribuido', 'Ticket atribuído a você',
              CONCAT('Ticket #', ?, ' foi atribuído ao seu atendimento')
       FROM employees WHERE id = ?`,
      [ticket[0].ticket_number, employee_id]
    );
    
    await log(req.user.id, 'ASSIGN_TICKET', 'support_tickets', id, { employee_id }, req);
    
    return success(res, { message: 'Ticket atribuído com sucesso.' });
    
  } catch (err) {
    console.error('[ASSIGN_TICKET]', err);
    return error(res, 'Erro ao atribuir ticket.', 500);
  }
};

/**
 * PUT /api/admin/support/tickets/:id/status
 * Atualiza status do ticket
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, motivo } = req.body;
    
    const validStatuses = ['aberto', 'em_atendimento', 'aguardando_resposta', 'resolvido', 'fechado'];
    
    if (!validStatuses.includes(status)) {
      return badRequest(res, 'Status inválido.');
    }
    
    const [ticket] = await pool.execute(
      'SELECT * FROM support_tickets WHERE id = ?',
      [id]
    );
    
    if (!ticket.length) {
      return notFound(res, 'Ticket não encontrado.');
    }
    
    const updates = ['status = ?', 'updated_at = NOW()'];
    const params = [status];
    
    if (status === 'fechado' || status === 'resolvido') {
      updates.push('closed_at = NOW()');
    }
    
    params.push(id);
    await pool.execute(
      `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Adicionar mensagem de sistema
    const statusMessages = {
      resolvido: `Ticket marcado como resolvido. ${motivo || ''}`,
      fechado: `Ticket fechado. ${motivo || ''}`,
      em_atendimento: 'Ticket em atendimento.',
      aguardando_resposta: 'Aguardando resposta do usuário.'
    };
    
    if (statusMessages[status]) {
      await pool.execute(
        `INSERT INTO support_messages (ticket_id, sender_id, mensagem, is_internal)
         VALUES (?, ?, ?, 1)`,
        [id, req.user.id, statusMessages[status]]
      );
    }
    
    // Notificar usuário
    if (['resolvido', 'fechado'].includes(status)) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'ticket_resolvido', 'Seu ticket foi resolvido',
                 CONCAT('O ticket #', ?, ' foi marcado como ', ?))`,
        [ticket[0].user_id, ticket[0].ticket_number, status]
      );
    }
    
    await log(req.user.id, 'UPDATE_TICKET_STATUS', 'support_tickets', id, { status }, req);
    
    return success(res, { message: 'Status atualizado com sucesso.' });
    
  } catch (err) {
    console.error('[UPDATE_STATUS]', err);
    return error(res, 'Erro ao atualizar status.', 500);
  }
};

/**
 * PUT /api/admin/support/tickets/:id/priority
 * Atualiza prioridade do ticket
 */
const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { prioridade } = req.body;
    
    const validPriorities = ['baixa', 'media', 'alta', 'urgente'];
    
    if (!validPriorities.includes(prioridade)) {
      return badRequest(res, 'Prioridade inválida.');
    }
    
    await pool.execute(
      'UPDATE support_tickets SET prioridade = ?, updated_at = NOW() WHERE id = ?',
      [prioridade, id]
    );
    
    await log(req.user.id, 'UPDATE_TICKET_PRIORITY', 'support_tickets', id, { prioridade }, req);
    
    return success(res, { message: 'Prioridade atualizada com sucesso.' });
    
  } catch (err) {
    console.error('[UPDATE_PRIORITY]', err);
    return error(res, 'Erro ao atualizar prioridade.', 500);
  }
};

/**
 * GET /api/admin/support/tickets/stats
 * Estatísticas de tickets
 */
const getTicketStats = async (req, res) => {
  try {
    // Estatísticas gerais
    const [[general]] = await pool.execute(
      `SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'aberto' THEN 1 END) as abertos,
        COUNT(CASE WHEN status = 'em_atendimento' THEN 1 END) as em_atendimento,
        COUNT(CASE WHEN status = 'aguardando_resposta' THEN 1 END) as aguardando,
        COUNT(CASE WHEN status = 'resolvido' THEN 1 END) as resolvidos,
        COUNT(CASE WHEN status = 'fechado' THEN 1 END) as fechados,
        COUNT(CASE WHEN prioridade = 'urgente' THEN 1 END) as urgentes,
        AVG(CASE WHEN closed_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, created_at, closed_at) END) as tempo_medio_resolucao
       FROM support_tickets`
    );
    
    // Por categoria
    const [byCategory] = await pool.execute(
      `SELECT 
        categoria,
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('aberto', 'em_atendimento') THEN 1 END) as pendentes
       FROM support_tickets
       GROUP BY categoria
       ORDER BY total DESC`
    );
    
    // Por funcionário
    const [byEmployee] = await pool.execute(
      `SELECT 
        e.id,
        u.nome,
        COUNT(*) as total_atendimentos,
        COUNT(CASE WHEN st.status = 'resolvido' THEN 1 END) as resolvidos,
        AVG(CASE WHEN st.closed_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, st.created_at, st.closed_at) END) as tempo_medio
       FROM support_tickets st
       INNER JOIN employees e ON e.id = st.employee_id
       INNER JOIN users u ON u.id = e.user_id
       GROUP BY e.id
       ORDER BY total_atendimentos DESC`
    );
    
    // Tickets por dia (últimos 7 dias)
    const [byDay] = await pool.execute(
      `SELECT 
        DATE(created_at) as data,
        COUNT(*) as total
       FROM support_tickets
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY data`
    );
    
    return success(res, {
      estatisticas_gerais: general,
      por_categoria: byCategory,
      por_funcionario: byEmployee,
      por_dia: byDay
    });
    
  } catch (err) {
    console.error('[TICKET_STATS]', err);
    return error(res, 'Erro ao obter estatísticas.', 500);
  }
};

module.exports = {
  listUserTickets,
  listAllTickets,
  getTicket,
  createTicket,
  addMessage,
  assignTicket,
  updateStatus,
  updatePriority,
  getTicketStats
};
