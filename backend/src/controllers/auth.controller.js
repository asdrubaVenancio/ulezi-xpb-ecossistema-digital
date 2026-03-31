/**
 * Controller de Autenticação
 * Registo, Login, Logout, Recuperação de Senha
 */
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../config/jwt');
const { success, created, error, badRequest } = require('../utils/response');
const { sendWelcomeEmail, sendEmail } = require('../utils/email');
const { log } = require('../utils/audit');

const normalizeRole = (role) => ({
  estudante: 'student',
  empresa: 'company',
  investidor: 'investor',
  funcionario: 'employee',
}[role] || role);

/**
 * Extrai ficheiros de documentos enviados no registo empresarial.
 */
const extractCompanyRegistrationDocs = (files = {}) => {
  const docMap = [
    { field: 'documento_alvara', tipo: 'alvara' },
    { field: 'documento_nif', tipo: 'nif' },
    { field: 'documento_certidao', tipo: 'certidao' },
    { field: 'documento_identificacao', tipo: 'identificacao' },
  ];

  return docMap
    .map(({ field, tipo }) => {
      const ficheiro = files[field]?.[0];
      if (!ficheiro) return null;
      return { tipo, ficheiro };
    })
    .filter(Boolean);
};

/**
 * Gera um link de recuperação compatível com o frontend actual.
 */
