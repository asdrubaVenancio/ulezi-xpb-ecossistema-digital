// ============================================================
// ULEZI XPB — Layout para Dashboards de Utilizador
// Sidebar + topbar para aluno, empresa e investidor
// ============================================================

import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, CreditCard, User, LogOut,
  Sun, Moon, Menu, TrendingUp, Users, Globe,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { iniciais, ROLE_LABELS, BACKEND_BASE_URL } from '../../utils/constants';

/** Itens de navegação por papel */
const NAV_POR_PAPEL = {
  estudante: [
    { path: '/painel/aluno',    icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/cursos',          icon: BookOpen,        label: 'Cursos' },
    { path: '/perfil',          icon: User,            label: 'Perfil' },
  ],
  empresa: [
    { path: '/empresa/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/negocios',            icon: TrendingUp,      label: 'Negócios' },
    { path: '/comunidade',          icon: Users,           label: 'Comunidade' },
    { path: '/empresa/assinatura',  icon: CreditCard,  label: 'Assinatura' },
    { path: '/perfil',              icon: User,        label: 'Perfil' },
  ],
  investidor: [
    { path: '/painel/investidor',    icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/negocios',             icon: TrendingUp,       label: 'Oportunidades' },
    { path: '/perfil',               icon: User,             label: 'Perfil' },
  ],
  student: [
    { path: '/painel/aluno',    icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/cursos',          icon: BookOpen,        label: 'Cursos' },
    { path: '/perfil',          icon: User,            label: 'Perfil' },
  ],
  company: [
    { path: '/empresa/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/negocios',            icon: TrendingUp,      label: 'Negócios' },
    { path: '/comunidade',          icon: Users,           label: 'Comunidade' },
    { path: '/empresa/assinatura',  icon: CreditCard,  label: 'Assinatura' },
    { path: '/perfil',              icon: User,        label: 'Perfil' },
  ],
  investor: [
    { path: '/painel/investidor',    icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/negocios',             icon: TrendingUp,       label: 'Oportunidades' },
    { path: '/perfil',               icon: User,             label: 'Perfil' },
  ],
};

// Componente Avatar do Usuário (foto ou iniciais)
function AvatarUsuario({ utilizador, tamanho = 36 }) {
  const urlFoto = utilizador?.foto_perfil
    ? utilizador.foto_perfil.startsWith('http')
      ? utilizador.foto_perfil
      : `${BACKEND_BASE_URL}${utilizador.foto_perfil}?t=${Date.now()}`
    : null;

  return (
    <div style={{ position: 'relative', width: tamanho, height: tamanho, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Imagem - absoluta, só aparece se carregar */}
      {urlFoto && (
        <img
          src={urlFoto}
          alt={utilizador?.nome}
          style={{
            width: tamanho,
            height: tamanho,
            borderRadius: '50%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
          onError={(e) => {
            console.error('[DASHBOARD] Erro ao carregar foto:', urlFoto);
            e.target.style.display = 'none';
          }}
        />
      )}
      
      {/* Fallback - iniciais (sempre presente, por baixo) */}
      <span style={{ zIndex: 0 }}>{iniciais(utilizador?.nome || '?')}</span>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const { utilizador, logout, tema, alternarTema } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [sidebarAberta, setSidebarAberta] = useState(false);

  const itens = NAV_POR_PAPEL[utilizador?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/entrar');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar${sidebarAberta ? ' open' : ''}`}>
        {/* Cabeçalho */}
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo">U</div>
            <div className="sidebar__brand-text">
              <div className="sidebar__brand-name">ULEZI XPI</div>
              <div className="sidebar__brand-sub">
                {ROLE_LABELS[utilizador?.role] || utilizador?.role || 'Painel'}
              </div>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="sidebar__nav">
          {itens.map(({ path, icon: Icon, label }) => {
            const activo = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`sidebar__item${activo ? ' active' : ''}`}
                onClick={() => setSidebarAberta(false)}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              <AvatarUsuario utilizador={utilizador} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar__user-name truncate">{utilizador?.nome || '—'}</div>
              <div className="sidebar__user-role">{utilizador?.email}</div>
            </div>
            <button type="button" className="sidebar__logout" onClick={handleLogout} aria-label="Sair">
              <LogOut size={16}/>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarAberta && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* Área principal */}
      <main className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-topbar__icon-btn" onClick={() => setSidebarAberta(a => !a)} aria-label="Menu" style={{ display: 'none' }} id="dl-toggle">
            <Menu size={20}/>
          </button>

          <div style={{ flex: 1 }} />

          <div className="admin-topbar__right">
            <Link
              to="/"
              className="btn btn--secondary btn--sm dashboard-topbar__site-btn"
              aria-label="Ir para o site público"
              title="Site público"
            >
              <Globe size={15} />
              Ir para o site
            </Link>
            <button type="button" className="admin-topbar__icon-btn" onClick={alternarTema} aria-label="Tema">
              {tema === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
            </button>
            <Link to="/perfil" className="admin-topbar__icon-btn" aria-label="Conta e definições" title="Conta e definições">
              <User size={18}/>
            </Link>
          </div>
        </header>

        <div className="admin-page">
          {children}
        </div>
      </main>

      <style>{`@media(max-width:768px){#dl-toggle{display:flex!important}}`}</style>
    </div>
  );
}
