/**
 * Controller de Perfis de Usuários
 * 
 * Responsável pela gestão e exibição de perfis detalhados
 * para alunos, empresas e investidores com design moderno.
 * 
 * @author Asdruba developer
 * @version 2.0.0
 */
const { pool } = require('../config/database');
const { success, error, notFound, badRequest } = require('../utils/response');
const { log } = require('../utils/audit');

/**
 * Obtém perfil completo do usuário autenticado
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let profileData = {};

    switch (userRole) {
      case 'student':
        profileData = await getStudentProfile(userId);
        break;
      case 'company':
        profileData = await getCompanyProfile(userId);
        break;
      case 'investor':
        profileData = await getInvestorProfile(userId);
        break;
      case 'admin':
      case 'employee':
        profileData = await getAdminProfile(userId);
        break;
      default:
        return badRequest(res, 'Tipo de usuário não reconhecido.');
    }

    return success(res, profileData, 'Perfil obtido com sucesso.');

  } catch (err) {
    console.error('[PROFILE_GET]', err);
    return error(res, 'Erro ao obter perfil.', 500);
  }
};

/**
 * Obtém perfil detalhado de aluno
 * @param {number} userId - ID do usuário
 * @returns {Promise<Object>} Dados do perfil
 */
const getStudentProfile = async (userId) => {
  // Dados básicos do usuário
  const [[user]] = await pool.execute(
    'SELECT id, nome, email, telefone, role, status, email_verificado, created_at FROM users WHERE id = ?',
    [userId]
  );

  // Dados do perfil de aluno
  const [[profile]] = await pool.execute(
    `
    SELECT
      sp.*,
      DATE(sp.data_nascimento) AS data_nascimento_formatada,
      TIMESTAMPDIFF(YEAR, sp.data_nascimento, CURDATE()) AS idade,
      CASE 
        WHEN sp.genero = 'M' THEN 'Masculino'
        WHEN sp.genero = 'F' THEN 'Feminino'
        ELSE 'Outro'
      END AS genero_descricao
    FROM student_profiles sp
    WHERE sp.user_id = ?
    `,
    [userId]
  );

  // Estatísticas de formação
  const [[stats]] = await pool.execute(
    `
    SELECT
      COUNT(DISTINCT e.id) AS total_inscricoes,
      COUNT(DISTINCT CASE WHEN e.status = 'confirmada' THEN e.id END) AS cursos_confirmados,
      COUNT(DISTINCT CASE WHEN e.status = 'em_analise' THEN e.id END) AND em_analise,
      COUNT(DISTINCT CASE WHEN e.status = 'pendente' THEN e.id END) AS pendentes,
      COUNT(DISTINCT c.id) AS cursos_interessados,
      COALESCE(SUM(p.valor), 0) AS valor_total_investido,
      COUNT(DISTINCT e.course_id) AS cursos_distintos
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    LEFT JOIN enrollments e ON e.student_id = u.id
    LEFT JOIN payments p ON p.enrollment_id = e.id AND p.status = 'confirmado'
    LEFT JOIN course_interests ci ON ci.student_id = u.id
    LEFT JOIN courses c ON c.id = ci.course_id
    WHERE u.id = ?
    `,
    [userId]
  );

  // Inscrições recentes
  const [recentEnrollments] = await pool.execute(
    `
    SELECT
      e.numero_inscricao,
      e.status,
      e.created_at AS data_inscricao,
      c.nome AS nome_curso,
      c.categoria,
      tc.nome AS nome_centro,
      tc.municipio AS municipio_centro,
      tcc.preco,
      r.numero_recibo
    FROM enrollments e
    INNER JOIN courses c ON c.id = e.course_id
    LEFT JOIN training_centers tc ON tc.id = e.center_id
    LEFT JOIN training_center_courses tcc ON tcc.id = e.offering_id
    LEFT JOIN receipts r ON r.enrollment_id = e.id
    WHERE e.student_id = ?
    ORDER BY e.created_at DESC
    LIMIT 5
    `,
    [userId]
  );

  // Cursos em destaque (baseado no interesse)
  const [recommendedCourses] = await pool.execute(
    `
    SELECT DISTINCT
      c.id,
      c.nome,
      c.categoria,
      c.nivel,
      COUNT(DISTINCT tcc.id) AS total_ofertas,
      MIN(tcc.preco) AS preco_minimo
    FROM courses c
    LEFT JOIN training_center_courses tcc ON tcc.course_id = c.id AND tcc.status = 'ativo'
    WHERE c.status = 'ativo' 
      AND c.id NOT IN (
        SELECT DISTINCT course_id FROM enrollments WHERE student_id = ?
      )
    GROUP BY c.id
    ORDER BY total_ofertas DESC, preco_minimo ASC
    LIMIT 6
    `,
    [userId]
  );

  return {
    usuario: {
      ...user,
      tipo: 'Aluno',
      data_cadastro: user.created_at
    },
    perfil: {
      ...profile,
      biografia: profile?.biografia || null,
      interesses: profile?.interesses ? JSON.parse(profile.interesses) : [],
      habilidades: profile?.habilidades ? JSON.parse(profile.habilidades) : [],
      formacao_academica: profile?.formacao_academica ? JSON.parse(profile.formacao_academica) : [],
      experiencia_profissional: profile?.experiencia_profissional ? JSON.parse(profile.experiencia_profissional) : []
    },
    estatisticas: {
      ...stats,
      valor_total_investido: Number(stats.valor_total_investido || 0),
      taxa_conclusao: stats.cursos_distintos > 0 ? ((stats.cursos_confirmados / stats.cursos_distintos) * 100).toFixed(1) : 0
    },
    atividades_recentes: {
      inscricoes: recentEnrollments.map(enrollment => ({
        ...enrollment,
        preco: enrollment.preco ? Number(enrollment.preco) : null,
        status_descricao: getStatusDescription(enrollment.status)
      })),
      cursos_recomendados: recommendedCourses.map(course => ({
        ...course,
        preco_minimo: course.preco_minimo ? Number(course.preco_minimo) : null
      }))
    },
    conquistas: await getStudentAchievements(userId)
  };
};