const buildResetLink = (token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/nova-senha/${token}`;
};

/**
 * POST /api/auth/register
 * Regista um novo utilizador
 */
const register = async (req, res) => {
  try {
    const {
      nome,
      email,
      telefone,
      password,
      nome_empresa,
      nomeEmpresa,
      provincia,
      municipio,
      areas_interesse,
      descricao,
      sector,
      nif,
      is_public,
    } = req.body;
    const role = normalizeRole(req.body.role);
    const normalizedEmail = email.trim().toLowerCase();
    const companyDocs = extractCompanyRegistrationDocs(req.files);

    if (role === 'company' && companyDocs.length < 4) {
      return badRequest(
        res,
        'No registo da empresa deve anexar alvara, NIF, certidao e documento de identificacao do responsavel.'
      );
    }

    // Verificar se o email já existe
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return badRequest(res, 'Este email já está registado.');
    }

    // Encriptar a senha
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(password, rounds);

    // Inserir utilizador
    const [result] = await pool.execute(
      'INSERT INTO users (nome, email, telefone, password_hash, role) VALUES (?,?,?,?,?)',
      [nome, normalizedEmail, telefone || null, password_hash, role]
    );
    const userId = result.insertId;

    // Criar perfil específico conforme o papel
    if (role === 'student') {
      await pool.execute(
        'INSERT INTO student_profiles (user_id, municipio, provincia, is_public) VALUES (?, ?, ?, ?)',
        [userId, municipio || null, provincia || null, is_public ? 1 : 0]
      );
    } else if (role === 'investor') {
      await pool.execute(
        'INSERT INTO investor_profiles (user_id, areas_interesse, descricao, provincia, municipio, is_public) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, areas_interesse || null, descricao || null, provincia || null, municipio || null, is_public == null ? 1 : (is_public ? 1 : 0)]
      );
    } else if (role === 'company') {
      const companyName = nome_empresa || nomeEmpresa || nome;
      const [companyResult] = await pool.execute(
        'INSERT INTO company_profiles (user_id, nome_empresa, nif, descricao, sector, provincia, municipio) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, companyName, nif || null, descricao || null, sector || null, provincia || null, municipio || null]
      );
      const companyProfileId = companyResult.insertId;

      for (const documento of companyDocs) {
        const url = `/uploads/documents/${documento.ficheiro.filename}`;
        await pool.execute(
          'INSERT INTO company_documents (company_id, tipo, nome_ficheiro, url_ficheiro) VALUES (?, ?, ?, ?)',
          [companyProfileId, documento.tipo, documento.ficheiro.originalname, url]
        );
      }
    }

    // Gerar token JWT
    const token = generateToken({ id: userId, email: normalizedEmail, role });
    const refresh_token = generateRefreshToken({ id: userId, email: normalizedEmail, role });

    // Enviar email de boas-vindas (não bloqueia a resposta)
    sendWelcomeEmail({ nome, email, role }).catch(e => console.error('[WELCOME EMAIL]', e.message));

    // Auditoria
    await log(userId, 'REGISTER', 'users', userId, { email: normalizedEmail, role }, req);

    return created(
      res,
      {
        token,
        refresh_token,
        user: { id: userId, nome, email: normalizedEmail, role },
        utilizador: { id: userId, nome, email: normalizedEmail, role },
      },
      'Conta criada com sucesso!'
    );
  } catch (err) {
    console.error('[AUTH] Register error:', err);
    if (err.code === 'ER_DUP_ENTRY') return badRequest(res, 'Este email já está registado.');
    return error(res, 'Erro ao criar conta. Tente novamente.', 500);
  }
};

/**
 * POST /api/auth/login
 * Autentica um utilizador
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Buscar utilizador
    const [rows] = await pool.execute(
      'SELECT id, nome, email, password_hash, role, status, foto_perfil FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return badRequest(res, 'Email ou palavra-passe incorretos.');
    }

    const user = rows[0];

    if (user.status === 'bloqueado') {
      return badRequest(res, 'A sua conta foi bloqueada. Contacte o suporte.');
    }
    if (user.status === 'inativo') {
      return badRequest(res, 'A sua conta está inativa.');
    }

    // Verificar senha
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      await log(user.id, 'LOGIN_FAILED', 'users', user.id, { email: normalizedEmail }, req);
      return badRequest(res, 'Email ou palavra-passe incorretos.');
    }

    // Buscar dados do perfil
    let profileData = {};
    if (user.role === 'student') {
      const [p] = await pool.execute('SELECT * FROM student_profiles WHERE user_id=?', [user.id]);
      profileData = p[0] || {};
    } else if (user.role === 'company') {
      const [p] = await pool.execute('SELECT * FROM company_profiles WHERE user_id=?', [user.id]);
      profileData = p[0] || {};
    } else if (user.role === 'investor') {
      const [p] = await pool.execute('SELECT * FROM investor_profiles WHERE user_id=?', [user.id]);
      profileData = p[0] || {};
    }

    // Gerar token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const refresh_token = generateRefreshToken({ id: user.id, email: user.email, role: user.role });

    await log(user.id, 'LOGIN', 'users', user.id, null, req);

    return success(res, {
      token,
      refresh_token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        foto_perfil: user.foto_perfil,
        profile: profileData,
      },
      // Alias para compatibilidade com frontend
      utilizador: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        foto_perfil: user.foto_perfil,
        profile: profileData,
      },
    }, 'Login realizado com sucesso!');
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return error(res, 'Erro ao fazer login. Tente novamente.', 500);
  }
};

/**
 * GET /api/auth/me
 * Retorna os dados do utilizador autenticado
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const [rows] = await pool.execute(
      'SELECT id, nome, email, telefone, role, status, foto_perfil, created_at FROM users WHERE id=?',
      [userId]
    );
    if (!rows.length) return badRequest(res, 'Utilizador não encontrado.');

    let profileData = {};
    if (role === 'student') {
      const [p] = await pool.execute('SELECT * FROM student_profiles WHERE user_id=?', [userId]);
      profileData = p[0] || {};
    } else if (role === 'company') {
      const [p] = await pool.execute('SELECT * FROM company_profiles WHERE user_id=?', [userId]);
      profileData = p[0] || {};
    } else if (role === 'investor') {
      const [p] = await pool.execute('SELECT * FROM investor_profiles WHERE user_id=?', [userId]);
      profileData = p[0] || {};
    }

    return success(res, { ...rows[0], profile: profileData });
  } catch (err) {
    return error(res, 'Erro ao obter dados do utilizador.', 500);
  }
};

/**
 * PUT /api/auth/profile
 * Atualiza o perfil do utilizador
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { nome, telefone, ...profileFields } = req.body;

    if (nome || telefone) {
      await pool.execute(
        'UPDATE users SET nome=COALESCE(?,nome), telefone=COALESCE(?,telefone) WHERE id=?',
        [nome || null, telefone || null, userId]
      );
    }

    if (role === 'student' && Object.keys(profileFields).length > 0) {
      const { municipio, provincia, data_nascimento, genero, bio, is_public } = profileFields;
      await pool.execute(
        `UPDATE student_profiles SET 
          municipio=COALESCE(?,municipio), provincia=COALESCE(?,provincia),
          data_nascimento=COALESCE(?,data_nascimento), genero=COALESCE(?,genero),
          bio=COALESCE(?,bio), is_public=COALESCE(?,is_public)
         WHERE user_id=?`,
        [municipio||null, provincia||null, data_nascimento||null, genero||null, bio||null, is_public!=null?is_public:null, userId]
      );
    } else if (role === 'investor' && Object.keys(profileFields).length > 0) {
      const { areas_interesse, descricao, provincia, municipio, is_public } = profileFields;
      await pool.execute(
        `UPDATE investor_profiles SET 
          areas_interesse=COALESCE(?,areas_interesse), descricao=COALESCE(?,descricao),
          provincia=COALESCE(?,provincia), municipio=COALESCE(?,municipio),
          is_public=COALESCE(?,is_public) WHERE user_id=?`,
        [areas_interesse||null, descricao||null, provincia||null, municipio||null, is_public!=null?is_public:null, userId]
      );
    } else if (role === 'company' && Object.keys(profileFields).length > 0) {
      const { descricao, sector, provincia, municipio, endereco, website, is_public } = profileFields;
      await pool.execute(
        `UPDATE company_profiles SET 
          descricao=COALESCE(?,descricao), sector=COALESCE(?,sector),
          provincia=COALESCE(?,provincia), municipio=COALESCE(?,municipio),
          endereco=COALESCE(?,endereco), website=COALESCE(?,website),
          is_public=COALESCE(?,is_public) WHERE user_id=?`,
        [descricao||null, sector||null, provincia||null, municipio||null, endereco||null, website||null, is_public!=null?is_public:null, userId]
      );
    }

    await log(userId, 'UPDATE_PROFILE', 'users', userId, null, req);
    return success(res, null, 'Perfil atualizado com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao atualizar perfil.', 500);
  }
};

/**
 * PUT /api/auth/change-password
 * Altera a senha do utilizador
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const current_password =
      req.body.current_password ||
      req.body.password_atual ||
      req.body.senha_actual;
    const new_password =
      req.body.new_password ||
      req.body.nova_password ||
      req.body.nova_senha;

    if (!current_password || !new_password) {
      return badRequest(res, 'A senha actual e a nova senha são obrigatórias.');
    }

    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id=?', [userId]);
    if (!rows.length) return badRequest(res, 'Utilizador não encontrado.');

    const isValid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!isValid) return badRequest(res, 'Senha atual incorreta.');

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newHash = await bcrypt.hash(new_password, rounds);
    await pool.execute('UPDATE users SET password_hash=? WHERE id=?', [newHash, userId]);

    await log(userId, 'CHANGE_PASSWORD', 'users', userId, null, req);
    return success(res, null, 'Senha alterada com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao alterar senha.', 500);
  }
};

/**
 * POST /api/auth/logout
 * Mantém a API compatível com o frontend mesmo sem blacklist de tokens.
 */
const logout = async (req, res) => {
  return success(res, null, 'Sessão terminada com sucesso.');
};

/**
 * POST /api/auth/refresh
 * Emite um novo access token a partir do refresh token.
 */
const refresh = async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token;
    if (!refreshToken) {
      return badRequest(res, 'Refresh token é obrigatório.');
    }

    const decoded = verifyRefreshToken(refreshToken);
    const [rows] = await pool.execute(
      'SELECT id, nome, email, role, status, foto_perfil FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!rows.length || rows[0].status !== 'ativo') {
      return error(res, 'Utilizador não encontrado ou inativo.', 401);
    }

    const user = rows[0];
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });

    return success(res, {
      token,
      refresh_token: newRefreshToken,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        foto_perfil: user.foto_perfil,
      },
      utilizador: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        foto_perfil: user.foto_perfil,
      },
    }, 'Token renovado com sucesso.');
  } catch (err) {
    return error(res, 'Refresh token inválido ou expirado.', 401);
  }
};

/**
 * POST /api/auth/esqueci-password
 * Gera token de recuperação e envia email, sem revelar se o utilizador existe.
 */
const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim()?.toLowerCase();
    if (!email) {
      return badRequest(res, 'O email é obrigatório.');
    }

    const [rows] = await pool.execute(
      'SELECT id, nome, email FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length) {
      const user = rows[0];
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await pool.execute(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, token, expiresAt]
      );

      const resetLink = buildResetLink(token);
      await sendEmail({
        to: user.email,
        subject: 'Recuperação de palavra-passe - ULEZI XPB',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1FA7C9;padding:28px;text-align:center">
              <h1 style="color:#fff;margin:0">ULEZI XPB</h1>
            </div>
            <div style="padding:28px">
              <h2 style="color:#374151">Recuperação de acesso</h2>
              <p style="color:#6B7280;line-height:1.6">
                Olá <strong>${user.nome}</strong>, recebemos um pedido para redefinir a sua palavra-passe.
              </p>
              <p style="color:#6B7280;line-height:1.6">
                Use o botão abaixo. Este link expira em 1 hora.
              </p>
              <a href="${resetLink}" style="display:inline-block;background:#1FA7C9;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:700">
                Redefinir palavra-passe
              </a>
              <p style="margin-top:18px;color:#94A3B8;font-size:12px;word-break:break-all">
                Se o botão não funcionar, copie este link: ${resetLink}
              </p>
            </div>
          </div>
        `,
      });

      await log(user.id, 'FORGOT_PASSWORD', 'users', user.id, null, req);
    }

    return success(
      res,
      null,
      'Se o email existir, enviámos as instruções de recuperação.'
    );
  } catch (err) {
    return error(res, 'Erro ao processar recuperação de senha.', 500);
  }
};

