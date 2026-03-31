// ============================================================
// ULEZI XPB — Dashboard Administrativo
// Dados 100% do backend real — toast integrado — validações
// ============================================================

import {
    Bell,
    BookOpen,
    Briefcase,
    Building2,
    Check,
    CheckCircle,
    CreditCard,
    Eye,
    FileText,
    Folder,
    Menu,
    Moon,
    Plus,
    RefreshCw,
    Save,
    Search,
    Settings,
    Shield,
    Sun,
    Users,
    X
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import GestaoCoordenadasBancarias from '../../components/admin/GestaoCoordenadasBancarias.jsx';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { useToast } from '../../components/ui/Toast';
import {
    BadgeStatus,
    EmptyState,
    Modal, PageLoader
} from '../../components/ui/index.jsx';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, authAPI, extrairErro, pagamentosAPI } from '../../services/api';
import { formatAOA, formatData, iniciais } from '../../utils/constants';
import CentrosFormacao from './CentrosFormacao.jsx';
import InscricoesAdmin from './InscricoesAdmin.jsx';
import OfertasCursos from './OfertasCursos.jsx';

const BACKEND_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

// ── Secções disponíveis ──────────────────────────────────────
const SECOES = {
  painel:        PainelGeral,
  notificacoes:  NotificacoesReal,
  utilizadores:  Utilizadores,
  cursos:        Cursos,
  centros:       CentrosFormacao,
  ofertas:       OfertasCursos,
  inscricoes:    InscricoesAdmin,
  empresas:      EmpresasRevisao,
  investimentos: Investimentos,
  pagamentos:    Pagamentos,
  contratos:     ContratosReal,
  vagas:         VagasEmpresa,
  ficheiros:     Ficheiros,
  seguranca:     Seguranca,
  configuracoes: Configuracoes,
};

