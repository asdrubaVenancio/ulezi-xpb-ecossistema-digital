/**
 * Controller do módulo de consultoria.
 * Implementa consultorias externas aprovadas, agenda por disponibilidade
 * e consumo de créditos de assinatura/recarga.
 */

const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');
const { sendEmail } = require('../utils/email');
const {
  getOwnerContext,
  getCreditBalance,
  consumeCredits,
  createRechargeCredits,
} = require('../services/consultation-credit.service');

const CONSULTATION_BUSY_STATUSES = ['pendente', 'agendada', 'confirmada'];

const toSqlDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const timeToMinutes = (value) => {
  const safeValue = value && String(value).includes(':') ? String(value) : '00:00';
  const [hours, minutes] = safeValue.split(':').map(Number);
  return ((hours || 0) * 60) + (minutes || 0);
};

const minutesToTime = (minutes) => {
  const safe = Math.max(0, Number(minutes || 0));
  const hours = String(Math.floor(safe / 60)).padStart(2, '0');
  const mins = String(safe % 60).padStart(2, '0');
  return `${hours}:${mins}:00`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getRequesterCompany = async (userId) => {
  console.log('[GET_REQUESTER_COMPANY] Iniciando - userId:', userId);
  try {
    const [[company]] = await pool.execute(
      `SELECT cp.id,
              cp.nome_empresa,
              cp.tipo_empresa,
              cp.consultoria_descricao,
              cp.sector,
              cp.is_approved,
              sp.package_category,
              sp.target_role
       FROM company_profiles cp
       LEFT JOIN subscriptions s
         ON s.company_id = cp.id
        AND s.status = 'ativa'
        AND s.data_fim >= CURDATE()
       LEFT JOIN subscription_packages sp
         ON sp.id = s.package_id
       WHERE cp.user_id = ?
       ORDER BY s.data_fim DESC
       LIMIT 1`,
      [userId]
    );

    console.log('[GET_REQUESTER_COMPANY] Company encontrada:', company ? company.id : 'NENHUMA');

    if (company) {
      const ehConsultoriaPorPacote = (
        company.package_category === 'consultoria'
        && ['consultancy', 'all'].includes(String(company.target_role || ''))
      );
      const ehConsultoriaPorPerfil = String(company.tipo_empresa || '').toLowerCase() === 'consultoria';
      const ehConsultoriaPorDescricao = Boolean(company.consultoria_descricao);

      console.log('[GET_REQUESTER_COMPANY] Critérios:');
      console.log('  - Por perfil (DB):', ehConsultoriaPorPerfil, '- valor DB:', company.tipo_empresa);
      console.log('  - Por descrição:', ehConsultoriaPorDescricao, '- valor:', company.consultoria_descricao);
      console.log('  - Por pacote:', ehConsultoriaPorPacote, '- categoria:', company.package_category, '- target:', company.target_role);

      company.tipo_empresa = (
        ehConsultoriaPorPerfil || ehConsultoriaPorDescricao || ehConsultoriaPorPacote
      ) ? 'consultoria' : 'empresa';

      console.log('[GET_REQUESTER_COMPANY] Tipo determinado:', company.tipo_empresa);
    }

    return company || null;
  } catch (error) {
    console.error('[GET_REQUESTER_COMPANY] ERRO:', error.message);
    // Se a coluna tipo_empresa não existir, tenta sem ela
    if (error.message && error.message.includes('tipo_empresa')) {
      console.log('⚠️  Coluna tipo_empresa não encontrada, usando fallback...');
      const [[company]] = await pool.execute(
        'SELECT id, nome_empresa, is_approved FROM company_profiles WHERE user_id = ? LIMIT 1',
        [userId]
      );
      if (company) {
        company.tipo_empresa = 'empresa'; // Default
      }
      return company || null;
    }
    throw error;
  }
};

const getActiveRequesterSubscription = async (userId, companyId = null) => {
  let sql = `
    SELECT s.*, sp.nome AS package_name, sp.package_category, sp.target_role, sp.consultorias_incluidas
    FROM subscriptions s
    INNER JOIN subscription_packages sp ON sp.id = s.package_id
    WHERE s.user_id = ? AND s.status = 'ativa' AND s.data_fim >= CURDATE()
  `;
  const params = [userId];

  if (companyId) {
    sql += ' AND s.company_id = ?';
    params.push(companyId);
  }

  sql += ' ORDER BY s.data_fim DESC LIMIT 1';

  const [[subscription]] = await pool.execute(sql, params);
  return subscription || null;
};

const getActiveConsultancy = async (companyId) => {
  const [[consultancy]] = await pool.execute(
    `SELECT cp.id, cp.user_id, cp.nome_empresa, cp.nif, cp.descricao, cp.consultoria_descricao,
            cp.provincia, cp.municipio, cp.website
     FROM company_profiles cp
     INNER JOIN subscriptions s ON s.company_id = cp.id AND s.status = 'ativa' AND s.data_fim >= CURDATE()
     INNER JOIN subscription_packages sp ON sp.id = s.package_id
     WHERE cp.id = ?
       AND (
         cp.tipo_empresa = 'consultoria'
         OR cp.consultoria_descricao IS NOT NULL
         OR cp.sector LIKE '%consultor%'
         OR (sp.package_category = 'consultoria' AND sp.target_role IN ('consultancy', 'all'))
       )
       AND cp.is_approved = 1
     LIMIT 1`,
    [companyId]
  );

  return consultancy || null;
};

const getConsultancyAvailabilityRows = async (companyId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, dia_semana, hora_inicio, hora_fim, capacidade_atendimentos, duracao_slot_minutos
       FROM consultancy_availability
       WHERE company_id = ? AND is_active = 1
       ORDER BY dia_semana ASC, hora_inicio ASC`,
      [companyId]
    );
    return rows;
  } catch (error) {
    if (error.message && error.message.includes('consultancy_availability')) {
      console.log('[GET_CONSULTANCY_AVAILABILITY_ROWS] Tabela não existe, retornando array vazio');
      return [];
    }
    throw error;
  }
};

const getOccupiedSlots = async (companyId, slotDate) => {
  const [rows] = await pool.execute(
    `SELECT hora_inicio, COUNT(*) AS total
     FROM consultations
     WHERE consultancy_company_id = ?
       AND slot_date = ?
       AND status IN ('pendente', 'agendada', 'confirmada')
     GROUP BY hora_inicio`,
    [companyId, slotDate]
  );

  const map = new Map();
  rows.forEach((row) => map.set(String(row.hora_inicio).slice(0, 5), Number(row.total || 0)));
  return map;
};

const buildSlotsFromTemplate = (template) => {
  const slots = [];
  const start = timeToMinutes(template.hora_inicio);
  const end = timeToMinutes(template.hora_fim);
  const duration = Math.max(15, Number(template.duracao_slot_minutos || 60));

  for (let cursor = start; cursor + duration <= end; cursor += duration) {
    slots.push({
      hora_inicio: minutesToTime(cursor),
      hora_fim: minutesToTime(cursor + duration),
      capacidade_atendimentos: Number(template.capacidade_atendimentos || 1),
      duracao_slot_minutos: duration,
    });
  }

  return slots;
};

const getSlotsForDate = async (companyId, slotDate) => {
  const availability = await getConsultancyAvailabilityRows(companyId);
  const date = new Date(`${slotDate}T00:00:00`);
  const weekDay = date.getDay();
  const templates = availability.filter((row) => Number(row.dia_semana) === weekDay);

  if (!templates.length) {
    return [];
  }

  const occupied = await getOccupiedSlots(companyId, slotDate);

  return templates.flatMap((template) => {
    return buildSlotsFromTemplate(template).map((slot) => {
      const key = String(slot.hora_inicio).slice(0, 5);
      const used = occupied.get(key) || 0;
      return {
        ...slot,
        vagas_restantes: Math.max(0, slot.capacidade_atendimentos - used),
        disponivel: used < slot.capacidade_atendimentos,
      };
    });
  });
};

const suggestNextSlots = async (companyId, slotDate, maxSuggestions = 4) => {
  const baseDate = new Date(`${slotDate}T00:00:00`);
  const targetWeekDay = baseDate.getDay();
  const suggestions = [];

  for (let week = 1; week <= 8 && suggestions.length < maxSuggestions; week += 1) {
    const nextDate = addDays(baseDate, week * 7);
    if (nextDate.getDay() !== targetWeekDay) {
      continue;
    }

    const sqlDate = nextDate.toISOString().slice(0, 10);
    const slots = await getSlotsForDate(companyId, sqlDate);
    const available = slots.filter((slot) => slot.disponivel);

    if (available.length) {
      suggestions.push({
        data: sqlDate,
        vagas: available,
      });
    }
  }

  return suggestions;
};

const getAvailableSlotForRequest = async ({
  consultancyCompanyId,
  slotDate,
  horaInicio,
  ignoreConsultationId = null,
}) => {
  const targetDate = toSqlDate(slotDate);
  const targetHour = String(horaInicio || '').slice(0, 5);
  const slots = await getSlotsForDate(consultancyCompanyId, targetDate);

  if (!ignoreConsultationId) {
    return slots.find((slot) => (
      String(slot.hora_inicio).slice(0, 5) === targetHour && slot.disponivel
    )) || null;
  }

  const [busyRows] = await pool.execute(
    `SELECT hora_inicio, COUNT(*) AS total
     FROM consultations
     WHERE consultancy_company_id = ?
       AND slot_date = ?
       AND status IN ('pendente', 'agendada', 'confirmada')
       AND id <> ?
     GROUP BY hora_inicio`,
    [consultancyCompanyId, targetDate, ignoreConsultationId]
  );

  const busyMap = new Map();
  busyRows.forEach((row) => {
    busyMap.set(String(row.hora_inicio).slice(0, 5), Number(row.total || 0));
  });

  return slots.find((slot) => {
    const slotHour = String(slot.hora_inicio).slice(0, 5);
    const used = busyMap.get(slotHour) || 0;
    return slotHour === targetHour && used < Number(slot.capacidade_atendimentos || 1);
  }) || null;
};

const canAccessConsultation = async (user, consultation) => {
  if (['admin', 'employee'].includes(user.role)) {
    return true;
  }

  if (consultation.user_id === user.id) {
    return true;
  }

  const company = await getRequesterCompany(user.id);
  return Boolean(company && consultation.consultancy_company_id === company.id);
};

const notifyUsers = async ({ requesterId, consultancyUserId, subject, title, message, html }) => {
  if (requesterId) {
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, ?, ?, ?)`,
      [requesterId, subject, title, message]
    );
  }

  if (consultancyUserId && consultancyUserId !== requesterId) {
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, ?, ?, ?)`,
      [consultancyUserId, subject, title, message]
    );
  }

  if (html && requesterId) {
    const [[requester]] = await pool.execute('SELECT email FROM users WHERE id = ?', [requesterId]);
    if (requester?.email) {
      await sendEmail({ to: requester.email, subject: title, html }).catch(() => null);
    }
  }

  if (html && consultancyUserId) {
    const [[consultancyUser]] = await pool.execute('SELECT email FROM users WHERE id = ?', [consultancyUserId]);
    if (consultancyUser?.email) {
      await sendEmail({ to: consultancyUser.email, subject: title, html }).catch(() => null);
    }
  }
};

const listUserConsultations = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, cp.nome_empresa AS consultoria_nome,
              rc.nome_empresa AS empresa_solicitante
       FROM consultations c
       LEFT JOIN company_profiles cp ON cp.id = c.consultancy_company_id
       LEFT JOIN company_profiles rc ON rc.id = c.requester_company_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    return success(res, { consultas: rows });
  } catch (err) {
    console.error('[LIST_USER_CONSULTATIONS]', err);
    return error(res, 'Erro ao listar consultas.', 500);
  }
};

const listAllConsultations = async (req, res) => {
  try {
    const filters = [];
    const params = [];

    if (req.query.status) {
      filters.push('c.status = ?');
      params.push(req.query.status);
    }

    if (req.query.tipo_consultoria) {
      filters.push('c.tipo_consultoria LIKE ?');
      params.push(`%${req.query.tipo_consultoria}%`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT c.*,
              u.nome AS usuario_nome,
              u.email AS usuario_email,
              c.requested_by_role AS usuario_tipo,
              cp.nome_empresa AS consultoria_nome,
              rc.nome_empresa AS empresa_solicitante,
              eu.nome AS consultor_nome
       FROM consultations c
       INNER JOIN users u ON u.id = c.user_id
       LEFT JOIN company_profiles cp ON cp.id = c.consultancy_company_id
       LEFT JOIN company_profiles rc ON rc.id = c.requester_company_id
       LEFT JOIN employees e ON e.id = c.employee_id
       LEFT JOIN users eu ON eu.id = e.user_id
       ${whereClause}
       ORDER BY c.created_at DESC`,
      params
    );

    return success(res, { consultas: rows });
  } catch (err) {
    console.error('[LIST_ALL_CONSULTATIONS]', err);
    return error(res, 'Erro ao listar consultas.', 500);
  }
};

