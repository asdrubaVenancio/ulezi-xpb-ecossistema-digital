// ============================================================
// Sidebar administrativa — grupos colapsáveis, rotas reais, ícones distintos
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardCheck,
  CreditCard,
  ChevronDown,
  FileText,
  Folder,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MailWarning,
  MapPinned,
  MessageSquare,
  ScrollText,
  Search,
  Settings,
  Shield,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  Zap,
  Scale,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_NAV_GRUPOS, pathParaSecaoAdmin } from '../../config/adminNav';
import { iniciais } from '../../utils/constants';

const STORAGE_KEY = 'ulezi-admin-nav-abertos';

/** Ícone por ID de secção — evita repetição visual no menu */
const ICONE_POR_SECAO = {
  painel: LayoutDashboard,
  notificacoes: Bell,
  cursos: BookOpen,
  centros: Building2,
  ofertas: Zap,
  inscricoes: ClipboardCheck,
  empresas: Landmark,
  oportunidades: TrendingUp,
  interesses: HeartHandshake,
  investimentos: Wallet,
  mediacao: Scale,
  contratos: ScrollText,
  assinaturas: FileText,
  utilizadores: Users,
  funcionarios: UserCog,
  consultoria: MessageSquare,
  visitas: MapPinned,
  suporte: LifeBuoy,
  'notificacoes-assinatura': MailWarning,
  pagamentos: CreditCard,
  vagas: Briefcase,
  ficheiros: Folder,
  seguranca: Shield,
  configuracoes: Settings,
};

function lerGruposAbertos() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Sidebar({ secaoActiva, notifCount = 0, aberta, onFechar }) {
  const { utilizador, logout } = useAuth();
  const [filtro, setFiltro] = useState('');
  const [abertos, setAbertos] = useState(() => {
    const saved = lerGruposAbertos();
    if (saved && typeof saved === 'object') return saved;
    return Object.fromEntries(ADMIN_NAV_GRUPOS.map((g) => [g.id, true]));
  });

  // Garante que o grupo da secção activa fica visível ao mudar de página
  useEffect(() => {
    const grupoActivo = ADMIN_NAV_GRUPOS.find((g) =>
      g.itens.some((i) => i.id === secaoActiva),
    );
    if (grupoActivo) {
      setAbertos((prev) => ({ ...prev, [grupoActivo.id]: true }));
    }
  }, [secaoActiva]);

  const persistirAbertos = useCallback((next) => {
    setAbertos(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignorar quota / modo privado */
    }
  }, []);

  const toggleGrupo = (id) => {
    persistirAbertos({ ...abertos, [id]: !abertos[id] });
  };

  const filtroNorm = filtro.trim().toLowerCase();

  const gruposFiltrados = useMemo(() => {
    if (!filtroNorm) return ADMIN_NAV_GRUPOS;
    return ADMIN_NAV_GRUPOS.map((g) => ({
      ...g,
      itens: g.itens.filter(
        (i) =>
          i.label.toLowerCase().includes(filtroNorm) ||
          g.label.toLowerCase().includes(filtroNorm),
      ),
    })).filter((g) => g.itens.length > 0);
  }, [filtroNorm]);

  const fecharSeMobile = () => {
    if (onFechar) onFechar();
  };

  return (
    <>
      {aberta && (
        <div
          className="sidebar-overlay"
          onClick={onFechar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar${aberta ? ' open' : ''}`}
        aria-label="Navegação do painel administrativo"
      >
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo-mark" aria-hidden="true">
              <span className="sidebar__logo-glyph">U</span>
            </div>
            <div className="sidebar__brand-text">
              <div className="sidebar__brand-name">ULEZI XPB</div>
              <div className="sidebar__brand-sub">Administração</div>
            </div>
          </div>
        </div>

        <div className="sidebar__find">
          <Search size={14} className="sidebar__find-icon" aria-hidden />
          <input
            type="search"
            className="sidebar__find-input"
            placeholder="Filtrar menu…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            aria-label="Filtrar itens do menu"
          />
        </div>

        <nav className="sidebar__nav" role="navigation">
          {gruposFiltrados.map((grupo) => {
            const expandido = abertos[grupo.id] !== false;
            return (
              <section key={grupo.id} className="sidebar__group">
                <button
                  type="button"
                  className="sidebar__group-toggle"
                  onClick={() => toggleGrupo(grupo.id)}
                  aria-expanded={expandido}
                >
                  <span className="sidebar__section">{grupo.label}</span>
                  <ChevronDown
                    size={16}
                    className={`sidebar__chevron${expandido ? ' sidebar__chevron--open' : ''}`}
                    aria-hidden
                  />
                </button>
                {expandido &&
                  grupo.itens.map(({ id, label, badge }) => {
                    const Icone = ICONE_POR_SECAO[id] || LayoutDashboard;
                    const to = pathParaSecaoAdmin(id);
                    const contagem = badge && notifCount > 0 ? notifCount : null;
                    return (
                      <NavLink
                        key={id}
                        to={to}
                        end={id === 'painel'}
                        className={({ isActive }) => {
                          const activo = isActive || secaoActiva === id;
                          return `sidebar__item${activo ? ' active' : ''}`;
                        }}
                        onClick={fecharSeMobile}
                      >
                        <Icone size={16} strokeWidth={2} aria-hidden />
                        <span className="sidebar__item-label">{label}</span>
                        {contagem != null && (
                          <span className="sidebar__badge">
                            {contagem > 99 ? '99+' : contagem}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
              </section>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar" aria-hidden="true">
              {iniciais(utilizador?.nome || 'Admin')}
            </div>
            <div className="sidebar__user-meta">
              <div className="sidebar__user-name truncate">
                {utilizador?.nome || 'Administrador'}
              </div>
              <div className="sidebar__user-role truncate">
                {utilizador?.email || '—'}
              </div>
            </div>
            <button
              type="button"
              className="sidebar__logout"
              onClick={logout}
              title="Terminar sessão"
              aria-label="Terminar sessão"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
