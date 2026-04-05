// ============================================================
// ULEZI XPB — Mercado de Investimentos
// Oportunidades empresariais com filtros, pesquisa e mediação
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle,
  Search,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import Footer        from '../../components/layout/Footer.jsx';
import Navbar        from '../../components/layout/Navbar.jsx';
import { Modal } from '../../components/ui/index.jsx';
import { useToast }  from '../../components/ui/Toast';
import { useAuth }   from '../../context/AuthContext';
import { extrairErro, negociosAPI } from '../../services/api';
import { formatAOA, TIPO_OPORTUNIDADE } from '../../utils/constants';

// ── Constantes de filtro ────────────────────────────────────
const FILTROS = [
  { id: '',                    label: 'Todos' },
  { id: 'venda_participacao',  label: 'Participação societária' },
  { id: 'emprestimo',          label: 'Empréstimo' },
  { id: 'franquia',            label: 'Franquia' },
  { id: 'venda_empresa',       label: 'Venda da empresa' },
  { id: 'licenciamento_marca', label: 'Licenciamento' },
];

// Cores por tipo de oportunidade
const COR_TIPO = {
  venda_participacao:  '#f5a200',
  emprestimo:          '#18c8dd',
  franquia:            '#2b7cad',
  venda_empresa:       '#f08200',
  licenciamento_marca: '#3ca46b',
};

// ── Skeleton para carregamento ──────────────────────────────
function SkeletonOportunidade() {
  return (
    <div className="oportunidade-card" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <div className="skeleton" style={{ height: 12, width: '35%', marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)' }} />
        <div className="skeleton" style={{ height: 18, width: '50%' }} />
      </div>
      <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 20 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 24, width: '30%' }} />
        <div className="skeleton" style={{ height: 32, width: '25%', borderRadius: 'var(--r-sm)' }} />
      </div>
    </div>
  );
}

// ── Card de oportunidade ────────────────────────────────────
function OportunidadeCard({
  tipo_servico,
  nome_empresa,
  titulo,
  descricao,
  valor_solicitado,
  valor_pedido,
  retorno_estimado,
  verificada,
  status,
  podeInteressar,
  onInteresse,
}) {
  const labelTipo = TIPO_OPORTUNIDADE[tipo_servico] || tipo_servico || '—';
  const cor       = COR_TIPO[tipo_servico] || '#f5a200';

  const desativado = !podeInteressar
    || (status && !['ativa', 'publicada', 'em_analise'].includes(status));

  return (
    <article className="oportunidade-card">
      {/* Tipo + verificação */}
      <div className="oportunidade-card__header">
        <span className="oportunidade-card__tipo" style={{ color: cor }}>
          {labelTipo}
        </span>
        {verificada && (
          <span className="oportunidade-card__verificada">
            <CheckCircle size={13} /> Verificada
          </span>
        )}
      </div>

      {/* Empresa */}
      <div className="oportunidade-card__empresa">
        <div className="oportunidade-card__empresa-icon">
          <Building2 size={14} color="var(--txt-3)" />
        </div>
        <span className="oportunidade-card__empresa-nome">
          {nome_empresa || '—'}
        </span>
      </div>

      {/* Título (opcional) */}
      {titulo && <p className="oportunidade-card__titulo-neg">{titulo}</p>}

      {/* Descrição */}
      <p className="oportunidade-card__desc">
        {descricao || 'Sem descrição disponível.'}
      </p>

      {/* Footer: valor + CTA */}
      <div className="oportunidade-card__footer">
        <div>
          <span className="oportunidade-card__footer-label">Investimento</span>
          <div className="oportunidade-card__valor">
            {formatAOA(valor_solicitado || valor_pedido)}
          </div>
          {retorno_estimado && (
            <div className="oportunidade-card__retorno">↑ {retorno_estimado}</div>
          )}
        </div>
        <button
          type="button"
          className="btn btn--laranja btn--sm"
          onClick={onInteresse}
          disabled={desativado}
          aria-label={`Analisar oportunidade de ${nome_empresa}`}
        >
          Analisar <ArrowRight size={13} />
        </button>
      </div>
    </article>
  );
}