const listActiveConsultancies = async (req, res) => {
  try {
    const requester = await getOwnerContext(req.user.id);
    const balance = await getCreditBalance(requester);

    const [rows] = await pool.execute(
      `SELECT DISTINCT cp.id, cp.nome_empresa, cp.descricao, cp.consultoria_descricao, cp.nif,
              cp.provincia, cp.municipio, cp.website
       FROM company_profiles cp
       INNER JOIN subscriptions s ON s.company_id = cp.id AND s.status = 'ativa' AND s.data_fim >= CURDATE()
       INNER JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE (
         cp.tipo_empresa = 'consultoria'
         OR cp.consultoria_descricao IS NOT NULL
         OR cp.sector LIKE '%consultor%'
         OR (sp.package_category = 'consultoria' AND sp.target_role IN ('consultancy', 'all'))
       )
         AND cp.is_approved = 1
       ORDER BY cp.nome_empresa ASC`
    );

    return success(res, {
      consultorias: rows,
      saldo_consultorias: balance,
    });
  } catch (err) {
    console.error('[LIST_ACTIVE_CONSULTANCIES]', err);
    return error(res, 'Erro ao listar consultorias activas.', 500);
  }
};

const getConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT c.*, cp.nome_empresa AS consultoria_nome, cp.user_id AS consultoria_user_id,
              u.nome AS solicitante_nome, u.email AS solicitante_email,
              u.nome AS usuario_nome, u.email AS usuario_email,
              c.requested_by_role AS usuario_tipo,
              rc.nome_empresa AS empresa_solicitante,
              eu.nome AS consultor_nome
       FROM consultations c
       INNER JOIN users u ON u.id = c.user_id
       LEFT JOIN company_profiles cp ON cp.id = c.consultancy_company_id
       LEFT JOIN company_profiles rc ON rc.id = c.requester_company_id
       LEFT JOIN employees e ON e.id = c.employee_id
       LEFT JOIN users eu ON eu.id = e.user_id
       WHERE c.id = ?`,
      [id]
    );

    if (!rows.length) {
      return notFound(res, 'Consulta não encontrada.');
    }

    const consultation = rows[0];
    const allowed = await canAccessConsultation(req.user, consultation);
    if (!allowed) {
      return badRequest(res, 'Sem permissão para consultar este registo.');
    }

    return success(res, { consulta: consultation });
  } catch (err) {
    console.error('[GET_CONSULTATION]', err);
    return error(res, 'Erro ao obter consulta.', 500);
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const consultancyCompanyId = Number(req.query.consultancy_company_id || req.query.company_id);
    const slotDate = toSqlDate(req.query.data || req.query.slot_date);

    if (!consultancyCompanyId || !slotDate) {
      return badRequest(res, 'Consultoria e data são obrigatórias.');
    }

    const consultancy = await getActiveConsultancy(consultancyCompanyId);
    if (!consultancy) {
      return badRequest(res, 'A consultoria selecionada não está activa.');
    }

    const slots = await getSlotsForDate(consultancyCompanyId, slotDate);
    const suggestions = await suggestNextSlots(consultancyCompanyId, slotDate);

    return success(res, {
      data: slotDate,
      consultoria: consultancy,
      vagas: slots,
      sugestoes: suggestions,
    });
  } catch (err) {
    console.error('[GET_AVAILABLE_SLOTS]', err);
    return error(res, 'Erro ao obter vagas disponíveis.', 500);
  }
};

const createConsultation = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      consultancy_company_id,
      tipo_consultoria,
      tema,
      descricao,
      slot_date,
      hora_inicio,
    } = req.body;

    if (!consultancy_company_id || !tipo_consultoria || !tema || !descricao || !slot_date || !hora_inicio) {
      return badRequest(res, 'Consultoria, tipo, tema, descrição, data e hora são obrigatórios.');
    }

    const requesterCompany = req.user.role === 'company' ? await getRequesterCompany(req.user.id) : null;
    const requesterOwner = await getOwnerContext(req.user.id);
    const requesterSubscription = await getActiveRequesterSubscription(req.user.id, requesterCompany?.id || null);
    const consultancy = await getActiveConsultancy(consultancy_company_id);

    if (!consultancy) {
      return badRequest(res, 'A consultoria escolhida não está activa ou aprovada.');
    }

    if (req.user.role === 'company' && !requesterCompany?.is_approved) {
      return badRequest(res, 'A sua empresa precisa de estar aprovada para solicitar consultoria.');
    }

    if (req.user.role === 'company' && !requesterSubscription) {
      return badRequest(res, 'A sua empresa precisa de uma assinatura activa para solicitar consultoria.');
    }

    const chosenSlot = await getAvailableSlotForRequest({
      consultancyCompanyId: consultancy.id,
      slotDate: slot_date,
      horaInicio: hora_inicio,
    });

    if (!chosenSlot) {
      return badRequest(res, 'O horário selecionado não tem vaga. Consulte as sugestões disponíveis.');
    }

    const balance = await getCreditBalance(requesterOwner);
    if (balance <= 0) {
      return badRequest(res, 'Sem saldo de consultorias disponível. Faça uma recarga ou active um pacote válido.');
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO consultations
       (user_id, consultancy_company_id, requester_company_id, requested_by_role, tipo_consultoria,
        tema, descricao, slot_date, data_agendada, hora_inicio, hora_fim, duracao_minutos,
        status, credits_consumed, credit_source, request_channel, requested_at, slot_confirmed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'agendada', 1, ?, 'plataforma', NOW(), NOW())`,
      [
        req.user.id,
        consultancy.id,
        requesterCompany?.id || null,
        req.user.role === 'investor' ? 'investor' : 'company',
        tipo_consultoria,
        tema,
        descricao,
        toSqlDate(slot_date),
        toSqlDate(slot_date),
        chosenSlot.hora_inicio,
        chosenSlot.hora_fim,
        chosenSlot.duracao_slot_minutos,
        requesterSubscription ? 'assinatura' : 'recarga',
      ]
    );

    const creditResult = await consumeCredits({
      userId: requesterOwner.userId,
      companyId: requesterOwner.companyId,
      consultationId: result.insertId,
      quantity: 1,
      description: `Consumo da solicitação de consultoria "${tema}"`,
      createdBy: req.user.id,
    });

    if (!creditResult.ok) {
      await connection.rollback();
      return badRequest(res, 'Saldo insuficiente de consultorias.');
    }

    await connection.commit();

    await notifyUsers({
      requesterId: req.user.id,
      consultancyUserId: consultancy.user_id,
      subject: 'consultoria_agendada',
      title: 'Consultoria agendada',
      message: `A consultoria "${tema}" foi agendada para ${toSqlDate(slot_date)} às ${String(chosenSlot.hora_inicio).slice(0, 5)}.`,
      html: `<p>Foi agendada uma consultoria.</p><p><strong>Tema:</strong> ${tema}</p><p><strong>Data:</strong> ${toSqlDate(slot_date)}</p><p><strong>Hora:</strong> ${String(chosenSlot.hora_inicio).slice(0, 5)}</p>`,
    });

    await log(req.user.id, 'CREATE_CONSULTATION', 'consultations', result.insertId, { consultancy_company_id, tema }, req);

    return created(res, {
      id: result.insertId,
      saldo_restante: creditResult.saldo_atual,
      message: 'Consultoria solicitada e agendada com sucesso.',
    });
  } catch (err) {
    try { await connection.rollback(); } catch (_) { /* noop */ }
    console.error('[CREATE_CONSULTATION]', err);
    return error(res, 'Erro ao solicitar consultoria.', 500);
  } finally {
    connection.release();
  }
};

const scheduleConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      consultancy_company_id,
      slot_date,
      data_agendada,
      hora_inicio,
      hora_fim,
      employee_id,
      link_reuniao,
      local_reuniao,
      valor,
    } = req.body;

    const [[current]] = await pool.execute(
      'SELECT id, consultancy_company_id, user_id, tema FROM consultations WHERE id = ?',
      [id]
    );

    if (!current) {
      return notFound(res, 'Consulta nÃ£o encontrada.');
    }

    const targetConsultancyId = Number(consultancy_company_id || current.consultancy_company_id || 0);
    const targetDate = toSqlDate(slot_date || data_agendada);

    if (!targetConsultancyId || !targetDate || !hora_inicio) {
      return badRequest(res, 'Consultoria, data e hora são obrigatórias.');
    }

    const consultancy = await getActiveConsultancy(targetConsultancyId);
    if (!consultancy) {
      return badRequest(res, 'A consultoria escolhida não está activa.');
    }

    const slots = await getSlotsForDate(consultancy.id, targetDate);
    const slot = slots.find((item) => String(item.hora_inicio).slice(0, 5) === String(hora_inicio).slice(0, 5) && item.disponivel);
    const slotFinal = slot || (hora_fim ? {
      hora_inicio: String(hora_inicio).length === 5 ? `${hora_inicio}:00` : hora_inicio,
      hora_fim: String(hora_fim).length === 5 ? `${hora_fim}:00` : hora_fim,
      duracao_slot_minutos: Math.max(15, timeToMinutes(hora_fim) - timeToMinutes(hora_inicio)),
    } : null);

    if (!slotFinal) {
      return badRequest(res, 'O horário selecionado não está disponível.');
    }

    await pool.execute(
      `UPDATE consultations
       SET consultancy_company_id = ?,
           employee_id = ?,
           slot_date = ?,
           data_agendada = ?,
           hora_inicio = ?,
           hora_fim = ?,
           duracao_minutos = ?,
           link_reuniao = ?,
           local_reuniao = ?,
           valor = ?,
           status = 'agendada',
           slot_confirmed_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [
        consultancy.id,
        employee_id || null,
        targetDate,
        targetDate,
        slotFinal.hora_inicio,
        slotFinal.hora_fim,
        slotFinal.duracao_slot_minutos,
        link_reuniao || null,
        local_reuniao || null,
        valor || null,
        id,
      ]
    );

    await notifyUsers({
      requesterId: current.user_id,
      consultancyUserId: consultancy.user_id,
      subject: 'consultoria_agendada',
      title: 'Consultoria reagendada',
      message: `A consultoria "${current.tema}" foi marcada para ${targetDate} Ã s ${String(slotFinal.hora_inicio).slice(0, 5)}.`,
      html: `<p>A consultoria <strong>${current.tema}</strong> foi agendada.</p><p><strong>Data:</strong> ${targetDate}</p><p><strong>Hora:</strong> ${String(slotFinal.hora_inicio).slice(0, 5)}</p>`,
    });

    await log(req.user.id, 'SCHEDULE_CONSULTATION', 'consultations', id, { consultancy_company_id: targetConsultancyId, slot_date: targetDate, hora_inicio }, req);
    return success(res, null, 'Consultoria reagendada com sucesso.');
  } catch (err) {
    console.error('[SCHEDULE_CONSULTATION]', err);
    return error(res, 'Erro ao reagendar consultoria.', 500);
  }
};

const rescheduleConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      consultancy_company_id,
      slot_date,
      data_agendada,
      hora_inicio,
    } = req.body;

    const [rows] = await pool.execute(
      `SELECT c.*, cp.user_id AS consultoria_user_id, cp.nome_empresa AS consultoria_nome
       FROM consultations c
       LEFT JOIN company_profiles cp ON cp.id = c.consultancy_company_id
       WHERE c.id = ?`,
      [id]
    );

    if (!rows.length) {
      return notFound(res, 'Consulta não encontrada.');
    }

    const consultation = rows[0];
    const allowed = await canAccessConsultation(req.user, consultation);
    if (!allowed) {
      return badRequest(res, 'Sem permissão para remarcar esta consulta.');
    }

    if (['cancelada', 'realizada'].includes(String(consultation.status || '').toLowerCase())) {
      return badRequest(res, 'A consulta atual não pode ser remarcada.');
    }

    const targetConsultancyId = Number(consultancy_company_id || consultation.consultancy_company_id || 0);
    const targetDate = toSqlDate(slot_date || data_agendada);

    if (!targetConsultancyId || !targetDate || !hora_inicio) {
      return badRequest(res, 'Consultoria, data e hora são obrigatórias para remarcar.');
    }

    const consultancy = await getActiveConsultancy(targetConsultancyId);
    if (!consultancy) {
      return badRequest(res, 'A consultoria selecionada não está ativa ou aprovada.');
    }

    const slot = await getAvailableSlotForRequest({
      consultancyCompanyId: consultancy.id,
      slotDate: targetDate,
      horaInicio: hora_inicio,
      ignoreConsultationId: consultation.id,
    });

    if (!slot) {
      return badRequest(res, 'O novo horário selecionado não tem vaga disponível.');
    }

    await pool.execute(
      `UPDATE consultations
       SET consultancy_company_id = ?,
           slot_date = ?,
           data_agendada = ?,
           hora_inicio = ?,
           hora_fim = ?,
           duracao_minutos = ?,
           status = 'agendada',
           motivo_cancelamento = NULL,
           slot_confirmed_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [
        consultancy.id,
        targetDate,
        targetDate,
        slot.hora_inicio,
        slot.hora_fim,
        slot.duracao_slot_minutos,
        consultation.id,
      ]
    );

    await notifyUsers({
      requesterId: consultation.user_id,
      consultancyUserId: consultancy.user_id,
      subject: 'consultoria_remarcada',
      title: 'Consultoria remarcada',
      message: `A consultoria "${consultation.tema}" foi remarcada para ${targetDate} às ${String(slot.hora_inicio).slice(0, 5)}.`,
      html: `<p>A consultoria <strong>${consultation.tema}</strong> foi remarcada.</p><p><strong>Data:</strong> ${targetDate}</p><p><strong>Hora:</strong> ${String(slot.hora_inicio).slice(0, 5)}</p>`,
    });

    await log(req.user.id, 'RESCHEDULE_CONSULTATION', 'consultations', consultation.id, {
      consultancy_company_id: consultancy.id,
      slot_date: targetDate,
      hora_inicio,
    }, req);

    return success(res, {
      id: consultation.id,
      slot_date: targetDate,
      hora_inicio: slot.hora_inicio,
      hora_fim: slot.hora_fim,
    }, 'Consultoria remarcada com sucesso.');
  } catch (err) {
    console.error('[RESCHEDULE_CONSULTATION]', err);
    return error(res, 'Erro ao remarcar consulta.', 500);
  }
};

const confirmConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM consultations WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!rows.length) {
      return notFound(res, 'Consulta não encontrada.');
    }

    await pool.execute('UPDATE consultations SET status = "confirmada", updated_at = NOW() WHERE id = ?', [id]);
    return success(res, null, 'Consulta confirmada com sucesso.');
  } catch (err) {
    console.error('[CONFIRM_CONSULTATION]', err);
    return error(res, 'Erro ao confirmar consulta.', 500);
  }
};

const completeConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { resumo, recomendacoes, proximos_passos } = req.body;

    await pool.execute(
      `UPDATE consultations
       SET status = 'realizada', resumo = ?, recomendacoes = ?, proximos_passos = ?, updated_at = NOW()
       WHERE id = ?`,
      [resumo || null, recomendacoes || null, proximos_passos || null, id]
    );

    await log(req.user.id, 'COMPLETE_CONSULTATION', 'consultations', id, {}, req);
    return success(res, null, 'Consulta concluída com sucesso.');
  } catch (err) {
    console.error('[COMPLETE_CONSULTATION]', err);
    return error(res, 'Erro ao concluir consulta.', 500);
  }
};

const cancelConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const [rows] = await pool.execute('SELECT * FROM consultations WHERE id = ?', [id]);
    if (!rows.length) {
      return notFound(res, 'Consulta não encontrada.');
    }

    const consultation = rows[0];
    const allowed = await canAccessConsultation(req.user, consultation);
    if (!allowed) {
      return badRequest(res, 'Sem permissão para cancelar esta consulta.');
    }

    if (['cancelada', 'realizada'].includes(String(consultation.status || '').toLowerCase())) {
      return badRequest(res, 'A consulta atual não pode ser cancelada.');
    }

    await pool.execute(
      `UPDATE consultations
       SET status = 'cancelada', motivo_cancelamento = ?, updated_at = NOW()
       WHERE id = ?`,
      [motivo || 'Cancelada pelo utilizador', id]
    );

    const consultancy = consultation.consultancy_company_id
      ? await getActiveConsultancy(consultation.consultancy_company_id).catch(() => null)
      : null;

    await notifyUsers({
      requesterId: consultation.user_id,
      consultancyUserId: consultancy?.user_id || null,
      subject: 'consultoria_cancelada',
      title: 'Consultoria cancelada',
      message: `A consultoria "${consultation.tema}" foi cancelada. A vaga voltou a ficar disponível.`,
      html: `<p>A consultoria <strong>${consultation.tema}</strong> foi cancelada.</p><p>A vaga do horário foi libertada automaticamente.</p>`,
    });

    await log(req.user.id, 'CANCEL_CONSULTATION', 'consultations', id, { motivo }, req);
    return success(res, null, 'Consulta cancelada com sucesso.');
  } catch (err) {
    console.error('[CANCEL_CONSULTATION]', err);
    return error(res, 'Erro ao cancelar consulta.', 500);
  }
};

