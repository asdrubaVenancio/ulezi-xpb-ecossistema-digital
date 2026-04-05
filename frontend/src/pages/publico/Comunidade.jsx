// ============================================================
// ULEZI XPB — Página de Comunidade
// Networking, serviços empresariais e vagas de emprego públicas
// ============================================================

import {
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Search,
  Users,
  X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Footer from '../../components/layout/Footer.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import { comunidadeAPI } from '../../services/api';
import { truncar } from '../../utils/constants';

// ── Utilitário: gera iniciais para avatar ──────────────────────
function gerarIniciais(nome) {
  if (!nome) return '?';
  const partes = nome.trim().split(' ').filter(Boolean);
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function formatarTempoRestante(dataLimite, agora) {
  if (!dataLimite) return 'Sem prazo';
  const limite = new Date(dataLimite).getTime();
  if (Number.isNaN(limite)) return 'Prazo inválido';
  const diferenca = limite - agora;
  if (diferenca <= 0) return 'Expirada';
  const totalSegundos = Math.floor(diferenca / 1000);
  const dias = Math.floor(totalSegundos / 86400);
  const horas = Math.floor((totalSegundos % 86400) / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  if (dias > 0) return `${dias}d ${horas}h ${minutos}m`;
  if (horas > 0) return `${horas}h ${minutos}m ${segundos}s`;
  return `${minutos}m ${segundos}s`;
}

// Componente Countdown Timer Visual com segundos
function CountdownTimer({ dataLimite, agora }) {
  const limite = new Date(dataLimite).getTime();
  const diferenca = limite - agora;
  
  if (diferenca <= 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '20px 32px',
        background: 'var(--vermelho)',
        borderRadius: 'var(--r-lg)',
        color: 'white',
        fontWeight: 700,
        fontSize: '1.1rem',
      }}>
        <Clock size={20} />
        CANDIDATURAS ENCERRADAS
      </div>
    );
  }
  
  const totalSegundos = Math.floor(diferenca / 1000);
  const dias = Math.floor(totalSegundos / 86400);
  const horas = Math.floor((totalSegundos % 86400) / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  
  const isUrgente = dias === 0 && horas < 24;
  
  const TimeBox = ({ valor, label }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--surface-1)',
      padding: '16px 20px',
      borderRadius: 'var(--r-md)',
      minWidth: 70,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
      border: `2px solid ${isUrgente ? 'var(--laranja)' : 'var(--ciano)'}`,
    }}>
      <span style={{ 
        fontSize: '2rem', 
        fontWeight: 800, 
        color: isUrgente ? 'var(--laranja)' : 'var(--ciano)', 
        lineHeight: 1,
        fontFamily: 'monospace',
        letterSpacing: '2px',
      }}>{String(valor).padStart(2, '0')}</span>
      <span style={{ 
        fontSize: '0.7rem', 
        color: 'var(--txt-3)', 
        textTransform: 'uppercase',
        fontWeight: 600,
        marginTop: 4,
      }}>{label}</span>
    </div>
  );
  
  const Separator = () => (
    <span style={{ 
      fontSize: '2rem', 
      fontWeight: 700, 
      color: 'var(--txt-3)',
      alignSelf: 'center',
      marginTop: -16,
    }}>:</span>
  );
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {dias > 0 && (
          <>
            <TimeBox valor={dias} label="dias" />
            <Separator />
          </>
        )}
        <TimeBox valor={horas} label="horas" />
        <Separator />
        <TimeBox valor={minutos} label="min" />
        <Separator />
        <TimeBox valor={segundos} label="seg" />
      </div>
      <span style={{ 
        fontSize: '0.8rem', 
        color: isUrgente ? 'var(--laranja)' : 'var(--txt-3)',
        fontWeight: 500,
      }}>
        {isUrgente ? '⚠️ Termina em breve!' : 'Tempo restante para candidaturas'}
      </span>
    </div>
  );
}

function paginarLista(lista, pagina, limite) {
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const paginaActual = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (paginaActual - 1) * limite;
  return {
    itens: lista.slice(inicio, inicio + limite),
    total,
    totalPaginas,
    pagina: paginaActual,
  };
}

