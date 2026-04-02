/**
 * Controller de MediaÃ§Ã£o de NegÃ³cios
 * MÃ³dulo 7 - NegÃ³cios e Investimentos
 * 
 * Gerencia o processo completo de mediaÃ§Ã£o entre investidores e empresas
 */

const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');
const { sendEmail } = require('../utils/email');

const ensureMediationRuntimeSchema = async () => {
  const allowedTables = new Set(['mediations', 'scheduled_meetings']);
  const allowedColumns = new Set(['mediator_user_id']);

  const ensureColumn = async (table, column, definition) => {
    if (!allowedTables.has(table) || !allowedColumns.has(column)) {
      throw new Error(`Schema guard rejected column check for ${table}.${column}`);
    }

    const [rows] = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`);
    if (!rows.length) {
      await pool.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };

  await ensureColumn('mediations', 'mediator_user_id', 'INT UNSIGNED NULL AFTER employee_id');
  await ensureColumn('scheduled_meetings', 'mediator_user_id', 'INT UNSIGNED NULL AFTER employee_id');

  try {
    await pool.execute('ALTER TABLE mediations MODIFY COLUMN employee_id INT UNSIGNED NULL');
  } catch (_) {}
  try {
    await pool.execute('ALTER TABLE scheduled_meetings MODIFY COLUMN employee_id INT UNSIGNED NULL');
  } catch (_) {}
};

const canManageMediation = (user, mediation) => (
  user?.role === 'admin' || Number(mediation?.mediator_user_id) === Number(user?.id)
);

const sendMeetingStatusEmail = async ({
  to,
  nome,
  titulo,
  contraparte,
  dataReuniao,
  horaInicio,
  tipoReuniao,
  mediador,
  assunto,
  resumo,
}) => {
  if (!to) return;

  return sendEmail({
    to,
    subject: assunto,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0EA5E9;padding:28px;text-align:center">
          <h1 style="color:#fff;margin:0">ULEZI XPB</h1>
          <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">${assunto}</p>
        </div>
        <div style="padding:28px">
          <p style="color:#374151">OlÃ¡ <strong>${nome || 'utilizador'}</strong>,</p>
          <p style="color:#6B7280;line-height:1.6">${resumo}</p>
          <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:18px 0">
            <p style="margin:6px 0;color:#374151"><strong>Processo:</strong> ${titulo}</p>
            <p style="margin:6px 0;color:#374151"><strong>Contraparte:</strong> ${contraparte}</p>
            <p style="margin:6px 0;color:#374151"><strong>Data:</strong> ${dataReuniao || 'A definir'}</p>
            <p style="margin:6px 0;color:#374151"><strong>Hora:</strong> ${horaInicio || 'A definir'}</p>
            <p style="margin:6px 0;color:#374151"><strong>Tipo:</strong> ${tipoReuniao || 'A definir'}</p>
            <p style="margin:6px 0;color:#374151"><strong>Mediador:</strong> ${mediador || 'Equipa Ulezi XPB'}</p>
          </div>
        </div>
      </div>
    `,
  });
};

/**
 * GET /api/admin/mediations
 * Lista todas as mediaÃ§Ãµes com filtros
 */
