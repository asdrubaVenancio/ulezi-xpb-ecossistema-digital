// ============================================================
// ULEZI XPB â€” Mercado de Investimentos (NegÃ³cios)
// Dados reais do backend â€” modal de interesse â€” validaÃ§Ã£o
// ============================================================
// 
// @author AsdrubaDeveloper
// @version 1.0.0

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Building2, CheckCircle, TrendingUp, ArrowRight, X, AlertCircle, ShieldCheck } from 'lucide-react';
import { negociosAPI, extrairErro } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { formatAOA, TIPO_OPORTUNIDADE } from '../../utils/constants';
import { PageLoader, Modal, BadgeStatus } from '../../components/ui/index.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import Footer from '../../components/layout/Footer.jsx';

const FILTROS = [
  { id: '',                   label: 'Todos' },
  { id: 'venda_participacao', label: 'ParticipaÃ§Ã£o SocietÃ¡ria' },
  { id: 'emprestimo',         label: 'EmprÃ©stimo' },
  { id: 'franquia',           label: 'Franquia' },
  { id: 'venda_empresa',      label: 'Venda da Empresa' },
  { id: 'licenciamento_marca',label: 'Licenciamento' },
];

export default function Negocios() {
  const { estaAutenticado, ehInvestidor } = useAuth();
  const toast = useToast();
  const [oportunidades, setOportunidades] = useState([]);
  const [carregando,    setCarregando]    = useState(true);
  const [pesquisa,      setPesquisa]      = useState('');
  const [filtro,        setFiltro]        = useState('');
  const [modalInt,      setModalInt]      = useState(null); // oportunidade seleccionada
  const [enviandoInt,   setEnviandoInt]   = useState(false);
  const timer = useRef(null);

  const carregar = useCallback(async (p = '', f = '') => {
    setCarregando(true);
    try {
      const params = {};
      if (p) params.pesquisa = p;
      if (f) params.tipo     = f;
      const { data } = await negociosAPI.oportunidades(params);
      // Backend: { sucesso, dados: { oportunidades } } ou array directo
      setOportunidades(data.dados?.oportunidades || data.dados || []);
    } catch (e) {
      toast.erro('Erro ao carregar oportunidades: ' + extrairErro(e));
    } finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(pesquisa, filtro); }, [filtro]);

  const handlePesquisa = (v) => {
    setPesquisa(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => carregar(v, filtro), 400);
  };

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
      setOportunidades((actual) => actual.filter((item) => item.id !== modalInt.id));
      setModalInt(null);
      toast.sucesso('Interesse registado. A equipa administrativa fara a mediacao do processo.');
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setEnviandoInt(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '40px 24px', maxWidth: 1100, margin: '0 auto', width: '100%', background: 'var(--bg)' }}>

        {/* CabeÃ§alho */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, marginBottom: 6 }}>
            Mercado de Investimentos
          </h1>
          <p style={{ color: 'var(--txt-3)' }}>
            Analise oportunidades de investimento em empresas verificadas e seguras.
          </p>
        </div>

        {/* Pesquisa + filtros */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="form-input-wrapper" style={{ flex: 1, minWidth: 200, maxWidth: 320 }}>
            <Search size={16} />
            <input
              type="text"
              className="form-input form-input--icon"
              placeholder="Pesquisar empresas..."
              value={pesquisa}
              onChange={e => handlePesquisa(e.target.value)}
            />
          </div>
          <div className="filtros-bar" style={{ margin: 0, flex: 1 }}>
            {FILTROS.map(f => (
              <button
                key={f.id}
                className={`filtro-btn${filtro === f.id ? ' active' : ''}`}
                onClick={() => setFiltro(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ConteÃºdo */}
        {carregando ? (
          <PageLoader />
        ) : oportunidades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--txt-3)' }}>
            <TrendingUp size={56} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>Nenhuma oportunidade encontrada</p>
            <p style={{ fontSize: '0.875rem', marginTop: 6 }}>Tente ajustar os filtros de pesquisa</p>
          </div>
        ) : (
          <div className="oportunidades-grid">
            {oportunidades.map(o => (
              <OportunidadeCard
                key={o.id}
                {...o}
                podeInteressar={!estaAutenticado || ehInvestidor}
                onInteresse={() => {
                  if (estaAutenticado && !ehInvestidor) {
                    toast.aviso('Apenas investidores podem demonstrar interesse nas oportunidades.');
                    return;
                  }
                  setModalInt(o);
                }}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />

      {/* Modal de interesse */}
      <Modal
        aberto={!!modalInt}
        onFechar={() => setModalInt(null)}
        titulo="Solicitar Mediação"
        acoes={<>
          <button className="btn btn--secondary" onClick={() => setModalInt(null)}>Cancelar</button>
          <button
            className={`btn btn--laranja${enviandoInt ? ' btn--loading' : ''}`}
            onClick={demonstrarInteresse}
            disabled={enviandoInt}
          >
            {!enviandoInt && <><ShieldCheck size={14} /> Solicitar mediação</>}
          </button>
        </>}
      >
        {modalInt && (
          <div>
            {/* Info da oportunidade */}
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Building2 size={16} color="var(--txt-3)" />
                <span style={{ fontWeight: 700 }}>{modalInt.nome_empresa || modalInt.empresa}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--txt-3)' }}>
                {TIPO_OPORTUNIDADE[modalInt.tipo_servico] || modalInt.tipo_servico} Â· {formatAOA(modalInt.valor_solicitado || modalInt.valor_pedido)}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="alert alert--info">
                <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem' }}>
                  O seu interesse sera encaminhado primeiro para a equipa administrativa da plataforma.
                </span>
              </div>

              <div className="alert alert--info">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem' }}>
                  A empresa nao recebera os seus contactos nesta fase. Um administrador ou funcionario responsavel fara a triagem, coordenara a mediacao e agendara a reuniao quando houver avancos.
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// â”€â”€ Card de oportunidade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OportunidadeCard({ tipo_servico, nome_empresa, titulo, descricao, valor_solicitado, valor_pedido, retorno_estimado, verificada, status, podeInteressar, onInteresse }) {
  const labelTipo = TIPO_OPORTUNIDADE[tipo_servico] || tipo_servico || 'â€”';

  // Cor por tipo
  const COR_TIPO = {
    venda_participacao:  '#F97316',
    emprestimo:          '#00BCD4',
    franquia:            '#8B5CF6',
    venda_empresa:       '#EF4444',
    licenciamento_marca: '#22C55E',
  };
  const cor = COR_TIPO[tipo_servico] || '#F97316';

  return (
    <div className="oportunidade-card">
      {/* Tipo + verificada */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: cor }}>
          {labelTipo}
        </span>
        {verificada && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--verde)', fontWeight: 600 }}>
            <CheckCircle size={13} /> Verificada
          </span>
        )}
      </div>

      {/* Empresa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={14} color="var(--txt-3)" />
        </div>
        <span style={{ fontWeight: 700, color: 'var(--txt-1)', fontSize: '0.95rem' }}>
          {nome_empresa || 'â€”'}
        </span>
      </div>

      {/* TÃ­tulo */}
      {titulo && <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>{titulo}</p>}

      {/* DescriÃ§Ã£o */}
      <p style={{ fontSize: '0.83rem', color: 'var(--txt-3)', marginBottom: 16, lineHeight: 1.6 }}>
        {descricao || 'Sem descriÃ§Ã£o disponÃ­vel.'}
      </p>

      {/* RodapÃ© */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            Investimento
          </p>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--txt-1)' }}>
            {formatAOA(valor_solicitado || valor_pedido)}
          </div>
          {retorno_estimado && (
            <div style={{ fontSize: '0.75rem', color: 'var(--verde)', fontWeight: 600, marginTop: 2 }}>
              â†’ {retorno_estimado}
            </div>
          )}
        </div>
        <button
          className="btn btn--laranja btn--sm"
          onClick={onInteresse}
          disabled={!podeInteressar || (status && !['ativa', 'publicada', 'em_analise'].includes(status))}
        >
          Analisar <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