/**
 * Obtém perfil detalhado de empresa
 * @param {number} userId - ID do usuário
 * @returns {Promise<Object>} Dados do perfil
 */
const getCompanyProfile = async (userId) => {
  // Dados básicos do usuário
  const [[user]] = await pool.execute(
    'SELECT id, nome, email, telefone, role, status, email_verificado, created_at FROM users WHERE id = ?',
    [userId]
  );

  // Dados do perfil empresarial
  const [[profile]] = await pool.execute(
    `
    SELECT
      cp.*,
      DATE(cp.data_fundacao) AS data_fundacao_formatada,
      TIMESTAMPDIFF(YEAR, cp.data_fundacao, CURDATE()) AS anos_existencia,
      CASE cp.setor
        WHEN 'tecnologia' THEN 'Tecnologia'
        WHEN 'saude' THEN 'Saúde'
        WHEN 'educacao' THEN 'Educação'
        WHEN 'financas' THEN 'Finanças'
        WHEN 'industria' THEN 'Indústria'
        WHEN 'comercio' THEN 'Comércio'
        WHEN 'servicos' THEN 'Serviços'
        ELSE cp.setor
      END AS setor_descricao
    FROM company_profiles cp
    WHERE cp.user_id = ?
    `,
    [userId]
  );

  // Estatísticas empresariais
  const [[stats]] = await pool.execute(
    `
    SELECT
      COUNT(DISTINCT j.id) AS total_vagas_publicadas,
      COUNT(DISTINCT CASE WHEN j.status = 'ativo' THEN j.id END) AS vagas_ativas,
      COUNT(DISTINCT CASE WHEN j.status = 'encerrada' THEN j.id END) AS vagas_encerradas,
      COUNT(DISTINCT io.id) AS total_oportunidades_investimento,
      COUNT(DISTINCT CASE WHEN io.status = 'ativo' THEN io.id END) AS oportunidades_ativas,
      COUNT(DISTINCT s.id) AS total_subscricoes_ativas,
      COUNT(DISTINCT a.id) AS total_parcerias,
      COALESCE(SUM(cs.valor), 0) AS valor_total_subscricoes
    FROM users u
    LEFT JOIN company_profiles cp ON cp.user_id = u.id
    LEFT JOIN jobs j ON j.company_id = cp.id
    LEFT JOIN investment_opportunities io ON io.company_id = cp.id
    LEFT JOIN subscriptions s ON s.company_id = cp.id AND s.status = 'ativo'
    LEFT JOIN company_services cs ON cs.company_id = cp.id AND cs.status = 'ativo'
    LEFT JOIN partnerships a ON a.company_id = cp.id AND a.status = 'ativo'
    WHERE u.id = ?
    `,
    [userId]
  );

  // Vagas recentes
  const [recentJobs] = await pool.execute(
    `
    SELECT
      j.id,
      j.titulo,
      j.tipo,
      j.localizacao,
      j.salario,
      j.status,
      j.created_at AS data_publicacao,
      COUNT(DISTINCT ca.id) AS total_candidatos
    FROM jobs j
    LEFT JOIN job_applications ca ON ca.job_id = j.id
    WHERE j.company_id = ?
    ORDER BY j.created_at DESC
    LIMIT 5
    `,
    [profile?.id]
  );

  // Oportunidades de investimento
  const [investmentOpportunities] = await pool.execute(
    `
    SELECT
      io.id,
      io.titulo,
      io.valor,
      io.tipo,
      io.status,
      io.created_at AS data_criacao,
      COUNT(DISTINCT ii.investor_id) AS total_investidores_interessados
    FROM investment_opportunities io
    LEFT JOIN investor_interests ii ON ii.opportunity_id = io.id
    WHERE io.company_id = ?
    ORDER BY io.created_at DESC
    LIMIT 3
    `,
    [profile?.id]
  );

  return {
    usuario: {
      ...user,
      tipo: 'Empresa',
      data_cadastro: user.created_at
    },
    perfil: {
      ...profile,
      descricao: profile?.descricao || null,
      missao: profile?.missao || null,
      visao: profile?.visao || null,
      valores: profile?.valores ? JSON.parse(profile.valores) : [],
      servicos: profile?.servicos ? JSON.parse(profile.servicos) : [],
      certificacoes: profile?.certificacoes ? JSON.parse(profile.certificacoes) : []
    },
    estatisticas: {
      ...stats,
      valor_total_subscricoes: Number(stats.valor_total_subscricoes || 0),
      taxa_preenchimento_vagas: stats.total_vagas_publicadas > 0 ? 
        ((stats.total_vagas_publicadas - stats.vagas_ativas) / stats.total_vagas_publicadas * 100).toFixed(1) : 0
    },
    atividades_recentes: {
      vagas: recentJobs.map(job => ({
        ...job,
        status_descricao: getJobStatusDescription(job.status),
        total_candidatos: Number(job.total_candidatos)
      })),
      oportunidades: investmentOpportunities.map(opp => ({
        ...opp,
        valor: Number(opp.valor),
        status_descricao: getOpportunityStatusDescription(opp.status),
        total_investidores_interessados: Number(opp.total_investidores_interessados)
      }))
    },
    conquistas: await getCompanyAchievements(userId)
  };
};

