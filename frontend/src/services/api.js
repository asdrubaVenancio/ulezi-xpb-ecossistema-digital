// ============================================================
// ULEZI XPB — Serviço de API (Axios) — v3
// Alinhado 100% com as rotas reais do backend
// ============================================================

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const BACKEND_BASE_URL = BASE_URL.replace(/\/api\/?$/, "");

export const STORAGE_KEYS = {
  token: "ulezi_token",
  refresh: "ulezi_refresh",
  user: "ulezi_user",
  tema: "ulezi_tema",
};

// ── Instância Axios ───────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor de pedido: adicionar token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (erro) => Promise.reject(erro),
);

// Interceptor de resposta: refresh automático e retry para 429
let aRefrescar = false;
let filaEspera = [];

// Retry automático para 429 (Too Many Requests)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

api.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    const original = erro.config;

    // Retry para 429 (Too Many Requests) com backoff exponencial
    if (erro.response?.status === 429 && !original._retryCount) {
      original._retryCount = original._retryCount || 0;
      const maxRetries = 3;
      const baseDelay = 500; // 500ms

      if (original._retryCount < maxRetries) {
        original._retryCount++;
        const delay = baseDelay * Math.pow(2, original._retryCount - 1);
        console.log(
          `[API] 429 recebido, retry ${original._retryCount}/${maxRetries} em ${delay}ms`,
        );
        await sleep(delay);
        return api(original);
      }
    }

    if (!original || original.url?.includes("/auth/refresh")) {
      return Promise.reject(erro);
    }

    if (erro.response?.status === 401 && !original._retry) {
      if (aRefrescar) {
        return new Promise((resolve, reject) => {
          filaEspera.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      aRefrescar = true;
      const refresh = localStorage.getItem(STORAGE_KEYS.refresh);
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: refresh,
          });
          const novoToken = data.dados?.token;
          const novoRefreshToken = data.dados?.refresh_token;
          if (novoToken) {
            localStorage.setItem(STORAGE_KEYS.token, novoToken);
            if (novoRefreshToken) {
              localStorage.setItem(STORAGE_KEYS.refresh, novoRefreshToken);
            }
            original.headers.Authorization = `Bearer ${novoToken}`;
            filaEspera.forEach((p) => p.resolve(novoToken));
            filaEspera = [];
            aRefrescar = false;
            return api(original);
          }
        } catch {
          filaEspera.forEach((p) => p.reject(erro));
          filaEspera = [];
        }
      }
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.refresh);
      localStorage.removeItem(STORAGE_KEYS.user);
      aRefrescar = false;
      window.dispatchEvent(new CustomEvent("ulezi:sessao-expirada"));
    }
    return Promise.reject(erro);
  },
);

const truncarMsg = (msg, max = 400) => {
  const s = typeof msg === "string" ? msg.trim() : String(msg ?? "");
  return s.length > max ? `${s.slice(0, max)}…` : s;
};

// Extractor de mensagem de erro (sem expor detalhes técnicos de rede ao utilizador)
export const extrairErro = (erro) => {
  if (erro?.response?.data?.mensagem)
    return truncarMsg(erro.response.data.mensagem);
  if (erro?.response?.data?.message)
    return truncarMsg(erro.response.data.message);
  if (erro?.response?.data?.erros?.[0])
    return truncarMsg(erro.response.data.erros[0]);
  if (!erro?.response) {
    return "Não foi possível contactar o servidor. Verifique a ligação e tente novamente.";
  }
  const status = erro.response?.status;
  if (status >= 500) {
    return "O serviço está temporariamente indisponível. Tente novamente dentro de instantes.";
  }
  if (status === 401) return "Sessão expirada ou credenciais inválidas.";
  if (status === 403) return "Não tem permissão para esta operação.";
  if (status === 404) return "Recurso não encontrado.";
  if (erro?.message && erro.message !== "Network Error")
    return truncarMsg(erro.message);
  return "Ocorreu um erro inesperado. Tente novamente.";
};

// ── APIs por módulo ───────────────────────────────────────────