const listMediations = async (req, res) => {
  try {
    await ensureMediationRuntimeSchema();
    const {
      status,
      employee_id,
      company_id,
      investor_id,
      page = 1,
      limit = 20
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND m.status = ?';
      params.push(status);
    }
    
    if (employee_id) {
      whereClause += ' AND m.employee_id = ?';
      params.push(employee_id);
    }
    
    if (company_id) {
      whereClause += ' AND m.company_id = ?';
      params.push(company_id);
    }
    
    if (investor_id) {
      whereClause += ' AND m.investor_id = ?';
      params.push(investor_id);
    }

    if (req.user.role === 'employee') {
      whereClause += ' AND m.mediator_user_id = ?';
      params.push(req.user.id);
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        m.id,
        m.interest_id,
        m.employee_id,
        m.mediator_user_id,
        m.company_id,
        m.investor_id,
        m.status,
        m.etapa_atual,
        m.data_inicio,
        m.data_conclusao,
        m.prioridade,
        m.resultado_final,
        m.valor_negociado,
        m.observacoes_internas,
        u_inv.nome as nome_investidor,
        u_emp.nome as nome_empresa_representante,
        cp.nome_empresa,
        io.titulo as titulo_oportunidade,
        io.tipo as tipo_oportunidade,
        io.valor as valor_original,
        COALESCE(func.nome, mu.nome) as nome_funcionario,
        CASE WHEN m.mediator_user_id = ? THEN 1 ELSE 0 END as pode_gerir
       FROM mediations m
       INNER JOIN users u_inv ON u_inv.id = m.investor_id
       INNER JOIN company_profiles cp ON cp.id = m.company_id
       INNER JOIN users u_emp ON u_emp.id = cp.user_id
       INNER JOIN investor_interests ii ON ii.id = m.interest_id
       INNER JOIN investment_opportunities io ON io.id = ii.opportunity_id
       LEFT JOIN employees e ON e.id = m.employee_id
       LEFT JOIN users func ON func.id = e.user_id
       LEFT JOIN users mu ON mu.id = m.mediator_user_id
       ${whereClause}
       ORDER BY 
         FIELD(m.prioridade, 'urgente', 'alta', 'media', 'baixa'),
         m.data_inicio DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      [req.user.id, ...params]
    );
    
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM mediations m ${whereClause}`,
      params
    );
    
    return success(res, {
      mediacoes: rows,
      total: countRows[0].total,
      pagina: parseInt(page),
      limite: parseInt(limit)
    });
    
  } catch (err) {
    console.error('[LIST_MEDIATIONS]', err);
    return error(res, 'Erro ao listar mediacoes.', 500);
  }
};

/**
 * GET /api/admin/mediations/:id
 * ObtÃ©m detalhes de uma mediaÃ§Ã£o especÃ­fica
 */
const getMediation = async (req, res) => {
  try {
    await ensureMediationRuntimeSchema();
    const { id } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT 
        m.*,
        u_inv.nome as nome_investidor,
        u_inv.email as email_investidor,
        u_inv.telefone as telefone_investidor,
        cp.nome_empresa,
        cp.descricao as descricao_empresa,
        cp.nif,
        cp.provincia,
        cp.municipio,
        cp.endereco as endereco_empresa,
        u_emp.nome as nome_representante,
        u_emp.email as email_representante,
        u_emp.telefone as telefone_representante,
        io.titulo as titulo_oportunidade,
        io.descricao as descricao_oportunidade,
        io.tipo as tipo_oportunidade,
        io.valor as valor_pedido,
        io.dados_especificos,
        COALESCE(func.nome, mu.nome) as nome_funcionario,
        COALESCE(func.email, mu.email) as email_funcionario
       FROM mediations m
       INNER JOIN users u_inv ON u_inv.id = m.investor_id
       INNER JOIN company_profiles cp ON cp.id = m.company_id
       INNER JOIN users u_emp ON u_emp.id = cp.user_id
       INNER JOIN investor_interests ii ON ii.id = m.interest_id
       INNER JOIN investment_opportunities io ON io.id = ii.opportunity_id
       LEFT JOIN employees e ON e.id = m.employee_id
       LEFT JOIN users func ON func.id = e.user_id
       LEFT JOIN users mu ON mu.id = m.mediator_user_id
       WHERE m.id = ?`,
      [id]
    );
    
    if (!rows.length) {
      return notFound(res, 'Mediacao nao encontrada.');
    }
    
    const mediation = rows[0];

    if (!canManageMediation(req.user, mediation)) {
      return error(res, 'Acesso negado.', 403);
    }
    
    // Buscar reuniÃµes agendadas
    const [meetings] = await pool.execute(
      `SELECT 
        sm.*,
        COALESCE(func.nome, mu.nome) as nome_funcionario
       FROM scheduled_meetings sm
       LEFT JOIN employees e ON e.id = sm.employee_id
       LEFT JOIN users func ON func.id = e.user_id
       LEFT JOIN users mu ON mu.id = sm.mediator_user_id
       WHERE sm.mediation_id = ?
       ORDER BY sm.data_reuniao DESC, sm.hora_inicio DESC`,
      [id]
    );
    
    // Buscar histÃ³rico de interesse
    const [interest] = await pool.execute(
      `SELECT 
        ii.*,
        ii.mensagem as mensagem_interesse
       FROM investor_interests ii
       WHERE ii.id = ?`,
      [mediation.interest_id]
    );
    
    return success(res, {
      mediacao: mediation,
      reunioes: meetings,
      interesse: interest[0] || null,
      permissoes: {
        pode_gerir: true,
        pode_indicar_mediador: req.user.role === 'admin',
      },
    });
    
  } catch (err) {
    console.error('[GET_MEDIATION]', err);
    return error(res, 'Erro ao obter mediacao.', 500);
  }
};

