/**
 * Controller de coordenadas bancárias
 * Gerencia dados bancários para pagamentos de inscrições
 * Apenas administradores podem criar/editar coordenadas
 * Todos os usuários podem visualizar as coordenadas ativas
 */
const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');

/**
 * Valida os dados de uma coordenada bancária
 * @param {Object} dados - Dados a serem validados
 * @returns {Object|null} - Objeto com erro ou null se válido
 */
const validarCoordenada = (dados) => {
  const { tipo, titulo, numero, titular } = dados;

  if (!tipo || !['IBAN', 'MULTICAIXA_EXPRESS', 'CONTA_BANCARIA', 'OUTRO'].includes(tipo)) {
    return { campo: 'tipo', mensagem: 'Tipo de coordenada inválido.' };
  }

  if (!titulo || titulo.trim().length < 2) {
    return { campo: 'titulo', mensagem: 'Título é obrigatório (mín. 2 caracteres).' };
  }

  if (!numero || numero.trim().length < 5) {
    return { campo: 'numero', mensagem: 'Número é obrigatório (mín. 5 caracteres).' };
  }

  if (!titular || titular.trim().length < 2) {
    return { campo: 'titular', mensagem: 'Titular é obrigatório (mín. 2 caracteres).' };
  }

  return null;
};

/**
 * Formata o número da coordenada para exibição
 * @param {string} tipo - Tipo de coordenada
 * @param {string} numero - Número da coordenada
 * @returns {string} - Número formatado
 */
const formatarNumero = (tipo, numero) => {
  const num = numero.replace(/\s/g, '');

  switch (tipo) {
    case 'IBAN':
      // Formato IBAN: AO06 0040 0000 1234 5678 9012 3
      if (num.length >= 25) {
        return num.match(/.{1,4}/g).join(' ');
      }
      return num;
    case 'MULTICAIXA_EXPRESS':
      // Formato: 000 000 000
      if (num.length === 9) {
        return num.match(/.{1,3}/g).join(' ');
      }
      return num;
    default:
      return num;
  }
};

/**
 * GET /api/bank-coordinates
 * Lista todas as coordenadas bancárias (público - apenas ativas)
 */
const listarCoordenadasPublico = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        id,
        tipo,
        titulo,
        numero,
        titular,
        banco,
        descricao,
        ordem
      FROM bank_coordinates
      WHERE is_active = 1
      ORDER BY ordem ASC, created_at DESC
      `
    );

    // Formata os números para exibição
    const coordenadas = rows.map((coord) => ({
      ...coord,
      numero_formatado: formatarNumero(coord.tipo, coord.numero),
    }));

    return success(res, { coordenadas }, 'Coordenadas bancárias obtidas com sucesso.');
  } catch (err) {
    console.error('[BANK_COORDS_PUBLIC_LIST]', err);
    return error(res, 'Erro ao obter coordenadas bancárias.');
  }
};

/**
 * GET /api/admin/bank-coordinates
 * Lista todas as coordenadas bancárias (admin - inclui inativas)
 */
const listarCoordenadasAdmin = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        bc.id,
        bc.tipo,
        bc.titulo,
        bc.numero,
        bc.titular,
        bc.banco,
        bc.descricao,
        bc.is_active,
        bc.ordem,
        bc.created_at,
        bc.updated_at,
        u.nome AS created_by_name
      FROM bank_coordinates bc
      INNER JOIN users u ON u.id = bc.created_by
      ORDER BY bc.ordem ASC, bc.created_at DESC
      `
    );

    return success(res, { coordenadas: rows }, 'Coordenadas bancárias obtidas com sucesso.');
  } catch (err) {
    console.error('[BANK_COORDS_ADMIN_LIST]', err);
    return error(res, 'Erro ao obter coordenadas bancárias.');
  }
};

/**
 * GET /api/admin/bank-coordinates/:id
 * Obtém detalhes de uma coordenada bancária específica
 */
const obterCoordenada = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `
      SELECT
        bc.*,
        u.nome AS created_by_name
      FROM bank_coordinates bc
      INNER JOIN users u ON u.id = bc.created_by
      WHERE bc.id = ?
      `,
      [id]
    );

    if (!rows.length) {
      return notFound(res, 'Coordenada bancária não encontrada.');
    }

    return success(res, { coordenada: rows[0] }, 'Coordenada bancária obtida com sucesso.');
  } catch (err) {
    console.error('[BANK_COORDS_GET]', err);
    return error(res, 'Erro ao obter coordenada bancária.');
  }
};

/**
 * POST /api/admin/bank-coordinates
 * Cria uma nova coordenada bancária (apenas admin)
 */