/**
 * Obtém perfil detalhado de investidor
 * @param {number} userId - ID do usuário
 * @returns {Promise<Object>} Dados do perfil
 */
const getInvestorProfile = async (userId) => {
  // Dados básicos do usuário
  const [[user]] = await pool.execute(
    'SELECT id, nome, email, telefone, role, status, email_verificado, created_at FROM users WHERE id = ?',
    [userId]
  );

  // Dados do perfil de investidor
  const [[profile]] = await pool.execute(
    `
    SELECT
      ip.*,
      DATE(ip.data_nascimento) AS data_nascimento_formatada,
      TIMESTAMPDIFF(YEAR, ip.data_nascimento, CURDATE()) AS idade,
      CASE ip.tipo_investidor
        WHEN 'iniciante' THEN 'Iniciante'
        WHEN 'intermediario' THEN 'Intermediário'
        WHEN 'avancado' THEN 'Avançado'
        WHEN 'profissional' THEN 'Profissional'
        ELSE ip.tipo_investidor
      END AS tipo_investidor_descricao
    FROM investor_profiles ip
    WHERE ip.user_id = ?
    `,
    [userId]
  );

  // Estatísticas de investimento
  const [[stats]] = await pool.execute(
    `
    SELECT
      COUNT(DISTINCT ii.id) AS total_investimentos,
      COUNT(DISTINCT CASE WHEN ii.status = 'ativo' THEN ii.id END) AS investimentos_ativos,
      COUNT(DISTINCT CASE WHEN ii.status = 'concluido' THEN ii.id END) AS investimentos_concluidos,
      COUNT(DISTINCT ii.opportunity_id) AS oportunidades_distintas,
      COALESCE(SUM(ii.valor), 0) AS valor_total_investido,
      COALESCE(AVG(ii.valor), 0) AS valor_medio_investimento,
      COALESCE(SUM(CASE WHEN ii.status = 'concluido' THEN ii.retorno ELSE 0 END), 0) AS retorno_total
    FROM users u
    LEFT JOIN investor_profiles ip ON ip.user_id = u.id
    LEFT JOIN investor_investments ii ON ii.investor_id = ip.id
    WHERE u.id = ?
    `,
    [userId]
  );

  // Investimentos recentes
  const [recentInvestments] = await pool.execute(
    `
    SELECT
      ii.id,
      ii.valor,
      ii.status,
      ii.data_investimento,
      ii.retorno_esperado,
      io.titulo AS oportunidade_titulo,
      c.nome AS empresa_nome,
      c.setor
    FROM investor_investments ii
    INNER JOIN investment_opportunities io ON io.id = ii.opportunity_id
    INNER JOIN company_profiles c ON c.id = io.company_id
    WHERE ii.investor_id = ?
    ORDER BY ii.data_investimento DESC
    LIMIT 5
    `,
    [profile?.id]
  );

  // Oportunidades recomendadas
  const [recommendedOpportunities] = await pool.execute(
    `
    SELECT DISTINCT
      io.id,
      io.titulo,
      io.valor,
      io.tipo,
      io.setor,
      io.retorno_esperado,
      c.nome AS empresa_nome,
      COUNT(DISTINCT ii.id) AS total_investidores
    FROM investment_opportunities io
    INNER JOIN company_profiles c ON c.id = io.company_id
    LEFT JOIN investor_investments ii ON ii.opportunity_id = io.id
    WHERE io.status = 'ativo'
      AND io.id NOT IN (
        SELECT DISTINCT opportunity_id FROM investor_investments WHERE investor_id = ?
      )
    GROUP BY io.id
    ORDER BY total_investidores DESC, io.retorno_esperado DESC
    LIMIT 6
    `,
    [profile?.id]
  );

  return {
    usuario: {
      ...user,
      tipo: 'Investidor',
      data_cadastro: user.created_at
    },
    perfil: {
      ...profile,
      biografia: profile?.biografia || null,
    preferencias_investimento: profile?.preferencias_investimento ? JSON.parse(profile.preferencias_investimento) : [],
      experiencia: profile?.experiencia || null,
      objetivos: profile?.objetivos ? JSON.parse(profile.objetivos) : []
    },
    estatisticas: {
      ...stats,
      valor_total_investido: Number(stats.valor_total_investido || 0),
      valor_medio_investimento: Number(stats.valor_medio_investimento || 0),
      retorno_total: Number(stats.retorno_total || 0),
      taxa_retorno: stats.valor_total_investido > 0 ? 
        ((stats.retorno_total / stats.valor_total_investido) * 100).toFixed(2) : 0,
      taxa_sucesso: stats.total_investimentos > 0 ? 
        ((stats.investimentos_concluidos / stats.total_investimentos) * 100).toFixed(1) : 0
    },
    atividades_recentes: {
      investimentos: recentInvestments.map(inv => ({
        ...inv,
        valor: Number(inv.valor),
        retorno_esperado: Number(inv.retorno_esperado),
        status_descricao: getInvestmentStatusDescription(inv.status)
      })),
      oportunidades_recomendadas: recommendedOpportunities.map(opp => ({
        ...opp,
        valor: Number(opp.valor),
        retorno_esperado: Number(opp.retorno_esperado),
        total_investidores: Number(opp.total_investidores)
      }))
    },
    conquistas: await getInvestorAchievements(userId)
  };
};

