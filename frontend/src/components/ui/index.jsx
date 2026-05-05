// ============================================================
// ULEZI XPB — Componentes UI Reutilizáveis
// ============================================================

import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// ── Spinner ────────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'var(--ciano)' }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.7s linear infinite', display: 'inline-block' }}
      aria-label="Carregando..."
      role="status"
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray="60" strokeDashoffset="20" opacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── PageLoader ────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Spinner size={36} />
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
const COR_BADGE = {
  verde: 'badge--verde', vermelho: 'badge--vermelho', amarelo: 'badge--amarelo',
  ciano: 'badge--ciano', roxo: 'badge--roxo', cinza: 'badge--cinza', laranja: 'badge--laranja',
};

export function Badge({ cor = 'cinza', children }) {
  return <span className={`badge ${COR_BADGE[cor] || 'badge--cinza'}`}>{children}</span>;
}

/** Mapeia status comuns para cor do badge */
export function BadgeStatus({ status }) {
  const mapa = {
    ativo: { cor: 'verde', label: 'Ativo' },
    activo: { cor: 'verde', label: 'Activo' },
    aprovado: { cor: 'verde', label: 'Aprovado' },
    aprovada: { cor: 'verde', label: 'Aprovada' },
    pago: { cor: 'verde', label: 'Pago' },
    confirmado: { cor: 'verde', label: 'Confirmado' },
    pendente: { cor: 'amarelo', label: 'Pendente' },
    aguardando_validacao: { cor: 'amarelo', label: 'Aguardando' },
    inativo: { cor: 'cinza', label: 'Inativo' },
    inactivo: { cor: 'cinza', label: 'Inactivo' },
    rejeitado: { cor: 'vermelho', label: 'Rejeitado' },
    rejeitada: { cor: 'vermelho', label: 'Rejeitada' },
    falhado: { cor: 'vermelho', label: 'Falhado' },
    cancelado: { cor: 'vermelho', label: 'Cancelado' },
    expirada: { cor: 'vermelho', label: 'Expirada' },
    suspenso: { cor: 'roxo', label: 'Suspenso' },
    // Papéis em português
    estudante: { cor: 'ciano', label: 'Estudante' },
    empresa: { cor: 'cinza', label: 'Empresa' },
    investidor: { cor: 'cinza', label: 'Investidor' },
    funcionario: { cor: 'roxo', label: 'Funcionário' },
    admin: { cor: 'laranja', label: 'Administrador' },
    // Papéis em inglês (do banco de dados)
    student: { cor: 'ciano', label: 'Estudante' },
    employee: { cor: 'roxo', label: 'Funcionário' },
    company: { cor: 'cinza', label: 'Empresa' },
    investor: { cor: 'cinza', label: 'Investidor' },
  };
  const item = mapa[status?.toLowerCase()] || { cor: 'cinza', label: status || '—' };
  return <Badge cor={item.cor}>{item.label}</Badge>;
}

// ── Alert ─────────────────────────────────────────────────────
const ICONES_ALERT = {
  success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info,
};

export function Alert({ tipo = 'info', titulo, children, onFechar }) {
  const Icone = ICONES_ALERT[tipo] || Info;
  return (
    <div className={`alert alert--${tipo}`} role="alert">
      <Icone size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        {titulo && <strong style={{ display: 'block', marginBottom: 2 }}>{titulo}</strong>}
        {children}
      </div>
      {onFechar && (
        <button type="button" onClick={onFechar} style={{ marginLeft: 'auto', opacity: 0.7, cursor: 'pointer' }}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ aberto, onFechar, titulo, children, acoes, largura = 520 }) {
  if (!aberto) return null;
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onFechar?.()}
      role="dialog"
      aria-modal
      aria-labelledby="modal-title"
    >
      <div className="modal" style={{ maxWidth: largura }}>
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">{titulo}</h2>
          {onFechar && (
            <button type="button" className="btn btn--ghost" onClick={onFechar} aria-label="Fechar">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="modal__body">{children}</div>
        {acoes && <div className="modal__footer">{acoes}</div>}
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────
export function ModalConfirm({ aberto, onFechar, onConfirmar, titulo, mensagem, labelConfirmar = 'Confirmar', carregando = false, perigo = false }) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={titulo}
      acoes={
        <>
          <button type="button" className="btn btn--secondary" onClick={onFechar} disabled={carregando}>Cancelar</button>
          <button
            type="button"
            className={`btn ${perigo ? 'btn--danger' : 'btn--primary'}${carregando ? ' btn--loading' : ''}`}
            onClick={onConfirmar} disabled={carregando}
          >
            {!carregando && labelConfirmar}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--txt-2)', lineHeight: 1.6 }}>{mensagem}</p>
    </Modal>
  );
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ icone, titulo, descricao, acao }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      {icone && (
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--r-full)',
          background: 'var(--ciano-100)', color: 'var(--ciano)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          {icone}
        </div>
      )}
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--txt-1)', marginBottom: 8, fontSize: '1rem' }}>
        {titulo}
      </p>
      {descricao && <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', marginBottom: 20 }}>{descricao}</p>}
      {acao}
    </div>
  );
}

