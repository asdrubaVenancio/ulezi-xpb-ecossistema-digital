// ============================================================
// ULEZI XPB — Constantes e utilitários globais
// ============================================================

/** Papéis de utilizador */
export const ROLES = {
  ESTUDANTE:   'estudante',
  EMPRESA:     'empresa',
  INVESTIDOR:  'investidor',
  ADMIN:       'admin',
  FUNCIONARIO: 'funcionario',
};

/** Labels dos papéis */
export const ROLE_LABELS = {
  estudante:   'Estudante',
  student:     'Estudante',
  empresa:     'Empresa',
  company:     'Empresa',
  investidor:  'Investidor',
  investor:    'Investidor',
  admin:       'Administrador',
  funcionario: 'Funcionário',
  employee:    'Funcionário',
};

/** Rota de dashboard por papel */
export const ROLE_DASHBOARD = {
  estudante:   '/painel/aluno',
  student:     '/painel/aluno',
  empresa:     '/empresa/dashboard',
  company:     '/empresa/dashboard',
  investidor:  '/painel/investidor',
  investor:    '/painel/investidor',
  admin:       '/painel/admin',
  funcionario: '/painel/admin',
  employee:    '/painel/admin',
};

/** Estados de pagamento */
export const STATUS_PAGAMENTO = {
  PENDENTE:             'pendente',
  AGUARDANDO_VALIDACAO: 'aguardando_validacao',
  CONFIRMADO:           'confirmado',
  REJEITADO:            'rejeitado',
};

/** Tipos de oportunidade de investimento */
export const TIPO_OPORTUNIDADE = {
  venda_empresa:        'Venda de Empresa',
  venda_participacao:   'Participação Societária',
  licenciamento_marca:  'Licenciamento de Marca',
  franquia:             'Franquia',
  pedido_investimento:  'Pedido de Investimento',
  emprestimo:           'Mútuo / Empréstimo',
};

/** Tipos de contrato de trabalho */
export const TIPO_CONTRATO = {
  efectivo:   'Efectivo',
  temporario: 'Temporário',
  estagio:    'Estágio',
  freelance:  'Freelance',
};

/** Modalidade de trabalho */
export const MODALIDADE = {
  presencial: 'Presencial',
  remoto:     'Remoto',
  hibrido:    'Híbrido',
};

/** Níveis de curso */
export const NIVEL_CURSO = {
  basico:     'Básico',
  intermedio: 'Intermédio',
  avancado:   'Avançado',
};

// ── Formatadores ──────────────────────────────────────────────

/**
 * Formata valor monetário em Kwanzas
 * @param {number|string} valor
 * @returns {string}
 */
export const formatAOA = (valor) => {
  if (valor == null || valor === '') return '—';
  const num = Number(valor);
  if (isNaN(num)) return '—';
  return `${num.toLocaleString('pt-AO')} Kz`;
};

/**
 * Formata data no padrão português
 * @param {string|Date} iso
 * @returns {string}
 */
export const formatData = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return '—';
  }
};

/**
 * Formata data e hora
 * @param {string|Date} iso
 * @returns {string}
 */
export const formatDataHora = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

/**
 * Tempo relativo (ex: "há 5 minutos")
 * @param {string|Date} iso
 * @returns {string}
 */
export const tempoRelativo = (iso) => {
  if (!iso) return '';
  const agora = new Date();
  const data  = new Date(iso);
  const diff  = Math.floor((agora - data) / 1000); // segundos

  if (diff < 60)           return 'Há menos de 1 min';
  if (diff < 3600)         return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400)        return `Há ${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 30)   return `Há ${Math.floor(diff / 86400)} dias`;
  if (diff < 86400 * 365)  return `Há ${Math.floor(diff / (86400 * 30))} meses`;
  return `Há ${Math.floor(diff / (86400 * 365))} anos`;
};

/**
 * Trunca texto com reticências
 * @param {string} texto
 * @param {number} limite
 * @returns {string}
 */
export const truncar = (texto, limite = 100) => {
  if (!texto) return '';
  return texto.length > limite ? texto.slice(0, limite) + '…' : texto;
};

/**
 * Iniciais do nome (para avatar)
 * @param {string} nome
 * @returns {string}
 */
export const iniciais = (nome) => {
  if (!nome) return '?';
  const partes = nome.trim().split(' ').filter(Boolean);
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};