const getConsultationStats = async (req, res) => {
  try {
    const [[stats]] = await pool.execute(
      `SELECT COUNT(*) AS total_consultas,
              SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) AS pendentes,
              SUM(CASE WHEN status = 'agendada' THEN 1 ELSE 0 END) AS agendadas,
              SUM(CASE WHEN status = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas,
              SUM(CASE WHEN status = 'realizada' THEN 1 ELSE 0 END) AS realizadas,
              SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) AS canceladas,
              COALESCE(SUM(CASE WHEN status = 'realizada' THEN valor ELSE 0 END), 0) AS receita_total
       FROM consultations`
    );

    return success(res, stats);
  } catch (err) {
    console.error('[GET_CONSULTATION_STATS]', err);
    return error(res, 'Erro ao obter estatísticas.', 500);
  }
};

const listProviderConsultations = async (req, res) => {
  try {
    console.log('[LIST_PROVIDER_CONSULTATIONS] ========== INICIANDO ==========');
    console.log('[LIST_PROVIDER_CONSULTATIONS] userId:', req.user?.id);
    console.log('[LIST_PROVIDER_CONSULTATIONS] user role:', req.user?.role);
    console.log('[LIST_PROVIDER_CONSULTATIONS] user email:', req.user?.email);
    
    const company = await getRequesterCompany(req.user.id);
    console.log('[LIST_PROVIDER_CONSULTATIONS] Company:', company?.id, 'tipo:', company?.tipo_empresa);

    if (!company || company.tipo_empresa !== 'consultoria') {
      console.log('[LIST_PROVIDER_CONSULTATIONS] Rejeitado: empresa não é consultoria');
      console.log('[LIST_PROVIDER_CONSULTATIONS] Company data:', JSON.stringify(company));
      return badRequest(res, 'A funcionalidade está disponível apenas para empresas de consultoria.');
    }

    const [rows] = await pool.execute(
      `SELECT c.*, u.nome AS solicitante_nome, u.email AS solicitante_email, rc.nome_empresa AS empresa_solicitante
       FROM consultations c
       INNER JOIN users u ON u.id = c.user_id
       LEFT JOIN company_profiles rc ON rc.id = c.requester_company_id
       WHERE c.consultancy_company_id = ?
       ORDER BY c.slot_date ASC, c.hora_inicio ASC, c.created_at ASC`,
      [company.id]
    );

    console.log('[LIST_PROVIDER_CONSULTATIONS] Rows retornadas:', rows.length);
    console.log('[LIST_PROVIDER_CONSULTATIONS] ========== SUCESSO ==========');
    return success(res, { consultas: rows });
  } catch (err) {
    console.error('[LIST_PROVIDER_CONSULTATIONS] ========== ERRO ==========');
    console.error('[LIST_PROVIDER_CONSULTATIONS] ERRO:', err.message, err.stack);
    return error(res, 'Erro ao listar solicitações da consultoria: ' + err.message, 500);
  }
};

