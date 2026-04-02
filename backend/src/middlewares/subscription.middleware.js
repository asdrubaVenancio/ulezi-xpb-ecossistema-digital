/**
 * Middleware de Assinatura
 * Verifica se a empresa tem assinatura ativa e gerencia privilégios
 */

const { pool } = require('../config/database');

/**
 * Verifica se a empresa já foi aprovada pela equipa administrativa.
 * Mantemos separado da assinatura para reutilizar a regra noutros módulos.
 */
const requireApprovedCompany = async (req, res, next) => {
  try {
    if (req.user.role !== 'company') {
      return next();
    }

    const [companyRows] = await pool.execute(
      'SELECT id, is_approved FROM company_profiles WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    if (!companyRows.length) {
      return res.status(404).json({
        success: false,
        code: 'COMPANY_NOT_FOUND',
        message: 'Perfil de empresa nao encontrado.',
      });
    }

    if (!companyRows[0].is_approved) {
      return res.status(403).json({
        success: false,
        code: 'COMPANY_NOT_APPROVED',
        message: 'A empresa ainda nao foi aprovada pela equipa administrativa.',
      });
    }

    req.companyId = req.companyId || companyRows[0].id;
    next();
  } catch (err) {
    console.error('[REQUIRE_APPROVED_COMPANY]', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar aprovacao da empresa.',
    });
  }
};

/**
 * Verifica se a empresa tem assinatura ativa
 * Bloqueia acesso se não tiver (exceto para atualização de perfil)
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    // Apenas para empresas (role = 'company')
    if (req.user.role !== 'company') {
      return next();
    }

    // Buscar empresa do utilizador
    const [company] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (!company.length) {
      return res.status(404).json({
        success: false,
        code: 'COMPANY_NOT_FOUND',
        message: 'Perfil de empresa não encontrado.'
      });
    }

    const companyId = company[0].id;

    // Verificar assinatura ativa
    const [subscriptions] = await pool.execute(
      `SELECT s.*, sp.slug as package_slug, sp.nome as package_name,
              sp.consultorias_incluidas, sp.max_oportunidades_ativas,
              sp.publicacoes_vagas_ilimitadas, sp.max_vagas_ativas,
              sp.suporte_prioritario, sp.beneficios
       FROM subscriptions s
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE s.company_id = ? AND s.status = 'ativa' AND s.data_fim >= CURDATE()
       ORDER BY s.data_fim DESC
       LIMIT 1`,
      [companyId]
    );

    if (subscriptions.length === 0) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Assinatura necessária. Por favor, adquira um plano para continuar.',
        redirect: '/assinatura/planos'
      });
    }

    // Anexar dados da assinatura ao request
    req.subscription = subscriptions[0];
    req.companyId = companyId;
    next();

  } catch (err) {
    console.error('[REQUIRE_SUBSCRIPTION]', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar assinatura.'
    });
  }
};

/**
 * Verifica privilégio específico (ex: pode publicar vagas?)
 */
const requirePrivilege = (privilege) => {
  return async (req, res, next) => {
    try {
      if (req.user.role !== 'company') return next();

      // Se não tem assinatura, já foi bloqueado pelo middleware anterior
      if (!req.subscription) {
        return res.status(403).json({
          success: false,
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Assinatura necessária para esta funcionalidade.'
        });
      }

      const sub = req.subscription;

      // Verificar privilégio específico
      switch (privilege) {
        case 'oportunidades':
          if (!sub.publicacoes_oportunidades_ilimitadas && sub.max_oportunidades_ativas <= 0) {
            return res.status(403).json({
              success: false,
              code: 'LIMIT_EXCEEDED',
              message: 'Limite de oportunidades atingido. Faça upgrade do seu plano.'
            });
          }
          break;

        case 'vagas':
          // Verificar quantidade atual de vagas ativas
          const [vagasCount] = await pool.execute(
            'SELECT COUNT(*) as total FROM company_job_postings WHERE company_id = ? AND status = "aprovada"',
            [req.companyId]
          );
          
          if (!sub.publicacoes_vagas_ilimitadas && vagasCount[0].total >= (sub.max_vagas_ativas || 0)) {
            return res.status(403).json({
              success: false,
              code: 'LIMIT_EXCEEDED',
              message: `Limite de ${sub.max_vagas_ativas} vagas atingido. Faça upgrade do seu plano.`
            });
          }
          break;

        case 'consultoria':
          // Verificar consultorias usadas no período
          const [consultCount] = await pool.execute(
            `SELECT COUNT(*) as total FROM consultations 
             WHERE user_id = ? AND status IN ('agendada', 'realizada', 'confirmada')
             AND created_at >= (SELECT data_inicio FROM subscriptions WHERE id = ?)`,
            [req.user.id, sub.id]
          );
          
          if (sub.consultorias_incluidas > 0 && consultCount[0].total >= sub.consultorias_incluidas) {
            return res.status(403).json({
              success: false,
              code: 'LIMIT_EXCEEDED',
              message: `Limite de ${sub.consultorias_incluidas} consultorias atingido. Faça upgrade do seu plano.`
            });
          }
          break;

        case 'suporte_prioritario':
          if (!sub.suporte_prioritario) {
            return res.status(403).json({
              success: false,
              code: 'PRIVILEGE_REQUIRED',
              message: 'Suporte prioritário não incluído no seu plano. Faça upgrade.'
            });
          }
          break;
      }

      next();

    } catch (err) {
      console.error('[REQUIRE_PRIVILEGE]', err);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar privilégios.'
      });
    }
  };
};

/**
 * Middleware opcional - adiciona dados da assinatura mas não bloqueia
 */
const optionalSubscription = async (req, res, next) => {
  try {
    if (req.user.role !== 'company') return next();

    const [company] = await pool.execute(
      'SELECT id FROM company_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (!company.length) return next();

    const [subscriptions] = await pool.execute(
      `SELECT s.*, sp.slug, sp.nome, sp.consultorias_incluidas, 
              sp.max_oportunidades_ativas, sp.publicacoes_vagas_ilimitadas,
              sp.max_vagas_ativas, sp.suporte_prioritario
       FROM subscriptions s
       LEFT JOIN subscription_packages sp ON sp.id = s.package_id
       WHERE s.company_id = ? AND s.status = 'ativa' AND s.data_fim >= CURDATE()
       ORDER BY s.data_fim DESC
       LIMIT 1`,
      [company[0].id]
    );

    req.subscription = subscriptions[0] || null;
    req.companyId = company[0].id;
    req.hasActiveSubscription = !!req.subscription;

    next();
  } catch (err) {
    console.error('[OPTIONAL_SUBSCRIPTION]', err);
    next();
  }
};

module.exports = {
  requireActiveSubscription,
  requireApprovedCompany,
  requirePrivilege,
  optionalSubscription
};