// ── Skeleton card genérico ─────────────────────────────────────
function SkeletonCard({ altura = 160 }) {
  return (
    <div
      className="card"
      style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div className="skeleton" style={{ height: 20, width: '60%' }} />
      <div className="skeleton" style={{ height: 14, width: '40%' }} />
      <div className="skeleton" style={{ height: altura - 60, borderRadius: 'var(--r-md)' }} />
    </div>
  );
}

// ── Skeleton grid ──────────────────────────────────────────────
function SkeletonGrid({ n = 6, colunas = 3 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))`,
        gap: 20,
      }}
    >
      {Array.from({ length: n }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ── Card de Membro ─────────────────────────────────────────────
const ETIQUETA_TIPO_PERFIL = {
  company: 'Empresa',
  empresa: 'Empresa',
  investor: 'Investidor',
  investidor: 'Investidor',
  student: 'Estudante',
  estudante: 'Estudante',
};

function CardMembro({ membro }) {
  const nome = membro.nome_empresa || membro.nome || 'Utilizador';
  const tipoRaw = membro.tipo || membro.role;
  const papel = membro.role_label || ETIQUETA_TIPO_PERFIL[tipoRaw] || tipoRaw || 'Membro';
  const local = [membro.municipio, membro.provincia].filter(Boolean).join(', ');

  return (
    <div className="comunidade-card" role="article">
      {/* Avatar */}
      <div className="comunidade-card__avatar">
        <span className="comunidade-card__iniciais">{gerarIniciais(nome)}</span>
      </div>

      {/* Corpo */}
      <div className="comunidade-card__corpo">
        <p className="comunidade-card__nome">{nome}</p>

        {/* Badge de tipo */}
        <span className="comunidade-card__badge comunidade-card__badge--membro">
          {papel}
        </span>

        {/* Localização */}
        {local && (
          <p className="comunidade-card__meta">
            <MapPin size={12} />
            {local}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Card de Serviço ────────────────────────────────────────────
function CardServico({ servico }) {
  const nome      = servico.nome_empresa || servico.nome || 'Empresa';
  const sector    = servico.categoria || servico.servico_nome || servico.sector || '';
  const descricao = servico.servico_descricao || servico.descricao || '';
  const email     = servico.contacto_email || servico.email || '';
  const whatsapp  = servico.contacto_whatsapp || servico.telefone || '';

  return (
    <div className="comunidade-card comunidade-card--servico" role="article">
      {/* Ícone da empresa */}
      <div className="comunidade-card__avatar comunidade-card__avatar--empresa">
        <Building2 size={22} />
      </div>

      {/* Corpo */}
      <div className="comunidade-card__corpo">
        <p className="comunidade-card__nome">{nome}</p>

        {sector && (
          <span className="comunidade-card__badge comunidade-card__badge--sector">
            {sector}
          </span>
        )}

        {descricao && (
          <p className="comunidade-card__desc">
            {truncar(descricao, 100)}
          </p>
        )}

        {(email || whatsapp) && (
          <div className="comunidade-card__meta" style={{ marginTop: 8, flexWrap: 'wrap', gap: 10 }}>
            {email && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Mail size={12} /> {email}</span>}
            {whatsapp && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MessageCircle size={12} /> {whatsapp}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card de Vaga ───────────────────────────────────────────────
function CardVaga({ vaga, onVerDetalhes }) {
  const [agoraLocal, setAgoraLocal] = useState(Date.now());
  
  // Atualiza o countdown a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setAgoraLocal(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const titulo   = vaga.titulo || 'Vaga';
  const empresa  = vaga.nome_empresa || '';
  const local    = vaga.localizacao || '';
  const salario  = vaga.salario || '';
  const tipo     = vaga.tipo || '';
  const desc     = vaga.descricao || '';
  const contacto = vaga.contacto || vaga.email || vaga.telefone || '';
  const tempoRestante = formatarTempoRestante(vaga.expires_at, agoraLocal);
  const expirada = tempoRestante === 'Expirada';
  const urgente = !expirada && tempoRestante.includes('d') && parseInt(tempoRestante) <= 3;

  // Calcula valores do countdown em tempo real
  const calcularCountdown = () => {
    if (!vaga.expires_at || expirada) return { dias: 0, horas: 0, minutos: 0, segundos: 0 };
    const limite = new Date(vaga.expires_at).getTime();
    const diferenca = limite - agoraLocal;
    if (diferenca <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0 };
    const totalSegundos = Math.floor(diferenca / 1000);
    return {
      dias: Math.floor(totalSegundos / 86400),
      horas: Math.floor((totalSegundos % 86400) / 3600),
      minutos: Math.floor((totalSegundos % 3600) / 60),
      segundos: totalSegundos % 60
    };
  };
  
  const { dias, horas, minutos, segundos } = calcularCountdown();

  return (
    <div className="comunidade-vaga" role="article" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Badge de urgência no topo */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        padding: '8px 16px',
        background: expirada ? 'var(--vermelho)' : urgente ? 'var(--laranja)' : 'var(--ciano)',
        color: 'white',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottomLeftRadius: 'var(--r-md)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        zIndex: 10,
      }}>
        <Clock size={12} />
        {expirada ? 'Encerrada' : urgente ? 'Termina em breve' : 'Em candidaturas'}
      </div>

      {/* Cabeçalho */}
      <div className="comunidade-vaga__header" style={{ paddingTop: 4 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}>
          <h3 className="comunidade-vaga__titulo" style={{ margin: 0 }}>{titulo}</h3>
          {tipo && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              background: 'var(--ciano-100)',
              color: 'var(--ciano)',
              borderRadius: 'var(--r-sm)',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}>{tipo}</span>
          )}
        </div>
        {empresa && (
          <p className="comunidade-vaga__empresa" style={{ marginTop: 6 }}>
            <Building2 size={13} />
            {empresa}
          </p>
        )}
      </div>

      {/* Descrição */}
      {desc && (
        <p className="comunidade-vaga__desc">{truncar(desc, 120)}</p>
      )}

      {/* Countdown Timer Compacto com Segundos */}
      {!expirada && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '12px 16px',
          margin: '12px 0',
          background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 100%)',
          borderRadius: 'var(--r-md)',
          border: `1px solid ${urgente ? 'var(--laranja-200)' : 'var(--border)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--txt-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Clock size={10} style={{ marginRight: 4, display: 'inline' }} />
              Termina em
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--txt-3)' }}>
              {new Date(vaga.expires_at).toLocaleDateString('pt-PT')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
            {/* Dias */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'var(--surface-1)',
              padding: '6px 10px',
              borderRadius: 'var(--r-sm)',
              minWidth: 45,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: urgente ? 'var(--laranja)' : 'var(--ciano)', lineHeight: 1, fontFamily: 'monospace' }}>{String(dias).padStart(2, '0')}</span>
              <span style={{ fontSize: '0.55rem', color: 'var(--txt-3)', textTransform: 'uppercase' }}>d</span>
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--txt-3)' }}>:</span>
            {/* Horas */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'var(--surface-1)',
              padding: '6px 10px',
              borderRadius: 'var(--r-sm)',
              minWidth: 45,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: urgente ? 'var(--laranja)' : 'var(--ciano)', lineHeight: 1, fontFamily: 'monospace' }}>{String(horas).padStart(2, '0')}</span>
              <span style={{ fontSize: '0.55rem', color: 'var(--txt-3)', textTransform: 'uppercase' }}>h</span>
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--txt-3)' }}>:</span>
            {/* Minutos */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'var(--surface-1)',
              padding: '6px 10px',
              borderRadius: 'var(--r-sm)',
              minWidth: 45,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: urgente ? 'var(--laranja)' : 'var(--ciano)', lineHeight: 1, fontFamily: 'monospace' }}>{String(minutos).padStart(2, '0')}</span>
              <span style={{ fontSize: '0.55rem', color: 'var(--txt-3)', textTransform: 'uppercase' }}>m</span>
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--txt-3)' }}>:</span>
            {/* Segundos */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: urgente ? 'var(--laranja-100)' : 'var(--surface-1)',
              padding: '6px 10px',
              borderRadius: 'var(--r-sm)',
              minWidth: 45,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              border: urgente ? '1px solid var(--laranja)' : 'none',
            }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: urgente ? 'var(--laranja)' : 'var(--ciano)', lineHeight: 1, fontFamily: 'monospace' }}>{String(segundos).padStart(2, '0')}</span>
              <span style={{ fontSize: '0.55rem', color: 'var(--txt-3)', textTransform: 'uppercase' }}>s</span>
            </div>
          </div>
        </div>
      )}

      {/* Meta: localização, salário, contacto */}
      <div className="comunidade-vaga__meta" style={{ marginTop: 'auto' }}>
        {local && (
          <span>
            <MapPin size={12} /> {local}
          </span>
        )}
        {salario && (
          <span className="comunidade-vaga__salario">
            <DollarSign size={12} /> {salario}
          </span>
        )}
        {contacto && (
          <span>
            <MessageCircle size={12} /> {contacto}
          </span>
        )}
      </div>

      {/* Botão Ver Detalhes */}
      <button
        onClick={() => onVerDetalhes(vaga)}
        style={{
          marginTop: 16,
          padding: '10px 16px',
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          color: 'var(--txt-1)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
          width: '100%',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'var(--surface-2)';
          e.target.style.borderColor = 'var(--ciano)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'var(--surface-1)';
          e.target.style.borderColor = 'var(--border)';
        }}
      >
        <ExternalLink size={14} />
        Ver detalhes completos
      </button>
    </div>
  );
}