export const authAPI = {
  login: (d) => api.post("/auth/login", d),
  registar: (d) =>
    api.post(
      "/auth/registar",
      d,
      d instanceof FormData
        ? {
            // Não definir Content-Type - Axios define automaticamente com boundary correto
            headers: { "Content-Type": undefined },
          }
        : undefined,
    ),
  logout: () => api.post("/auth/logout"),
  refresh: (t) => api.post("/auth/refresh", { refresh_token: t }),
  esqueciSenha: (email) => api.post("/auth/esqueci-password", { email }),
  novaSenha: (t, d) => api.post(`/auth/nova-password/${t}`, d),
  obterPerfilCompleto: () => api.get("/auth/perfil"),
  atualizarPerfil: (d) => api.put("/auth/perfil", d),
  alterarSenha: (d) => api.put("/auth/password", d),
  // Envio de foto de perfil via multipart/form-data
  uploadFoto: (fd) =>
    api.post("/auth/foto-perfil", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const cursosAPI = {
  listar: (p) => api.get("/cursos", { params: p }),
  obter: (id) => api.get(`/cursos/${id}`),
  centros: (id, p) => api.get(`/cursos/${id}/centros`, { params: p }),
  inscrever: (d) =>
    api.post(
      "/inscricoes",
      d,
      d instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined,
    ),
  minhas: () => api.get("/inscricoes/minhas"),
  cancelar: (id) => api.delete(`/inscricoes/${id}`),
  avaliar: (id, d) => api.post(`/inscricoes/${id}/avaliar`, d),
  descarregarRecibo: (id) =>
    api.get(`/inscricoes/${id}/receipt`, { responseType: "blob" }),
  // Substituir documentos de inscrição (reenvio após rejeição)
  substituirDocumentos: (id, fd) =>
    api.put(
      `/inscricoes/${id}/documentos`,
      fd,
      { headers: { "Content-Type": undefined } },
    ),
};

export const pagamentosAPI = {
  meus: () => api.get("/pagamentos/meus"),
  comprovativo: (fd) =>
    api.post("/pagamentos/comprovativo", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  verComprovativo: (id) => api.get(`/pagamentos/${id}/comprovativo`),
  adminListar: (p) => api.get("/pagamentos/admin", { params: p }),
  adminValidar: (id, d) => api.put(`/pagamentos/admin/${id}/validar`, d),
};

export const negociosAPI = {
  oportunidades: (p) => api.get("/oportunidades", { params: p }),
  criarEmpresa: (d) => api.post("/empresas", d),
  publicarOp: (d) => api.post("/oportunidades", d),
  interesse: (id, d) => api.post(`/oportunidades/${id}/interesse`, d),
};

export const comunidadeAPI = {
  perfis: (p) => api.get("/comunidade/perfis", { params: p }),
  servicos: (p) => api.get("/comunidade/servicos", { params: p }),
  categServicos: () => api.get("/comunidade/servicos/categorias"),
  // Vagas públicas (aprovadas)
  vagas: (p) => api.get("/vagas-empresa", { params: p }),
  vagaDetalhe: (id) => api.get(`/vagas-empresa/${id}`),
};

export const vagasEmpresaAPI = {
  // Empresa — gerir próprias vagas
  minhas: () => api.get("/vagas-empresa/minhas/vagas"),
  criar: (d) => api.post("/vagas-empresa", d),
  editar: (id, d) => api.put(`/vagas-empresa/${id}`, d),
  eliminar: (id) => api.delete(`/vagas-empresa/${id}`),
  // Admin — aprovar/rejeitar
  adminTodas: (p) => api.get("/vagas-empresa/admin/todas", { params: p }),
  adminAprovar: (id) => api.put(`/vagas-empresa/admin/${id}/approve`),
  adminRejeitar: (id, d) => api.put(`/vagas-empresa/admin/${id}/reject`, d),
};

// ── Coordenadas Bancárias ───────────────────────────────────────────────────
export const coordenadasBancariasAPI = {
  // Público - para alunos visualizarem
  listar: () => api.get("/bank-coordinates"),
  // Admin - CRUD
  adminListar: () => api.get("/bank-coordinates/admin"),
  adminObter: (id) => api.get(`/bank-coordinates/admin/${id}`),
  criar: (d) => api.post("/bank-coordinates/admin", d),
  atualizar: (id, d) => api.put(`/bank-coordinates/admin/${id}`, d),
  desativar: (id) => api.delete(`/bank-coordinates/admin/${id}`),
  excluir: (id) => api.delete(`/bank-coordinates/admin/${id}/permanente`),
};

export const notifAPI = {
  listar: () => api.get(`/notificacoes?_t=${Date.now()}`), // timestamp para evitar cache
  marcarLida: (id) => api.put(`/notificacoes/${id}/lida`),
  marcarTodas: () => api.put("/notificacoes/marcar-todas"),
  contagemNaoLidas: () => api.get(`/notificacoes/contagem-nao-lidas?_t=${Date.now()}`),
};

export const investidorAPI = {
  interesses: () => api.get("/investidor/interesses"),
  contratos: () => api.get("/investidor/contratos"),
  downloadContrato: (id) =>
    api.get(`/contracts/${id}/download`, { responseType: "blob" }),
  assinarContrato: (id) => api.post(`/contracts/${id}/sign`),
  perfil: () => api.get("/investidor/perfil"),
  atualizarPerfil: (d) => api.put("/investidor/perfil", d),
  cancelarInt: (id) => api.delete(`/investidor/interesses/${id}`),
};

export const empresaAPI = {
  perfil: () => api.get("/empresa/perfil"),
  stats: () => api.get("/empresa/stats"),
  oportunidades: () => api.get("/empresa/oportunidades"),
  servicos: () => api.get("/empresa/servicos"),
  criarServico: (d) => api.post("/empresas/servicos", d),
  editarServico: (id, d) => api.put(`/empresa/servicos/${id}`, d),
  eliminarServico: (id) => api.delete(`/empresa/servicos/${id}`),
  categoriasServicos: () => api.get("/comunidade/servicos/categorias"),
  contratos: () => api.get("/empresa/contratos"),
  downloadContrato: (id) =>
    api.get(`/contracts/${id}/download`, { responseType: "blob" }),
  assinarContrato: (id) => api.post(`/contracts/${id}/sign`),
  criarOportunidade: (d) => api.post("/oportunidades", d),
  interessados: (id) => api.get(`/empresa/oportunidades/${id}/interessados`),
  documentos: () => api.get("/empresa/documentos"),
  enviarDoc: (fd) =>
    api.post("/empresa/documentos", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  assinatura: () => api.get("/empresa/assinatura"),
  // Assinaturas
  minhaAssinatura: () => api.get("/empresa/minha-assinatura"),
  pacotesAssinatura: () => api.get("/subscription-packages"),
  assinar: (d) => api.post("/empresa/assinar", d),
  assinarComComprovativo: (fd) =>
    api.post("/empresa/assinar-com-comprovativo", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  renovarAssinatura: () => api.post("/empresa/renovar"),
  // Vagas da empresa
  minhasVagas: () => api.get("/vagas-empresa/minhas/vagas"),
  criarVaga: (d) => api.post("/vagas-empresa", d),
  editarVaga: (id, d) => api.put(`/vagas-empresa/${id}`, d),
  eliminarVaga: (id) => api.delete(`/vagas-empresa/${id}`),
};

export const consultoriaAPI = {
  listarMinhas: () => api.get("/consultations"),
  listarConsultorias: () => api.get("/consultations/consultancies"),
  obterVagas: (params) => api.get("/consultations/available-slots", { params }),
  solicitar: (dados) => api.post("/consultations", dados),
  remarcar: (id, dados) => api.put(`/consultations/${id}/reschedule`, dados),
  confirmar: (id) => api.post(`/consultations/${id}/confirm`),
  cancelar: (id, dados) => api.put(`/consultations/${id}/cancel`, dados),
  meusCreditos: () => api.get("/consultations/credits/me"),
  solicitarRecarga: (dados) =>
    api.post("/consultations/credits/recharges", dados),
  providerSolicitacoes: () => api.get("/consultations/provider/requests"),
  providerDisponibilidade: () =>
    api.get("/consultations/provider/availability"),
  guardarDisponibilidade: (dados) =>
    api.put("/consultations/provider/availability", dados),
  obterDisponibilidade: (consultoriaId) =>
    api.get(`/consultations/${consultoriaId}/availability`),
};

export const adminAPI = {
  stats: () => api.get("/admin/stats"),
  utilizadores: (p) => api.get("/admin/utilizadores", { params: p }),
  statusUser: (id, s) =>
    api.put(`/admin/utilizadores/${id}/status`, { status: s }),
  empresas: (p) => api.get("/admin/empresas", { params: p }),
  empresaDetalhe: (id) => api.get(`/admin/empresas/${id}`),
  visualizarDocumentoEmpresa: (id) =>
    api.get(`/admin/empresas/documentos/${id}/visualizar`),
  aprovarEmpresa: (id, d) => api.put(`/admin/empresas/${id}/aprovar`, d),
  rejeitarEmpresa: (id, d) => api.put(`/admin/empresas/${id}/rejeitar`, d),
  criarAssinatura: (id, d) => api.post(`/admin/empresas/${id}/assinatura`, d),
  assinaturasEmpresas: (p) =>
    api.get("/admin/company-subscriptions", { params: p }),
  verComprovativoAssinatura: (id) =>
    api.get(`/admin/company-subscriptions/${id}/proof`),
  aprovarAssinaturaEmpresa: (id) =>
    api.put(`/admin/company-subscriptions/${id}/approve`),
  rejeitarAssinaturaEmpresa: (id, d) =>
    api.put(`/admin/company-subscriptions/${id}/reject`, d),
  eliminarAssinaturaEmpresa: (id) =>
    api.delete(`/admin/company-subscriptions/${id}`),
  pacotesAssinatura: (p) =>
    api.get("/admin/subscription-packages", { params: p }),
  pacoteAssinatura: (id) => api.get(`/admin/subscription-packages/${id}`),
  criarPacoteAssinatura: (d) => api.post("/admin/subscription-packages", d),
  atualizarPacoteAssinatura: (id, d) =>
    api.put(`/admin/subscription-packages/${id}`, d),
  aprovarPacoteAssinatura: (id, d = { aprovado: true }) =>
    api.put(`/admin/subscription-packages/${id}/approve`, d),
  rejeitarPacoteAssinatura: (id, motivo_rejeicao) =>
    api.put(`/admin/subscription-packages/${id}/approve`, {
      aprovado: false,
      motivo_rejeicao,
    }),
  eliminarPacoteAssinatura: (id) =>
    api.delete(`/admin/subscription-packages/${id}`),
  cursos: (p) => api.get("/admin/cursos", { params: p }),
  criarCurso: (d) => api.post("/admin/cursos", d),
  editarCurso: (id, d) => api.put(`/admin/cursos/${id}`, d),
  centros: (p) => api.get("/admin/centros", { params: p }),
  criarCentro: (d) => api.post("/admin/centros", d),
  editarCentro: (id, d) => api.put(`/admin/centros/${id}`, d),
  removerCentro: (id) => api.delete(`/admin/centros/${id}`),
  ofertasCentro: (id) => api.get(`/admin/centros/${id}/cursos`),
  criarOfertaCentro: (id, d) => api.post(`/admin/centros/${id}/cursos`, d),
  editarOfertaCentro: (centerId, offeringId, d) =>
    api.put(`/admin/centros/${centerId}/cursos/${offeringId}`, d),
  removerOfertaCentro: (centerId, offeringId) =>
    api.delete(`/admin/centros/${centerId}/cursos/${offeringId}`),
  inscricoes: (p) => api.get("/admin/inscricoes", { params: p }),
  atribuirCentro: (id, d) => api.put(`/admin/inscricoes/${id}/centro`, d),
  verDocumentoInscricao: (id, tipo) =>
    api.get(`/admin/inscricoes/${id}/documento`, { params: { tipo } }),
  reverInscricao: (id, d) => api.put(`/admin/inscricoes/${id}/revisao`, d),
  pagamentos: (p) => api.get("/pagamentos/admin", { params: p }),
  confirmarPag: (id) => api.put(`/admin/pagamentos/${id}/confirmar`),
  oportunidades: (p) => api.get("/admin/oportunidades", { params: p }),
  contratos: (p) => api.get("/admin/contratos", { params: p }),
  verContrato: (id) =>
    api.get(`/contracts/${id}/download`, { responseType: "blob" }),
  gerarContrato: (id) => api.post(`/admin/investimentos/${id}/contrato`),
  auditoria: (p) => api.get("/admin/auditoria", { params: p }),
  // Vagas de empresas (aprovação)
  vagasEmpresa: (p) => api.get("/vagas-empresa/admin/todas", { params: p }),
  aprovarVaga: (id) => api.put(`/vagas-empresa/admin/${id}/approve`),
  rejeitarVaga: (id, d) => api.put(`/vagas-empresa/admin/${id}/reject`, d),
  // Configurações
  configs: () => api.get("/admin/configuracoes"),
  salvarConfigs: (d) => api.put("/admin/configuracoes", d),
  // Notificações admin
  notificacoes: () => api.get("/admin/notificacoes"),
  marcarLida: (id) => api.put(`/admin/notificacoes/${id}/lida`),
  marcarTodas: () => api.put("/admin/notificacoes/marcar-todas"),
  // Ficheiros do sistema
  ficheiros: (p) => api.get("/admin/ficheiros", { params: p }),
  // Exportação de listas (csv/pdf/word)
  exportarLista: (tipo, p) =>
    api.get(`/admin/listas/${tipo}`, { params: p, responseType: "blob" }),
};

export const geografiaAPI = {
  provincias: () => api.get("/geografia/provincias"),
  municipios: (prov) =>
    api.get("/geografia/municipios", { params: { provincia: prov } }),
};

// Notificações do utilizador
export const notificationAPI = {
  listar: () => api.get("/notifications"),
  marcarLida: (id) => api.put(`/notifications/${id}/lida`),
  marcarTodasLidas: () => api.put("/notifications/marcar-todas"),
};

export default api;
