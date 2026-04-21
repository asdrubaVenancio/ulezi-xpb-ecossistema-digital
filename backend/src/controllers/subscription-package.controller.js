/**
 * Controller de Pacotes de Assinatura
 * Gestão de planos/pacotes com workflow de aprovação
 */

const { pool } = require('../config/database');
const { success, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');

/**
 * GET /api/admin/subscription-packages
 * Lista todos os pacotes de assinatura
 */
const listPackages = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params = [];

    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    const [packages] = await pool.execute(
      `SELECT sp.*, 
              u.nome as criado_por_nome,
              a.nome as aprovado_por_nome
       FROM subscription_packages sp
       LEFT JOIN users u ON u.id = sp.created_by
       LEFT JOIN users a ON a.id = sp.approved_by
       ${whereClause}
       ORDER BY sp.ordem ASC, sp.preco ASC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM subscription_packages ${whereClause}`,
      params
    );

    // Resumo por status
    const [summary] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN status = 'inativo' THEN 1 ELSE 0 END) as inativos
       FROM subscription_packages`
    );

    return success(res, {
      pacotes: packages,
      total: countRows[0].total,
      pagina: parseInt(page),
      limite: parseInt(limit),
      resumo: summary[0]
    });

  } catch (err) {
    console.error('[LIST_PACKAGES]', err);
    return error(res, 'Erro ao listar pacotes.', 500);
  }
};

/**
 * GET /api/admin/subscription-packages/:id
 * Detalhes de um pacote
 */
const getPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const [packages] = await pool.execute(
      `SELECT sp.*, 
              u.nome as criado_por_nome,
              a.nome as aprovado_por_nome
       FROM subscription_packages sp
       LEFT JOIN users u ON u.id = sp.created_by
       LEFT JOIN users a ON a.id = sp.approved_by
       WHERE sp.id = ?`,
      [id]
    );

    if (!packages.length) {
      return notFound(res, 'Pacote não encontrado.');
    }

    // Buscar empresas usando este pacote
    const [companies] = await pool.execute(
      `SELECT cp.nome_empresa, s.data_fim, s.status
       FROM subscriptions s
       INNER JOIN company_profiles cp ON cp.id = s.company_id
       WHERE s.package_id = ? AND s.status = 'ativa'
       ORDER BY s.data_fim DESC
       LIMIT 10`,
      [id]
    );

    return success(res, {
      pacote: packages[0],
      empresas_ativas: companies
    });

  } catch (err) {
    console.error('[GET_PACKAGE]', err);
    return error(res, 'Erro ao obter pacote.', 500);
  }
};

/**
 * POST /api/admin/subscription-packages
 * Cria novo pacote (requer aprovação se criado por funcionário)
 */
const createPackage = async (req, res) => {
  try {
    const {
      slug,
      nome,
      package_category = 'empresa',
      target_role = 'company',
      descricao,
      preco,
      moeda = 'AOA',
      duracao_dias = 30,
      duracao_meses = 1,
      consultorias_incluidas = 0,
      consultation_recharge_credits = 0,
      max_oportunidades_ativas = 3,
      max_vagas_ativas = 3,
      publicacoes_oportunidades_ilimitadas = false,
      publicacoes_vagas_ilimitadas = false,
      suporte_prioritario = false,
      beneficios = [],
      ordem = 0
    } = req.body;

    // Validações
    if (!slug || !nome || !preco) {
      return badRequest(res, 'Slug, nome e preço são obrigatórios.');
    }

    // Verificar slug único (por categoria - slugs podem repetir em categorias diferentes)
    const [existing] = await pool.execute(
      'SELECT id FROM subscription_packages WHERE slug = ? AND package_category = ?',
      [slug, package_category]
    );
    if (existing.length) {
      return badRequest(res, 'Já existe um pacote com este slug na mesma categoria.');
    }

    // Definir status baseado no role do criador
    const isEmployee = req.user.role === 'employee';
    const status = isEmployee ? 'pendente' : 'ativo';

    const [result] = await pool.execute(
      `INSERT INTO subscription_packages 
       (slug, nome, package_category, target_role, descricao, preco, moeda, duracao_dias, duracao_meses,
        consultorias_incluidas, consultation_recharge_credits, max_oportunidades_ativas, max_vagas_ativas,
        publicacoes_oportunidades_ilimitadas, publicacoes_vagas_ilimitadas,
        suporte_prioritario, beneficios, status, created_by, ordem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug, nome, package_category, target_role, descricao || null, preco, moeda, duracao_dias, duracao_meses,
        consultorias_incluidas, consultation_recharge_credits, max_oportunidades_ativas, max_vagas_ativas,
        publicacoes_oportunidades_ilimitadas ? 1 : 0,
        publicacoes_vagas_ilimitadas ? 1 : 0,
        suporte_prioritario ? 1 : 0,
        JSON.stringify(beneficios || []),
        status,
        req.user.id,
        ordem
      ]
    );

    // Notificar admins se foi criado por funcionário
    if (isEmployee) {
      const [admins] = await pool.execute(
        'SELECT id FROM users WHERE role = "admin" AND status = "ativo"'
      );
      
      for (const admin of admins) {
        await pool.execute(
          `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
           VALUES (?, 'pacote_pendente', 'Pacote pendente de aprovação',
                   CONCAT('O funcionário ', ?, ' criou o pacote "', ?, '" que aguarda sua aprovação.'))`,
          [admin.id, req.user.nome, nome]
        );
      }
    }

    await log(req.user.id, 'CREATE_PACKAGE', 'subscription_packages', result.insertId, { slug, nome, status }, req);

    return success(res, {
      id: result.insertId,
      status,
      mensagem: isEmployee
        ? 'Pacote criado e aguarda aprovação do administrador.'
        : 'Pacote criado com sucesso.'
    }, undefined, 201);

  } catch (err) {
    console.error('[CREATE_PACKAGE]', err);
    return error(res, 'Erro ao criar pacote.', 500);
  }
};