/**
 * POST /api/admin/mediations
 * Cria uma nova mediação a partir de um interesse
 */
const createMediation = async (req, res) => {
  try {
    await ensureMediationRuntimeSchema();
    const { interest_id, employee_id, prioridade = 'media', assign_to_admin = false } = req.body;

    if (!interest_id || (!employee_id && !assign_to_admin)) {
      return badRequest(res, 'ID do interesse e mediador são obrigatórios.');
    }

    const [interest] = await pool.execute(
      `SELECT ii.*,
              cp.id as company_id,
              cp.user_id as company_user_id,
              cp.nome_empresa,
              u.nome as nome_investidor,
              u.email as email_investidor,
              io.titulo as titulo_oportunidade,
              io.tipo as tipo_oportunidade
       FROM investor_interests ii
       INNER JOIN investment_opportunities io ON io.id = ii.opportunity_id
       INNER JOIN company_profiles cp ON cp.id = io.company_id
       INNER JOIN users u ON u.id = ii.investor_id
       WHERE ii.id = ? AND ii.status = 'pendente'`,
      [interest_id]
    );

    if (!interest.length) {
      return notFound(res, 'Interesse não encontrado ou já processado.');
    }

    const interesse = interest[0];

    const [existing] = await pool.execute(
      'SELECT id FROM mediations WHERE interest_id = ?',
      [interest_id]
    );

    if (existing.length > 0) {
      return badRequest(res, 'Já existe uma mediação para este interesse.');
    }

    let employeeIdValue = null;
    let mediatorUserId = req.user.id;
    let mediatorNome = req.user.nome;

    if (!assign_to_admin) {
      const [employee] = await pool.execute(
        `SELECT e.id, u.id as user_id, u.nome
         FROM employees e
         INNER JOIN users u ON u.id = e.user_id
         WHERE e.id = ? AND e.is_active = 1`,
        [employee_id]
      );

      if (!employee.length) {
        return badRequest(res, 'Funcionário não encontrado ou inativo.');
      }

      employeeIdValue = employee[0].id;
      mediatorUserId = employee[0].user_id;
      mediatorNome = employee[0].nome;
    }

    const [result] = await pool.execute(
      `INSERT INTO mediations
       (interest_id, employee_id, mediator_user_id, company_id, investor_id, prioridade, status, etapa_atual)
       VALUES (?, ?, ?, ?, ?, ?, 'pendente', 'triagem')`,
      [interest_id, employeeIdValue, mediatorUserId, interesse.company_id, interesse.investor_id, prioridade]
    );

    await pool.execute(
      'UPDATE investor_interests SET status = "em_mediacao" WHERE id = ?',
      [interest_id]
    );

    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'nova_mediacao', 'Nova mediação atribuída', ?)`,
      [mediatorUserId, `Você foi designado para mediar o negócio: ${interesse.titulo_oportunidade} entre ${interesse.nome_investidor} e a empresa ${interesse.nome_empresa}.`]
    );

    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'mediacao_iniciada', 'Processo de mediação iniciado',
               CONCAT('O processo de mediação para "', ?, '" foi iniciado. O mediador responsável será ', ?, '.'))`,
      [interesse.investor_id, interesse.titulo_oportunidade, mediatorNome]
    );

    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'novo_interesse', 'Novo interesse em sua oportunidade',
               CONCAT('O investidor ', ?, ' demonstrou interesse em "', ?, '". O processo de mediação foi iniciado.'))`,
      [interesse.company_user_id, interesse.nome_investidor, interesse.titulo_oportunidade]
    );

    await log(req.user.id, 'CREATE_MEDIATION', 'mediations', result.insertId, { interest_id, employee_id: employeeIdValue, mediator_user_id: mediatorUserId }, req);

    return created(res, {
      id: result.insertId,
      message: 'Mediação criada com sucesso.',
      mediacao: {
        investidor: interesse.nome_investidor,
        empresa: interesse.nome_empresa,
        oportunidade: interesse.titulo_oportunidade,
        funcionario: mediatorNome,
        prioridade,
      }
    });

  } catch (err) {
    console.error('[CREATE_MEDIATION]', err);
    return error(res, 'Erro ao criar mediação.', 500);
  }
};
const updateMediation = async (req, res) => {
  try {
    await ensureMediationRuntimeSchema();
    const { id } = req.params;
    const {
      status,
      etapa_atual,
      employee_id,
      assign_to_admin,
      prioridade,
      observacoes_internas,
      valor_negociado,
      percentagem_negociado,
      termos_adicionais
    } = req.body;
    
    const [existingRows] = await pool.execute(
      'SELECT * FROM mediations WHERE id = ?',
      [id]
    );
    
    if (!existingRows.length) {
      return notFound(res, 'Mediação não encontrada.');
    }

    const existing = existingRows[0];

    if (!canManageMediation(req.user, existing)) {
      return error(res, 'Acesso negado.', 403);
    }

    const updates = [];
    const params = [];
    let novoMediatorUserId = existing.mediator_user_id;
    let novoEmployeeId = existing.employee_id;

    if (employee_id !== undefined || assign_to_admin === true) {
      if (req.user.role !== 'admin') {
        return error(res, 'Apenas o admin pode alterar o mediador.', 403);
      }

      if (assign_to_admin === true) {
        novoMediatorUserId = req.user.id;
        novoEmployeeId = null;
      } else if (employee_id) {
        const [employeeRows] = await pool.execute(
          `SELECT e.id, u.id as user_id
           FROM employees e
           INNER JOIN users u ON u.id = e.user_id
           WHERE e.id = ?`,
          [employee_id]
        );

        if (!employeeRows.length) {
          return badRequest(res, 'Funcionário indicado não encontrado.');
        }

        novoEmployeeId = employeeRows[0].id;
        novoMediatorUserId = employeeRows[0].user_id;
      }

      updates.push('employee_id = ?');
      params.push(novoEmployeeId);
      updates.push('mediator_user_id = ?');
      params.push(novoMediatorUserId);
    }
    
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (etapa_atual !== undefined) { updates.push('etapa_atual = ?'); params.push(etapa_atual); }
    if (prioridade !== undefined) { updates.push('prioridade = ?'); params.push(prioridade); }
    if (observacoes_internas !== undefined) { updates.push('observacoes_internas = ?'); params.push(observacoes_internas); }
    if (valor_negociado !== undefined) { updates.push('valor_negociado = ?'); params.push(valor_negociado); }
    if (percentagem_negociado !== undefined) { updates.push('percentagem_negociado = ?'); params.push(percentagem_negociado); }
    if (termos_adicionais !== undefined) { updates.push('termos_adicionais = ?'); params.push(JSON.stringify(termos_adicionais)); }
    
    if (updates.length === 0) {
      return badRequest(res, 'Nenhum campo para atualizar.');
    }
    
    params.push(id);
    await pool.execute(
      `UPDATE mediations SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    if (novoMediatorUserId !== existing.mediator_user_id) {
      await pool.execute(
        `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
         VALUES (?, 'mediacao_transferida', 'Mediação atribuída', 'Uma mediação foi atribuída a si.')`,
        [novoMediatorUserId]
      );
    }
    
    await log(req.user.id, 'UPDATE_MEDIATION', 'mediations', id, { status, etapa_atual, employee_id: novoEmployeeId, mediator_user_id: novoMediatorUserId }, req);
    
    return success(res, { message: 'Mediação atualizada com sucesso.' });
    
  } catch (err) {
    console.error('[UPDATE_MEDIATION]', err);
    return error(res, 'Erro ao atualizar mediação.', 500);
  }
};