/**
 * Obtém perfil de administrador
 * @param {number} userId - ID do usuário
 * @returns {Promise<Object>} Dados do perfil
 */
const getAdminProfile = async (userId) => {
  const [[user]] = await pool.execute(
    'SELECT id, nome, email, telefone, role, status, email_verificado, created_at FROM users WHERE id = ?',
    [userId]
  );

  // Estatísticas administrativas
  const [[stats]] = await pool.execute(
    `
    SELECT
      COUNT(DISTINCT u.id) AS total_usuarios,
      COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) AS total_alunos,
      COUNT(DISTINCT CASE WHEN u.role = 'company' THEN u.id END) AS total_empresas,
      COUNT(DISTINCT CASE WHEN u.role = 'investor' THEN u.id END) AS total_investidores,
      COUNT(DISTINCT c.id) AS total_cursos,
      COUNT(DISTINCT tc.id) AS total_centros,
      COUNT(DISTINCT e.id) AS total_inscricoes,
      COUNT(DISTINCT CASE WHEN e.status = 'pendente' THEN e.id END) AS inscricoes_pendentes,
      COUNT(DISTINCT CASE WHEN e.status = 'em_analise' THEN e.id END) AND em_analise,
      COUNT(DISTINCT j.id) AS total_vagas,
      COUNT(DISTINCT io.id) AS total_oportunidades
    FROM users u
    LEFT JOIN courses c ON c.status = 'ativo'
    LEFT JOIN training_centers tc ON tc.status = 'ativo'
    LEFT JOIN enrollments e ON 1=1
    LEFT JOIN jobs j ON 1=1
    LEFT JOIN investment_opportunities io ON 1=1
    WHERE 1=1
    `
  );

  // Atividades recentes do sistema
  const [recentActivities] = await pool.execute(
    `
    SELECT
      'user' AS tipo,
      u.nome AS descricao,
      u.created_at AS data,
      'Novo usuário registrado' AS acao
    FROM users u
    WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    
    UNION ALL
    
    SELECT
      'enrollment' AS tipo,
      CONCAT('c', e.numero_inscricao) AS descricao,
      e.created_at AS data,
      'Nova inscrição' AS acao
    FROM enrollments e
    WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    
    ORDER BY data DESC
    LIMIT 10
    `
  );

  return {
    usuario: {
      ...user,
      tipo: user.role === 'admin' ? 'Administrador' : 'Funcionário',
      data_cadastro: user.created_at
    },
    perfil: {
      cargo: user.role === 'admin' ? 'Administrador do Sistema' : 'Gestor de Operações',
      departamento: 'ULEZI XPB',
      nivel_acesso: user.role === 'admin' ? 'Total' : 'Parcial'
    },
    estatisticas: stats,
    atividades_recentes: recentActivities,
    conquistas: await getAdminAchievements(userId)
  };
};

