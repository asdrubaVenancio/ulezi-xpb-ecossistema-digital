// ============================================================
// ULEZI XPB — Context de Autenticação e Tema
// Compatível com o backend: dados.token, dados.utilizador
// ============================================================

import {
    createContext,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { authAPI, STORAGE_KEYS } from '../services/api';

// Re-export useAuth do hook separado (para compatibilidade com Fast Refresh)
export { useAuth } from '../hooks/useAuth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilizador, setUtilizador] = useState(null);
  const [carregando,  setCarregando] = useState(true);
  const [tema, setTemaState] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.tema) || 'light'
  );

  // ── Aplicar tema ao documento ──────────────────────────────
  useEffect(() => {
    const corFundo = tema === 'dark' ? '#0F172A' : '#F8FAFC';
    const corTexto = tema === 'dark' ? '#F1F5F9' : '#0F172A';
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    document.documentElement.setAttribute('data-theme', tema);
    document.body.setAttribute('data-theme', tema);
    document.body.style.backgroundColor = corFundo;
    document.body.style.color = corTexto;
    document.body.style.colorScheme = tema;
    if (metaTheme) metaTheme.setAttribute('content', corFundo);
    localStorage.setItem(STORAGE_KEYS.tema, tema);
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTemaState(t => (t === 'light' ? 'dark' : 'light'));
  }, []);

  // ── Limpar sessão ──────────────────────────────────────────
  const limparSessao = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.refresh);
    localStorage.removeItem(STORAGE_KEYS.user);
    setUtilizador(null);
  }, []);

  // ── Ouvir evento de sessão expirada ───────────────────────
  useEffect(() => {
    const handler = () => limparSessao();
    window.addEventListener('ulezi:sessao-expirada', handler);
    return () => window.removeEventListener('ulezi:sessao-expirada', handler);
  }, [limparSessao]);

  // ── Restaurar sessão do localStorage ──────────────────────
  useEffect(() => {
    const userStr = localStorage.getItem(STORAGE_KEYS.user);
    const token   = localStorage.getItem(STORAGE_KEYS.token);
    if (userStr && token) {
      try {
        setUtilizador(JSON.parse(userStr));
      } catch {
        limparSessao();
      }
    }
    setCarregando(false);
  }, [limparSessao]);

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    // Backend devolve: { sucesso: true, dados: { token, user } }
    // ou { sucesso: true, dados: { token, utilizador } }
    const { data } = await authAPI.login({ email, password });
    const dados = data.dados || data.data || {};
    const token = dados.token;
    // Suportar tanto 'user' como 'utilizador' na resposta
    const user  = dados.utilizador || dados.user;

    if (!token || !user) throw new Error('Resposta inválida do servidor.');

    localStorage.setItem(STORAGE_KEYS.token,   token);
    // refresh_token é opcional
    if (dados.refresh_token) {
      localStorage.setItem(STORAGE_KEYS.refresh, dados.refresh_token);
    }
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    setUtilizador(user);

    return user;
  }, []);

  // ── Login com dados (usado após registro automático) ────────
  const loginComDados = useCallback((token, refreshToken, user) => {
    if (!token || !user) return;
    
    localStorage.setItem(STORAGE_KEYS.token, token);
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
    }
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    setUtilizador(user);
  }, []);

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignora erros de rede */ }
    limparSessao();
  }, [limparSessao]);

  // ── Atualizar dados do utilizador em memória ───────────────
  const atualizarUtilizador = useCallback((novos) => {
    setUtilizador(prev => {
      const atualizado = { ...prev, ...novos };
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(atualizado));
      return atualizado;
    });
  }, []);

  // ── Helpers de papel ───────────────────────────────────────
  // O backend usa: admin, employee, student, company, investor
  // O frontend usa os mesmos valores (não traduzidos)
  const ehAdmin       = utilizador?.role === 'admin';
  const ehFuncionario = utilizador?.role === 'employee' || utilizador?.role === 'funcionario';
  const ehEmpresa     = utilizador?.role === 'company'  || utilizador?.role === 'empresa';
  const ehEstudante   = utilizador?.role === 'student'  || utilizador?.role === 'estudante';
  const ehInvestidor  = utilizador?.role === 'investor' || utilizador?.role === 'investidor';
  const ehStaff       = ehAdmin || ehFuncionario;

  return (
    <AuthContext.Provider value={{
      utilizador, carregando, login, loginComDados, logout, limparSessao,
      atualizarUtilizador, tema, alternarTema,
      estaAutenticado: !!utilizador,
      ehAdmin, ehFuncionario, ehEmpresa,
      ehEstudante, ehInvestidor, ehStaff,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
