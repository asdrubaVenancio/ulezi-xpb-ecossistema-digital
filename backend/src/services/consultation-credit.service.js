/**
 * Serviço de créditos de consultoria.
 * Centraliza saldo, alocação por assinatura e consumo por solicitação.
 */

const { pool } = require('../config/database');

const getOwnerContext = async (userId) => {
  const [[company]] = await pool.execute(
    'SELECT id, tipo_empresa FROM company_profiles WHERE user_id = ? LIMIT 1',
    [userId]
  );

  return {
    userId,
    companyId: company?.id || null,
    companyType: company?.tipo_empresa || null,
  };
};

const getCreditBalance = async ({ userId, companyId = null }) => {
  console.log('[GET_CREDIT_BALANCE] Iniciando - userId:', userId, 'companyId:', companyId);
  try {
    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(quantity), 0) AS saldo
       FROM consultation_credit_transactions
       WHERE owner_user_id = ? AND ((owner_company_id IS NULL AND ? IS NULL) OR owner_company_id = ?)`,
      [userId, companyId, companyId]
    );
    console.log('[GET_CREDIT_BALANCE] Sucesso - saldo:', rows[0]?.saldo || 0);
    return Number(rows[0]?.saldo || 0);
  } catch (error) {
    console.error('[GET_CREDIT_BALANCE] ERRO:', error.message);
    if (error.message && error.message.includes('consultation_credit_transactions')) {
      console.log('[GET_CREDIT_BALANCE] Tabela não existe, retornando 0');
      return 0;
    }
    throw error;
  }
};

const hasSubscriptionAllocation = async (subscriptionId) => {
  const [rows] = await pool.execute(
    `SELECT id
     FROM consultation_credit_transactions
     WHERE subscription_id = ? AND transaction_type = 'assinatura'
     LIMIT 1`,
    [subscriptionId]
  );

  return rows.length > 0;
};

const allocateCreditsFromSubscription = async ({ subscriptionId, createdBy = null }) => {
  console.log('[CREDIT_DEBUG] Iniciando alocação para assinatura:', subscriptionId);

  const [[subscription]] = await pool.execute(
    `SELECT s.id, s.user_id, s.company_id, s.package_id,
            sp.consultorias_incluidas, sp.nome AS package_name
     FROM subscriptions s
     INNER JOIN subscription_packages sp ON sp.id = s.package_id
     WHERE s.id = ?
     LIMIT 1`,
    [subscriptionId]
  );

  console.log('[CREDIT_DEBUG] Assinatura encontrada:', subscription);

  if (!subscription) {
    console.log('[CREDIT_DEBUG] Assinatura não encontrada');
    return false;
  }

  const consultoriasIncluidas = Number(subscription.consultorias_incluidas || 0);
  console.log('[CREDIT_DEBUG] Consultorias incluídas:', consultoriasIncluidas);

  if (consultoriasIncluidas <= 0) {
    console.log('[CREDIT_DEBUG] Sem consultorias incluídas no pacote');
    return false;
  }

  const hasAllocation = await hasSubscriptionAllocation(subscriptionId);
  console.log('[CREDIT_DEBUG] Já tem alocação:', hasAllocation);

  if (hasAllocation) {
    console.log('[CREDIT_DEBUG] Créditos já foram alocados anteriormente');
    return false;
  }

  await pool.execute(
    `INSERT INTO consultation_credit_transactions
     (owner_user_id, owner_company_id, subscription_id, package_id, transaction_type, quantity, description, created_by)
     VALUES (?, ?, ?, ?, 'assinatura', ?, ?, ?)`,
    [
      subscription.user_id,
      subscription.company_id || null,
      subscription.id,
      subscription.package_id,
      consultoriasIncluidas,
      `Créditos atribuídos pela assinatura ${subscription.package_name || 'activa'}`,
      createdBy,
    ]
  );

  console.log('[CREDIT_DEBUG] Créditos alocados com sucesso:', consultoriasIncluidas);
  return true;
};

const createRechargeCredits = async ({
  userId,
  companyId = null,
  packageId,
  quantity,
  unitValue = null,
  totalValue = null,
  description,
  createdBy = null,
  metadata = null,
}) => {
  await pool.execute(
    `INSERT INTO consultation_credit_transactions
     (owner_user_id, owner_company_id, package_id, transaction_type, quantity, unit_value, total_value, description, metadata, created_by)
     VALUES (?, ?, ?, 'recarga', ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      companyId,
      packageId || null,
      Number(quantity || 0),
      unitValue,
      totalValue,
      description || 'Recarga de créditos de consultoria',
      metadata ? JSON.stringify(metadata) : null,
      createdBy,
    ]
  );
};

const consumeCredits = async ({
  userId,
  companyId = null,
  consultationId,
  quantity = 1,
  description,
  createdBy = null,
}) => {
  const saldo = await getCreditBalance({ userId, companyId });
  const debit = Math.abs(Number(quantity || 1));

  if (saldo < debit) {
    return { ok: false, saldo };
  }

  await pool.execute(
    `INSERT INTO consultation_credit_transactions
     (owner_user_id, owner_company_id, consultation_id, transaction_type, quantity, description, created_by)
     VALUES (?, ?, ?, 'consumo', ?, ?, ?)`,
    [
      userId,
      companyId,
      consultationId,
      debit * -1,
      description || 'Consumo de crédito de consultoria',
      createdBy,
    ]
  );

  return { ok: true, saldo_anterior: saldo, saldo_atual: saldo - debit };
};

module.exports = {
  getOwnerContext,
  getCreditBalance,
  allocateCreditsFromSubscription,
  createRechargeCredits,
  consumeCredits,
};
