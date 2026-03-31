import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Home,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CoordenadasBancarias from '../../components/banco/CoordenadasBancarias.jsx';
import Footer from '../../components/layout/Footer.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import { useToast } from '../../components/ui/Toast';
import { BadgeStatus, Modal, PageLoader } from '../../components/ui/index.jsx';
import { useAuth } from '../../context/AuthContext';
import { authAPI, comunidadeAPI, cursosAPI, extrairErro } from '../../services/api';
import { formatAOA } from '../../utils/constants';

export function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ flex: 1, background: 'var(--bg)' }}>{children}</main>
      <Footer />
    </div>
  );
}

// =============================================================================
// CONSTANTES E CONFIGURAÇÕES
// =============================================================================

/** Mapeamento de níveis para cores temáticas vibrantes */
const NIVEL_CORES = {
  basico: { 
    bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
    cor: '#059669', 
    label: 'Básico' 
  },
  intermedio: { 
    bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
    cor: '#d97706', 
    label: 'Intermédio' 
  },
  avancado: { 
    bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
    cor: '#dc2626', 
    label: 'Avançado' 
  },
};

/** Opções de filtro disponíveis */
const OPCOES_NIVEL = [
  { value: '', label: 'Todos os níveis' },
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermédio' },
  { value: 'avancado', label: 'Avançado' },
];

const OPCOES_DURACAO = [
  { value: '', label: 'Qualquer duração' },
  { value: 'curto', label: 'Até 20 horas' },
  { value: 'medio', label: '21-50 horas' },
  { value: 'longo', label: 'Mais de 50 horas' },
];

const OPCOES_PRECO = [
  { value: '', label: 'Qualquer preço' },
  { value: 'gratis', label: 'Gratuito' },
  { value: 'pago', label: 'Pago' },
];

const OPCOES_ORDENACAO = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'preco_asc', label: 'Preço: Menor → Maior' },
  { value: 'preco_desc', label: 'Preço: Maior → Menor' },
  { value: 'nome', label: 'Nome A-Z' },
  { value: 'avaliacao', label: 'Melhor avaliados' },
];

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

/**
 * Card individual de curso com design moderno
 * Aplica SRP: apenas renderiza informações do curso
 */
function CursoCard({ curso }) {
  // Validação de segurança: garante que temos dados mínimos
  if (!curso || typeof curso !== 'object') {
    console.warn('[CursoCard] Dados inválidos recebidos:', curso);
    return null;
  }

  // Extração segura de propriedades com valores padrão
  const cursoId = curso.uuid || curso.id;
  const nome = curso.nome || curso.titulo || 'Curso sem nome';
  
  // Debug: verificar se o cursoId existe
  if (!cursoId) {
    console.warn('[CursoCard] cursoId não encontrado:', curso);
  }
  
  const nivel = String(curso.nivel || '').toLowerCase().trim();
  const categoria = curso.categoria || curso.area_formacao || 'Sem categoria';
  const duracao = curso.duracao_horas || curso.duracao || '-';
  const preco = Number(curso.preco) || 0;
  const mediaAvaliacoes = Number(curso.media_avaliacoes || curso.avaliacao_media || 0);
  const totalAvaliacoes = Number(curso.total_avaliacoes || 0);
  const imagem = curso.imagem_url || curso.imagem;

  // Configuração visual baseada no nível
  const configNivel = NIVEL_CORES[nivel] || { 
    bg: 'var(--ciano-100)', 
    cor: 'var(--ciano)', 
    label: 'Todos' 
  };

  return (
    <Link
      to={cursoId ? `/cursos/${cursoId}` : '#'}
      className="card card--hoverable curso-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        color: 'inherit',
        overflow: 'hidden',
      }}
    >
      {/* Imagem ou placeholder do curso */}
      <div
        style={{
          height: 140,
          background: imagem
            ? `url(${imagem}) center/cover`
            : configNivel.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {!imagem && (
          <BookOpen size={40} color={configNivel.cor} style={{ opacity: 0.6 }} />
        )}
        {/* Badge de nível */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '4px 10px',
            borderRadius: 'var(--r-sm)',
            background: 'rgba(255,255,255,0.95)',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: configNivel.cor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {configNivel.label}
        </div>
        {/* Badge de gratuito - REMOVIDO: todos os cursos são pagos */}
        {/* preco === 0 && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '4px 10px',
              borderRadius: 'var(--r-sm)',
              background: 'var(--verde)',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'white',
            }}
          >
            Gratuito
          </div>
        ) */}
      </div>

      {/* Conteúdo do card */}
      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Categoria */}
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--txt-3)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          {categoria}
        </span>

        {/* Título */}
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.05rem',
            lineHeight: 1.4,
            marginBottom: 12,
            color: 'var(--txt-1)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {nome}
        </h3>

        {/* Meta informações */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
            fontSize: '0.8rem',
            color: 'var(--txt-2)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={14} />
            {duracao}h
          </span>
          {totalAvaliacoes > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={14} fill="var(--amarelo)" color="var(--amarelo)" />
              {mediaAvaliacoes.toFixed(1)} ({totalAvaliacoes})
            </span>
          )}
        </div>

        {/* Preço e botão */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}
        >
        {/* Preço - mostra 'Consultar' se for 0 ou null, pois o preço real depende do centro */}
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.15rem',
              color: preco > 0 ? 'var(--txt-1)' : 'var(--txt-3)',
            }}
          >
            {preco > 0 ? formatAOA(preco) : 'Consultar'}
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--verde)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Ver detalhes →
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Indicador de estado de carregamento
 */
