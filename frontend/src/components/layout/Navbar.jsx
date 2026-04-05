// ============================================================
// ULEZI XPB — Navbar Pública
// Navegação principal com menu mobile animado e toggle de tema
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun, User, X } from 'lucide-react';
import { useAuth }       from '../../context/AuthContext';
import { ROLE_DASHBOARD } from '../../utils/constants';

export default function Navbar() {
  const { estaAutenticado, utilizador, logout, tema, alternarTema } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/entrar');
  }, [logout, navigate]);

  // Fechar menu mobile ao redimensionar para desktop
  useEffect(() => {
    const fechar = () => { if (window.innerWidth > 768) setMenuAberto(false); };
    window.addEventListener('resize', fechar);
    return () => window.removeEventListener('resize', fechar);
  }, []);

  // Bloquear scroll do body quando menu mobile está aberto
  useEffect(() => {
    document.body.style.overflow = menuAberto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuAberto]);

  return (
    <nav className="navbar" role="navigation" aria-label="Navegação principal">
      {/* Logo */}
      <Link to="/" className="navbar__logo" aria-label="ULEZI XPB — Página inicial">
        <LogoIcon />
        ULEZI<span>XPB</span>
      </Link>

      {/* Links de navegação (desktop) */}
      <div className="navbar__nav">
        <NavLink to="/cursos"     className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Cursos</NavLink>
        <NavLink to="/negocios"   className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Negócios</NavLink>
        <NavLink to="/comunidade" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Comunidade</NavLink>
      </div>

      {/* Acções (direita) */}
      <div className="navbar__actions">
        {/* Toggle de tema */}
        <button
          type="button"
          onClick={alternarTema}
          className="btn btn--ghost navbar__theme-toggle"
          aria-label={tema === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
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
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn--ghost"
              title="Terminar sessão"
              aria-label="Terminar sessão"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link to="/entrar" className="btn btn--secondary btn--sm navbar__desktop-only">
              Entrar
            </Link>
            <Link to="/criar-conta" className="btn btn--primary btn--sm navbar__desktop-only">
              Criar Conta
            </Link>
          </>
        )}

        {/* Botão menu mobile */}
        <button
          type="button"
          className="btn btn--ghost navbar__menu-toggle"
          onClick={() => setMenuAberto((a) => !a)}
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
        >
          {menuAberto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Overlay mobile */}
      <div
        className={`navbar__mobile-overlay${menuAberto ? ' navbar__mobile-overlay--visible' : ''}`}
        onClick={() => setMenuAberto(false)}
        aria-hidden="true"
      />

      {/* Menu mobile dropdown com animação */}
      <div
        className={`navbar__mobile-menu${menuAberto ? ' navbar__mobile-menu--open' : ''}`}
        role="menu"
        aria-hidden={!menuAberto}
      >
        <NavLink
          to="/cursos"
          className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}
          onClick={() => setMenuAberto(false)}
        >
          Cursos
        </NavLink>
        <NavLink
          to="/negocios"
          className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}
          onClick={() => setMenuAberto(false)}
        >
          Negócios
        </NavLink>
        <NavLink
          to="/comunidade"
          className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}
          onClick={() => setMenuAberto(false)}
        >
          Comunidade
        </NavLink>

        {/* Separador + acções auth (mobile) */}
        <div className="navbar__mobile-divider" />

        {estaAutenticado ? (
          <>
            <Link
              to={ROLE_DASHBOARD[utilizador?.role] || '/'}
              className="navbar__mobile-link"
              onClick={() => setMenuAberto(false)}
            >
              <User size={16} /> Ir para o Dashboard
            </Link>
            <button
              type="button"
              className="navbar__mobile-link navbar__mobile-link--danger"
              onClick={() => { setMenuAberto(false); handleLogout(); }}
            >
              <LogOut size={16} /> Terminar sessão
            </button>
          </>
        ) : (
          <div className="navbar__mobile-auth">
            <Link
              to="/entrar"
              className="btn btn--secondary btn--full"
              onClick={() => setMenuAberto(false)}
            >
              Entrar
            </Link>
            <Link
              to="/criar-conta"
              className="btn btn--primary btn--full"
              onClick={() => setMenuAberto(false)}
            >
              Criar Conta
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

// ── Ícone logo SVG inline ───────────────────────────────────
function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="ulezi-logo-nav" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#17C1D8" />
          <stop offset="0.58" stopColor="#1782B5" />
          <stop offset="1" stopColor="#F6A400" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#ulezi-logo-nav)" />
      <text y="23" x="6" fontSize="18" fontWeight="900" fill="white" fontFamily="sans-serif">U</text>
    </svg>
  );
}