// ── Caixa de pesquisa reutilizável ─────────────────────────────
function CaixaPesquisa({ valor, onChange, placeholder }) {
  return (
    <div className="comunidade-search">
      <Search size={16} className="comunidade-search__icon" />
      <input
        type="search"
        className="comunidade-search__input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {valor && (
        <button
          type="button"
          className="comunidade-search__limpar"
          onClick={() => onChange('')}
          aria-label="Limpar pesquisa"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ── Estado vazio ───────────────────────────────────────────────
function EstadoVazio({ icone, titulo, descricao }) {
  return (
    <div className="comunidade-vazio">
      <div className="comunidade-vazio__icone">{icone}</div>
      <p className="comunidade-vazio__titulo">{titulo}</p>
      <p className="comunidade-vazio__desc">{descricao}</p>
    </div>
  );
}

function Paginacao({ pagina, totalPaginas, total, onChange }) {
  if (totalPaginas <= 1) return null;

  const inicio = Math.max(1, pagina - 2);
  const fim = Math.min(totalPaginas, inicio + 4);
  const paginas = [];
  for (let numero = inicio; numero <= fim; numero += 1) paginas.push(numero);

  return (
    <div className="comunidade-paginacao">
      <span className="comunidade-paginacao__info">{total} registo{total !== 1 ? 's' : ''}</span>
      <div className="comunidade-paginacao__acoes">
        <button type="button" className="btn btn--secondary btn--sm" disabled={pagina <= 1} onClick={() => onChange(pagina - 1)}>
          <ChevronLeft size={14} /> Anterior
        </button>
        {paginas.map((numero) => (
          <button
            type="button"
            key={numero}
            className={`btn btn--sm ${numero === pagina ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => onChange(numero)}
          >
            {numero}
          </button>
        ))}
        <button type="button" className="btn btn--secondary btn--sm" disabled={pagina >= totalPaginas} onClick={() => onChange(pagina + 1)}>
          Próxima <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────
export default function Comunidade() {
  // Estados de aba activa
  const [aba, setAba] = useState('membros');

  // Dados
  const [membros,   setMembros]   = useState([]);
  const [servicos,  setServicos]  = useState([]);
  const [vagas,     setVagas]     = useState([]);
  const [categorias, setCategorias] = useState([]);

  // UI
  const [carregando,  setCarregando]  = useState(false);
  const [pesquisa,    setPesquisa]    = useState('');
  const [categoria,   setCategoria]   = useState('');
  const [agora,       setAgora]       = useState(Date.now());
  const [paginaMembros, setPaginaMembros] = useState(1);
  const [paginaServicos, setPaginaServicos] = useState(1);
  const [paginaVagas, setPaginaVagas] = useState(1);
  const [metaMembros, setMetaMembros] = useState({ total: 0, page: 1, limit: 9, totalPaginas: 1 });
  const [metaVagas, setMetaVagas] = useState({ total: 0, page: 1, limit: 6, totalPaginas: 1 });
  const [modalVagaDetalhes, setModalVagaDetalhes] = useState(null); // Vaga selecionada para ver detalhes

  useEffect(() => {
    const timer = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // ── Loaders ────────────────────────────────────────────────
  const carregarMembros = useCallback(async (pagina = 1) => {
    setCarregando(true);
    try {
      const { data } = await comunidadeAPI.perfis({ page: pagina, limit: metaMembros.limit, pesquisa: pesquisa || undefined });
      // Backend devolve { profiles, total, page } — não usar só `perfis`
      const d = data.dados ?? data.data ?? {};
      const lista = Array.isArray(d.profiles)
        ? d.profiles
        : Array.isArray(d.perfis)
          ? d.perfis
          : Array.isArray(d)
            ? d
            : [];
      setMembros(lista);
      const total = Number(d.total || lista.length || 0);
      const limite = Number(d.limit || metaMembros.limit || 9);
      const paginaActual = Number(d.page || pagina || 1);
      setMetaMembros({
        total,
        page: paginaActual,
        limit: limite,
        totalPaginas: Math.max(1, Math.ceil(total / limite)),
      });
    } catch {
      setMembros([]);
      setMetaMembros((prev) => ({ ...prev, total: 0, page: pagina, totalPaginas: 1 }));
    } finally {
      setCarregando(false);
    }
  }, [metaMembros.limit, pesquisa]);

  const carregarCategorias = useCallback(async () => {
    try {
      const { data } = await comunidadeAPI.categServicos();
      const lista = data.dados?.categorias || data.dados || [];
      setCategorias(Array.isArray(lista) ? lista : []);
    } catch {
      setCategorias([]);
    }
  }, []);

  const carregarServicos = useCallback(async (cat = '') => {
    setCarregando(true);
    try {
      const { data } = await comunidadeAPI.servicos({ categoria: cat || undefined, pesquisa: pesquisa || undefined });
      const lista = data.dados?.servicos || data.dados || [];
      setServicos(Array.isArray(lista) ? lista : []);
    } catch {
      setServicos([]);
    } finally {
      setCarregando(false);
    }
  }, [pesquisa]);

  const carregarVagas = useCallback(async (pagina = 1) => {
    setCarregando(true);
    try {
      const { data } = await comunidadeAPI.vagas({ page: pagina, limit: metaVagas.limit, pesquisa: pesquisa || undefined });
      const lista = data.dados?.vagas || data.dados || [];
      setVagas(Array.isArray(lista) ? lista : []);
      const total = Number(data.dados?.total || lista.length || 0);
      const limite = Number(data.dados?.limit || metaVagas.limit || 6);
      const paginaActual = Number(data.dados?.page || pagina || 1);
      setMetaVagas({
        total,
        page: paginaActual,
        limit: limite,
        totalPaginas: Math.max(1, Math.ceil(total / limite)),
      });
    } catch {
      setVagas([]);
      setMetaVagas((prev) => ({ ...prev, total: 0, page: pagina, totalPaginas: 1 }));
    } finally {
      setCarregando(false);
    }
  }, [metaVagas.limit, pesquisa]);

  // Carregar dados quando muda a aba
  useEffect(() => {
    setPesquisa('');
    setCategoria('');
    setPaginaMembros(1);
    setPaginaServicos(1);
    setPaginaVagas(1);
    if (aba === 'membros')  carregarMembros(1);
    if (aba === 'servicos') { carregarCategorias(); carregarServicos(''); }
    if (aba === 'vagas')    carregarVagas(1);
  }, [aba]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recarregar serviços quando muda categoria
  useEffect(() => {
    if (aba === 'servicos') carregarServicos(categoria);
  }, [categoria, aba, carregarServicos]);

  useEffect(() => {
    if (aba === 'servicos') setPaginaServicos(1);
  }, [categoria, pesquisa, aba]);

  useEffect(() => {
    if (aba === 'membros') carregarMembros(paginaMembros);
  }, [paginaMembros, aba, carregarMembros]);

  useEffect(() => {
    if (aba === 'vagas') carregarVagas(paginaVagas);
  }, [paginaVagas, aba, carregarVagas]);

  useEffect(() => {
    if (aba === 'membros') setPaginaMembros(1);
    if (aba === 'vagas') setPaginaVagas(1);
  }, [pesquisa, aba]);

  // ── Filtragem local por pesquisa ───────────────────────────
  const membrosFiltrados = useMemo(() => {
    if (!pesquisa.trim()) return membros;
    const t = pesquisa.toLowerCase();
    return membros.filter((m) => {
      const nome = (m.nome_empresa || m.nome || '').toLowerCase();
      const prov = (m.provincia || '').toLowerCase();
      return nome.includes(t) || prov.includes(t);
    });
  }, [membros, pesquisa]);

  const servicosFiltrados = useMemo(() => {
    if (!pesquisa.trim()) return servicos;
    const t = pesquisa.toLowerCase();
    return servicos.filter((s) => {
      const nome = (s.nome_empresa || s.nome || '').toLowerCase();
      const desc = (s.descricao || '').toLowerCase();
      return nome.includes(t) || desc.includes(t);
    });
  }, [servicos, pesquisa]);

  const vagasFiltradas = useMemo(() => {
    const agoraTimestamp = Date.now();
    // Filtrar apenas vagas ativas (dentro do período de candidaturas)
    let ativas = vagas.filter((v) => {
      // Verificar se a vaga tem data de início e se já começou
      if (v.starts_at) {
        const inicio = new Date(v.starts_at).getTime();
        if (inicio > agoraTimestamp) return false; // Ainda não começou
      }
      // Verificar se a vaga tem data de fim e se já expirou
      if (v.expires_at) {
        const fim = new Date(v.expires_at).getTime();
        if (fim <= agoraTimestamp) return false; // Já expirou
      }
      return true; // Vaga ativa
    });
    
    if (!pesquisa.trim()) return ativas;
    const t = pesquisa.toLowerCase();
    return ativas.filter((v) => {
      const titulo   = (v.titulo || '').toLowerCase();
      const empresa  = (v.nome_empresa || '').toLowerCase();
      const local    = (v.localizacao || '').toLowerCase();
      return titulo.includes(t) || empresa.includes(t) || local.includes(t);
    });
  }, [vagas, pesquisa]);

  const servicosPaginados = useMemo(
    () => paginarLista(servicosFiltrados, paginaServicos, 9),
    [servicosFiltrados, paginaServicos]
  );

  // ── Abas com contadores ────────────────────────────────────
  const abas = [
    { id: 'membros',  label: 'Membros',  icone: <Users size={15} />,     count: membros.length },
    { id: 'servicos', label: 'Serviços', icone: <Building2 size={15} />, count: servicos.length },
    { id: 'vagas',    label: 'Vagas',    icone: <Briefcase size={15} />, count: vagas.length },
  ];

  // ── Conteúdo por aba ───────────────────────────────────────
  const renderConteudo = () => {
    if (aba === 'membros') {
      if (carregando) return <SkeletonGrid n={6} colunas={3} />;
      if (!membrosFiltrados.length) {
        return (
          <EstadoVazio
            icone={<Users size={32} />}
            titulo={pesquisa ? 'Nenhum membro encontrado' : 'Sem membros públicos'}
            descricao={pesquisa ? 'Tente um termo de pesquisa diferente.' : 'Os membros com perfil público aparecerão aqui.'}
          />
        );
      }
      return (
        <>
          <div className="comunidade-grid">
            {membrosFiltrados.map((m, i) => (
              <CardMembro key={m.id || i} membro={m} />
            ))}
          </div>
          <Paginacao
            pagina={metaMembros.page}
            totalPaginas={metaMembros.totalPaginas}
            total={metaMembros.total}
            onChange={setPaginaMembros}
          />
        </>
      );
    }

    if (aba === 'servicos') {
      return (
        <>
          {/* Filtro de categoria */}
          {categorias.length > 0 && (
            <div className="comunidade-filtros">
              <button
                type="button"
                className={`filtro-btn${categoria === '' ? ' active' : ''}`}
                onClick={() => setCategoria('')}
              >
                Todas
              </button>
              {categorias.map((cat) => {
                const val = cat.id || cat.nome || String(cat);
                const label = cat.nome || String(cat);
                return (
                  <button
                    type="button"
                    key={val}
                    className={`filtro-btn${categoria === val ? ' active' : ''}`}
                    onClick={() => setCategoria(val)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {carregando ? <SkeletonGrid n={6} colunas={3} /> : !servicosFiltrados.length ? (
            <EstadoVazio
              icone={<Building2 size={32} />}
              titulo="Nenhum serviço encontrado"
              descricao="Tente outra categoria ou pesquisa."
            />
          ) : (
            <>
              <div className="comunidade-grid">
                {servicosPaginados.itens.map((s, i) => (
                  <CardServico key={s.id || i} servico={s} />
                ))}
              </div>
              <Paginacao
                pagina={servicosPaginados.pagina}
                totalPaginas={servicosPaginados.totalPaginas}
                total={servicosPaginados.total}
                onChange={setPaginaServicos}
              />
            </>
          )}
        </>
      );
    }

    if (aba === 'vagas') {
      if (carregando) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} altura={120} />)}
        </div>
      );
      if (!vagasFiltradas.length) {
        return (
          <EstadoVazio
            icone={<Briefcase size={32} />}
            titulo={pesquisa ? 'Nenhuma vaga encontrada' : 'Sem vagas disponíveis'}
            descricao={pesquisa ? 'Tente um termo diferente.' : 'As vagas aprovadas aparecem aqui.'}
          />
        );
      }
      return (
        <>
          <div className="comunidade-vagas-lista">
            {vagasFiltradas.map((v, i) => (
              <CardVaga key={v.id || i} vaga={v} onVerDetalhes={setModalVagaDetalhes} />
            ))}
          </div>
          <Paginacao
            pagina={metaVagas.page}
            totalPaginas={metaVagas.totalPaginas}
            total={metaVagas.total}
            onChange={setPaginaVagas}
          />
        </>
      );
    }

    return null;
  };

  // ── Placeholder de pesquisa por aba ───────────────────────
  const placeholders = {
    membros:  'Pesquisar membros...',
    servicos: 'Pesquisar serviços...',
    vagas:    'Pesquisar vagas ou empresas...',
  };

  return (
    <div className="publico-layout">
      <Navbar />

      <main className="publico-main">
        {/* ── Hero compacto ─────────────────────────────── */}
        <section className="comunidade-hero">
          <div className="comunidade-hero__inner">
            <span className="comunidade-hero__kicker">
              <Users size={14} /> Ecossistema ULEZI XPB
            </span>
            <h1 className="comunidade-hero__titulo">
              Comunidade de Negócios
            </h1>
            <p className="comunidade-hero__desc">
              Conecte-se com membros, descubra serviços empresariais e encontre oportunidades de emprego.
            </p>
          </div>
        </section>

        {/* ── Área principal ────────────────────────────── */}
        <div className="brand-page brand-page--narrow" style={{ paddingTop: 0 }}>
          {/* Abas */}
          <div className="comunidade-tabs-bar">
            <div className="comunidade-tabs">
              {abas.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className={`comunidade-tab${aba === a.id ? ' comunidade-tab--activa' : ''}`}
                  onClick={() => setAba(a.id)}
                  role="tab"
                  aria-selected={aba === a.id}
                >
                  {a.icone}
                  <span>{a.label}</span>
                  {a.count > 0 && (
                    <span className={`comunidade-tab__count${aba === a.id ? ' comunidade-tab__count--activa' : ''}`}>
                      {a.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Pesquisa */}
            <CaixaPesquisa
              valor={pesquisa}
              onChange={setPesquisa}
              placeholder={placeholders[aba]}
            />
          </div>

          {/* Conteúdo */}
          <div className="comunidade-conteudo">
            {renderConteudo()}
          </div>
        </div>
      </main>

      {/* Modal de Detalhes da Vaga */}
      {modalVagaDetalhes && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setModalVagaDetalhes(null)}
        >
          <div 
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--r-lg)',
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '24px 24px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  background: 'var(--ciano-100)',
                  color: 'var(--ciano)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}>
                  <Briefcase size={12} />
                  {modalVagaDetalhes.tipo || 'Efetivo'}
                </div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--txt-1)',
                  margin: 0,
                }}>
                  {modalVagaDetalhes.titulo}
                </h2>
                {modalVagaDetalhes.nome_empresa && (
                  <p style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--txt-2)',
                    fontSize: '0.95rem',
                    margin: '8px 0 0',
                  }}>
                    <Building2 size={16} />
                    {modalVagaDetalhes.nome_empresa}
                  </p>
                )}
              </div>
              <button
                onClick={() => setModalVagaDetalhes(null)}
                style={{
                  padding: 8,
                  background: 'var(--surface-2)',
                  border: 'none',
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Countdown Timer em Tempo Real */}
            <div style={{
              padding: '24px',
              background: 'var(--surface-2)',
              margin: '24px',
              borderRadius: 'var(--r-lg)',
              border: '1px solid var(--border)',
            }}>
              <CountdownTimer dataLimite={modalVagaDetalhes.expires_at} agora={agora} />
            </div>

            {/* Detalhes */}
            <div style={{ padding: '0 24px' }}>
              {/* Descrição */}
              {modalVagaDetalhes.descricao && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--txt-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 8,
                  }}>Descrição</h4>
                  <p style={{
                    color: 'var(--txt-2)',
                    lineHeight: 1.6,
                    fontSize: '0.95rem',
                  }}>{modalVagaDetalhes.descricao}</p>
                </div>
              )}

              {/* Requisitos */}
              {modalVagaDetalhes.requisitos && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--txt-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 8,
                  }}>Requisitos</h4>
                  <p style={{
                    color: 'var(--txt-2)',
                    lineHeight: 1.6,
                    fontSize: '0.95rem',
                  }}>{modalVagaDetalhes.requisitos}</p>
                </div>
              )}

              {/* Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginBottom: 24,
              }}>
                {modalVagaDetalhes.localizacao && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-md)',
                  }}>
                    <MapPin size={18} color="var(--ciano)" />
                    <div>
                      <span style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: 'var(--txt-3)',
                        textTransform: 'uppercase',
                      }}>Localização</span>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: 'var(--txt-1)',
                      }}>{modalVagaDetalhes.localizacao}</span>
                    </div>
                  </div>
                )}
                {modalVagaDetalhes.salario && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-md)',
                  }}>
                    <DollarSign size={18} color="var(--verde)" />
                    <div>
                      <span style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: 'var(--txt-3)',
                        textTransform: 'uppercase',
                      }}>Salário</span>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: 'var(--txt-1)',
                      }}>{modalVagaDetalhes.salario}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Período de Candidaturas */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'var(--surface-1)',
                border: '1px solid var(--ciano)',
                borderRadius: 'var(--r-md)',
                marginBottom: 24,
              }}>
                <Clock size={18} color="var(--ciano)" />
                <div>
                  <span style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    color: 'var(--txt-3)',
                    textTransform: 'uppercase',
                  }}>Período de candidaturas</span>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'var(--txt-1)',
                  }}>
                    {modalVagaDetalhes.starts_at 
                      ? `De ${new Date(modalVagaDetalhes.starts_at).toLocaleDateString('pt-PT')} até ${new Date(modalVagaDetalhes.expires_at).toLocaleDateString('pt-PT')}`
                      : `Até ${new Date(modalVagaDetalhes.expires_at).toLocaleDateString('pt-PT')}`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Footer com Contacto */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}>
              {(modalVagaDetalhes.contacto || modalVagaDetalhes.email) && (
                <a
                  href={`mailto:${modalVagaDetalhes.email || modalVagaDetalhes.contacto}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: 'var(--ciano)',
                    color: 'white',
                    borderRadius: 'var(--r-md)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  <Mail size={16} />
                  Candidatar por email
                </a>
              )}
              {modalVagaDetalhes.telefone && (
                <a
                  href={`https://wa.me/${modalVagaDetalhes.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: 'var(--verde)',
                    color: 'white',
                    borderRadius: 'var(--r-md)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  <MessageCircle size={16} />
                  Contactar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