/**
 * Atualiza perfil do usuário autenticado
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Promise com resposta JSON
 */
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const updates = req.body;

    // Atualizar dados básicos do usuário
    const userUpdates = [];
    const userParams = [];

    if (updates.nome) {
      userUpdates.push('nome = ?');
      userParams.push(updates.nome.trim());
    }
    if (updates.telefone) {
      userUpdates.push('telefone = ?');
      userParams.push(updates.telefone.trim());
    }

    if (userUpdates.length > 0) {
      userParams.push(userId);
      await pool.execute(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
        userParams
      );
    }

    // Atualizar perfil específico
    switch (userRole) {
      case 'student':
        await updateStudentProfile(userId, updates);
        break;
      case 'company':
        await updateCompanyProfile(userId, updates);
        break;
      case 'investor':
        await updateInvestorProfile(userId, updates);
        break;
    }

    // Registrar auditoria
    await log(
      userId,
      'UPDATE_PROFILE',
      'users',
      userId,
      { campos_atualizados: Object.keys(updates) },
      req
    );

    return success(res, null, 'Perfil atualizado com sucesso.');

  } catch (err) {
    console.error('[PROFILE_UPDATE]', err);
    return error(res, 'Erro ao atualizar perfil.', 500);
  }
};

/**
 * Funções auxiliares para atualização de perfis específicos
 */
const updateStudentProfile = async (userId, updates) => {
  const allowedFields = [
    'biografia', 'interesses', 'habilidades', 
    'formacao_academica', 'experiencia_profissional'
  ];

  const profileUpdates = [];
  const profileParams = [];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      profileUpdates.push(`${field} = ?`);
      profileParams.push(Array.isArray(updates[field]) ? JSON.stringify(updates[field]) : updates[field]);
    }
  });

  if (profileUpdates.length > 0) {
    profileParams.push(userId);
    await pool.execute(
      `UPDATE student_profiles SET ${profileUpdates.join(', ')} WHERE user_id = ?`,
      profileParams
    );
  }
};