const criarCoordenada = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipo, titulo, numero, titular, banco, descricao, ordem } = req.body;

    // Validação dos dados
    const erroValidacao = validarCoordenada({ tipo, titulo, numero, titular });
    if (erroValidacao) {
      return badRequest(res, erroValidacao.mensagem);
    }

    // Insere a coordenada bancária
    const [result] = await pool.execute(
      `
      INSERT INTO bank_coordinates
        (tipo, titulo, numero, titular, banco, descricao, ordem, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        tipo,
        titulo.trim(),
        numero.trim(),
        titular.trim(),
        banco?.trim() || null,
        descricao?.trim() || null,
        ordem || 0,
        userId,
      ]
    );

    // Registra a auditoria
    await log(userId, 'CREATE_BANK_COORD', 'bank_coordinates', result.insertId, { tipo, titulo }, req);

    return created(res, 'Coordenada bancária criada com sucesso.', {
      id: result.insertId,
    });
  } catch (err) {
    console.error('[BANK_COORDS_CREATE]', err);
    return error(res, 'Erro ao criar coordenada bancária.');
  }
};

/**
 * PUT /api/admin/bank-coordinates/:id
 * Atualiza uma coordenada bancária existente
 */
const atualizarCoordenada = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { tipo, titulo, numero, titular, banco, descricao, is_active, ordem } = req.body;

    // Verifica se a coordenada existe
    const [existente] = await pool.execute(
      'SELECT id FROM bank_coordinates WHERE id = ?',
      [id]
    );

    if (!existente.length) {
      return notFound(res, 'Coordenada bancária não encontrada.');
    }

    // Validação dos dados se estão sendo atualizados
    if (tipo || titulo || numero || titular) {
      const erroValidacao = validarCoordenada({
        tipo: tipo || existente[0].tipo,
        titulo: titulo || existente[0].titulo,
        numero: numero || existente[0].numero,
        titular: titular || existente[0].titular,
      });
      if (erroValidacao) {
        return badRequest(res, erroValidacao.mensagem);
      }
    }

    // Atualiza a coordenada
    await pool.execute(
      `
      UPDATE bank_coordinates
      SET
        tipo = COALESCE(?, tipo),
        titulo = COALESCE(?, titulo),
        numero = COALESCE(?, numero),
        titular = COALESCE(?, titular),
        banco = COALESCE(?, banco),
        descricao = COALESCE(?, descricao),
        is_active = COALESCE(?, is_active),
        ordem = COALESCE(?, ordem)
      WHERE id = ?
      `,
      [
        tipo || null,
        titulo?.trim() || null,
        numero?.trim() || null,
        titular?.trim() || null,
        banco?.trim() || null,
        descricao?.trim() || null,
        typeof is_active !== 'undefined' ? (is_active ? 1 : 0) : null,
        ordem !== undefined ? ordem : null,
        id,
      ]
    );

    // Registra a auditoria
    await log(userId, 'UPDATE_BANK_COORD', 'bank_coordinates', id, { tipo, titulo }, req);

    return success(res, 'Coordenada bancária atualizada com sucesso.');
  } catch (err) {
    console.error('[BANK_COORDS_UPDATE]', err);
    return error(res, 'Erro ao atualizar coordenada bancária.');
  }
};

/**
 * DELETE /api/admin/bank-coordinates/:id
 * Remove uma coordenada bancária (soft delete - apenas desativa)
 */
const desativarCoordenada = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verifica se a coordenada existe
    const [existente] = await pool.execute(
      'SELECT id, titulo FROM bank_coordinates WHERE id = ?',
      [id]
    );

    if (!existente.length) {
      return notFound(res, 'Coordenada bancária não encontrada.');
    }

    // Desativa a coordenada (soft delete)
    await pool.execute(
      'UPDATE bank_coordinates SET is_active = 0 WHERE id = ?',
      [id]
    );

    // Registra a auditoria
    await log(userId, 'DEACTIVATE_BANK_COORD', 'bank_coordinates', id, { titulo: existente[0].titulo }, req);

    return success(res, 'Coordenada bancária desativada com sucesso.');
  } catch (err) {
    console.error('[BANK_COORDS_DELETE]', err);
    return error(res, 'Erro ao desativar coordenada bancária.');
  }
};

/**
 * DELETE /api/admin/bank-coordinates/:id/permanente
 * Remove permanentemente uma coordenada bancária
 */
const excluirCoordenadaPermanente = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verifica se a coordenada existe
    const [existente] = await pool.execute(
      'SELECT id, titulo FROM bank_coordinates WHERE id = ?',
      [id]
    );

    if (!existente.length) {
      return notFound(res, 'Coordenada bancária não encontrada.');
    }

    // Remove permanentemente
    await pool.execute(
      'DELETE FROM bank_coordinates WHERE id = ?',
      [id]
    );

    // Registra a auditoria
    await log(userId, 'DELETE_BANK_COORD', 'bank_coordinates', id, { titulo: existente[0].titulo }, req);

    return success(res, 'Coordenada bancária excluída permanentemente.');
  } catch (err) {
    console.error('[BANK_COORDS_DELETE_PERM]', err);
    return error(res, 'Erro ao excluir coordenada bancária.');
  }
};

module.exports = {
  listarCoordenadasPublico,
  listarCoordenadasAdmin,
  obterCoordenada,
  criarCoordenada,
  atualizarCoordenada,
  desativarCoordenada,
  excluirCoordenadaPermanente,
  formatarNumero,
};