/**
 * POST /api/admin/mediations/:id/complete
 * Finaliza uma mediação com sucesso ou insucesso
 */
const completeMediation = async (req, res) => {
  try {
    await ensureMediationRuntimeSchema();
    const { id } = req.params;
    const { resultado_final, motivo_cancelamento } = req.body;
    
    if (!['sucesso', 'insucesso', 'cancelado'].includes(resultado_final)) {
      return badRequest(res, 'Resultado deve ser: sucesso, insucesso ou cancelado.');
    }
    
    const [existing] = await pool.execute(
      `SELECT m.*, 
              u_inv.nome as nome_investidor,
              u_inv.email as email_investidor,
              cp.nome_empresa,
              cp.user_id as company_user_id
       FROM mediations m
       INNER JOIN users u_inv ON u_inv.id = m.investor_id
       INNER JOIN company_profiles cp ON cp.id = m.company_id
       WHERE m.id = ?`,
      [id]
    );
    
    if (!existing.length) {
      return notFound(res, 'Mediação não encontrada.');
    }

    const mediation = existing[0];

    if (!canManageMediation(req.user, mediation)) {
      return error(res, 'Acesso negado.', 403);
    }
    
    await pool.execute(
      `UPDATE mediations SET
        status = 'concluida',
        resultado_final = ?,
        motivo_cancelamento = ?,
        data_conclusao = NOW()
       WHERE id = ?`,
      [resultado_final, motivo_cancelamento || null, id]
    );
    
    const novoStatusInteresse = resultado_final === 'sucesso' ? 'aprovado' : 'cancelado';
    await pool.execute(
      'UPDATE investor_interests SET status = ? WHERE id = ?',
      [novoStatusInteresse, mediation.interest_id]
    );
    
    const mensagem = resultado_final === 'sucesso'
      ? `A mediação foi concluída com sucesso! Parabéns pelo negócio com ${mediation.nome_empresa}.`
      : resultado_final === 'insucesso'
      ? `A mediação não resultou em acordo. ${motivo_cancelamento || 'As partes não chegaram a um consenso.'}`
      : `A mediação foi cancelada. ${motivo_cancelamento || ''}`;
    
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'mediacao_concluida', ?, ?)`,
      [mediation.investor_id, `Mediação: ${resultado_final}`, mensagem]
    );
    
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, 'mediacao_concluida', ?, ?)`,
      [mediation.company_user_id, `Mediação: ${resultado_final}`, mensagem]
    );
    
    await log(req.user.id, 'COMPLETE_MEDIATION', 'mediations', id, { resultado_final }, req);
    
    return success(res, {
      message: 'Mediação concluída com sucesso.',
      resultado: resultado_final,
      proximo_passo: resultado_final === 'sucesso' ? 'Gerar contrato formal' : 'Arquivar processo'
    });
    
  } catch (err) {
    console.error('[COMPLETE_MEDIATION]', err);
    return error(res, 'Erro ao concluir mediação.', 500);
  }
};

