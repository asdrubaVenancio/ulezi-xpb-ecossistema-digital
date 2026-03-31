// ============================================================
// ULEZI XPB — Footer Público
// ============================================================

import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          {/* Marca */}
          <div>
            <div className="footer__brand-name">
              <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden>
                <rect width="32" height="32" rx="7" fill="#00BCD4"/>
                <text y="23" x="6" fontSize="18" fontWeight="900" fill="white" fontFamily="sans-serif">U</text>
              </svg>
              ULEZI<span>XPB</span>
            </div>
            <p className="footer__brand-desc">
              Ecossistema digital que conecta educação, investimento e comunidade.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <p className="footer__col-title">Plataforma</p>
            <nav className="footer__links">
              <Link to="/cursos"     className="footer__link">Cursos</Link>
              <Link to="/negocios"   className="footer__link">Negócios</Link>
              <Link to="/comunidade" className="footer__link">Comunidade</Link>
            </nav>
          </div>

          {/* Conta */}
          <div>
            <p className="footer__col-title">Conta</p>
            <nav className="footer__links">
              <Link to="/entrar"      className="footer__link">Entrar</Link>
              <Link to="/criar-conta" className="footer__link">Criar Conta</Link>
            </nav>
          </div>

          {/* Jurídico */}
          <div>
            <p className="footer__col-title">Jurídico</p>
            <nav className="footer__links">
              <Link to="/termos"      className="footer__link">Termos de Uso</Link>
              <Link to="/privacidade" className="footer__link">Privacidade</Link>
            </nav>
          </div>
        </div>

        <div className="footer__bottom">
          © {ano} ULEZI XPB. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
