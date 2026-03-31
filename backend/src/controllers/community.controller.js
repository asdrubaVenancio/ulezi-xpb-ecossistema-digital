/**
 * Controller do Módulo de Comunidade
 */
const { pool } = require('../config/database');
const { success, error, notFound } = require('../utils/response');

const normalizeRole = (role) => ({
  estudante: 'student',
  empresa: 'company',
  investidor: 'investor',
}[role] || role);

/** GET /api/community/profiles - Listar perfis públicos */
const listProfiles = async (req, res) => {
  try {
    const role = normalizeRole(req.query.role);
    const search = req.query.search || req.query.pesquisa;
    const page = req.query.page || 1;
    const limit = req.query.limit || req.query.limite || 20;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let rows = [];

    if (!role || role === 'company') {
      let q = `SELECT u.id, u.nome, u.email, u.telefone, u.foto_perfil, 'company' as tipo,
               cp.nome_empresa, cp.sector, cp.provincia, cp.municipio, cp.descricao, cp.website, cp.id as company_id
               FROM company_profiles cp LEFT JOIN users u ON u.id=cp.user_id
               WHERE cp.is_public=1 AND cp.is_approved=1 AND u.status="ativo"`;
      const p = [];
      if (search) { q += ' AND (cp.nome_empresa LIKE ? OR cp.descricao LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
      const [companies] = await pool.execute(q, p);
      rows.push(...companies);
    }

    if (!role || role === 'investor') {
      let q = `SELECT u.id, u.nome, u.email, u.telefone, u.foto_perfil, 'investor' as tipo,
               ip.areas_interesse, ip.descricao, ip.provincia, ip.municipio
               FROM investor_profiles ip LEFT JOIN users u ON u.id=ip.user_id
               WHERE ip.is_public=1 AND u.status="ativo"`;
      const p = [];
      if (search) { q += ' AND (u.nome LIKE ? OR ip.descricao LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
      const [investors] = await pool.execute(q, p);
      rows.push(...investors);
    }

    if (!role || role === 'student') {
      let q = `SELECT u.id, u.nome, u.foto_perfil, 'student' as tipo,
               sp.municipio, sp.provincia, sp.bio
               FROM student_profiles sp LEFT JOIN users u ON u.id=sp.user_id
               WHERE sp.is_public=1 AND u.status="ativo"`;
      const p = [];
      if (search) { q += ' AND (u.nome LIKE ? OR sp.bio LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
      const [students] = await pool.execute(q, p);
      rows.push(...students);
    }

    // Paginação manual
    const total = rows.length;
    const paginated = rows.slice(offset, offset + parseInt(limit));

    return success(res, { profiles: paginated, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return error(res, 'Erro ao listar perfis.', 500);
  }
};

/** GET /api/community/services - Buscar empresas por serviço */
const findByService = async (req, res) => {
  try {
    const category_id = req.query.category_id || req.query.categoria;
    const search = req.query.search || req.query.pesquisa;

    let query = `SELECT cp.id, cp.nome_empresa, cp.sector, cp.provincia, cp.municipio, cp.descricao, cp.website,
                 u.email, u.telefone, u.foto_perfil, sc.nome as servico_nome, cs.descricao as servico_descricao
                 FROM company_services cs
                 LEFT JOIN company_profiles cp ON cp.id=cs.company_id
                 LEFT JOIN service_categories sc ON sc.id=cs.category_id
                 LEFT JOIN users u ON u.id=cp.user_id
                 WHERE cs.ativo=1 AND cp.is_public=1 AND cp.is_approved=1 AND u.status="ativo"`;
    const params = [];

    if (category_id) { query += ' AND cs.category_id=?'; params.push(category_id); }
    if (search) { query += ' AND (cp.nome_empresa LIKE ? OR sc.nome LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, 'Erro ao buscar empresas por serviço.', 500);
  }
};

/** GET /api/community/services/categories - Listar categorias de serviços */
const listServiceCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM service_categories WHERE status="ativo" ORDER BY nome');
    return success(res, rows);
  } catch (err) {
    return error(res, 'Erro ao listar categorias.', 500);
  }
};

/** GET /api/community/jobs - Listar vagas de emprego */
const listJobs = async (req, res) => {
  try {
    const search = req.query.search || req.query.pesquisa;
    const { tipo } = req.query;
    let query = 'SELECT * FROM job_postings WHERE status="ativa"';
    const params = [];
    if (search) { query += ' AND (titulo LIKE ? OR empresa LIKE ? OR descricao LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (tipo) { query += ' AND tipo=?'; params.push(tipo); }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, 'Erro ao listar vagas.', 500);
  }
};

/** GET /api/community/jobs/:id - Detalhes de vaga */
const getJob = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM job_postings WHERE id=? AND status="ativa"', [req.params.id]);
    if (!rows.length) return notFound(res, 'Vaga não encontrada.');
    return success(res, rows[0]);
  } catch (err) {
    return error(res, 'Erro ao obter vaga.', 500);
  }
};

/** POST /api/admin/jobs - Publicar vaga */
const createJob = async (req, res) => {
  try {
    const { titulo, empresa, descricao, requisitos, localizacao, tipo, salario, contacto, expires_at } = req.body;
    if (!titulo || !descricao) return res.status(400).json({ success: false, message: 'Título e descrição são obrigatórios.' });

    const [result] = await pool.execute(
      'INSERT INTO job_postings (titulo, empresa, descricao, requisitos, localizacao, tipo, salario, contacto, admin_id, expires_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [titulo, empresa||null, descricao, requisitos||null, localizacao||null, tipo||'efetivo', salario||null, contacto||null, req.user.id, expires_at||null]
    );
    return res.status(201).json({ success: true, message: 'Vaga publicada.', data: { id: result.insertId } });
  } catch (err) {
    return error(res, 'Erro ao publicar vaga.', 500);
  }
};

module.exports = { listProfiles, findByService, listServiceCategories, listJobs, getJob, createJob };