// ── Skeleton line ─────────────────────────────────────────────
export function Skeleton({ largura = '100%', altura = 16, arredondado = false }) {
  return (
    <div className="skeleton" style={{
      width: largura, height: altura,
      borderRadius: arredondado ? 'var(--r-full)' : 'var(--r-sm)',
    }} />
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, padding = 24, className = '', ...rest }) {
  return (
    <div className={`card ${className}`} style={{ padding }} {...rest}>
      {children}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
export function StatCard({ icone, label, valor, variacao, corIcone = 'var(--ciano-100)', alerta }) {
  const sobe = variacao >= 0;
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div className="stat-card__icon" style={{ background: corIcone }}>{icone}</div>
        {variacao !== undefined && variacao !== null && (
          <span className={`stat-card__badge stat-card__badge--${sobe ? 'up' : 'down'}`}>
            {sobe ? '↑' : '↓'} {Math.abs(variacao)}%
          </span>
        )}
      </div>
      <div
        className="stat-card__value"
        style={alerta ? { color: 'var(--amarelo)' } : undefined}
      >
        {valor}
      </div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────
export function Tabs({ abas, activa, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {abas.map((aba) => (
        <button
          type="button"
          key={aba.id}
          role="tab"
          aria-selected={activa === aba.id}
          className={`tab-btn${activa === aba.id ? ' active' : ''}`}
          onClick={() => onChange(aba.id)}
        >
          {aba.icone}
          {aba.label}
          {aba.count !== undefined && (
            <span style={{
              background: activa === aba.id ? 'var(--ciano)' : 'var(--border)',
              color: activa === aba.id ? 'white' : 'var(--txt-3)',
              fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px',
              borderRadius: 'var(--r-full)',
            }}>
              {aba.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Input controlado com label + erro ─────────────────────────
export function InputField({ label, erro, icone, hint, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className={icone ? 'form-input-wrapper' : undefined}>
        {icone}
        <input
          className={`form-input${icone ? ' form-input--icon' : ''}${erro ? ' form-input--error' : ''}`}
          aria-invalid={!!erro}
          {...props}
        />
      </div>
      {erro  && <span className="form-error"><AlertCircle size={12}/> {erro}</span>}
      {hint  && !erro && <span className="form-hint">{hint}</span>}
    </div>
  );
}

// ── Select controlado ─────────────────────────────────────────
export function SelectField({ label, erro, hint, children, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className={`form-select${erro ? ' form-select--error' : ''}`} aria-invalid={!!erro} {...props}>
        {children}
      </select>
      {erro && <span className="form-error"><AlertCircle size={12}/> {erro}</span>}
      {hint && !erro && <span className="form-hint">{hint}</span>}
    </div>
  );
}

// ── Textarea controlado ───────────────────────────────────────
export function TextareaField({ label, erro, hint, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea
        className={`form-textarea${erro ? ' form-textarea--error' : ''}`}
        aria-invalid={!!erro}
        {...props}
      />
      {erro && <span className="form-error"><AlertCircle size={12}/> {erro}</span>}
      {hint && !erro && <span className="form-hint">{hint}</span>}
    </div>
  );
}