// ── Estado vazio ────────────────────────────────────────────
function EstadoVazio({ temFiltros, onLimpar }) {
  return (
    <div className="cursos-vazio">
      <div className="cursos-vazio__icone">
        <TrendingUp size={32} />
      </div>
      <h3 className="cursos-vazio__titulo">Nenhuma oportunidade encontrada</h3>
      <p className="cursos-vazio__desc">
        {temFiltros
          ? 'Tente ajustar os filtros ou a pesquisa.'
          : 'Volte mais tarde — novas oportunidades são publicadas regularmente.'}
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
export default function Negocios() {
  const { estaAutenticado, ehInvestidor } = useAuth();
  const toast = useToast();
  const [oportunidades, setOportunidades] = useState([]);
  const [carregando,     setCarregando]   = useState(true);
  const [pesquisa,       setPesquisa]     = useState('');
  const [filtro,         setFiltro]       = useState('');
  const [modalInt,       setModalInt]     = useState(null);
  const [enviandoInt,    setEnviandoInt]  = useState(false);
  const timerRef = useRef(null);

  // ── Carregamento ────────────────────────────
  const carregar = useCallback(async (p = '', f = '') => {
    setCarregando(true);
    try {
      const params = {};
      if (p) params.pesquisa = p;
      if (f) params.tipo = f;
      const { data } = await negociosAPI.oportunidades(params);
      setOportunidades(data.dados?.oportunidades || data.dados || []);
    } catch (erro) {
      toast.erro(`Erro ao carregar oportunidades: ${extrairErro(erro)}`);
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => { carregar(pesquisa, filtro); }, [carregar, filtro]);

  // Pesquisa com debounce
  const handlePesquisa = (valor) => {
    setPesquisa(valor);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => carregar(valor, filtro), 350);
  };

  const limparFiltros = () => {
    setPesquisa('');
    setFiltro('');
  };

  // ── Demonstrar interesse ────────────────────
  const demonstrarInteresse = async () => {
    if (!estaAutenticado) {
      toast.info('Precisa de entrar na sua conta para demonstrar interesse.');
      return;
    }
    if (!ehInvestidor) {
      toast.aviso('Apenas investidores podem demonstrar interesse nas oportunidades.');
      return;
    }

    setEnviandoInt(true);
    try {
      await negociosAPI.interesse(modalInt.id, {});
      setOportunidades((lista) => lista.filter((item) => item.id !== modalInt.id));
      setModalInt(null);
      toast.sucesso('Interesse registado. A equipa administrativa fará a mediação do processo.');
    } catch (erro) {
      toast.erro(extrairErro(erro));
    } finally {
      setEnviandoInt(false);
    }
  };

  const temFiltros = pesquisa || filtro;

  return (
    <div className="publico-layout">
      <Navbar />
      <main className="publico-main">

        {/* ── Hero ──────────────────────────────────── */}
        <section className="cursos-hero">
          <div className="cursos-hero__inner">
            <span className="cursos-hero__kicker">
              <TrendingUp size={14} /> Mercado de Investimentos
            </span>
            <h1 className="cursos-hero__titulo">
              Oportunidades <span className="texto-gradiente">Empresariais</span>
            </h1>
            <p className="cursos-hero__desc">
              Explore oportunidades de investimento em empresas angolanas verificadas,
              com mediação profissional e contratos protegidos pela plataforma.
            </p>

            {/* Pesquisa */}
            <div className="cursos-hero__pesquisa">
              <Search size={18} className="cursos-pesquisa__icon" />
              <input
                type="search"
                className="cursos-pesquisa__input"
                placeholder="Pesquisar empresas ou oportunidades..."
                value={pesquisa}
                onChange={(e) => handlePesquisa(e.target.value)}
                aria-label="Pesquisar oportunidades"
              />
              {pesquisa && (
                <button
                  type="button"
                  className="cursos-pesquisa__limpar"
                  onClick={() => { setPesquisa(''); carregar('', filtro); }}
                  aria-label="Limpar pesquisa"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Conteúdo ──────────────────────────────── */}
        <div className="brand-page brand-page--narrow" style={{ paddingTop: 0 }}>

          {/* Filtros de tipo */}
          <div className="cursos-toolbar">
            <div className="cursos-toolbar__info">
              {!carregando && (
                <span>
                  {oportunidades.length} oportunidade{oportunidades.length !== 1 ? 's' : ''}
                  {temFiltros ? ' encontradas' : ' disponíveis'}
                </span>
              )}
            </div>
          </div>

          <div className="comunidade-filtros">
            {FILTROS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`filtro-btn${filtro === item.id ? ' active' : ''}`}
                onClick={() => setFiltro(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Grelha de oportunidades */}
          {carregando ? (
            <div className="oportunidades-grid">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonOportunidade key={i} />)}
            </div>
          ) : oportunidades.length === 0 ? (
            <EstadoVazio temFiltros={!!temFiltros} onLimpar={limparFiltros} />
          ) : (
            <div className="oportunidades-grid">
              {oportunidades.map((oportunidade) => (
                <OportunidadeCard
                  key={oportunidade.id}
                  {...oportunidade}
                  podeInteressar={!estaAutenticado || ehInvestidor}
                  onInteresse={() => {
                    if (estaAutenticado && !ehInvestidor) {
                      toast.aviso('Apenas investidores podem demonstrar interesse.');
                      return;
                    }
                    setModalInt(oportunidade);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* ── Modal de mediação ────────────────────── */}
      <Modal
        aberto={!!modalInt}
        onFechar={() => setModalInt(null)}
        titulo="Solicitar mediação"
        acoes={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => setModalInt(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className={`btn btn--laranja${enviandoInt ? ' btn--loading' : ''}`}
              onClick={demonstrarInteresse}
              disabled={enviandoInt}
            >
              {!enviandoInt && (
                <><ShieldCheck size={14} /> Solicitar mediação</>
              )}
            </button>
          </>
        }
      >
        {modalInt && (
          <div className="negocios-modal-conteudo">
            {/* Resumo da oportunidade */}
            <div className="inscricao-resumo">
              <div className="inscricao-resumo__curso">
                <Building2 size={16} style={{ display: 'inline', marginRight: 6 }} />
                {modalInt.nome_empresa || modalInt.empresa}
              </div>
              <p className="inscricao-resumo__centro">
                {TIPO_OPORTUNIDADE[modalInt.tipo_servico] || modalInt.tipo_servico}
                {' — '}
                {formatAOA(modalInt.valor_solicitado || modalInt.valor_pedido)}
              </p>
            </div>

            {/* Alertas informativos */}
            <div className="negocios-modal-alertas">
              <div className="alert alert--info">
                <ShieldCheck size={16} />
                <span>
                  O interesse será encaminhado primeiro para a equipa
                  administrativa da plataforma.
                </span>
              </div>
              <div className="alert alert--info">
                <AlertCircle size={16} />
                <span>
                  A empresa não recebe os seus contactos nesta fase. O processo
                  segue por mediação formal.
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
