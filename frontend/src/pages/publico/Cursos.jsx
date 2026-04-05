// ============================================================
// ULEZI XPB — Listagem de Cursos
// Catálogo com filtros, ordenação, skeleton loading e design moderno
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Clock, SlidersHorizontal,
  Star, Search, X, GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar  from '../../components/layout/Navbar.jsx';
import Footer  from '../../components/layout/Footer.jsx';
import { useToast } from '../../components/ui/Toast';
import { cursosAPI, extrairErro } from '../../services/api';
import { formatAOA } from '../../utils/constants';

// ── Constantes de configuração ─────────────────────────────
const NIVEL_BADGE = {
  basico:     { label: 'Básico',     cor: '#059669', bg: '#D1FAE5' },
  intermedio: { label: 'Intermédio', cor: '#D97706', bg: '#FEF3C7' },
  avancado:   { label: 'Avançado',   cor: '#DC2626', bg: '#FEE2E2' },
};

const OPCOES_NIVEL = [
  { value: '',          label: 'Todos os níveis' },
  { value: 'basico',    label: 'Básico' },
  { value: 'intermedio',label: 'Intermédio' },
  { value: 'avancado',  label: 'Avançado' },
];

const OPCOES_PRECO = [
  { value: '',       label: 'Qualquer preço' },
  { value: 'gratis', label: 'Gratuito' },
  { value: 'pago',   label: 'Pago' },
];

const OPCOES_DURACAO = [
  { value: '',      label: 'Qualquer duração' },
  { value: 'curto', label: 'Até 20h' },
  { value: 'medio', label: '21h–50h' },
  { value: 'longo', label: '50h+' },
];

const OPCOES_ORDENACAO = [
  { value: 'relevancia',  label: 'Relevância' },
  { value: 'preco_asc',   label: 'Preço ↑' },
  { value: 'preco_desc',  label: 'Preço ↓' },
  { value: 'nome',        label: 'Nome A-Z' },
  { value: 'avaliacao',   label: 'Melhor avaliados' },
];