const getProviderAvailability = async (req, res) => {
  try {
    console.log('[GET_PROVIDER_AVAILABILITY] ========== INICIANDO ==========');
    console.log('[GET_PROVIDER_AVAILABILITY] userId:', req.user?.id);
    console.log('[GET_PROVIDER_AVAILABILITY] user role:', req.user?.role);
    console.log('[GET_PROVIDER_AVAILABILITY] user email:', req.user?.email);
    
    const company = await getRequesterCompany(req.user.id);
    console.log('[GET_PROVIDER_AVAILABILITY] Company:', company?.id, 'tipo:', company?.tipo_empresa);

    if (!company || company.tipo_empresa !== 'consultoria') {
      console.log('[GET_PROVIDER_AVAILABILITY] Rejeitado: empresa não é consultoria');
      console.log('[GET_PROVIDER_AVAILABILITY] Company data:', JSON.stringify(company));
      return badRequest(res, 'A funcionalidade está disponível apenas para empresas de consultoria.');
    }

    const rows = await getConsultancyAvailabilityRows(company.id);
    console.log('[GET_PROVIDER_AVAILABILITY] Rows retornadas:', rows.length);
    console.log('[GET_PROVIDER_AVAILABILITY] ========== SUCESSO ==========');
    return success(res, { disponibilidade: rows });
  } catch (err) {
    console.error('[GET_PROVIDER_AVAILABILITY] ========== ERRO ==========');
    console.error('[GET_PROVIDER_AVAILABILITY] ERRO:', err.message, err.stack);
    return error(res, 'Erro ao listar disponibilidade: ' + err.message, 500);
  }
};