const updateCompanyProfile = async (userId, updates) => {
  const allowedFields = [
    'descricao', 'missao', 'visao', 'valores', 
    'servicos', 'certificacoes', 'website', 'linkedin'
  ];

  const profileUpdates = [];
  const profileParams = [];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      profileUpdates.push(`${field} = ?`);
      profileParams.push(Array.isArray(updates[field]) ? JSON.stringify(updates[field]) : updates[field]);
    }
  });

  if (profileUpdates.length > 0) {
    const [[company]] = await pool.execute('SELECT id FROM company_profiles WHERE user_id = ?', [userId]);
    if (company) {
      profileParams.push(company.id);
      await pool.execute(
        `UPDATE company_profiles SET ${profileUpdates.join(', ')} WHERE id = ?`,
        profileParams
      );
    }
  }
};

const updateInvestorProfile = async (userId, updates) => {
  const allowedFields = [
    'biografia', 'preferencias_investimento', 
    'experiencia', 'objetivos'
  ];

  const profileUpdates = [];
  const profileParams = [];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      profileUpdates.push(`${field} = ?`);
      profileParams.push(Array.isArray(updates[field]) ? JSON.stringify(updates[field]) : updates[field]);
    }
  });

  if (profileUpdates.length > 0) {
    const [[investor]] = await pool.execute('SELECT id FROM investor_profiles WHERE user_id = ?', [userId]);
    if (investor) {
      profileParams.push(investor.id);
      await pool.execute(
        `UPDATE investor_profiles SET ${profileUpdates.join(', ')} WHERE id = ?`,
        profileParams
      );
    }
  }
};

/**
 * Funções auxiliares para descrições de status
 */
const getStatusDescription = (status) => {
  const descriptions = {
    'pendente': 'Pendente de Validação',
    'em_analise': 'Em Análise',
    'confirmada': 'Confirmada',
    'rejeitada': 'Rejeitada'
  };
  return descriptions[status] || status;
};

const getJobStatusDescription = (status) => {
  const descriptions = {
    'ativo': 'Ativa',
    'encerrada': 'Encerrada',
    'pausada': 'Pausada'
  };
  return descriptions[status] || status;
};

const getOpportunityStatusDescription = (status) => {
  const descriptions = {
    'ativo': 'Ativa',
    'encerrada': 'Encerrada',
    'suspenso': 'Suspenso'
  };
  return descriptions[status] || status;
};

const getInvestmentStatusDescription = (status) => {
  const descriptions = {
    'pendente': 'Pendente',
    'ativo': 'Ativo',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado'
  };
  return descriptions[status] || status;
};

/**
 * Funções para obter conquistas/badges
 */
const getStudentAchievements = async (userId) => {
  // Implementar lógica de conquistas para alunos
  return [
    { id: 1, nome: 'Primeira Inscrição', descricao: 'Realizou sua primeira inscrição', icone: '🎓', conquistado_em: null },
    { id: 2, nome: 'Estudante Dedicação', descricao: 'Concluiu 3 cursos', icone: '📚', conquistado_em: null },
    { id: 3, nome: 'Investidor em Formação', descricao: 'Investiu mais de 50.000 Kz', icone: '💰', conquistado_em: null }
  ];
};

const getCompanyAchievements = async (userId) => {
  return [
    { id: 1, nome: 'Empregadora Ativa', descricao: 'Publicou 5 vagas', icone: '💼', conquistado_em: null },
    { id: 2, nome: 'Crescimento', descricao: 'Atraiu 100 candidatos', icone: '📈', conquistado_em: null },
    { id: 3, nome: 'Parceria Estratégica', descricao: 'Fez 10 parcerias', icone: '🤝', conquistado_em: null }
  ];
};

const getInvestorAchievements = async (userId) => {
  return [
    { id: 1, nome: 'Investidor Iniciante', descricao: 'Realizou primeiro investimento', icone: '🚀', conquistado_em: null },
    { id: 2, nome: 'Investidor Experiente', descricao: 'Fez 5 investimentos', icone: '⭐', conquistado_em: null },
    { id: 3, nome: 'Investidor Master', descricao: 'Investiu mais de 500.000 Kz', icone: '🏆', conquistado_em: null }
  ];
};

const getAdminAchievements = async (userId) => {
  return [
    { id: 1, nome: 'Gestor Eficiente', descricao: 'Aprovou 100 inscrições', icone: '✅', conquistado_em: null },
    { id: 2, nome: 'Líder Comunitário', descricao: 'Cadastrou 50 empresas', icone: '👥', conquistado_em: null },
    { id: 3, nome: 'Mestre da Plataforma', descricao: '1 ano de serviço', icone: '👑', conquistado_em: null }
  ];
};

module.exports = {
  getMyProfile,
  updateMyProfile
};