/**
 * PUT /api/admin/subscription-packages/:id
 * Atualiza pacote
 */
const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Buscar pacote existente
    const [existing] = await pool.execute(
      'SELECT * FROM subscription_packages WHERE id = ?',
      [id]
    );
    if (!existing.length) {
      return notFound(res, 'Pacote não encontrado.');
    }

    // Se não é admin, só pode editar se criou e está pendente
    if (req.user.role !== 'admin' && existing[0].created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    // Campos permitidos
    const allowedFields = [
      'nome', 'package_category', 'target_role', 'descricao', 'preco', 'moeda', 'duracao_dias', 'duracao_meses',
      'consultorias_incluidas', 'consultation_recharge_credits', 'max_oportunidades_ativas', 'max_vagas_ativas',
      'publicacoes_oportunidades_ilimitadas', 'publicacoes_vagas_ilimitadas',
      'suporte_prioritario', 'beneficios', 'ordem', 'is_active'
    ];

    const fields = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        if (field === 'beneficios') {
          values.push(JSON.stringify(updates[field]));
        } else if (field.startsWith('publicacoes_') || field === 'suporte_prioritario') {
          values.push(updates[field] ? 1 : 0);
        } else {
          values.push(updates[field]);
        }
      }
    }

    if (fields.length === 0) {
      return badRequest(res, 'Nenhum campo para atualizar.');
    }

    values.push(id);
    await pool.execute(
      `UPDATE subscription_packages SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    await log(req.user.id, 'UPDATE_PACKAGE', 'subscription_packages', id, updates, req);

    return success(res, null, 'Pacote atualizado com sucesso.');

  } catch (err) {
    console.error('[UPDATE_PACKAGE]', err);
    return error(res, 'Erro ao atualizar pacote.', 500);
  }
};

/**
 * PUT /api/admin/subscription-packages/:id/approve
 * Aprova pacote criado por funcionário
 */
const approvePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { aprovado, motivo_rejeicao } = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM subscription_packages WHERE id = ?',
      [id]
    );
    if (!existing.length) {
      return notFound(res, 'Pacote não encontrado.');
    }

    if (existing[0].status !== 'pendente') {
      return badRequest(res, 'Este pacote já foi processado.');
    }

    const novoStatus = aprovado ? 'ativo' : 'rejeitado';

    await pool.execute(
      `UPDATE subscription_packages 
       SET status = ?, approved_by = ?, approved_at = NOW(), motivo_rejeicao = ?
       WHERE id = ?`,
      [novoStatus, req.user.id, motivo_rejeicao || null, id]
    );

    // Notificar criador
    await pool.execute(
      `INSERT INTO notifications (user_id, tipo, titulo, mensagem)
       VALUES (?, ?, ?, ?)`,
      [
        existing[0].created_by,
        aprovado ? 'pacote_aprovado' : 'pacote_rejeitado',
        aprovado ? 'Pacote aprovado' : 'Pacote rejeitado',
        aprovado 
          ? `Seu pacote "${existing[0].nome}" foi aprovado e já está disponível para as empresas.`
          : `Seu pacote "${existing[0].nome}" foi rejeitado. Motivo: ${motivo_rejeicao || 'Não especificado.'}`
      ]
    );

    await log(req.user.id, aprovado ? 'APPROVE_PACKAGE' : 'REJECT_PACKAGE', 'subscription_packages', id, { motivo_rejeicao }, req);

    return success(res, null, aprovado ? 'Pacote aprovado com sucesso.' : 'Pacote rejeitado.');

  } catch (err) {
    console.error('[APPROVE_PACKAGE]', err);
    return error(res, 'Erro ao processar pacote.', 500);
  }
};

/**
 * DELETE /api/admin/subscription-packages/:id
 * Remove pacote
 */
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se tem assinaturas ativas
    const [subscriptions] = await pool.execute(
      'SELECT COUNT(*) as total FROM subscriptions WHERE package_id = ? AND status = "ativa"',
      [id]
    );

    if (subscriptions[0].total > 0) {
      return badRequest(res, 'Não é possível remover este pacote pois existem assinaturas ativas.');
    }

    await pool.execute('DELETE FROM subscription_packages WHERE id = ?', [id]);

    await log(req.user.id, 'DELETE_PACKAGE', 'subscription_packages', id, {}, req);

    return success(res, null, 'Pacote removido com sucesso.');

  } catch (err) {
    console.error('[DELETE_PACKAGE]', err);
    return error(res, 'Erro ao remover pacote.', 500);
  }
};

/**
 * GET /api/subscription-packages
 * Lista pacotes ativos (para empresas visualizarem)
 */
const listActivePackages = async (req, res) => {
  try {
    const role = req.user.role;
    let companyType = null;

    if (role === 'company') {
      const [[company]] = await pool.execute(
        'SELECT tipo_empresa FROM company_profiles WHERE user_id = ? LIMIT 1',
        [req.user.id]
      );
      companyType = company?.tipo_empresa || 'empresa';
    }

    const [packages] = await pool.execute(
      `SELECT id, slug, nome, package_category, target_role, descricao, preco, moeda, duracao_dias, duracao_meses,
              consultorias_incluidas, consultation_recharge_credits, max_oportunidades_ativas, max_vagas_ativas,
              publicacoes_oportunidades_ilimitadas, publicacoes_vagas_ilimitadas,
              suporte_prioritario, beneficios, ordem
       FROM subscription_packages
       WHERE status = 'ativo' AND is_active = 1
         AND (
           (? = 'company' AND ? = 'empresa' AND target_role IN ('company', 'all') AND package_category IN ('empresa', 'recarga_consultoria'))
           OR (? = 'company' AND ? = 'consultoria' AND target_role IN ('consultancy', 'all') AND package_category IN ('consultoria', 'recarga_consultoria'))
           OR (? = 'investor' AND target_role IN ('investor', 'all') AND package_category = 'recarga_consultoria')
         )
       ORDER BY ordem ASC, preco ASC`,
      [role, companyType, role, companyType, role]
    );

    return success(res, {
      pacotes: packages.map(p => ({
        ...p,
        beneficios: typeof p.beneficios === 'string' ? JSON.parse(p.beneficios) : p.beneficios
      }))
    });

  } catch (err) {
    console.error('[LIST_ACTIVE_PACKAGES]', err);
    return error(res, 'Erro ao listar pacotes.', 500);
  }
};

module.exports = {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  approvePackage,
  deletePackage,
  listActivePackages
};