/**
 * POST /api/auth/nova-password/:token
 * Redefine a palavra-passe com base num token válido.
 */
const resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const password = req.body.password;
    const confirmar = req.body.confirmar_password || req.body.confirmar;

    if (!token || !password) {
      return badRequest(res, 'Token e nova palavra-passe são obrigatórios.');
    }

    if (confirmar && password !== confirmar) {
      return badRequest(res, 'As palavras-passe não coincidem.');
    }

    const [rows] = await pool.execute(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used, u.email
       FROM password_resets pr
       INNER JOIN users u ON u.id = pr.user_id
       WHERE pr.token = ?
       ORDER BY pr.created_at DESC
       LIMIT 1`,
      [token]
    );

    if (!rows.length) {
      return error(res, 'Token de recuperação inválido.', 400);
    }

    const resetRequest = rows[0];
    if (resetRequest.used) {
      return error(res, 'Este token já foi utilizado.', 400);
    }
    if (new Date(resetRequest.expires_at) < new Date()) {
      return error(res, 'O token de recuperação expirou.', 400);
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    const passwordHash = await bcrypt.hash(password, rounds);

    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      resetRequest.user_id,
    ]);
    await pool.execute('UPDATE password_resets SET used = 1 WHERE id = ?', [
      resetRequest.id,
    ]);

    await log(resetRequest.user_id, 'RESET_PASSWORD', 'users', resetRequest.user_id, null, req);
    return success(res, null, 'Palavra-passe redefinida com sucesso.');
  } catch (err) {
    return error(res, 'Erro ao redefinir palavra-passe.', 500);
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};
