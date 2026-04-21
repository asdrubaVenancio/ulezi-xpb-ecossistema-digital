// ============================================================
// Navegação do painel administrativo — rotas e agrupamento
// Mantém slugs de URL estáveis (compatível com bookmarks existentes)
// ============================================================

/** ID interno da secção → segmento na URL (excepto painel) */
export const SECAO_PATH_SLUG = {
  painel: null,
  notificacoes: "notificacoes",
  utilizadores: "utilizadores",
  cursos: "cursos",
  centros: "centros",
  ofertas: "ofertas",
  inscricoes: "inscricoes",
  empresas: "empresas",
  oportunidades: "oportunidades",
  interesses: "interesses",
  investimentos: "investimentos",
  mediacao: "mediacoes",
  contratos: "contratos",
  assinaturas: "assinaturas",
  funcionarios: "funcionarios",
  consultoria: "consultoria",
  visitas: "visitas",
  suporte: "suporte",
  "notificacoes-assinatura": "notificacoes-assinatura",
  pagamentos: "pagamentos",
  vagas: "vagas",
  ficheiros: "ficheiros",
  seguranca: "seguranca",
  configuracoes: "configuracoes",
};

/** Slug da URL → ID interno */
export const SLUG_TO_SECAO = Object.fromEntries(
  Object.entries(SECAO_PATH_SLUG)
    .filter(([, slug]) => slug != null)
    .map(([id, slug]) => [slug, id]),
);

/** Rota canónica do painel raiz (mantém ROLE_DASHBOARD e hábitos dos utilizadores) */
export const ADMIN_PAINEL_ROOT = "/painel/admin";

/**
 * Caminho absoluto para uma secção admin
 * @param {string} secaoId
 * @returns {string}
 */
export function pathParaSecaoAdmin(secaoId) {
  const slug = SECAO_PATH_SLUG[secaoId];
  if (secaoId === "painel" || !slug) return ADMIN_PAINEL_ROOT;
  return `/admin/${slug}`;
}

/**
 * Resolve slug da URL para ID de secção; inválido → null
 * @param {string|undefined} slug
 * @returns {string|null}
 */
export function secaoDesdeSlug(slug) {
  if (!slug) return null;
  return SLUG_TO_SECAO[slug] ?? null;
}

/**
 * Grupos colapsáveis na sidebar — menos ruído visual, mesma árvore funcional
 * Cada item: { id, label, pathSlug } onde pathSlug === SECAO_PATH_SLUG[id] ou null para painel
 */
export const ADMIN_NAV_GRUPOS = [
  {
    id: "visao",
    label: "Visão geral",
    itens: [
      { id: "painel", label: "Painel geral" },
      { id: "notificacoes", label: "Notificações", badge: true },
    ],
  },
  {
    id: "formacao",
    label: "Formação",
    itens: [
      { id: "cursos", label: "Cursos" },
      { id: "centros", label: "Centros" },
      { id: "ofertas", label: "Ofertas" },
      { id: "inscricoes", label: "Inscrições" },
    ],
  },
  {
    id: "negocios",
    label: "Negócios e contratos",
    itens: [
      { id: "empresas", label: "Empresas" },
      { id: "oportunidades", label: "Oportunidades" },
      { id: "interesses", label: "Interesses" },
      { id: "investimentos", label: "Investimentos" },
      { id: "mediacao", label: "Mediação" },
      { id: "contratos", label: "Contratos" },
      { id: "assinaturas", label: "Assinaturas" },
    ],
  },
  {
    id: "operacoes",
    label: "Operações",
    itens: [
      { id: 'utilizadores', label: 'Utilizadores' },
      { id: 'funcionarios', label: 'Funcionários' },
      { id: 'consultoria', label: 'Consultoria' },
      { id: 'visitas', label: 'Visitas' },
      { id: 'suporte', label: 'Suporte' },
      { id: 'notificacoes-assinatura', label: 'Alertas de assinatura' },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro e vagas",
    itens: [
      { id: "pagamentos", label: "Pagamentos" },
      { id: "vagas", label: "Vagas (empresas)" },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    itens: [
      { id: "ficheiros", label: "Ficheiros" },
      { id: "seguranca", label: "Segurança" },
      { id: "configuracoes", label: "Configurações" },
    ],
  },
];