const getConsultancyAvailability = async (req, res) => {
  try {
    const { consultancyId } = req.params;

    const [rows] = await pool.execute(
      `SELECT dia_semana, hora_inicio, hora_fim, capacidade_atendimentos, duracao_slot_minutos
       FROM consultancy_availability
       WHERE company_id = ? AND is_active = 1
       ORDER BY dia_semana ASC, hora_inicio ASC`,
      [consultancyId]
    );

    return success(res, rows);
  } catch (err) {
    console.error('[GET_CONSULTANCY_AVAILABILITY]', err);
    return error(res, 'Erro ao obter disponibilidade da consultoria.', 500);
  }
};

const saveProviderAvailability = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    console.log('[SAVE_PROVIDER_AVAILABILITY] Iniciando - userId:', req.user?.id);
    const company = await getRequesterCompany(req.user.id);
    console.log('[SAVE_PROVIDER_AVAILABILITY] Company:', company?.id, 'tipo:', company?.tipo_empresa);

    const disponibilidade = Array.isArray(req.body?.disponibilidade) ? req.body.disponibilidade : [];
    console.log('[SAVE_PROVIDER_AVAILABILITY] Disponibilidade count:', disponibilidade.length);

    if (!company || company.tipo_empresa !== 'consultoria') {
      console.log('[SAVE_PROVIDER_AVAILABILITY] Rejeitado: empresa não é consultoria');
      return badRequest(res, 'A funcionalidade está disponível apenas para empresas de consultoria.');
    }

    await connection.beginTransaction();
    console.log('[SAVE_PROVIDER_AVAILABILITY] Transação iniciada');
    await connection.execute('DELETE FROM consultancy_availability WHERE company_id = ?', [company.id]);
    console.log('[SAVE_PROVIDER_AVAILABILITY] Disponibilidade anterior removida');

    for (const item of disponibilidade) {
      if (item == null) continue;
      if (timeToMinutes(item.hora_fim) <= timeToMinutes(item.hora_inicio)) {
        await connection.rollback();
        return badRequest(res, 'O horário final da disponibilidade deve ser maior que o horário inicial.');
      }

      await connection.execute(
        `INSERT INTO consultancy_availability
         (company_id, dia_semana, hora_inicio, hora_fim, capacidade_atendimentos, duracao_slot_minutos, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          company.id,
          Number(item.dia_semana),
          item.hora_inicio,
          item.hora_fim,
          Number(item.capacidade_atendimentos || 1),
          Number(item.duracao_slot_minutos || 60),
          item.is_active === false ? 0 : 1,
        ]
      );
    }

    await connection.commit();
    await log(req.user.id, 'SAVE_CONSULTANCY_AVAILABILITY', 'consultancy_availability', company.id, { total: disponibilidade.length }, req);
    return success(res, null, 'Disponibilidade guardada com sucesso.');
  } catch (err) {
    console.error('[SAVE_PROVIDER_AVAILABILITY] ERRO:', err.message);
    try { await connection.rollback(); } catch (_) { /* noop */ }

    // Verificar se é erro de tabela não existente
    if (err.message && err.message.includes('consultancy_availability')) {
      console.error('[SAVE_PROVIDER_AVAILABILITY] Tabela consultancy_availability não existe!');
      return error(res, 'Erro: Tabela de disponibilidade não configurada. Reinicie o servidor para aplicar migrações.', 500);
    }

    return error(res, 'Erro ao guardar disponibilidade: ' + err.message, 500);
  } finally {
    connection.release();
  }
};

const getCreditSummary = async (req, res) => {
  try {
    const owner = await getOwnerContext(req.user.id);
    const balance = await getCreditBalance(owner);
    const [pending] = await pool.execute(
      `SELECT rr.*, sp.nome AS package_name
       FROM consultation_recharge_requests rr
       INNER JOIN subscription_packages sp ON sp.id = rr.package_id
       WHERE rr.requester_user_id = ?
       ORDER BY rr.created_at DESC`,
      [req.user.id]
    );

    return success(res, {
      saldo: balance,
      recargas: pending,
    });
  } catch (err) {
    console.error('[GET_CREDIT_SUMMARY]', err);
    return error(res, 'Erro ao obter créditos de consultoria.', 500);
  }
};

const requestRecharge = async (req, res) => {
  try {
    const { package_id, payment_reference, notes } = req.body;
    const owner = await getOwnerContext(req.user.id);

    if (!package_id) {
      return badRequest(res, 'O pacote de recarga é obrigatório.');
    }

    const [[pkg]] = await pool.execute(
      `SELECT *
       FROM subscription_packages
       WHERE id = ? AND status = 'ativo' AND is_active = 1
         AND package_category = 'recarga_consultoria'`,
      [package_id]
    );

    if (!pkg) {
      return notFound(res, 'Pacote de recarga não encontrado.');
    }

    const roleAllowed = (
      (req.user.role === 'company' && ['company', 'all', 'consultancy'].includes(pkg.target_role))
      || (req.user.role === 'investor' && ['investor', 'all'].includes(pkg.target_role))
    );

    if (!roleAllowed) {
      return badRequest(res, 'Este pacote de recarga não está disponível para o seu perfil.');
    }

    const rechargeQuantity = Number(pkg.consultation_recharge_credits || pkg.consultorias_incluidas || 0);

    if (rechargeQuantity <= 0) {
      return badRequest(res, 'O pacote de recarga não possui quantidade de créditos configurada.');
    }

    const [result] = await pool.execute(
      `INSERT INTO consultation_recharge_requests
       (requester_user_id, requester_company_id, package_id, quantity, unit_value, total_value, payment_reference, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        owner.companyId,
        pkg.id,
        rechargeQuantity,
        pkg.preco,
        pkg.preco,
        payment_reference || null,
        notes || null,
      ]
    );

    const [admins] = await pool.execute('SELECT id FROM users WHERE role IN ("admin", "employee") AND status = "ativo"');
    for (const admin of admins) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'recarga_consultoria_pendente', 'Nova recarga de consultoria',
                 CONCAT('Foi solicitada uma recarga de ', ?, ' crédito(s) de consultoria.'))`,
        [admin.id, rechargeQuantity]
      );
    }

    return created(res, { id: result.insertId }, 'Pedido de recarga enviado para validação.');
  } catch (err) {
    console.error('[REQUEST_RECHARGE]', err);
    return error(res, 'Erro ao solicitar recarga.', 500);
  }
};

const listRechargeRequests = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT rr.*, u.nome, u.email, sp.nome AS package_name
       FROM consultation_recharge_requests rr
       INNER JOIN users u ON u.id = rr.requester_user_id
       INNER JOIN subscription_packages sp ON sp.id = rr.package_id
       ORDER BY rr.created_at DESC`
    );

    return success(res, { recargas: rows });
  } catch (err) {
    console.error('[LIST_RECHARGE_REQUESTS]', err);
    return error(res, 'Erro ao listar recargas.', 500);
  }
};

const approveRechargeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const [[request]] = await pool.execute('SELECT * FROM consultation_recharge_requests WHERE id = ?', [id]);
    if (!request) {
      return notFound(res, 'Pedido de recarga não encontrado.');
    }

    if (request.status !== 'pendente') {
      return badRequest(res, 'Apenas pedidos pendentes podem ser aprovados.');
    }

    await createRechargeCredits({
      userId: request.requester_user_id,
      companyId: request.requester_company_id,
      packageId: request.package_id,
      quantity: request.quantity,
      unitValue: request.unit_value,
      totalValue: request.total_value,
      description: `Recarga aprovada de ${request.quantity} crédito(s) de consultoria`,
      createdBy: req.user.id,
      metadata: { recharge_request_id: request.id },
    });

    await pool.execute(
      `UPDATE consultation_recharge_requests
       SET status = 'aprovado', approved_by = ?, approved_at = NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );

    return success(res, null, 'Recarga aprovada com sucesso.');
  } catch (err) {
    console.error('[APPROVE_RECHARGE_REQUEST]', err);
    return error(res, 'Erro ao aprovar recarga.', 500);
  }
};

const rejectRechargeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    await pool.execute(
      `UPDATE consultation_recharge_requests
       SET status = 'rejeitado', approved_by = ?, approved_at = NOW(), rejection_reason = ?
       WHERE id = ?`,
      [req.user.id, motivo || 'Sem motivo informado', id]
    );

    return success(res, null, 'Recarga rejeitada com sucesso.');
  } catch (err) {
    console.error('[REJECT_RECHARGE_REQUEST]', err);
    return error(res, 'Erro ao rejeitar recarga.', 500);
  }
};

module.exports = {
  listUserConsultations,
  listAllConsultations,
  listActiveConsultancies,
  listProviderConsultations,
  getConsultation,
  createConsultation,
  scheduleConsultation,
  rescheduleConsultation,
  confirmConsultation,
  completeConsultation,
  cancelConsultation,
  getAvailableSlots,
  getConsultationStats,
  getProviderAvailability,
  getConsultancyAvailability,
  saveProviderAvailability,
  getCreditSummary,
  requestRecharge,
  listRechargeRequests,
  approveRechargeRequest,
  rejectRechargeRequest,
};