// ── Skeleton de Carregamento ────────────────────────────────
function SkeletonCurso() {
  return (
    <div
      className="curso-card"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {/* Imagem */}
      <div className="skeleton" style={{ height: 160, borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }} />

      <div style={{ padding: 20, display: 'grid', gap: 10 }}>
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
        <div className="skeleton" style={{ height: 18, width: '80%' }} />
        <div className="skeleton" style={{ height: 14, width: '60%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <div className="skeleton" style={{ height: 20, width: '30%' }} />
          <div className="skeleton" style={{ height: 20, width: '20%' }} />
        </div>
      </div>
    </div>
  );
}

// ── Card individual de curso ────────────────────────────────
function CursoCard({ curso }) {
  if (!curso || typeof curso !== 'object') return null;

  const id          = curso.uuid || curso.id;
  const nome        = curso.nome        || 'Curso sem título';
  const descricao   = curso.descricao   || '';
  const categoria   = curso.categoria   || curso.area_formacao || '';
  const nivel       = String(curso.nivel || '').toLowerCase();
  const duracao     = Number(curso.duracao_horas || curso.duracao || 0);
  const preco       = Number(curso.preco || curso.preco_minimo || 0);
  const avaliacao   = Number(curso.media_avaliacoes || 0);
  const numAvaliacoes = Number(curso.total_avaliacoes || 0);

  const nivelInfo   = NIVEL_BADGE[nivel] || null;

  // Gradiente de imagem baseado na categoria
  const gradientes = [
    'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
    'linear-gradient(135deg, #065f46 0%, #059669 100%)',
    'linear-gradient(135deg, #7c2d12 0%, #dc2626 100%)',
    'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)',
    'linear-gradient(135deg, #164e63 0%, #0891b2 100%)',
  ];
  const gradIdx = Math.abs(nome.charCodeAt(0)) % gradientes.length;

  return (
    <Link
      to={`/cursos/${id}`}
      className="curso-card"
      style={{ textDecoration: 'none' }}
      aria-label={`Ver detalhes do curso ${nome}`}
    >
      {/* Imagem / Capa */}
      <div
        className="curso-card__imagem"
        style={{ background: gradientes[gradIdx] }}
        aria-hidden="true"
      >
        <GraduationCap size={36} color="rgba(255,255,255,0.5)" />
        {nivelInfo && (
          <span
            className="curso-card__nivel"
            style={{ background: nivelInfo.bg, color: nivelInfo.cor }}
          >
            {nivelInfo.label}
          </span>
        )}
      </div>

      {/* Corpo */}
      <div className="curso-card__corpo">
        {categoria && (
          <span className="curso-card__categoria">{categoria}</span>
        )}

        <h3 className="curso-card__titulo">{nome}</h3>

        {descricao && (
          <p className="curso-card__desc">
            {descricao.length > 90 ? `${descricao.slice(0, 90)}…` : descricao}
          </p>
        )}

        {/* Meta */}
        <div className="curso-card__meta">
          {duracao > 0 && (
            <span className="curso-card__meta-item">
              <Clock size={13} /> {duracao}h
            </span>
          )}
          {numAvaliacoes > 0 && (
            <span className="curso-card__meta-item curso-card__meta-item--star">
              <Star size={13} fill="var(--amarelo)" color="var(--amarelo)" />
              {avaliacao.toFixed(1)}
              <span style={{ color: 'var(--txt-4)' }}>({numAvaliacoes})</span>
            </span>
          )}
        </div>

        {/* Rodapé: preço + CTA */}
        <div className="curso-card__rodape">
          <span className="curso-card__preco">
            {preco > 0 ? formatAOA(preco) : 'Consultar'}
          </span>
          <span className="curso-card__ver-mais">Ver detalhes →</span>
        </div>
      </div>
    </Link>
  );
}

// ── Estado vazio ────────────────────────────────────────────
function EstadoVazio({ temFiltros, onLimpar }) {
  return (
    <div className="cursos-vazio">
      <div className="cursos-vazio__icone">
        <Search size={32} />
      </div>
      <h3 className="cursos-vazio__titulo">
        {temFiltros ? 'Nenhum curso encontrado' : 'Sem cursos disponíveis'}
      </h3>
      <p className="cursos-vazio__desc">
        {temFiltros
          ? 'Tente ajustar os filtros ou limpar a pesquisa.'
          : 'Volte mais tarde para novos cursos.'}
      </p>
      {temFiltros && (
        <button type="button" className="btn btn--secondary" onClick={onLimpar}>
          <X size={16} /> Limpar filtros
        </button>
      )}
    </div>
  );
}

// ── Componente Principal ────────────────────────────────────
export default function Cursos() {
  const toast = useToast();

  // Dados
  const [cursosOriginais, setCursosOriginais] = useState([]);
  const [carregando,      setCarregando]      = useState(true);

  // Filtros
  const [pesquisa,    setPesquisa]    = useState('');
  const [nivel,       setNivel]       = useState('');
  const [duracao,     setDuracao]     = useState('');
  const [preco,       setPreco]       = useState('');
  const [ordenacao,   setOrdenacao]   = useState('relevancia');
  const [painelAberto, setPainelAberto] = useState(false);

  // ── Carregamento da API ──────────────────────────────────
  const carregarCursos = useCallback(async () => {
    try {
      setCarregando(true);
      const { data } = await cursosAPI.listar();

      const lista =
        data?.dados?.cursos  ||
        data?.dados?.courses ||
        data?.dados?.data    ||
        (Array.isArray(data?.dados) ? data.dados : null) ||
        (Array.isArray(data) ? data : null) ||
        [];

      // Filtra registos sem ID (dados inválidos)
      setCursosOriginais(lista.filter((c) => c && (c.id || c.uuid)));
    } catch (erro) {
      toast.erro('Erro ao carregar cursos: ' + extrairErro(erro));
      setCursosOriginais([]);
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => { carregarCursos(); }, [carregarCursos]);

  // ── Filtro e ordenação (memorizados para performance) ────
  const cursosFiltrados = useMemo(() => {
    let resultado = cursosOriginais.filter((curso) => {
      // Pesquisa textual
      if (pesquisa.trim()) {
        const t   = pesquisa.toLowerCase();
        const nome = (curso.nome || '').toLowerCase();
        const desc = (curso.descricao || '').toLowerCase();
        const cat  = (curso.categoria || curso.area_formacao || '').toLowerCase();
        if (!nome.includes(t) && !desc.includes(t) && !cat.includes(t)) return false;
      }
      // Nível
      if (nivel && String(curso.nivel || '').toLowerCase() !== nivel) return false;
      // Preço
      if (preco) {
        const v = Number(curso.preco || 0);
        if (preco === 'gratis' && v > 0) return false;
        if (preco === 'pago'   && v === 0) return false;
      }
      // Duração
      if (duracao) {
        const h = Number(curso.duracao_horas || curso.duracao || 0);
        if (duracao === 'curto' && h > 20)          return false;
        if (duracao === 'medio' && (h <= 20 || h > 50)) return false;
        if (duracao === 'longo' && h <= 50)          return false;
      }
      return true;
    });

    // Ordenação
    resultado = [...resultado].sort((a, b) => {
      switch (ordenacao) {
        case 'preco_asc':  return (Number(a.preco) || 0) - (Number(b.preco) || 0);
        case 'preco_desc': return (Number(b.preco) || 0) - (Number(a.preco) || 0);
        case 'nome':       return (a.nome || '').localeCompare(b.nome || '', 'pt');
        case 'avaliacao':  return (Number(b.media_avaliacoes) || 0) - (Number(a.media_avaliacoes) || 0);
        default:           return 0;
      }
    });

    return resultado;
  }, [cursosOriginais, pesquisa, nivel, preco, duracao, ordenacao]);

  // Verifica se há filtros ativos
  const temFiltros = pesquisa || nivel || preco || duracao;

  const limparFiltros = () => {
    setPesquisa('');
    setNivel('');
    setPreco('');
    setDuracao('');
    setOrdenacao('relevancia');
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="publico-layout">
      <Navbar />

      <main className="publico-main">
        {/* ── Hero ───────────────────────────────────── */}
        <section className="cursos-hero">
          <div className="cursos-hero__inner">
            <span className="cursos-hero__kicker">
              <BookOpen size={14} /> Catálogo Formativo
            </span>
            <h1 className="cursos-hero__titulo">
              Todos os <span className="texto-gradiente">Cursos</span>
            </h1>
            <p className="cursos-hero__desc">
              Descubra formações profissionais para avançar na sua carreira ou expandir o seu negócio.
            </p>

            {/* Barra de pesquisa principal */}
            <div className="cursos-hero__pesquisa">
              <Search size={18} className="cursos-pesquisa__icon" />
              <input
                type="search"
                className="cursos-pesquisa__input"
                placeholder="Pesquisar cursos por nome, área ou descrição..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                aria-label="Pesquisar cursos"
              />
              {pesquisa && (
                <button
                  type="button"
                  className="cursos-pesquisa__limpar"
                  onClick={() => setPesquisa('')}
                  aria-label="Limpar pesquisa"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Área de conteúdo ───────────────────────── */}
        <div className="brand-page brand-page--narrow" style={{ paddingTop: 0 }}>

          {/* Barra de filtros */}
          <div className="cursos-toolbar">
            <div className="cursos-toolbar__info">
              {!carregando && (
                <span>
                  {cursosFiltrados.length} curso{cursosFiltrados.length !== 1 ? 's' : ''}
                  {temFiltros ? ' encontrados' : ' disponíveis'}
                </span>
              )}
            </div>

            <div className="cursos-toolbar__controles">
              {/* Botão filtros avançados */}
              <button
                type="button"
                className={`btn btn--sm ${painelAberto ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setPainelAberto((a) => !a)}
                aria-expanded={painelAberto}
              >
                <SlidersHorizontal size={14} />
                Filtros
                {temFiltros && (
                  <span className="cursos-toolbar__badge">
                    {[nivel, preco, duracao].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Ordenação */}
              <select
                className="form-select"
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                aria-label="Ordenar cursos"
                style={{ height: 36 }}
              >
                {OPCOES_ORDENACAO.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Painel de filtros avançados */}
          {painelAberto && (
            <div className="cursos-filtros-painel">
              <div className="cursos-filtros-grid">
                <div className="form-group">
                  <label className="form-label">Nível</label>
                  <select className="form-select" value={nivel} onChange={(e) => setNivel(e.target.value)}>
                    {OPCOES_NIVEL.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preço</label>
                  <select className="form-select" value={preco} onChange={(e) => setPreco(e.target.value)}>
                    {OPCOES_PRECO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duração</label>
                  <select className="form-select" value={duracao} onChange={(e) => setDuracao(e.target.value)}>
                    {OPCOES_DURACAO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              {temFiltros && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={limparFiltros} style={{ marginTop: 12 }}>
                  <X size={14} /> Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Grelha de cursos */}
          {carregando ? (
            <div className="cursos-grid">
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCurso key={i} />)}
            </div>
          ) : cursosFiltrados.length === 0 ? (
            <EstadoVazio temFiltros={!!temFiltros} onLimpar={limparFiltros} />
          ) : (
            <div className="cursos-grid">
              {cursosFiltrados.map((curso) => (
                <CursoCard key={curso.uuid || curso.id} curso={curso} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