/**
 * POST /api/admin/mediations/:id/meetings
 * Agenda ou remarca uma reunião para a mediação
 */
const scheduleMeeting = async (req, res) => {
  try {
    await ensureMediationRuntimeSchema();
    const { id } = req.params;
    const {
      meeting_id,
      data_reuniao,
      hora_inicio,
      hora_fim,
      local_reuniao,
      tipo_reuniao,
      link_video,
      objetivo,
      pauta
    } = req.body;
    
    if (!data_reuniao || !hora_inicio || !tipo_reuniao) {
      return badRequest(res, 'Data, hora e tipo de reunião são obrigatórios.');
    }
    
    const [mediation] = await pool.execute(
      `SELECT m.*, 
              u_inv.nome as nome_investidor,
              u_inv.email as email_investidor,
              cp.nome_empresa,
              cp.user_id as company_user_id,
              u_emp.email as email_empresa,
              COALESCE(func.nome, mu.nome) as nome_funcionario,
              COALESCE(func.email, mu.email) as email_funcionario
       FROM mediations m
       INNER JOIN users u_inv ON u_inv.id = m.investor_id
       INNER JOIN company_profiles cp ON cp.id = m.company_id
       INNER JOIN users u_emp ON u_emp.id = cp.user_id
       LEFT JOIN employees e ON e.id = m.employee_id
       LEFT JOIN users func ON func.id = e.user_id
       LEFT JOIN users mu ON mu.id = m.mediator_user_id
       WHERE m.id = ?`,
      [id]
    );
    
    if (!mediation.length) {
      return notFound(res, 'Mediação não encontrada.');
    }
    
    const med = mediation[0];

    if (!canManageMediation(req.user, med)) {
      return error(res, 'Acesso negado.', 403);
    }

    let resultId = meeting_id;
    const isEditing = !!meeting_id;

    if (isEditing) {
      await pool.execute(
        `UPDATE scheduled_meetings
         SET data_reuniao = ?, hora_inicio = ?, hora_fim = ?, local_reuniao = ?,
             tipo_reuniao = ?, link_video = ?, objetivo = ?, pauta = ?,
             status = 'reagendada', employee_id = ?, mediator_user_id = ?
         WHERE id = ? AND mediation_id = ?`,
        [
          data_reuniao,
          hora_inicio,
          hora_fim || null,
          local_reuniao || null,
          tipo_reuniao,
          link_video || null,
          objetivo || null,
          pauta || null,
          med.employee_id || null,
          med.mediator_user_id || null,
          meeting_id,
          id,
        ]
      );
    } else {
      const [result] = await pool.execute(
        `INSERT INTO scheduled_meetings 
         (mediation_id, employee_id, mediator_user_id, company_id, investor_id, data_reuniao, hora_inicio, hora_fim, 
          local_reuniao, tipo_reuniao, link_video, objetivo, pauta)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, med.employee_id || null, med.mediator_user_id || null, med.company_id, med.investor_id, data_reuniao, hora_inicio, hora_fim || null,
         local_reuniao || null, tipo_reuniao, link_video || null, objetivo || null, pauta || null]
      );
      resultId = result.insertId;
    }
    
    await pool.execute(
      'UPDATE mediations SET status = "agendada", etapa_atual = "reuniao_inicial" WHERE id = ?',
      [id]
    );

    const tipoNotificacao = isEditing ? 'reuniao_reagendada' : 'reuniao_agendada';
    const tituloNotificacao = isEditing ? 'Reunião de mediação reagendada' : 'Reunião de mediação agendada';
    const assunto = isEditing ? 'Reunião de mediação reagendada' : 'Reunião de mediação agendada';
    const resumoInvestidor = isEditing
      ? `A reunião da mediação com a empresa ${med.nome_empresa} foi reagendada.`
      : `Foi agendada uma reunião da mediação com a empresa ${med.nome_empresa}.`;
    const resumoEmpresa = isEditing
      ? `A reunião da mediação com o investidor ${med.nome_investidor} foi reagendada.`
      : `Foi agendada uma reunião da mediação com o investidor ${med.nome_investidor}.`;
    
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, ?, ?, CONCAT('Reunião marcada para ', ?, ' às ', ?, '.'))`,
      [med.investor_id, tipoNotificacao, tituloNotificacao, data_reuniao, hora_inicio]
    );
    
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, ?, ?, CONCAT('Reunião marcada para ', ?, ' às ', ?, '.'))`,
      [med.company_user_id, tipoNotificacao, tituloNotificacao, data_reuniao, hora_inicio]
    );
    
    await Promise.all([
      sendMeetingStatusEmail({
        to: med.email_investidor,
        nome: med.nome_investidor,
        titulo: med.titulo_oportunidade || `Mediação com ${med.nome_empresa}`,
        contraparte: med.nome_empresa,
        dataReuniao: data_reuniao,
        horaInicio: hora_inicio,
        tipoReuniao: tipo_reuniao,
        mediador: med.nome_funcionario,
        assunto,
        resumo: resumoInvestidor,
      }),
      sendMeetingStatusEmail({
        to: med.email_empresa,
        nome: med.nome_empresa,
        titulo: med.titulo_oportunidade || `Mediação com ${med.nome_investidor}`,
        contraparte: med.nome_investidor,
        dataReuniao: data_reuniao,
        horaInicio: hora_inicio,
        tipoReuniao: tipo_reuniao,
        mediador: med.nome_funcionario,
        assunto,
        resumo: resumoEmpresa,
      }),
    ]);
    
    await log(req.user.id, isEditing ? 'RESCHEDULE_MEETING' : 'SCHEDULE_MEETING', 'scheduled_meetings', resultId, { mediation_id: id }, req);
    
    return created(res, {
      id: resultId,
      message: isEditing ? 'Reunião reagendada com sucesso.' : 'Reunião agendada com sucesso.',
      reuniao: {
        data: data_reuniao,
        hora: hora_inicio,
        tipo: tipo_reuniao,
        mediador: med.nome_funcionario
      }
    });
    
  } catch (err) {
    console.error('[SCHEDULE_MEETING]', err);
    return error(res, 'Erro ao agendar reunião.', 500);
  }
};

/**
 * POST /api/admin/mediations/:id/meetings/:meetingId/cancel
 * Cancela uma reunião e avisa as partes
 */
const cancelMeeting = async (req, res) => {
  try {
    await ensureMediationRuntimeSchema();
    const { id, meetingId } = req.params;
    const { motivo } = req.body;

    const [rows] = await pool.execute(
      `SELECT m.mediator_user_id, m.employee_id, m.id as mediation_id,
              sm.id, sm.data_reuniao, sm.hora_inicio, sm.tipo_reuniao,
              u_inv.nome as nome_investidor, u_inv.email as email_investidor,
              cp.nome_empresa, u_emp.email as email_empresa,
              COALESCE(func.nome, mu.nome) as nome_funcionario
       FROM scheduled_meetings sm
       INNER JOIN mediations m ON m.id = sm.mediation_id
       INNER JOIN users u_inv ON u_inv.id = m.investor_id
       INNER JOIN company_profiles cp ON cp.id = m.company_id
       INNER JOIN users u_emp ON u_emp.id = cp.user_id
       LEFT JOIN employees e ON e.id = m.employee_id
       LEFT JOIN users func ON func.id = e.user_id
       LEFT JOIN users mu ON mu.id = m.mediator_user_id
       WHERE sm.id = ? AND sm.mediation_id = ?`,
      [meetingId, id]
    );

    if (!rows.length) {
      return notFound(res, 'Reunião não encontrada.');
    }

    const meeting = rows[0];

    if (!canManageMediation(req.user, meeting)) {
      return error(res, 'Acesso negado.', 403);
    }

    await pool.execute(
      `UPDATE scheduled_meetings SET status = 'cancelada', observacoes = ? WHERE id = ?`,
      [motivo || 'Reunião cancelada pelo mediador.', meetingId]
    );

    await Promise.all([
      pool.execute(`INSERT INTO notifications (user_id, tipo, titulo, mensagem) VALUES ((SELECT investor_id FROM mediations WHERE id = ?), 'reuniao_cancelada', 'Reunião cancelada', ?)`, [id, motivo || 'A reunião foi cancelada.']),
      pool.execute(`INSERT INTO notifications (user_id, tipo, titulo, mensagem) VALUES ((SELECT cp.user_id FROM mediations m INNER JOIN company_profiles cp ON cp.id = m.company_id WHERE m.id = ?), 'reuniao_cancelada', 'Reunião cancelada', ?)`, [id, motivo || 'A reunião foi cancelada.'])
    ]);

    await Promise.all([
      sendMeetingStatusEmail({
        to: meeting.email_investidor,
        nome: meeting.nome_investidor,
        titulo: `Mediação com ${meeting.nome_empresa}`,
        contraparte: meeting.nome_empresa,
        dataReuniao: meeting.data_reuniao,
        horaInicio: meeting.hora_inicio,
        tipoReuniao: meeting.tipo_reuniao,
        mediador: meeting.nome_funcionario,
        assunto: 'Reunião de mediação cancelada',
        resumo: motivo || 'A reunião de mediação foi cancelada. O mediador entrará em contacto para novo alinhamento.',
      }),
      sendMeetingStatusEmail({
        to: meeting.email_empresa,
        nome: meeting.nome_empresa,
        titulo: `Mediação com ${meeting.nome_investidor}`,
        contraparte: meeting.nome_investidor,
        dataReuniao: meeting.data_reuniao,
        horaInicio: meeting.hora_inicio,
        tipoReuniao: meeting.tipo_reuniao,
        mediador: meeting.nome_funcionario,
        assunto: 'Reunião de mediação cancelada',
        resumo: motivo || 'A reunião de mediação foi cancelada. O mediador entrará em contacto para novo alinhamento.',
      }),
    ]);

    await log(req.user.id, 'CANCEL_MEETING', 'scheduled_meetings', meetingId, { mediation_id: id, motivo }, req);

    return success(res, { message: 'Reunião cancelada com sucesso.' });
  } catch (err) {
    console.error('[CANCEL_MEETING]', err);
    return error(res, 'Erro ao cancelar reunião.', 500);
  }
};

/**
 * GET /api/admin/mediations/stats
 * EstatÃ­sticas de mediaÃ§Ãµes
 */
const getMediationStats = async (req, res) => {
  try {
    // EstatÃ­sticas gerais
    const [[stats]] = await pool.execute(
      `SELECT 
        COUNT(*) as total_mediacoes,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
        COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
        COUNT(CASE WHEN resultado_final = 'sucesso' THEN 1 END) as sucessos,
        COUNT(CASE WHEN resultado_final = 'insucesso' THEN 1 END) as insucessos,
        COALESCE(SUM(valor_negociado), 0) as valor_total_negociado
       FROM mediations`
    );
    
    // Por funcionÃ¡rio
    const [byEmployee] = await pool.execute(
      `SELECT 
        e.id,
        u.nome,
        COUNT(*) as total,
        COUNT(CASE WHEN m.resultado_final = 'sucesso' THEN 1 END) as sucessos,
        COALESCE(SUM(m.valor_negociado), 0) as valor_negociado
       FROM mediations m
       INNER JOIN employees e ON e.id = m.employee_id
       INNER JOIN users u ON u.id = e.user_id
       WHERE m.status = 'concluida'
       GROUP BY e.id
       ORDER BY sucessos DESC`
    );
    
    // Por mÃªs (Ãºltimos 6 meses)
    const [byMonth] = await pool.execute(
      `SELECT 
        DATE_FORMAT(data_inicio, '%Y-%m') as mes,
        COUNT(*) as total,
        COUNT(CASE WHEN resultado_final = 'sucesso' THEN 1 END) as sucessos
       FROM mediations
       WHERE data_inicio >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(data_inicio, '%Y-%m')
       ORDER BY mes`
    );
    
    return success(res, {
      estatisticas_gerais: stats,
      por_funcionario: byEmployee,
      por_mes: byMonth
    });
    
  } catch (err) {
    console.error('[MEDIATION_STATS]', err);
    return error(res, 'Erro ao obter estatisticas.', 500);
  }
};

module.exports = {
  listMediations,
  getMediation,
  createMediation,
  updateMediation,
  completeMediation,
  scheduleMeeting,
  cancelMeeting,
  getMediationStats
};