// ════════════════════════════════════════════════════════════
// LAYOUT PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function DashboardAdmin() {
  const { tema, alternarTema } = useAuth();
  const [secaoActiva,   setSecaoActiva]   = useState('painel');
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [notifCount,    setNotifCount]    = useState(0);

  const SecaoActual = SECOES[secaoActiva] || PainelGeral;

  useEffect(() => {
    adminAPI.notificacoes()
      .then(({ data }) => {
        const dados = data.dados || {};
        const lista = dados.notificacoes || dados || [];
        const naoLidas = typeof dados.nao_lidas === 'number'
          ? dados.nao_lidas
          : lista.filter((item) => !item.lida).length;
        setNotifCount(naoLidas);
      })
      .catch(() => setNotifCount(0));
  }, [secaoActiva]);

  return (
    <div className="admin-layout">
      <Sidebar
        secaoActiva={secaoActiva}
        onNavegar={setSecaoActiva}
        notifCount={notifCount}
        aberta={sidebarAberta}
        onFechar={() => setSidebarAberta(false)}
      />

      <main className="admin-main">
        <header className="admin-topbar">
          <button id="sidebar-toggle" className="admin-topbar__icon-btn"
            onClick={() => setSidebarAberta(a => !a)} aria-label="Menu">
            <Menu size={20} />
          </button>

          <div className="admin-topbar__search">
            <Search size={16} />
            <input placeholder="Pesquisar no sistema..." aria-label="Pesquisa" />
          </div>

          <div className="admin-topbar__right">
            <button className="admin-topbar__icon-btn" onClick={alternarTema} aria-label="Tema">
              {tema === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
            </button>
            <button className="admin-topbar__icon-btn"
              onClick={() => setSecaoActiva('notificacoes')} aria-label="Notificações">
              <Bell size={18}/>
              {notifCount > 0 && <span className="admin-topbar__notif-count">{notifCount}</span>}
            </button>
          </div>
        </header>

        <div className="admin-page">
          <SecaoActual onNavegar={setSecaoActiva} setNotifCount={setNotifCount} />
        </div>
      </main>

      <style>{`@media(max-width:768px){#sidebar-toggle{display:flex!important}}`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAINEL GERAL — dados reais
// ════════════════════════════════════════════════════════════
function PainelGeral({ onNavegar }) {
  const [stats,       setStats]       = useState(null);
  const [empresasPend, setEmpresasPend] = useState([]);
  const [inscricoesPend, setInscricoesPend] = useState([]);
  const [carregando,  setCarregando]   = useState(true);
  const toast = useToast();

  const carregar = useCallback(async () => {
    try {
      const [sRes, eRes, iRes] = await Promise.all([
        adminAPI.stats(),
        adminAPI.empresas({ status: 'pendente', limite: 5 }),
        adminAPI.inscricoes({ status: 'pendente', limite: 5 }),
      ]);
      // O backend retorna { dados: { stats: {...}, recent_enrollments: [...] } }
      const dadosStats = sRes.data.dados?.stats || sRes.data.dados || {};
      setStats(dadosStats);
      setEmpresasPend(eRes.data.dados?.empresas || []);
      setInscricoesPend(iRes.data.dados?.slice(0, 5) || []);
    } catch (e) {
      toast.erro('Erro ao carregar estatísticas: ' + extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  if (carregando) return <PageLoader />;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Painel Geral</h1>
          <p className="page-header__sub">Visão geral do ecossistema ULEZI XPB</p>
        </div>
        <button className="btn btn--secondary btn--sm" onClick={carregar}>
          <RefreshCw size={14}/> Actualizar
        </button>
      </div>

      {/* Stat cards — campos reais do backend */}
      <div className="stats-grid">
        <StatCard icone={<Users size={20} color="var(--ciano)"/>}      label="Utilizadores"   valor={stats?.total_utilizadores?.toLocaleString('pt-AO') || '0'} variacao={null} cor="var(--ciano-100)"   />
        <StatCard icone={<BookOpen size={20} color="var(--laranja)"/>}  label="Inscrições"     valor={stats?.total_inscricoes?.toLocaleString('pt-AO') || '0'}    variacao={null} cor="var(--laranja-100)" />
        <StatCard icone={<Building2 size={20} color="var(--verde)"/>}   label="Empresas"       valor={stats?.total_empresas?.toLocaleString('pt-AO') || '0'}       variacao={null} cor="var(--verde-100)"   />
        <StatCard icone={<CreditCard size={20} color="var(--vermelho)"/>} label="Pag. Pendentes" valor={stats?.pagamentos_pendentes?.toLocaleString('pt-AO') || '0'}  variacao={null} cor="var(--vermelho-100)" alerta={stats?.pagamentos_pendentes > 0} />
      </div>

      <div className="dashboard-summary-grid">
        {/* Linha de actividade real */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Resumo do Sistema</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)', marginBottom: 20 }}>Estado actual do ecossistema</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Oportunidades activas', valor: stats?.total_oportunidades || 0, cor: 'var(--ciano)' },
              { label: 'Vagas em aberto',        valor: stats?.total_vagas         || 0, cor: 'var(--verde)' },
              { label: 'Empresas pendentes',     valor: stats?.empresas_pendentes  || 0, cor: 'var(--amarelo)', alerta: true },
              { label: 'Op. em análise',         valor: stats?.oportunidades_pendentes || 0, cor: 'var(--roxo)' },
            ].map(item => (
              <div key={item.label} style={{
                padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
                background: 'var(--bg-input)',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: item.alerta && item.valor > 0 ? 'var(--amarelo)' : item.cor }}>
                  {item.valor}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--txt-3)', marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Aprovações Pendentes - Empresas e Inscrições */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>Aprovações Pendentes</h2>
            <span className="badge badge--amarelo">
              {empresasPend.length + inscricoesPend.length} pendentes
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)', marginBottom: 16 }}>
            Empresas e inscrições aguardando validação
          </p>
          
          {/* Inscrições Pendentes */}
          {inscricoesPend.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Inscrições ({inscricoesPend.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {inscricoesPend.map(i => (
                  <div key={i.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 10, background: 'var(--bg-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{i.nome_aluno}</span>
                      <span className="badge badge--amarelo" style={{ fontSize: '0.7rem' }}>Inscrição</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)', marginBottom: 6 }}>
                      {i.nome_curso} · {formatData(i.created_at)}
                    </p>
                    <button className="btn btn--primary btn--sm btn--full" onClick={() => onNavegar?.('inscricoes')}>
                      Analisar Inscrição
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Empresas Pendentes */}
          {empresasPend.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Empresas ({empresasPend.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {empresasPend.map(e => (
                  <div key={e.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{e.nome_empresa}</span>
                      <span className="badge badge--amarelo" style={{ fontSize: '0.7rem' }}>Empresa</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)', marginBottom: 6 }}>
                      {formatData(e.criado_em)} · {e.num_documentos} docs
                    </p>
                    <button className="btn btn--primary btn--sm btn--full" onClick={() => onNavegar?.('empresas')}>
                      Analisar Empresa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {empresasPend.length === 0 && inscricoesPend.length === 0 && (
            <p style={{ color: 'var(--txt-4)', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>
              Nenhuma aprovação pendente ✓
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── StatCard local ─────────────────────────────────────────────
function StatCard({ icone, label, valor, cor, alerta }) {
  return (
    <div className="stat-card">
      <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        {icone}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800, color: alerta ? 'var(--amarelo)' : 'var(--txt-1)', marginBottom: 4 }}>
        {valor}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>{label}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// NOTIFICAÇÕES
// ════════════════════════════════════════════════════════════
function Notificacoes() {
  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-header__title">Notificações</h1></div>
      </div>
      <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--txt-3)' }}>
        <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <p>Sem notificações por ler</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// UTILIZADORES — dados reais
// ════════════════════════════════════════════════════════════
function Utilizadores() {
  const toast = useToast();
  const [utilizadores, setUtilizadores] = useState([]);
  const [total,        setTotal]        = useState(0);
  const [carregando,   setCarregando]   = useState(true);
  const [pesquisa,     setPesquisa]     = useState('');
  const [filtroRole,   setFiltroRole]   = useState('');
  const [modalUser,    setModalUser]    = useState(null);
  const pesquisaTimer = useRef(null);

  const carregar = useCallback(async (p = '', r = '') => {
    setCarregando(true);
    try {
      const { data } = await adminAPI.utilizadores({ pesquisa: p, role: r, limite: 50 });
      setUtilizadores(data.dados?.utilizadores || []);
      setTotal(data.dados?.total || 0);
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(pesquisa, filtroRole); }, [filtroRole]);

  const handlePesquisa = (v) => {
    setPesquisa(v);
    clearTimeout(pesquisaTimer.current);
    pesquisaTimer.current = setTimeout(() => carregar(v, filtroRole), 400);
  };

  const alterarStatus = useCallback(async (id, novoStatus) => {
    const ok = await toast.confirmar({
      titulo:   novoStatus === 'bloqueado' ? 'Bloquear utilizador' : 'Activar utilizador',
      mensagem: novoStatus === 'bloqueado'
        ? 'O utilizador não conseguirá entrar na plataforma. Continuar?'
        : 'O utilizador voltará a ter acesso à plataforma.',
      variante: novoStatus === 'bloqueado' ? 'perigo' : 'primario',
      labelOk:  novoStatus === 'bloqueado' ? 'Bloquear' : 'Activar',
    });
    if (!ok) return;

    try {
      await adminAPI.statusUser(id, novoStatus);
      setUtilizadores(p => p.map(u => u.id === id ? { ...u, status: novoStatus } : u));
      setModalUser(null);
      toast.sucesso('Estado do utilizador actualizado.');
    } catch (e) { toast.erro(extrairErro(e)); }
  }, [toast]);

  // Stats locais
  const stats = {
    total:       total,
    estudantes:  utilizadores.filter(u => ['estudante', 'student'].includes(u.role)).length,
    empresas:    utilizadores.filter(u => ['empresa', 'company'].includes(u.role)).length,
    investidores:utilizadores.filter(u => ['investidor', 'investor'].includes(u.role)).length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Utilizadores</h1>
          <p className="page-header__sub">Gerir todos os usuários do sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total',       valor: stats.total },
          { label: 'Estudantes',  valor: stats.estudantes },
          { label: 'Empresas',    valor: stats.empresas },
          { label: 'Investidores',valor: stats.investidores },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>
              {s.valor.toLocaleString('pt-AO')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="form-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16}/>
          <input className="form-input form-input--icon" placeholder="Pesquisar por nome ou e-mail..."
            value={pesquisa} onChange={e => handlePesquisa(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filtroRole} onChange={e => setFiltroRole(e.target.value)}>
          <option value="">Todos os papéis</option>
          <option value="estudante">Estudante</option>
          <option value="empresa">Empresa</option>
          <option value="investidor">Investidor</option>
          <option value="funcionario">Funcionário</option>
        </select>
      </div>

      {carregando ? <PageLoader /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Estado</th>
                <th>Registo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {utilizadores.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--txt-3)' }}>Nenhum utilizador encontrado</td></tr>
              ) : utilizadores.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: 'var(--ciano-100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: 'var(--ciano-600)', flexShrink: 0,
                      }}>
                        {iniciais(u.nome)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.nome}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--txt-3)', fontSize: '0.85rem' }}>{u.email}</td>
                  <td><BadgeStatus status={u.role} /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: u.status === 'ativo' ? 'var(--verde)' : u.status === 'pendente' ? 'var(--amarelo)' : 'var(--txt-4)',
                      }} />
                      <span style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{u.status}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--txt-3)', fontSize: '0.8rem' }}>{formatData(u.criado_em)}</td>
                  <td>
                    <button className="btn btn--ghost btn--sm" onClick={() => setModalUser(u)} title="Acções">
                      ···
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal acções */}
      <Modal aberto={!!modalUser} onFechar={() => setModalUser(null)} titulo={`Acções — ${modalUser?.nome}`}>
        <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', marginBottom: 16 }}>
          Estado actual: <BadgeStatus status={modalUser?.status} />
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {modalUser?.status !== 'ativo' && (
            <button className="btn btn--primary btn--full" onClick={() => alterarStatus(modalUser.id, 'ativo')}>
              <Check size={15}/> Activar utilizador
            </button>
          )}
          {modalUser?.status !== 'bloqueado' && (
            <button className="btn btn--danger btn--full" onClick={() => alterarStatus(modalUser.id, 'bloqueado')}>
              <X size={15}/> Bloquear utilizador
            </button>
          )}
          {modalUser?.status !== 'inativo' && (
            <button className="btn btn--secondary btn--full" onClick={() => alterarStatus(modalUser.id, 'inativo')}>
              Desactivar conta
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CURSOS — dados reais
// ════════════════════════════════════════════════════════════
function Cursos() {
  const toast = useToast();
  const [cursos,      setCursos]      = useState([]);
  const [carregando,  setCarregando]  = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando,    setEditando]    = useState(null);
  const [form, setForm] = useState({ nome: '', categoria: '' });
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await adminAPI.cursos({ limite: 50 });
      setCursos(data.dados?.cursos || []);
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirModal = (curso = null) => {
    setEditando(curso);
    setForm(curso ? {
      nome: curso.nome, 
      categoria: curso.categoria || '',
    } : { nome: '', categoria: '' });
    setModalAberto(true);
  };

  const guardar = async () => {
    if (!form.nome.trim()) return toast.aviso('Nome do curso obrigatório');
    setEnviando(true);
    try {
      if (editando) {
        await adminAPI.editarCurso(editando.id, form);
        toast.sucesso('Curso actualizado!');
      } else {
        await adminAPI.criarCurso(form);
        toast.sucesso('Curso criado!');
      }
      setModalAberto(false);
      carregar();
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setEnviando(false); }
  };

  const toggleActivo = async (curso) => {
    const ok = await toast.confirmar({
      titulo:   curso.ativo ? 'Desactivar curso' : 'Activar curso',
      mensagem: curso.ativo ? 'Este curso ficará indisponível para inscrições.' : 'Este curso ficará visível para inscrições.',
      variante: curso.ativo ? 'perigo' : 'primario',
      labelOk:  curso.ativo ? 'Desactivar' : 'Activar',
    });
    if (!ok) return;
    try {
      await adminAPI.editarCurso(curso.id, { ativo: !curso.ativo });
      setCursos(p => p.map(c => c.id === curso.id ? { ...c, ativo: !c.ativo } : c));
      toast.sucesso(curso.ativo ? 'Curso desactivado.' : 'Curso activado.');
    } catch (e) { toast.erro(extrairErro(e)); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Cursos</h1>
          <p className="page-header__sub">Gerir cursos de formação</p>
        </div>
        <button className="btn btn--primary btn--sm" onClick={() => abrirModal()}>
          <Plus size={15}/> Novo Curso
        </button>
      </div>

      {carregando ? <PageLoader /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Nome</th><th>Categoria</th><th>Estado</th><th>Acções</th></tr>
            </thead>
            <tbody>
              {cursos.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--txt-3)' }}>Nenhum curso encontrado</td></tr>
              ) : cursos.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ color: 'var(--txt-2)' }}>{c.categoria || '—'}</td>
                  <td><BadgeStatus status={c.ativo ? 'activo' : 'inactivo'} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--secondary btn--sm" onClick={() => abrirModal(c)}>Editar</button>
                      <button className={`btn btn--sm ${c.ativo ? 'btn--danger' : 'btn--primary'}`} onClick={() => toggleActivo(c)}>
                        {c.ativo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal aberto={modalAberto} onFechar={() => setModalAberto(false)}
        titulo={editando ? 'Editar Curso' : 'Novo Curso'}
        acoes={<>
          <button className="btn btn--secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
          <button className={`btn btn--primary${enviando?' btn--loading':''}`} onClick={guardar} disabled={enviando}>
            {!enviando && <><Save size={14}/> Guardar</>}
          </button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome do curso *</label>
            <input className="form-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Informática Básica" />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <input className="form-input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="Ex: Informática" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// EMPRESAS — dados reais
// ════════════════════════════════════════════════════════════
function Empresas() {
  const toast = useToast();
  const [empresas,   setEmpresas]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [abaActiva,  setAbaActiva]  = useState('todas');
  const [pesquisa,   setPesquisa]   = useState('');
  const [modalEmp,   setModalEmp]   = useState(null);
  const [motivo,     setMotivo]     = useState('');

  const carregar = useCallback(async (status = '') => {
    setCarregando(true);
    try {
      const { data } = await adminAPI.empresas({ status, pesquisa, limite: 50 });
      setEmpresas(data.dados?.empresas || []);
      setTotal(data.dados?.total || 0);
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setCarregando(false); }
  }, [pesquisa, toast]);

  useEffect(() => { carregar(abaActiva === 'pendentes' ? 'pendente' : ''); }, [abaActiva]);

  const aprovar = async (id, aprovado) => {
    // Backend exige motivo quando rejeitado
    if (!aprovado && !motivo.trim()) {
      toast.aviso('O motivo de rejeição é obrigatório');
      return;
    }

    const ok = await toast.confirmar({
      titulo:   aprovado ? 'Aprovar empresa' : 'Rejeitar empresa',
      mensagem: aprovado
        ? 'A empresa ficará visível no marketplace e poderá publicar oportunidades.'
        : `Motivo: "${motivo}"`,
      variante: aprovado ? 'primario' : 'perigo',
      labelOk:  aprovado ? 'Aprovar' : 'Rejeitar',
    });
    if (!ok) return;

    try {
      await adminAPI.aprovarEmpresa(id, { aprovado, motivo: motivo || null });
      setEmpresas(p => p.map(e => e.id === id ? { ...e, status_aprovacao: aprovado ? 'aprovada' : 'rejeitada' } : e));
      setModalEmp(null);
      setMotivo('');
      toast.sucesso(aprovado ? 'Empresa aprovada com sucesso!' : 'Empresa rejeitada.');
    } catch (e) { toast.erro(extrairErro(e)); }
  };

  const pendentes = empresas.filter(e => e.status_aprovacao === 'pendente');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Empresas</h1>
          <p className="page-header__sub">Gerir empresas, aprovações e assinaturas</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total',      valor: total },
          { label: 'Aprovadas',  valor: empresas.filter(e => e.status_aprovacao === 'aprovada').length },
          { label: 'Pendentes',  valor: pendentes.length, alerta: pendentes.length > 0 },
          { label: 'Rejeitadas', valor: empresas.filter(e => e.status_aprovacao === 'rejeitada').length },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: s.alerta ? 'var(--amarelo)' : undefined }}>
              {s.valor}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab-btn${abaActiva==='todas'?' active':''}`} onClick={() => setAbaActiva('todas')}>Todas</button>
        <button className={`tab-btn${abaActiva==='pendentes'?' active':''}`} onClick={() => setAbaActiva('pendentes')}>
          Pendentes {pendentes.length > 0 && <span style={{ background: 'var(--amarelo)', color: 'white', fontSize: '0.7rem', padding: '0 6px', borderRadius: 'var(--r-full)' }}>{pendentes.length}</span>}
        </button>
      </div>

      {carregando ? <PageLoader /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Empresa</th><th>Setor</th><th>Estado</th><th>Documentos</th><th>Registo</th><th></th></tr>
            </thead>
            <tbody>
              {empresas.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--txt-3)' }}>Nenhuma empresa encontrada</td></tr>
              ) : empresas.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={14} color="var(--txt-3)"/>
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{e.nome_empresa}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>{formatData(e.criado_em)}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--txt-2)' }}>{e.setor_atividade || '—'}</td>
                  <td><BadgeStatus status={e.status_aprovacao} /></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', color: 'var(--txt-3)' }}>
                      <FileText size={14}/> {e.num_documentos || 0}
                    </span>
                  </td>
                  <td style={{ color: 'var(--txt-3)', fontSize: '0.8rem' }}>{formatData(e.criado_em)}</td>
                  <td>
                    <button className="btn btn--ghost btn--sm" onClick={() => { setModalEmp(e); setMotivo(''); }}>···</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal aberto={!!modalEmp} onFechar={() => setModalEmp(null)} titulo={`Acções — ${modalEmp?.nome_empresa}`}>
        <p style={{ fontSize: '0.875rem', color: 'var(--txt-2)', marginBottom: 16 }}>
          Estado: <BadgeStatus status={modalEmp?.status_aprovacao} />
        </p>
        {modalEmp?.status_aprovacao === 'pendente' ? (
          <>
            <button className="btn btn--primary btn--full" style={{ marginBottom: 8 }} onClick={() => aprovar(modalEmp.id, true)}>
              <Check size={15}/> Aprovar empresa
            </button>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">Motivo de rejeição (opcional)</label>
              <textarea className="form-textarea" rows={2} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Documentação incompleta, NIF inválido..." />
            </div>
            <button className="btn btn--danger btn--full" onClick={() => aprovar(modalEmp.id, false)}>
              <X size={15}/> Rejeitar empresa
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem' }}>
            {modalEmp?.status_aprovacao === 'aprovada'
              ? 'Esta empresa já foi aprovada.' : 'Esta empresa foi rejeitada.'}
          </p>
        )}
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// INVESTIMENTOS
// ════════════════════════════════════════════════════════════
function EmpresasRevisao() {
  const toast = useToast();
  const [empresas, setEmpresas] = useState([]);
  const [contagens, setContagens] = useState({ total: 0, aprovadas: 0, pendentes: 0, rejeitadas: 0 });
  const [carregando, setCarregando] = useState(true);
  const [abaActiva, setAbaActiva] = useState('todas');
  const [pesquisa, setPesquisa] = useState('');
  const [modalEmp, setModalEmp] = useState(null);
  const [detalheEmpresa, setDetalheEmpresa] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviandoAcao, setEnviandoAcao] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const status = abaActiva === 'pendentes'
        ? 'pendente'
        : abaActiva === 'aprovadas'
          ? 'aprovada'
          : abaActiva === 'rejeitadas'
            ? 'rejeitada'
            : '';

      const { data } = await adminAPI.empresas({ status, pesquisa, limite: 50 });
      setEmpresas(data.dados?.empresas || []);
      setContagens(data.dados?.contagens || { total: 0, aprovadas: 0, pendentes: 0, rejeitadas: 0 });
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [abaActiva, pesquisa, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirAnalise = useCallback(async (empresaBase) => {
    setModalEmp(empresaBase);
    setMotivo('');
    setCarregandoDetalhe(true);

    try {
      const { data } = await adminAPI.empresaDetalhe(empresaBase.id);
      setDetalheEmpresa(data.dados || null);
    } catch (e) {
      toast.erro('Nao foi possivel carregar os documentos da empresa: ' + extrairErro(e));
      setDetalheEmpresa(null);
    } finally {
      setCarregandoDetalhe(false);
    }
  }, [toast]);

  const decidirEmpresa = async (empresaId, aprovado) => {
    if (!aprovado && !motivo.trim()) {
      toast.aviso('O motivo de rejeicao e obrigatorio');
      return;
    }

    const ok = await toast.confirmar({
      titulo: aprovado ? 'Aprovar empresa' : 'Rejeitar empresa',
      mensagem: aprovado
        ? 'A empresa ficara visivel no marketplace e podera publicar oportunidades.'
        : `Motivo: "${motivo}"`,
      variante: aprovado ? 'primario' : 'perigo',
      labelOk: aprovado ? 'Aprovar' : 'Rejeitar',
    });
    if (!ok) return;

    try {
      setEnviandoAcao(true);
      if (aprovado) {
        await adminAPI.aprovarEmpresa(empresaId, {});
      } else {
        await adminAPI.rejeitarEmpresa(empresaId, { motivo: motivo.trim() });
      }
      await carregar();
      setModalEmp(null);
      setDetalheEmpresa(null);
      setMotivo('');
      toast.sucesso(aprovado ? 'Empresa aprovada com sucesso!' : 'Empresa rejeitada.');
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setEnviandoAcao(false);
    }
  };

  const empresaSelecionada = detalheEmpresa?.empresa || modalEmp;
  const documentos = detalheEmpresa?.documentos || [];
  const assinaturas = detalheEmpresa?.assinaturas || [];
  const estadoEmpresa = empresaSelecionada?.estado || 'pendente';

  const obterUrlDocumento = (url) => {
    if (!url) return '#';
    if (/^https?:\/\//i.test(url)) return url;
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Avaliação de empresas</h1>
          <p className="page-header__sub">Validar documentos, confirmar legitimidade do perfil e decidir com mais rigor operacional.</p>
        </div>
        <div className="page-header__actions">
          <div className="form-input-wrapper" style={{ minWidth: 260 }}>
            <Search size={16}/>
            <input
              className="form-input form-input--icon"
              placeholder="Pesquisar empresa, representante ou NIF"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>
          <button className="btn btn--secondary btn--sm" onClick={carregar}>
            <RefreshCw size={14}/> Actualizar
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total', valor: contagens.total || 0 },
          { label: 'Aprovadas', valor: contagens.aprovadas || 0 },
          { label: 'Pendentes', valor: contagens.pendentes || 0, alerta: (contagens.pendentes || 0) > 0 },
          { label: 'Rejeitadas', valor: contagens.rejeitadas || 0 },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: s.alerta ? 'var(--amarelo)' : undefined }}>
              {s.valor}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab-btn${abaActiva === 'todas' ? ' active' : ''}`} onClick={() => setAbaActiva('todas')}>Todas</button>
        <button className={`tab-btn${abaActiva === 'pendentes' ? ' active' : ''}`} onClick={() => setAbaActiva('pendentes')}>
          Pendentes {(contagens.pendentes || 0) > 0 && (
            <span style={{ background: 'var(--amarelo)', color: 'white', fontSize: '0.7rem', padding: '0 6px', borderRadius: 'var(--r-full)' }}>
              {contagens.pendentes}
            </span>
          )}
        </button>
        <button className={`tab-btn${abaActiva === 'aprovadas' ? ' active' : ''}`} onClick={() => setAbaActiva('aprovadas')}>Aprovadas</button>
        <button className={`tab-btn${abaActiva === 'rejeitadas' ? ' active' : ''}`} onClick={() => setAbaActiva('rejeitadas')}>Rejeitadas</button>
      </div>

      {carregando ? <PageLoader /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Empresa</th><th>Sector</th><th>Estado</th><th>Documentos</th><th>Localização</th><th>Registo</th><th></th></tr>
            </thead>
            <tbody>
              {empresas.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--txt-3)' }}>Nenhuma empresa encontrada</td></tr>
              ) : empresas.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={14} color="var(--txt-3)"/>
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{e.nome_empresa}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>{e.representante || 'Representante nao informado'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--txt-2)' }}>{e.sector || '—'}</td>
                  <td><BadgeStatus status={e.estado} /></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', color: 'var(--txt-3)' }}>
                      <FileText size={14}/> {e.num_documentos || 0}
                    </span>
                  </td>
                  <td style={{ color: 'var(--txt-3)', fontSize: '0.8rem' }}>
                    {[e.provincia, e.municipio].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td style={{ color: 'var(--txt-3)', fontSize: '0.8rem' }}>{formatData(e.criado_em)}</td>
                  <td>
                    <button className="btn btn--ghost btn--sm" onClick={() => abrirAnalise(e)}>
                      <Eye size={15}/> Analisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        aberto={!!modalEmp}
        onFechar={() => { setModalEmp(null); setDetalheEmpresa(null); setMotivo(''); }}
        titulo={empresaSelecionada ? `Avaliação documental — ${empresaSelecionada.nome_empresa}` : 'Avaliação documental'}
        largura={980}
      >
        {carregandoDetalhe ? <PageLoader /> : !empresaSelecionada ? (
          <EmptyState icone={<Building2 size={28}/>} titulo="Empresa indisponível" descricao="Nao foi possivel carregar os dados desta empresa." />
        ) : (
          <div className="company-review-shell">
            <div className="company-review-summary">
              <BadgeStatus status={estadoEmpresa} />
              <span className="badge badge--cinza">{documentos.length} documento(s)</span>
              <span className="badge badge--cinza">{assinaturas.length} assinatura(s)</span>
            </div>

            <div className="company-review-grid">
              <div className="company-review-panel">
                <p className="company-review-panel__title">Dados da empresa</p>
                <p className="company-review-panel__desc">Confirme a identidade da empresa, o responsável e a consistência dos campos apresentados.</p>

                <div className="company-metadata-grid">
                  {[
                    ['Empresa', empresaSelecionada.nome_empresa],
                    ['Responsável', empresaSelecionada.nome || empresaSelecionada.representante],
                    ['E-mail', empresaSelecionada.email],
                    ['Telefone', empresaSelecionada.telefone],
                    ['NIF', empresaSelecionada.nif],
                    ['Sector', empresaSelecionada.sector],
                    ['Província', empresaSelecionada.provincia],
                    ['Município', empresaSelecionada.municipio],
                  ].map(([label, value]) => (
                    <div key={label} className="company-meta-item">
                      <p className="company-meta-item__label">{label}</p>
                      <p className="company-meta-item__value">{value || '—'}</p>
                    </div>
                  ))}
                </div>

                {empresaSelecionada.motivo_rejeicao && (
                  <div className="alert alert--warning" style={{ marginTop: 16 }}>
                    <AlertCircle size={16} />
                    <div>
                      <strong>Motivo da rejeição anterior</strong>
                      <p>{empresaSelecionada.motivo_rejeicao}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="company-review-panel">
                <p className="company-review-panel__title">Decisão administrativa</p>
                <p className="company-review-panel__desc">Aprove ou rejeite apenas depois de validar a documentação e a legitimidade do perfil.</p>

                <div className="company-review-actions">
                  <div className="form-group">
                    <label className="form-label">Observações ou motivo de rejeição</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ex.: documentação ilegível, dados inconsistentes, falta de confirmação presencial..."
                    />
                  </div>

                  {estadoEmpresa === 'pendente' ? (
                    <>
                      <button className={`btn btn--primary btn--full${enviandoAcao ? ' btn--loading' : ''}`} onClick={() => decidirEmpresa(empresaSelecionada.id, true)} disabled={enviandoAcao}>
                        {!enviandoAcao && <><Check size={15}/> Aprovar empresa</>}
                      </button>
                      <button className={`btn btn--danger btn--full${enviandoAcao ? ' btn--loading' : ''}`} onClick={() => decidirEmpresa(empresaSelecionada.id, false)} disabled={enviandoAcao}>
                        {!enviandoAcao && <><X size={15}/> Rejeitar empresa</>}
                      </button>
                    </>
                  ) : (
                    <div className={`alert ${estadoEmpresa === 'aprovada' ? 'alert--success' : 'alert--warning'}`}>
                      {estadoEmpresa === 'aprovada' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                      <div>
                        <strong>{estadoEmpresa === 'aprovada' ? 'Empresa já aprovada' : 'Empresa rejeitada'}</strong>
                        <p>
                          {estadoEmpresa === 'aprovada'
                            ? 'Este perfil já foi validado e pode operar segundo as regras actuais da plataforma.'
                            : 'Revise o motivo da rejeição antes de solicitar novos documentos ou nova submissão.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="company-review-panel">
              <p className="company-review-panel__title">Documentos enviados</p>
              <p className="company-review-panel__desc">Abra os ficheiros, confirme se estão legíveis e compare com os dados do cadastro.</p>

              {documentos.length === 0 ? (
                <EmptyState icone={<FileText size={24}/>} titulo="Sem documentos" descricao="Esta empresa ainda não anexou documentos para validação." />
              ) : (
                <div className="company-docs-grid">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="company-doc-card">
                      <div className="company-doc-card__top">
                        <div>
                          <p className="company-doc-card__title">{doc.tipo || 'Documento'}</p>
                          <p className="company-doc-card__name">{doc.nome_ficheiro || 'Ficheiro anexado'}</p>
                        </div>
                        <BadgeStatus status={doc.status_verificacao || 'pendente'} />
                      </div>
                      <p style={{ color: 'var(--txt-4)', fontSize: '0.74rem' }}>{formatData(doc.created_at)}</p>
                      <a className="btn btn--secondary btn--sm" href={obterUrlDocumento(doc.url_ficheiro)} target="_blank" rel="noreferrer">
                        <Eye size={14}/> Ver documento
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="company-review-panel">
              <p className="company-review-panel__title">Histórico de assinaturas</p>
              <p className="company-review-panel__desc">Consulte a situação comercial do perfil empresarial.</p>

              {assinaturas.length === 0 ? (
                <EmptyState icone={<CreditCard size={24}/>} titulo="Sem assinaturas" descricao="Ainda não existem assinaturas registadas para esta empresa." />
              ) : (
                <div className="company-subscription-list">
                  {assinaturas.map((assinatura) => (
                    <div key={assinatura.id} className="company-subscription-item">
                      <div className="company-subscription-item__meta">
                        <strong>{assinatura.plano || 'Plano não definido'}</strong>
                        <BadgeStatus status={assinatura.status} />
                      </div>
                      <p style={{ color: 'var(--txt-3)', fontSize: '0.8rem' }}>
                        {formatData(assinatura.data_inicio)} até {formatData(assinatura.data_fim)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Investimentos() {
  const toast = useToast();
  const [oportunidades, setOportunidades] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    adminAPI.oportunidades({ limite: 50 })
      .then(({ data }) => setOportunidades(data.dados?.oportunidades || []))
      .catch(e => toast.erro(extrairErro(e)))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Investimentos</h1>
      </div>
      {carregando ? <PageLoader /> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Título</th><th>Empresa</th><th>Tipo</th><th>Valor</th><th>Estado</th><th>Data</th></tr></thead>
            <tbody>
              {oportunidades.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:32, color:'var(--txt-3)' }}>Nenhuma oportunidade</td></tr>
              ) : oportunidades.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight:500 }}>{o.titulo}</td>
                  <td style={{ color:'var(--txt-3)' }}>{o.nome_empresa || '—'}</td>
                  <td><BadgeStatus status={o.tipo_servico} /></td>
                  <td style={{ fontWeight:700 }}>{formatAOA(o.valor_pedido)}</td>
                  <td><BadgeStatus status={o.status} /></td>
                  <td style={{ color:'var(--txt-3)', fontSize:'0.8rem' }}>{formatData(o.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGAMENTOS — dados reais
// ════════════════════════════════════════════════════════════
function Pagamentos() {
  const toast = useToast();
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalPag,   setModalPag]   = useState(null);
  const [motivo,     setMotivo]     = useState('');

  const carregar = useCallback(async () => {
    try {
      const { data } = await pagamentosAPI.adminListar({ limite: 50 });
      setPagamentos(data.dados?.pagamentos || []);
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const validar = async (id, aprovado) => {
    // Backend exige motivo_rejeicao com mínimo 10 chars se não aprovado
    if (!aprovado && (!motivo || motivo.trim().length < 10)) {
      toast.aviso('Indique o motivo da rejeição (mínimo 10 caracteres)');
      return;
    }

    const ok = await toast.confirmar({
      titulo:   aprovado ? 'Confirmar pagamento' : 'Rejeitar pagamento',
      mensagem: aprovado
        ? 'O utilizador receberá confirmação e a inscrição será activada.'
        : `Motivo: "${motivo}"`,
      variante: aprovado ? 'primario' : 'perigo',
      labelOk:  aprovado ? 'Confirmar' : 'Rejeitar',
    });
    if (!ok) return;

    try {
      await pagamentosAPI.adminValidar(id, { aprovado, motivo_rejeicao: motivo || null });
      setPagamentos(p => p.map(pg => pg.id === id ? { ...pg, status: aprovado ? 'confirmado' : 'rejeitado' } : pg));
      setModalPag(null);
      setMotivo('');
      toast.sucesso(aprovado ? 'Pagamento confirmado!' : 'Pagamento rejeitado.');
    } catch (e) { toast.erro(extrairErro(e)); }
  };

  // Calcular stats dos pagamentos carregados
  const totalReceita = pagamentos.filter(p => p.status === 'confirmado').reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
  const pendentes = pagamentos.filter(p => ['pendente','aguardando_validacao'].includes(p.status)).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Pagamentos</h1>
          <p className="page-header__sub">Acompanhamento de todas as transações</p>
        </div>
        <button className="btn btn--secondary btn--sm" onClick={carregar}>
          <RefreshCw size={14}/> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>{formatAOA(totalReceita)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>Receita Confirmada</div>
        </div>
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: 4, color: pendentes > 0 ? 'var(--amarelo)' : undefined }}>{pendentes}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>Aguardam Validação</div>
        </div>
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>{pagamentos.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>Total de Transações</div>
        </div>
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: 4, color: 'var(--verde)' }}>{pagamentos.filter(p => p.status==='confirmado').length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>Confirmados</div>
        </div>
      </div>

      {carregando ? <PageLoader /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Referência</th><th>Utilizador</th><th>Tipo</th><th>Valor</th><th>Estado</th><th>Data</th><th>Acções</th></tr>
            </thead>
            <tbody>
              {pagamentos.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'var(--txt-3)' }}>Nenhum pagamento encontrado</td></tr>
              ) : pagamentos.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight:600, color:'var(--txt-3)', fontSize:'0.8rem' }}>{p.referencia || `PAG-${p.id}`}</td>
                  <td style={{ fontWeight:500 }}>{p.nome_utilizador || p.user_nome || '—'}</td>
                  <td style={{ color:'var(--txt-3)', fontSize:'0.85rem' }}>{p.tipo || '—'}</td>
                  <td style={{ fontWeight:700 }}>{formatAOA(p.valor)}</td>
                  <td><BadgeStatus status={p.status} /></td>
                  <td style={{ color:'var(--txt-3)', fontSize:'0.8rem' }}>{formatData(p.criado_em || p.data)}</td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      {p.comprovativo_url && (
                        <a href={p.comprovativo_url} target="_blank" rel="noreferrer" className="btn btn--secondary btn--sm" title="Ver comprovativo">
                          <Eye size={13}/>
                        </a>
                      )}
                      {['pendente','aguardando_validacao'].includes(p.status) && (
                        <button className="btn btn--primary btn--sm" onClick={() => { setModalPag(p); setMotivo(''); }}>
                          Validar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal aberto={!!modalPag} onFechar={() => setModalPag(null)} titulo={`Validar Pagamento`}>
        <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 16 }}>
          <p style={{ fontWeight:600 }}>{modalPag?.nome_utilizador || '—'}</p>
          <p style={{ fontSize:'0.85rem', color:'var(--txt-3)', marginTop:4 }}>
            {formatAOA(modalPag?.valor)} · {modalPag?.tipo || 'Pagamento'}
          </p>
        </div>
        <button className="btn btn--primary btn--full" style={{ marginBottom:8 }} onClick={() => validar(modalPag.id, true)}>
          <Check size={15}/> Confirmar pagamento
        </button>
        <div className="form-group" style={{ marginBottom:8 }}>
          <label className="form-label">Motivo de rejeição (se aplicável)</label>
          <textarea className="form-textarea" rows={2} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Comprovativo ilegível, valor incorreto..." />
        </div>
        <button className="btn btn--danger btn--full" onClick={() => validar(modalPag.id, false)}>
          <X size={15}/> Rejeitar pagamento
        </button>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SECÇÕES SIMPLES
// ════════════════════════════════════════════════════════════
function Contratos() {
  return <SecaoSimples icone={<FileText/>} titulo="Contratos" desc="Gestão de contratos digitais"/>;
}

// ════════════════════════════════════════════════════════════
// VAGAS DE EMPRESAS — Aprovação/Rejeição
// ════════════════════════════════════════════════════════════
function VagasEmpresa() {
  const toast = useToast();
  const [vagas,      setVagas]      = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro,     setFiltro]     = useState('pendente');
  const [contagens,  setContagens]  = useState({});
  const [modalRej,   setModalRej]   = useState(null); // vaga para rejeitar
  const [motivoRej,  setMotivoRej]  = useState('');
  const [enviando,   setEnviando]   = useState(false);

  const carregar = useCallback(async (status = filtro) => {
    setCarregando(true);
    try {
      const { data } = await adminAPI.vagasEmpresa({ status });
      setVagas(data.dados?.vagas || []);
      setContagens(data.dados?.contagens || {});
    } catch (e) {
      toast.erro('Erro ao carregar vagas: ' + extrairErro(e));
    } finally { setCarregando(false); }
  }, [filtro, toast]);

  useEffect(() => { carregar(); }, []);

  const mudarFiltro = (s) => { setFiltro(s); carregar(s); };

  const aprovar = async (id, titulo) => {
    const ok = await toast.confirmar({
      titulo: 'Aprovar vaga',
      mensagem: `Aprovar a vaga "${titulo}"? Ficará visível publicamente.`,
      labelOk: 'Aprovar',
    });
    if (!ok) return;
    try {
      await adminAPI.aprovarVaga(id);
      toast.sucesso('Vaga aprovada e publicada!');
      carregar(filtro);
    } catch (e) { toast.erro(extrairErro(e)); }
  };

  const abrirRejeicao = (vaga) => {
    setModalRej(vaga);
    setMotivoRej('');
  };

  const confirmarRejeicao = async () => {
    if (!motivoRej.trim()) return toast.aviso('Indique o motivo de rejeição.');
    setEnviando(true);
    try {
      await adminAPI.rejeitarVaga(modalRej.id, { motivo: motivoRej });
      toast.sucesso('Vaga rejeitada. A empresa foi notificada.');
      setModalRej(null);
      carregar(filtro);
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setEnviando(false); }
  };

  const estadoCor = {
    pendente:  { bg: 'var(--amarelo-100)', color: '#92400E', label: 'Pendente' },
    aprovada:  { bg: 'var(--verde-100)',   color: '#166534', label: 'Aprovada' },
    rejeitada: { bg: 'var(--vermelho-100)', color: '#991B1B', label: 'Rejeitada' },
    encerrada: { bg: 'var(--bg-hover)',    color: 'var(--txt-3)', label: 'Encerrada' },
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Vagas de Empresas</h2>
          <p className="section-desc">Aprovar ou rejeitar vagas submetidas pelas empresas</p>
        </div>
      </div>

      {/* Contadores */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Pendentes',  val: contagens.pendentes  || 0, cor: 'var(--amarelo-100)', corT: '#92400E' },
          { label: 'Aprovadas',  val: contagens.aprovadas  || 0, cor: 'var(--verde-100)',   corT: '#166534' },
          { label: 'Rejeitadas', val: contagens.rejeitadas || 0, cor: 'var(--vermelho-100)', corT: '#991B1B' },
          { label: 'Total',      val: contagens.total       || 0, cor: 'var(--ciano-100)',   corT: 'var(--ciano-600)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ background: s.cor }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: s.corT }}>{s.val}</div>
            <div style={{ fontSize: '0.8rem', color: s.corT, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pendente','aprovada','rejeitada','encerrada'].map(s => (
          <button key={s} onClick={() => mudarFiltro(s)}
            className={`btn btn--sm ${filtro === s ? 'btn--primary' : 'btn--secondary'}`}
            style={{ textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
        <button onClick={() => mudarFiltro('')} className={`btn btn--sm ${filtro === '' ? 'btn--primary' : 'btn--secondary'}`}>
          Todas
        </button>
      </div>

      {carregando ? <PageLoader /> : vagas.length === 0 ? (
        <EmptyState icone={<Briefcase size={28}/>} titulo="Sem vagas" descricao={`Nenhuma vaga ${filtro || ''} encontrada.`}/>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vagas.map(v => {
            const ec = estadoCor[v.status] || estadoCor.pendente;
            return (
              <div key={v.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700 }}>{v.titulo}</span>
                      <span style={{ padding: '2px 10px', borderRadius: 'var(--r-full)', background: ec.bg, color: ec.color, fontSize: '0.72rem', fontWeight: 700 }}>
                        {ec.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--txt-3)', marginBottom: 8 }}>
                      🏢 {v.nome_empresa} · 📋 {v.tipo} {v.localizacao ? `· 📍 ${v.localizacao}` : ''}
                    </div>
                    <p style={{ fontSize: '0.83rem', color: 'var(--txt-2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {v.descricao}
                    </p>
                    {v.motivo_rejeicao && (
                      <p style={{ fontSize: '0.78rem', color: '#991B1B', marginTop: 6, background: 'var(--vermelho-100)', padding: '6px 10px', borderRadius: 'var(--r-sm)' }}>
                        ⚠️ {v.motivo_rejeicao}
                      </p>
                    )}
                  </div>
                  {v.status === 'pendente' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn btn--sm" style={{ background: 'var(--verde)', color: 'white' }}
                        onClick={() => aprovar(v.id, v.titulo)}>
                        <CheckCircle size={14}/> Aprovar
                      </button>
                      <button className="btn btn--sm btn--danger" onClick={() => abrirRejeicao(v)}>
                        <X size={14}/> Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: motivo de rejeição */}
      <Modal aberto={!!modalRej} onFechar={() => setModalRej(null)} titulo="Rejeitar Vaga"
        acoes={<>
          <button className="btn btn--secondary" onClick={() => setModalRej(null)}>Cancelar</button>
          <button className={`btn btn--danger${enviando?' btn--loading':''}`} onClick={confirmarRejeicao} disabled={enviando}>
            {!enviando && <><X size={14}/> Rejeitar</>}
          </button>
        </>}
      >
        {modalRej && (
          <>
            <p style={{ marginBottom: 12, color: 'var(--txt-2)', fontSize: '0.875rem' }}>
              Vai rejeitar a vaga <strong>"{modalRej.titulo}"</strong> da empresa <strong>{modalRej.nome_empresa}</strong>.
              A empresa será notificada com o motivo.
            </p>
            <div className="form-group">
              <label className="form-label">Motivo de rejeição *</label>
              <textarea className="form-textarea" rows={3}
                placeholder="Ex: Conteúdo inapropriado, informação incompleta, duplicado..."
                value={motivoRej} onChange={e => setMotivoRej(e.target.value)}
                style={{ minHeight: 80 }}/>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function Ficheiros() {
  return <SecaoSimples icone={<Folder/>} titulo="Ficheiros" desc="Gestão de ficheiros do sistema"/>;
}
function NotificacoesReal({ setNotifCount }) {
  const toast = useToast();
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data } = await adminAPI.notificacoes();
      const dados = data.dados || {};
      const lista = dados.notificacoes || data.dados || [];
      setNotificacoes(lista);
      setNotifCount?.(typeof dados.nao_lidas === 'number'
        ? dados.nao_lidas
        : lista.filter((item) => !item.lida).length);
    } catch (e) {
      toast.erro('Erro ao carregar notificações: ' + extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [setNotifCount, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const marcarLida = async (id) => {
    try {
      await adminAPI.marcarLida(id);
      const actualizadas = notificacoes.map((item) => (
        item.id === id ? { ...item, lida: 1, lida_at: new Date().toISOString() } : item
      ));
      setNotificacoes(actualizadas);
      setNotifCount?.(actualizadas.filter((item) => !item.lida).length);
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  };

  const marcarTodas = async () => {
    try {
      await adminAPI.marcarTodas();
      setNotificacoes((lista) => lista.map((item) => ({ ...item, lida: 1 })));
      setNotifCount?.(0);
      toast.sucesso('Notificações marcadas como lidas.');
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Notificações</h1>
          <p className="page-header__sub">Alertas internos do painel administrativo</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--secondary btn--sm" onClick={carregar}>
            <RefreshCw size={14}/> Actualizar
          </button>
          <button className="btn btn--primary btn--sm" onClick={marcarTodas} disabled={notificacoes.length === 0 || notificacoes.every((item) => item.lida)}>
            <Check size={14}/> Marcar todas
          </button>
        </div>
      </div>

      {carregando ? <PageLoader /> : notificacoes.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--txt-3)' }}>
          <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>Sem notificações disponíveis.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notificacoes.map((item) => (
            <div key={item.id} className="card" style={{ padding: 18, borderLeft: item.lida ? '4px solid var(--border)' : '4px solid var(--ciano)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{item.titulo}</span>
                    <span className={`badge ${item.lida ? 'badge--cinza' : 'badge--ciano'}`}>
                      {item.lida ? 'Lida' : 'Nova'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--txt-2)', fontSize: '0.9rem', marginBottom: 8 }}>{item.mensagem}</p>
                  <p style={{ color: 'var(--txt-4)', fontSize: '0.75rem' }}>{formatData(item.created_at || item.criado_em)}</p>
                </div>
                {!item.lida && (
                  <button className="btn btn--secondary btn--sm" onClick={() => marcarLida(item.id)}>
                    <Check size={14}/> Marcar lida
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContratosReal() {
  const toast = useToast();
  const [contratos, setContratos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data } = await adminAPI.contratos({ limite: 50 });
      setContratos(data.dados?.contratos || []);
    } catch (e) {
      toast.erro('Erro ao carregar contratos: ' + extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Contratos</h1>
          <p className="page-header__sub">Acompanhar contratos gerados no módulo de investimentos</p>
        </div>
        <button className="btn btn--secondary btn--sm" onClick={carregar}>
          <RefreshCw size={14}/> Actualizar
        </button>
      </div>

      {carregando ? <PageLoader /> : contratos.length === 0 ? (
        <EmptyState icone={<FileText size={28}/>} titulo="Sem contratos" descricao="Os contratos gerados aparecerão aqui."/>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Empresa</th>
                <th>Investidor</th>
                <th>Estado</th>
                <th>Assinaturas</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.titulo || c.oportunidade_titulo || 'Contrato de investimento'}</td>
                  <td>{c.nome_empresa || '—'}</td>
                  <td>{c.investidor_nome || '—'}</td>
                  <td><BadgeStatus status={c.status} /></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--txt-3)' }}>
                    Empresa: {c.assinado_empresa ? 'Sim' : 'Não'} | Investidor: {c.assinado_investidor ? 'Sim' : 'Não'}
                  </td>
                  <td style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{formatData(c.criado_em || c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Seguranca() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    adminAPI.auditoria({ limite: 20 })
      .then(({ data }) => setLogs(data.dados?.registos || data.dados || []))
      .catch(e => toast.erro(extrairErro(e)))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div>
      <div className="page-header"><h1 className="page-header__title">Segurança & Auditoria</h1></div>
      {carregando ? <PageLoader /> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Acção</th><th>Utilizador</th><th>IP</th><th>Data</th></tr></thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign:'center', padding:32, color:'var(--txt-3)' }}>Sem registos</td></tr>
              ) : logs.map((l, i) => (
                <tr key={i}>
                  <td style={{ fontSize:'0.85rem' }}>{l.acao}</td>
                  <td style={{ color:'var(--txt-3)', fontSize:'0.85rem' }}>{l.user_nome || l.actor || '—'}</td>
                  <td style={{ color:'var(--txt-4)', fontSize:'0.8rem' }}>{l.ip_address || '—'}</td>
                  <td style={{ color:'var(--txt-3)', fontSize:'0.8rem' }}>{formatData(l.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ════════════════════════════════════════════════════════════
function Configuracoes() {
  const toast  = useToast();
  const { utilizador } = useAuth();
  const [configs, setConfigs] = useState({
    nomePlataforma: 'ULEZI XPB', email: 'info@ulezi.com',
    telefone: '+244 923 000 000', site: 'https://ulezi.com',
    notifInscricoes: true, notifEmpresas: true, notifInvestidores: true,
    notifEmail: false, notifWhatsapp: false,
    autenticacao2FA: false, bloqueioInstrumentos: true, registosAuditoria: true,
  });
  const [senhaActual, setSenhaActual] = useState('');
  const [novaSenha,   setNovaSenha]   = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mudandoSenha, setMudandoSenha] = useState(false);
  const [carregandoConfigs, setCarregandoConfigs] = useState(true);

  useEffect(() => {
    adminAPI.configs()
      .then(({ data }) => {
        const recebidas = data.dados?.configuracoes || {};
        if (Object.keys(recebidas).length > 0) {
          setConfigs((actual) => ({
            ...actual,
            ...recebidas,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setCarregandoConfigs(false));
  }, []);

  const guardar = async () => {
    setGuardando(true);
    try {
      await adminAPI.salvarConfigs(configs);
      toast.sucesso('Configurações guardadas!');
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setGuardando(false); }
  };

  const alterarSenha = async () => {
    if (!senhaActual) return toast.aviso('Introduza a palavra-passe actual');
    if (novaSenha.length < 8) return toast.aviso('Nova senha deve ter mínimo 8 caracteres');
    if (novaSenha !== confirmarSenha) return toast.aviso('As senhas não coincidem');
    setMudandoSenha(true);
    try {
      await authAPI.alterarSenha({ password_atual: senhaActual, nova_password: novaSenha });
      setSenhaActual(''); setNovaSenha(''); setConfirmarSenha('');
      toast.sucesso('Palavra-passe alterada com sucesso!');
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setMudandoSenha(false); }
  };

  const toggle = (k) => setConfigs(c => ({ ...c, [k]: !c[k] }));

  if (carregandoConfigs) return <PageLoader />;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-header__title">Configurações</h1><p className="page-header__sub">Configurações gerais do sistema</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Coluna Esquerda - Configurações */}
        <div style={{ maxWidth: 640 }}>
          {/* Informações da plataforma */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:36, height:36, borderRadius:'var(--r-full)', background:'var(--ciano-100)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Settings size={18} color="var(--ciano)"/>
              </div>
              <div><p style={{ fontWeight:700 }}>Informações da Plataforma</p><p style={{ fontSize:'0.78rem', color:'var(--txt-3)' }}>Dados do sistema</p></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div className="form-group">
            <label className="form-label">Nome da Plataforma</label>
            <input className="form-input" value={configs.nomePlataforma} onChange={e => setConfigs(c=>({...c,nomePlataforma:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail de contacto</label>
            <input type="email" className="form-input" value={configs.email} onChange={e => setConfigs(c=>({...c,email:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input className="form-input" value={configs.telefone} onChange={e => setConfigs(c=>({...c,telefone:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Site</label>
            <input className="form-input" value={configs.site} onChange={e => setConfigs(c=>({...c,site:e.target.value}))} />
          </div>
        </div>
        <button className={`btn btn--primary btn--sm${guardando?' btn--loading':''}`} style={{ marginTop:14 }} onClick={guardar} disabled={guardando}>
          {!guardando && <><Save size={14}/> Guardar Alterações</>}
        </button>
      </div>

      {/* Notificações */}
      <div className="card" style={{ padding:24, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ width:36, height:36, borderRadius:'var(--r-full)', background:'var(--amarelo-100)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Bell size={18} color="var(--amarelo)"/>
          </div>
          <div><p style={{ fontWeight:700 }}>Notificações</p><p style={{ fontSize:'0.78rem', color:'var(--txt-3)' }}>Configurar alertas do sistema</p></div>
        </div>
        {[
          { k:'notifInscricoes', l:'Notificar novas inscrições',    d:'Alerta quando aluno se inscreve' },
          { k:'notifEmpresas',   l:'Notificar novas empresas',      d:'Alerta quando empresa solicita aprovação' },
          { k:'notifInvestidores',l:'Notificar investimentos',      d:'Alerta quando investidor demonstra interesse' },
          { k:'notifEmail',      l:'Notificações por e-mail',       d:'Enviar também por email' },
          { k:'notifWhatsapp',   l:'Notificações por WhatsApp',     d:'Enviar via WhatsApp' },
        ].map(({k,l,d}) => <ToggleRow key={k} label={l} desc={d} activo={configs[k]} onChange={()=>toggle(k)} />)}
      </div>

      {/* Segurança */}
      <div className="card" style={{ padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ width:36, height:36, borderRadius:'var(--r-full)', background:'var(--verde-100)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Shield size={18} color="var(--verde)"/>
          </div>
          <div><p style={{ fontWeight:700 }}>Segurança</p><p style={{ fontSize:'0.78rem', color:'var(--txt-3)' }}>Configurações de segurança</p></div>
        </div>
        {[
          { k:'autenticacao2FA',      l:'Autenticação de dois factores', d:'Exigir 2FA para administradores' },
          { k:'bloqueioInstrumentos', l:'Bloqueio de instrumentos',      d:'Bloquear após 5 tentativas falhadas' },
          { k:'registosAuditoria',    l:'Registos de auditoria',         d:'Registar todas as acções administrativas' },
        ].map(({k,l,d}) => <ToggleRow key={k} label={l} desc={d} activo={configs[k]} onChange={()=>toggle(k)} />)}

        {/* Alterar senha */}
        <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid var(--border)' }}>
          <p style={{ fontWeight:600, marginBottom:14, fontSize:'0.875rem' }}>Alterar Palavra-passe</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12, marginBottom:12 }}>
            <div className="form-group">
              <label className="form-label">Palavra-passe actual</label>
              <input type="password" className="form-input" value={senhaActual} onChange={e=>setSenhaActual(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Nova palavra-passe</label>
              <input type="password" className="form-input" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} placeholder="Mínimo 8 caracteres" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar nova palavra-passe</label>
              <input type="password" className="form-input" value={confirmarSenha} onChange={e=>setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha" />
            </div>
          </div>
          <button className={`btn btn--primary btn--sm${mudandoSenha?' btn--loading':''}`} onClick={alterarSenha} disabled={mudandoSenha}>
            {!mudandoSenha && 'Actualizar Palavra-passe'}
          </button>
        </div>
        </div>
        </div>

        {/* Coluna Direita - Coordenadas Bancárias */}
        <div>
          <GestaoCoordenadasBancarias />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, activo, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize:'0.875rem', fontWeight:500 }}>{label}</p>
        <p style={{ fontSize:'0.78rem', color:'var(--txt-3)' }}>{desc}</p>
      </div>
      <button role="switch" aria-checked={activo} onClick={onChange}
        style={{
          width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
          background: activo ? 'var(--ciano)' : 'var(--border)',
          position:'relative', transition:'background 200ms', flexShrink:0,
        }}>
        <span style={{
          position:'absolute', top:2, left: activo ? 22 : 2,
          width:20, height:20, borderRadius:'50%', background:'var(--bg-card)',
          transition:'left 200ms', boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
        }}/>
      </button>
    </div>
  );
}

function SecaoSimples({ icone, titulo, desc }) {
  return (
    <div>
      <div className="page-header"><h1 className="page-header__title">{titulo}</h1></div>
      <div className="card" style={{ padding:32, textAlign:'center', color:'var(--txt-3)' }}>
        <div style={{ opacity:0.3, margin:'0 auto 16px', width:'fit-content' }}>{React.cloneElement(icone, { size:48 })}</div>
        <p>{desc}</p>
      </div>
    </div>
  );
}