function LoadingState() {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: 48,
          height: 48,
          border: '3px solid var(--border)',
          borderTop: '3px solid var(--verde)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px',
        }}
      />
      <p style={{ color: 'var(--txt-3)', fontSize: '0.9rem' }}>
        A carregar cursos...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Estado vazio quando não há resultados
 */
function EmptyState({ temFiltros, onLimpar }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 24px',
        color: 'var(--txt-3)',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--bg-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <Search size={32} style={{ opacity: 0.4 }} />
      </div>
      <h3
        style={{
          fontWeight: 600,
          marginBottom: 8,
          color: 'var(--txt-1)',
          fontSize: '1.1rem',
        }}
      >
        {temFiltros ? 'Nenhum curso encontrado' : 'Sem cursos disponíveis'}
      </h3>
      <p style={{ fontSize: '0.875rem', marginBottom: temFiltros ? 20 : 0 }}>
        {temFiltros
          ? 'Tente ajustar os filtros para ver mais resultados.'
          : 'Volte mais tarde para novos cursos.'}
      </p>
      {temFiltros && (
        <button className="btn btn--secondary" onClick={onLimpar}>
          <X size={16} />
          Limpar filtros
        </button>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

/**
 * Página de listagem de cursos para alunos
 * Implementa filtros avançados, ordenação e design moderno
 */
export function Cursos() {
  // ---------------------------------------------------------------------------
  // ESTADOS
  // ---------------------------------------------------------------------------
  const toast = useToast();
  const timerRef = useRef(null);

  // Dados
  const [cursosOriginais, setCursosOriginais] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [pesquisa, setPesquisa] = useState('');
  const [nivel, setNivel] = useState('');
  const [duracao, setDuracao] = useState('');
  const [preco, setPreco] = useState('');
  const [ordenacao, setOrdenacao] = useState('relevancia');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Contadores
  const totalResultados = useMemo(() => cursosOriginais.length, [cursosOriginais]);

  // ---------------------------------------------------------------------------
  // FUNÇÕES DE CARREGAMENTO
  // ---------------------------------------------------------------------------

  /**
   * Carrega os cursos da API
   * Aplica SRP: apenas busca dados, não filtra
   */
  const carregarCursos = useCallback(async () => {
    try {
      setCarregando(true);
      const { data } = await cursosAPI.listar();
      
      // Validação de segurança: garante que recebemos um array
      // Verifica várias estruturas possíveis da resposta da API
      const lista = data?.dados?.cursos 
        || data?.dados?.courses 
        || data?.dados?.data 
        || (Array.isArray(data?.dados) ? data.dados : null)
        || (Array.isArray(data) ? data : null)
        || [];
      
      // Sanitização básica de dados
      const cursosSanitizados = lista.filter((curso) => 
        curso && (curso.id || curso.uuid)
      );
      
      setCursosOriginais(cursosSanitizados);
      console.log('[Cursos] Carregados:', cursosSanitizados.length, 'cursos');
    } catch (erro) {
      console.error('[Cursos] Erro ao carregar:', erro);
      toast.erro('Erro ao carregar cursos: ' + extrairErro(erro));
      setCursosOriginais([]);
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  // Efeito de montagem: carrega dados iniciais
  useEffect(() => {
    carregarCursos();
    
    // Cleanup: cancela timer pendente
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [carregarCursos]);

  // ---------------------------------------------------------------------------
  // FUNÇÕES DE FILTRAGEM
  // ---------------------------------------------------------------------------

  /**
   * Verifica se um curso corresponde aos filtros ativos
   */
  const correspondeAosFiltros = useCallback((curso) => {
    // Filtro de pesquisa (nome ou descrição)
    if (pesquisa.trim()) {
      const termo = pesquisa.toLowerCase().trim();
      const nome = String(curso.nome || '').toLowerCase();
      const descricao = String(curso.descricao || '').toLowerCase();
      const categoria = String(curso.categoria || curso.area_formacao || '').toLowerCase();
      
      if (!nome.includes(termo) && !descricao.includes(termo) && !categoria.includes(termo)) {
        return false;
      }
    }

    // Filtro de nível
    if (nivel && String(curso.nivel || '').toLowerCase() !== nivel) {
      return false;
    }

    // Filtro de preço
    if (preco) {
      const valor = Number(curso.preco) || 0;
      if (preco === 'gratis' && valor > 0) return false;
      if (preco === 'pago' && valor === 0) return false;
    }

    // Filtro de duração
    if (duracao) {
      const horas = Number(curso.duracao_horas || curso.duracao || 0);
      if (duracao === 'curto' && horas > 20) return false;
      if (duracao === 'medio' && (horas <= 20 || horas > 50)) return false;
      if (duracao === 'longo' && horas <= 50) return false;
    }

    return true;
  }, [pesquisa, nivel, preco, duracao]);

  /**
   * Compara dois cursos para ordenação
   */
  const compararCursos = useCallback((a, b) => {
    switch (ordenacao) {
      case 'preco_asc':
        return (Number(a.preco) || 0) - (Number(b.preco) || 0);
      
      case 'preco_desc':
        return (Number(b.preco) || 0) - (Number(a.preco) || 0);
      
      case 'nome':
        return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt');
      
      case 'avaliacao':
        return (Number(b.media_avaliacoes || 0) || Number(b.avaliacao_media || 0)) - 
               (Number(a.media_avaliacoes || 0) || Number(a.avaliacao_media || 0));
      
      case 'relevancia':
      default:
        // Ordenação por relevância: cursos com avaliação primeiro, depois por data
        const ratingA = Number(a.media_avaliacoes || a.avaliacao_media || 0);
        const ratingB = Number(b.media_avaliacoes || b.avaliacao_media || 0);
        if (ratingB !== ratingA) return ratingB - ratingA;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  }, [ordenacao]);

  // ---------------------------------------------------------------------------
  // MEMOIZAÇÃO DE RESULTADOS
  // ---------------------------------------------------------------------------

  /** Cursos filtrados e ordenados - calculado apenas quando necessário */
  const cursosFiltrados = useMemo(() => {
    return cursosOriginais
      .filter(correspondeAosFiltros)
      .sort(compararCursos);
  }, [cursosOriginais, correspondeAosFiltros, compararCursos]);

  /** Indica se há algum filtro ativo */
  const temFiltrosAtivos = useMemo(() => {
    return pesquisa || nivel || duracao || preco || ordenacao !== 'relevancia';
  }, [pesquisa, nivel, duracao, preco, ordenacao]);

  // ---------------------------------------------------------------------------
  // HANDLERS DE EVENTOS
  // ---------------------------------------------------------------------------

  /**
   * Handler de pesquisa com debounce para performance
   */
  const handlePesquisa = useCallback((valor) => {
    setPesquisa(valor);
    
    // Cancela timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Debounce: aguarda 300ms após última digitação
    timerRef.current = setTimeout(() => {
      // A filtragem é automática via useMemo
    }, 300);
  }, []);

  /**
   * Limpa todos os filtros aplicados
   */
  const limparFiltros = useCallback(() => {
    setPesquisa('');
    setNivel('');
    setDuracao('');
    setPreco('');
    setOrdenacao('relevancia');
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // RENDERIZAÇÃO
  // ---------------------------------------------------------------------------

  return (
    <Layout>
      <div style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* ================================================================= */}
        {/* CABEÇALHO                                                        */}
        {/* ================================================================= */}
        <div
          style={{
            marginBottom: 32,
            textAlign: 'center',
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              background: 'var(--verde-100)',
              borderRadius: 'var(--r-lg)',
              marginBottom: 16,
            }}
          >
            <GraduationCap size={22} color="var(--verde)" />
            <span
              style={{
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'var(--verde)',
              }}
            >
              {totalResultados} {totalResultados === 1 ? 'curso disponível' : 'cursos disponíveis'}
            </span>
          </div>
          
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 800,
              marginBottom: 12,
              color: 'var(--txt-1)',
            }}
          >
            Cursos de Formação
          </h1>
          <p style={{ color: 'var(--txt-3)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Desenvolva novas competências com os nossos cursos certificados. 
            Aprenda no seu ritmo, onde e quando quiser.
          </p>
        </div>

        {/* ================================================================= */}
        {/* BARRA DE PESQUISA E FILTROS - Design moderno com gradiente suave   */}
        {/* ================================================================= */}
        <div
          style={{
            background: 'linear-gradient(145deg, var(--bg-2) 0%, var(--bg-3) 100%)',
            borderRadius: 'var(--r-xl)',
            padding: '24px 28px',
            marginBottom: 32,
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* Linha principal: pesquisa + ordenação */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {/* Campo de pesquisa com estilo premium */}
            <div
              className="form-input-wrapper"
              style={{ 
                flex: 1, 
                minWidth: 260, 
                position: 'relative',
              }}
            >
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--txt-3)',
                  pointerEvents: 'none',
                  opacity: 0.7,
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Pesquisar cursos..."
                value={pesquisa}
                onChange={(e) => handlePesquisa(e.target.value)}
                style={{
                  paddingLeft: 48,
                  height: 52,
                  fontSize: '1rem',
                  width: '100%',
                  borderRadius: 'var(--r-lg)',
                  border: '2px solid var(--border)',
                  background: 'var(--bg)',
                  transition: 'all 0.2s ease',
                }}
              />
              {pesquisa && (
                <button
                  onClick={() => setPesquisa('')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: 'var(--txt-3)',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Ordenação */}
            <select
              className="form-select"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              style={{ height: 48, minWidth: 180 }}
            >
              {OPCOES_ORDENACAO.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            {/* Botão de filtros avançados */}
            <button
              className={`btn ${mostrarFiltros ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              style={{ height: 48, whiteSpace: 'nowrap' }}
            >
              <SlidersHorizontal size={18} />
              Filtros
              {temFiltrosAtivos && (
                <span
                  style={{
                    marginLeft: 6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--vermelho)',
                    color: 'white',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  !
                </span>
              )}
            </button>
          </div>

          {/* Filtros avançados (expandido) */}
          {mostrarFiltros && (
            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {/* Filtro de nível */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: 6,
                    color: 'var(--txt-2)',
                  }}
                >
                  Nível do curso
                </label>
                <select
                  className="form-select"
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {OPCOES_NIVEL.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro de duração */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: 6,
                    color: 'var(--txt-2)',
                  }}
                >
                  Duração
                </label>
                <select
                  className="form-select"
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {OPCOES_DURACAO.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro de preço */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: 6,
                    color: 'var(--txt-2)',
                  }}
                >
                  Preço
                </label>
                <select
                  className="form-select"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {OPCOES_PRECO.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botão limpar filtros */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  className="btn btn--ghost"
                  onClick={limparFiltros}
                  disabled={!temFiltrosAtivos}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <X size={16} />
                  Limpar todos
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Indicador de resultados */}
        {!carregando && (
          <div
            style={{
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <p style={{ fontSize: '0.9rem', color: 'var(--txt-2)' }}>
              <strong>{cursosFiltrados.length}</strong>{' '}
              {cursosFiltrados.length === 1 ? 'resultado' : 'resultados'}
              {temFiltrosAtivos && ' com filtros aplicados'}
            </p>
          </div>
        )}

        {/* ================================================================= */}
        {/* CONTEÚDO PRINCIPAL                                               */}
        {/* ================================================================= */}
        {carregando ? (
          <LoadingState />
        ) : cursosFiltrados.length === 0 ? (
          <EmptyState
            temFiltros={temFiltrosAtivos}
            onLimpar={limparFiltros}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}
          >
            {cursosFiltrados.map((curso) => (
              <CursoCard key={curso.uuid || curso.id || Math.random()} curso={curso} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export function CursoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { utilizador } = useAuth() || {};
  const [curso, setCurso] = useState(null);
  const [centros, setCentros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalInscricao, setModalInscricao] = useState(null);
  const [mostrarCoordenadas, setMostrarCoordenadas] = useState(true);
  const [formInscricao, setFormInscricao] = useState({
    provincia_aluno: '',
    municipio_aluno: '',
    endereco_centro: '',
    observacoes: '',
    valor_pago: '',
    data_pagamento: new Date().toISOString().split('T')[0],
    banco_origem: '',
    referencia_bancaria: '',
  });
  const [comprovativo, setComprovativo] = useState(null);
  const [documentoRequisito, setDocumentoRequisito] = useState(null);
  const [submetendo, setSubmetendo] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) {
      setErro('ID do curso não fornecido');
      setCarregando(false);
      return;
    }
    
    try {
      setCarregando(true);
      setErro(null);
      
      const [{ data: cursoData }, { data: centrosData }] = await Promise.all([
        cursosAPI.obter(id), 
        cursosAPI.centros(id)
      ]);
      
      const cursoRecebido = cursoData?.dados?.course || cursoData?.dados?.curso || cursoData?.dados || null;
      setCurso(cursoRecebido);
      
      const dadosCentros = centrosData?.dados || {};
      const listaCentros = dadosCentros.centers || [
        ...(dadosCentros.local || []), 
        ...(dadosCentros.provincial || []), 
        ...(dadosCentros.outros || [])
      ];
      setCentros(Array.isArray(listaCentros) ? listaCentros : []);
      
      if (!cursoRecebido) {
        setErro('Curso não encontrado');
      }
    } catch (e) {
      console.error('[CursoDetalhe] Erro ao carregar:', e);
      setErro(extrairErro(e) || 'Erro ao carregar o curso');
      setCurso(null);
      setCentros([]);
      toast.erro('Erro ao carregar o curso: ' + extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [id, toast]);

  useEffect(() => { 
    carregar(); 
  }, [carregar]);

  const abrirInscricao = (oferta = null) => {
    const ofertaAtual = oferta || { id: null, certificado_exigido: false, preco: curso?.preco || '' };
    setModalInscricao(ofertaAtual);
    
    // Preencher automaticamente os campos de localização do centro
    const centro = ofertaAtual?.centro || {};
    setFormInscricao((anterior) => ({
      ...anterior,
      valor_pago: ofertaAtual?.preco || curso?.preco || '',
      provincia_aluno: centro.provincia || '',
      municipio_aluno: centro.municipio || '',
      endereco_centro: centro.endereco || '',
    }));
    setComprovativo(null);
    setDocumentoRequisito(null);
  };

  const submeterInscricao = async () => {
    if (!utilizador) {
      navigate('/criar-conta');
      return;
    }
    if (!['student', 'estudante'].includes(utilizador.role)) {
      toast.aviso('A inscrição em cursos está disponível apenas para estudantes.');
      return;
    }
    if (!comprovativo) {
      toast.aviso('Anexe o comprovativo de pagamento.');
      return;
    }
    if (modalInscricao?.certificado_exigido && !documentoRequisito) {
      toast.aviso('Este curso exige certificado ou documento obrigatório.');
      return;
    }

    setSubmetendo(true);
    try {
      console.log('[INSCRICAO] Comprovativo:', comprovativo, 'Tipo:', typeof comprovativo, 'Is File:', comprovativo instanceof File);
      const fd = new FormData();
      if (modalInscricao?.id) fd.append('offering_id', modalInscricao.id);
      else fd.append('course_id', id);
      fd.append('provincia_aluno', formInscricao.provincia_aluno);
      fd.append('municipio_aluno', formInscricao.municipio_aluno);
      fd.append('observacoes', formInscricao.observacoes);
      fd.append('valor_pago', formInscricao.valor_pago);
      fd.append('data_pagamento', formInscricao.data_pagamento);
      fd.append('banco_origem', formInscricao.banco_origem);
      fd.append('referencia_bancaria', formInscricao.referencia_bancaria);
      
      if (comprovativo && comprovativo instanceof File) {
        fd.append('comprovativo_pagamento', comprovativo);
      } else {
        console.error('[INSCRICAO] Comprovativo não é um arquivo válido:', comprovativo);
        toast.erro('Erro: comprovativo não é um arquivo válido');
        setSubmetendo(false);
        return;
      }
      
      if (documentoRequisito && documentoRequisito instanceof File) {
        fd.append('documento_requisito', documentoRequisito);
      }

      await cursosAPI.inscrever(fd);
      toast.sucesso('Inscrição submetida com sucesso. Aguarde a validação administrativa.');
      setModalInscricao(null);
      navigate('/cursos');
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setSubmetendo(false);
    }
  };

  if (carregando) return <Layout><PageLoader /></Layout>;

  if (!curso) {
    return (
      <Layout>
        <div style={{ padding: '48px 24px', maxWidth: 960, margin: '0 auto' }}>
          <div className="card" style={{ padding: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Curso nao encontrado</h1>
            <p style={{ color: 'var(--txt-3)', marginBottom: 20 }}>O curso solicitado nao existe ou nao esta disponivel.</p>
            <Link to="/cursos" className="btn btn--primary">Voltar aos cursos</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '40px 24px', maxWidth: 980, margin: '0 auto', display: 'grid', gap: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <p style={{ color: 'var(--txt-3)', marginBottom: 6 }}>Modulo de cursos</p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 800 }}>{curso.nome}</h1>
            </div>
            <BadgeStatus status={curso.nivel || 'ativo'} />
          </div>
          <p style={{ color: 'var(--txt-2)', lineHeight: 1.7, marginBottom: 20 }}>{curso.descricao || 'Sem descricao detalhada disponivel.'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem', marginBottom: 6 }}>Preco por centro</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                {curso.preco_minimo ? `${formatAOA(curso.preco_minimo)}${curso.preco_maximo && curso.preco_maximo !== curso.preco_minimo ? ` - ${formatAOA(curso.preco_maximo)}` : ''}` : 'A definir'}
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem', marginBottom: 6 }}>Carga horaria</div>
              <div style={{ fontWeight: 700 }}>{curso.duracao_horas ? `${curso.duracao_horas}h` : 'Conforme o centro'}</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem', marginBottom: 6 }}>Centros activos</div>
              <div style={{ fontWeight: 700 }}>{curso.total_centros || centros.length}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>Centros de formacao</h2>
          <p style={{ color: 'var(--txt-3)', marginBottom: 18 }}>Cada centro define o preco, a carga horaria e as exigencias especificas do curso.</p>
          {centros.length === 0 ? (
            <div style={{ padding: 18, borderRadius: 'var(--r-md)', background: 'var(--bg-soft)', color: 'var(--txt-3)' }}>
              Ainda nao existem centros listados para este curso. Mesmo assim pode submeter a inscricao e a equipa associara um centro posteriormente.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {centros.map((oferta) => (
                <div key={oferta.id} className="card" style={{ padding: 18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:16, flexWrap:'wrap', marginBottom:12 }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>{oferta.centro?.nome}</div>
                      <div style={{ color: 'var(--txt-3)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} />
                        {[oferta.centro?.municipio, oferta.centro?.provincia].filter(Boolean).join(', ') || 'Localizacao nao definida'}
                      </div>
                    </div>
                    <BadgeStatus status={oferta.proximidade || 'ativo'} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:12 }}>
                    <div style={{ background:'var(--bg-soft)', borderRadius:'var(--r-md)', padding:12 }}>
                      <div style={{ fontSize:'0.76rem', color:'var(--txt-3)', marginBottom:4 }}>Preco</div>
                      <div style={{ fontWeight:800 }}>{formatAOA(oferta.preco)}</div>
                    </div>
                    <div style={{ background:'var(--bg-soft)', borderRadius:'var(--r-md)', padding:12 }}>
                      <div style={{ fontSize:'0.76rem', color:'var(--txt-3)', marginBottom:4 }}>Carga horaria</div>
                      <div style={{ fontWeight:700 }}>{oferta.carga_horaria ? `${oferta.carga_horaria}h` : 'A definir'}</div>
                    </div>
                    <div style={{ background:'var(--bg-soft)', borderRadius:'var(--r-md)', padding:12 }}>
                      <div style={{ fontSize:'0.76rem', color:'var(--txt-3)', marginBottom:4 }}>Documento exigido</div>
                      <div style={{ fontWeight:700 }}>{oferta.certificado_exigido ? 'Sim' : 'Nao'}</div>
                    </div>
                  </div>
                  {oferta.especificacoes && <p style={{ color:'var(--txt-2)', lineHeight:1.6, marginBottom:12 }}>{oferta.especificacoes}</p>}
                  <button className="btn btn--primary btn--sm" onClick={() => abrirInscricao(oferta)}>Inscrever neste centro</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
            {centros.length === 0 && <button className="btn btn--primary" onClick={() => abrirInscricao(null)}>Inscrever sem centro definido</button>}
            {!utilizador && <Link to="/criar-conta" className="btn btn--primary">Criar conta para inscrever</Link>}
            <Link to="/cursos" className="btn btn--secondary">Voltar a lista</Link>
          </div>
        </div>
      </div>

      <Modal
        aberto={!!modalInscricao}
        onFechar={() => {
          setModalInscricao(null);
          setMostrarCoordenadas(true);
        }}
        titulo={mostrarCoordenadas ? "Dados para Pagamento" : "Submeter inscrição"}
        largura={720}
        acoes={
          mostrarCoordenadas ? (
            <button className="btn btn--secondary" onClick={() => {
              setModalInscricao(null);
              setMostrarCoordenadas(true);
            }}>Fechar</button>
          ) : (
            <>
              <button className="btn btn--secondary" onClick={() => setMostrarCoordenadas(true)}>← Voltar</button>
              <button className={`btn btn--primary${submetendo ? ' btn--loading' : ''}`} onClick={submeterInscricao} disabled={submetendo}>
                {!submetendo && 'Submeter inscrição'}
              </button>
            </>
          )
        }
      >
        {mostrarCoordenadas ? (
          <CoordenadasBancarias onContinuar={() => setMostrarCoordenadas(false)} />
        ) : (
          <div style={{ display:'grid', gap:16 }}>
            <div style={{ background:'var(--bg-soft)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:16 }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{curso.nome}</div>
            <div style={{ fontSize:'0.84rem', color:'var(--txt-3)' }}>
              {modalInscricao?.centro?.nome ? `${modalInscricao.centro.nome} • ${formatAOA(modalInscricao.preco)}` : 'Sem centro definido no momento'}
            </div>
          </div>
          {/* Localização do Centro - Preenchida Automaticamente */}
          <div style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 'var(--r-md)', marginBottom: 12 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--txt-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} />
              Localização do Centro de Formação
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Província</label>
                <input className="form-input" value={formInscricao.provincia_aluno} readOnly disabled style={{ background: 'var(--bg-3)', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Município</label>
                <input className="form-input" value={formInscricao.municipio_aluno} readOnly disabled style={{ background: 'var(--bg-3)', cursor: 'not-allowed' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Endereço do Centro</label>
              <input className="form-input" value={formInscricao.endereco_centro} readOnly disabled style={{ background: 'var(--bg-3)', cursor: 'not-allowed' }} />
            </div>
          </div>
          {/* Informações de Pagamento - Bloqueadas (preenchidas automaticamente) */}
          <div style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 'var(--r-md)', marginBottom: 12 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--txt-2)', marginBottom: 8 }}>
              Informações de Pagamento
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Valor pago</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formInscricao.valor_pago} 
                  readOnly 
                  disabled 
                  style={{ background: 'var(--bg-3)', cursor: 'not-allowed' }} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Data do pagamento</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formInscricao.data_pagamento} 
                  readOnly 
                  disabled 
                  style={{ background: 'var(--bg-3)', cursor: 'not-allowed' }} 
                />
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label className="form-label">Banco de origem *</label>
              <input className="form-input" value={formInscricao.banco_origem} onChange={(e)=>setFormInscricao((s)=>({ ...s, banco_origem: e.target.value }))} placeholder="Ex: BFA" />
            </div>
            <div className="form-group">
              <label className="form-label">Referencia bancaria *</label>
              <input className="form-input" value={formInscricao.referencia_bancaria} onChange={(e)=>setFormInscricao((s)=>({ ...s, referencia_bancaria: e.target.value }))} placeholder="Ex: TRX123456" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observacoes</label>
            <textarea className="form-textarea" rows={3} value={formInscricao.observacoes} onChange={(e)=>setFormInscricao((s)=>({ ...s, observacoes: e.target.value }))} placeholder="Informacoes adicionais para a equipa." />
          </div>
          <div className="form-group">
            <label className="form-label">Comprovativo de pagamento *</label>
            <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={(e)=>setComprovativo(e.target.files?.[0] || null)} />
          </div>
          {modalInscricao?.certificado_exigido && (
            <div className="form-group">
              <label className="form-label">Certificado ou documento obrigatório *</label>
              <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={(e)=>setDocumentoRequisito(e.target.files?.[0] || null)} />
            </div>
          )}
        </div>
      )}
      </Modal>
    </Layout>
  );
}

export function Comunidade() {
  const toast = useToast();
  const [aba, setAba] = useState('membros');
  const [membros, setMembros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [vagas, setVagas] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const carregarMembros = useCallback(async () => {
    setCarregando(true);
    try {
      const { data } = await comunidadeAPI.perfis({});
      const lista = data.dados?.profiles || data.dados || [];
      setMembros(Array.isArray(lista) ? lista : []);
    } catch {
      toast.erro('Erro ao carregar membros.');
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  const carregarServicos = useCallback(async (categoriaAtual = '') => {
    setCarregando(true);
    try {
      const { data } = await comunidadeAPI.servicos(categoriaAtual);
      const lista = data.dados?.empresas || data.dados || [];
      setServicos(Array.isArray(lista) ? lista : []);
    } catch {
      toast.erro('Erro ao carregar servicos.');
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  const carregarCategorias = useCallback(async () => {
    try {
      const { data } = await comunidadeAPI.categServicos();
      const lista = data.dados?.categorias || data.dados || [];
      setCategorias(Array.isArray(lista) ? lista : []);
    } catch {
      setCategorias([]);
    }
  }, []);

  const carregarVagas = useCallback(async () => {
    setCarregando(true);
    try {
      const { data } = await comunidadeAPI.vagas({});
      const lista = data.dados?.vagas || data.dados || [];
      setVagas(Array.isArray(lista) ? lista : []);
    } catch {
      toast.erro('Erro ao carregar vagas.');
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => {
    if (aba === 'membros') carregarMembros();
    if (aba === 'servicos') { carregarCategorias(); carregarServicos(categoria); }
    if (aba === 'vagas') carregarVagas();
  }, [aba, categoria, carregarCategorias, carregarMembros, carregarServicos, carregarVagas]);

  return (
    <Layout>
      <div style={{ padding: '40px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, marginBottom: 6 }}>Comunidade</h1>
          <p style={{ color: 'var(--txt-3)' }}>Networking, solicitacao de servicos e vagas publicas.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['membros', 'servicos', 'vagas'].map((item) => <button key={item} onClick={() => setAba(item)} className={`btn btn--sm ${aba === item ? 'btn--primary' : 'btn--secondary'}`}>{item}</button>)}
        </div>

        {aba === 'membros' && (carregando ? <PageLoader /> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>{membros.map((m, i) => <div key={m.id || i} className="card" style={{ padding: 20 }}><div style={{ fontWeight: 700, marginBottom: 6 }}>{m.nome_empresa || m.nome || 'Utilizador'}</div><div style={{ color: 'var(--txt-3)', fontSize: '0.84rem' }}>{[m.municipio, m.provincia].filter(Boolean).join(', ') || 'Sem localizacao publica'}</div></div>)}</div>)}

        {aba === 'servicos' && (
          <>
            <select className="form-select" style={{ width: 280, marginBottom: 20 }} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => <option key={cat.id || cat.nome || cat} value={cat.id || cat.nome || cat}>{cat.nome || cat}</option>)}
            </select>
            {carregando ? <PageLoader /> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>{servicos.map((s, i) => <div key={s.id || i} className="card" style={{ padding: 20 }}><div style={{ fontWeight: 700, marginBottom: 6 }}>{s.nome_empresa || s.nome || 'Empresa'}</div><div style={{ color: 'var(--txt-3)', fontSize: '0.84rem' }}>{s.descricao || s.sector || 'Sem descricao publica'}</div></div>)}</div>}
          </>
        )}

        {aba === 'vagas' && (carregando ? <PageLoader /> : <div style={{ display: 'grid', gap: 12 }}>{vagas.map((v, i) => <div key={v.id || i} className="card" style={{ padding: 20 }}><div style={{ fontWeight: 700, marginBottom: 6 }}>{v.titulo}</div><div style={{ color: 'var(--txt-3)', fontSize: '0.84rem', marginBottom: 8 }}>{[v.nome_empresa, v.localizacao].filter(Boolean).join(' · ')}</div><div style={{ color: 'var(--txt-2)', fontSize: '0.9rem' }}>{v.descricao}</div></div>)}</div>)}
      </div>
    </Layout>
  );
}

export function Termos() {
  return (
    <Layout>
      <div style={{ padding: '48px 24px', maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>Termos de uso</h1>
        <p style={{ color: 'var(--txt-3)', marginBottom: 32 }}>Ultima actualizacao: Marco de 2026</p>
        <div style={{ display: 'grid', gap: 24, color: 'var(--txt-2)', lineHeight: 1.8 }}>
          <div><h2 style={{ fontWeight: 700, marginBottom: 8 }}>1. Utilizacao</h2><p>Ao utilizar a plataforma, o utilizador concorda com as regras operacionais e de seguranca da ULEZI XPB.</p></div>
          <div><h2 style={{ fontWeight: 700, marginBottom: 8 }}>2. Responsabilidade</h2><p>Os dados submetidos devem ser verdadeiros e actualizados. O uso indevido pode levar a bloqueio da conta.</p></div>
          <div><h2 style={{ fontWeight: 700, marginBottom: 8 }}>3. Intermediacao</h2><p>A plataforma regista e organiza processos, mas as decisoes finais de negocio e investimento pertencem as partes envolvidas.</p></div>
        </div>
      </div>
    </Layout>
  );
}

export function Privacidade() {
  return (
    <Layout>
      <div style={{ padding: '48px 24px', maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>Politica de privacidade</h1>
        <p style={{ color: 'var(--txt-3)', marginBottom: 32 }}>Ultima actualizacao: Marco de 2026</p>
        <div style={{ display: 'grid', gap: 24, color: 'var(--txt-2)', lineHeight: 1.8 }}>
          <div><h2 style={{ fontWeight: 700, marginBottom: 8 }}>Dados recolhidos</h2><p>Recolhemos dados de identificacao, contacto e actividade necessarios para o funcionamento da plataforma.</p></div>
          <div><h2 style={{ fontWeight: 700, marginBottom: 8 }}>Finalidade</h2><p>Os dados sao usados para autenticacao, historico, notificacoes, pagamentos e seguranca operacional.</p></div>
          <div><h2 style={{ fontWeight: 700, marginBottom: 8 }}>Direitos</h2><p>O utilizador pode actualizar dados do proprio perfil e solicitar correcoes quando necessario.</p></div>
        </div>
      </div>
    </Layout>
  );
}

export function NotFound() {
  return (
    <Layout>
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '8rem', fontWeight: 900, color: 'var(--border)', lineHeight: 1, marginBottom: 20 }}>404</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Pagina nao encontrada</h1>
        <p style={{ color: 'var(--txt-3)', marginBottom: 28 }}>A pagina que procura nao existe ou foi movida.</p>
        <Link to="/" className="btn btn--primary btn--lg"><Home size={18} /> Voltar ao inicio</Link>
      </div>
    </Layout>
  );
}

export function EsqueciPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (!email) return setErro('Introduza o seu e-mail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErro('E-mail invalido');

    setCarregando(true);
    try {
      await authAPI.esqueciSenha(email);
      setEnviado(true);
    } catch (err) {
      toast.erro(extrairErro(err));
      setEnviado(true);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Layout>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 200px)' }}>
        <div className="auth-card">
          {enviado ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--verde-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={28} color="var(--verde)" />
              </div>
              <h1 className="auth-card__title">Pedido enviado</h1>
              <p style={{ color: 'var(--txt-3)', marginBottom: 24, lineHeight: 1.6 }}>Se o e-mail <strong>{email}</strong> existir no sistema, recebera instrucoes de recuperacao.</p>
              <Link to="/entrar" className="btn btn--primary btn--full">Voltar ao login</Link>
            </div>
          ) : (
            <>
              <h1 className="auth-card__title">Recuperar conta</h1>
              <p className="auth-card__sub">Introduza o seu e-mail para receber um link de recuperacao.</p>
              {erro && <div className="alert alert--error" style={{ marginBottom: 16 }}><AlertCircle size={16} /> {erro}</div>}
              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input type="email" className={`form-input${erro ? ' form-input--error' : ''}`} placeholder="seu@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setErro(''); }} autoComplete="email" autoFocus />
                </div>
                <button type="submit" className={`btn btn--primary btn--full${carregando ? ' btn--loading' : ''}`} disabled={carregando}>{!carregando && 'Enviar link de recuperacao'}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export function NovaPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ password: '', confirmar: '' });
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState({});

  const validar = () => {
    const novosErros = {};
    if (form.password.length < 8) novosErros.password = 'Minimo 8 caracteres';
    else if (!/[A-Z]/.test(form.password)) novosErros.password = 'Deve ter letra maiuscula';
    else if (!/[0-9]/.test(form.password)) novosErros.password = 'Deve ter numero';
    if (form.password !== form.confirmar) novosErros.confirmar = 'As senhas nao coincidem';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setCarregando(true);
    try {
      await authAPI.novaSenha(token, { password: form.password, confirmar_password: form.confirmar });
      toast.sucesso('Palavra-passe redefinida com sucesso.');
      navigate('/entrar');
    } catch (err) {
      toast.erro(extrairErro(err));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Layout>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 200px)' }}>
        <div className="auth-card">
          <h1 className="auth-card__title">Nova palavra-passe</h1>
          <p className="auth-card__sub">Defina a sua nova senha de acesso.</p>
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label">Nova palavra-passe</label>
              <input type="password" className={`form-input${erros.password ? ' form-input--error' : ''}`} placeholder="Minimo 8 caracteres" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              {erros.password && <span className="form-error"><AlertCircle size={12} /> {erros.password}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar</label>
              <input type="password" className={`form-input${erros.confirmar ? ' form-input--error' : ''}`} placeholder="Repita a nova senha" value={form.confirmar} onChange={(e) => setForm((f) => ({ ...f, confirmar: e.target.value }))} />
              {erros.confirmar && <span className="form-error"><AlertCircle size={12} /> {erros.confirmar}</span>}
            </div>
            <button type="submit" className={`btn btn--primary btn--full${carregando ? ' btn--loading' : ''}`} disabled={carregando}>{!carregando && 'Redefinir palavra-passe'}</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
