// ============================================================
// ULEZI XPB — Sidebar Administrativa
// Fiel ao protótipo: seções GERAL, GESTÃO, FINANCEIRO, SISTEMA
// ============================================================

import {
    Bell,
    BookOpen,
    Briefcase,
    Building2,
    ClipboardCheck,
    CreditCard, FileText, Folder,
    LayoutDashboard,
    LogOut,
    Settings,
    Shield,
    TrendingUp,
    Users,
} from 'lucide-react';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { iniciais } from '../../utils/constants';

/** Mapeamento de secções e itens */
const NAV_ITEMS = [
  {
    secao: 'GERAL',
    itens: [
      { id: 'painel',        label: 'Painel Geral',   icon: LayoutDashboard },
      { id: 'notificacoes',  label: 'Notificações',   icon: Bell,  badge: null },
    ],
  },
  {
    secao: 'GESTÃO',
    itens: [
      { id: 'utilizadores',  label: 'Utilizadores',   icon: Users },
      { id: 'cursos',        label: 'Cursos',          icon: BookOpen },
      { id: 'centros',       label: 'Centros',         icon: Building2 },
      { id: 'ofertas',       label: 'Ofertas',         icon: TrendingUp },
      { id: 'inscricoes',    label: 'Inscrições',      icon: ClipboardCheck },
      { id: 'empresas',      label: 'Empresas',        icon: Building2 },
      { id: 'investimentos', label: 'Investimentos',   icon: TrendingUp },
      { id: 'funcionarios',  label: 'Funcionários',    icon: Users },
      { id: 'mediacao',     label: 'Mediação',        icon: TrendingUp },
      { id: 'consultoria',  label: 'Consultoria',     icon: Briefcase },
      { id: 'assinaturas',  label: 'Assinaturas',     icon: FileText },
      { id: 'visitas',      label: 'Visitas',         icon: Building2 },
      { id: 'suporte',      label: 'Suporte',         icon: Bell },
      { id: 'interesses',   label: 'Interesses',      icon: TrendingUp },
      { id: 'notificacoes-assinatura', label: 'Notif. Assinatura', icon: Bell },
    ],
  },
  {
    secao: 'FINANCEIRO',
    itens: [
      { id: 'pagamentos',    label: 'Pagamentos',      icon: CreditCard },
      { id: 'contratos',     label: 'Contratos',       icon: FileText },
      { id: 'vagas',         label: 'Vagas Empresas',  icon: Briefcase },
      { id: 'oportunidades', label: 'Oportunidades',   icon: TrendingUp },
    ],
  },
  {
    secao: 'SISTEMA',
    itens: [
      { id: 'ficheiros',     label: 'Ficheiros',       icon: Folder },
      { id: 'seguranca',     label: 'Segurança',       icon: Shield },
      { id: 'configuracoes', label: 'Configurações',   icon: Settings },
    ],
  },
];

/**
 * @param {{ secaoActiva: string, onNavegar: (id: string) => void, notifCount?: number }} props
 */
export default function Sidebar({ secaoActiva, onNavegar, notifCount = 0, aberta, onFechar }) {
  const { utilizador, logout } = useAuth();

  return (
    <>
      {/* Overlay mobile */}
      {aberta && (
        <div
          className="sidebar-overlay"
          onClick={onFechar}
        />
      )}

      <aside className={`sidebar${aberta ? ' open' : ''}`} aria-label="Navegação principal">
        {/* Cabeçalho com logo */}
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo" aria-hidden>U</div>
            <div className="sidebar__brand-text">
              <div className="sidebar__brand-name">ULEZI XPB</div>
              <div className="sidebar__brand-sub">Painel Admin</div>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="sidebar__nav" role="navigation">
          {NAV_ITEMS.map(({ secao, itens }) => (
            <React.Fragment key={secao}>
              <div className="sidebar__section">{secao}</div>
              {itens.map(({ id, label, icon: Icon }) => {
                const badge = id === 'notificacoes' && notifCount > 0 ? notifCount : null;
                return (
                  <div
                    key={id}
                    className={`sidebar__item${secaoActiva === id ? ' active' : ''}`}
                    onClick={() => { onNavegar(id); if (onFechar) onFechar(); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onNavegar(id)}
                    aria-current={secaoActiva === id ? 'page' : undefined}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                    {badge && <span className="sidebar__badge">{badge > 99 ? '99+' : badge}</span>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Rodapé com utilizador */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar" aria-hidden>
              {iniciais(utilizador?.nome || 'Admin')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar__user-name truncate">{utilizador?.nome || 'Administrador'}</div>
              <div className="sidebar__user-role">{utilizador?.email || 'admin@ulezi.com'}</div>
            </div>
            <button
              className="sidebar__logout"
              onClick={logout}
              title="Sair"
              aria-label="Terminar sessão"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
