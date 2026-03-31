// ============================================================
// ULEZI XPB — Navbar Pública
// Fiel ao protótipo Figma: logo + nav + botões auth + toggle tema
// ============================================================

import React, { useState, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DASHBOARD } from '../../utils/constants';

export default function Navbar() {
  const { estaAutenticado, utilizador, logout, tema, alternarTema } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/entrar');
  }, [logout, navigate]);

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar__logo">
        <LogoIcon />
        ULEZI<span>XPB</span>
      </Link>

      {/* Links de navegação (desktop) */}
      <div className="navbar__nav">
        <NavLink to="/cursos"      className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Cursos</NavLink>
        <NavLink to="/negocios"    className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Negócios</NavLink>
        <NavLink to="/comunidade"  className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Comunidade</NavLink>
      </div>

      {/* Acções (direita) */}
      <div className="navbar__actions">
        {/* Toggle de tema */}
        <button
          onClick={alternarTema}
          className="btn btn--ghost"
          aria-label={tema === 'light' ? 'Activar modo escuro' : 'Activar modo claro'}
          title={tema === 'light' ? 'Modo escuro' : 'Modo claro'}
        >
          {tema === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {estaAutenticado ? (
          <>
            <Link
              to={ROLE_DASHBOARD[utilizador?.role] || '/'}
              className="btn btn--secondary btn--sm"
            >
              <User size={15} />
              Dashboard
            </Link>
            <button onClick={handleLogout} className="btn btn--ghost" title="Sair">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link to="/entrar" className="btn btn--secondary btn--sm">Entrar</Link>
            <Link to="/criar-conta" className="btn btn--primary  btn--sm">Criar Conta</Link>
          </>
        )}

        {/* Menu mobile */}
        <button
          className="btn btn--ghost navbar__menu-toggle"
          onClick={() => setMenuAberto(a => !a)}
          aria-label="Menu"
        >
          {menuAberto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Menu mobile dropdown */}
      {menuAberto && (
        <div
          className="navbar__mobile-menu"
          style={{
            position: 'absolute', top: 'var(--header-h)', left: 0, right: 0,
            background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
            padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px',
            zIndex: 99,
          }}
          onClick={() => setMenuAberto(false)}
        >
          <NavLink to="/cursos"     className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Cursos</NavLink>
          <NavLink to="/negocios"   className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Negócios</NavLink>
          <NavLink to="/comunidade" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Comunidade</NavLink>
          {!estaAutenticado && (
            <>
              <Link to="/entrar" className="btn btn--secondary btn--sm" style={{ marginTop: 8 }}>Entrar</Link>
              <Link to="/criar-conta" className="btn btn--primary  btn--sm">Criar Conta</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

/** Ícone logo SVG inline */
function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#00BCD4"/>
      <text y="23" x="6" fontSize="18" fontWeight="900" fill="white" fontFamily="sans-serif">U</text>
    </svg>
  );
}
