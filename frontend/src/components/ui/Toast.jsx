// ============================================================
// ULEZI XPB — Sistema de Toast / Notificações Moderno
// Uso: toast.sucesso('msg'), toast.erro('msg'), toast.aviso('msg'), toast.info('msg')
// Confirmação: toast.confirmar({ titulo, mensagem, onConfirmar })
// ============================================================

import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2, XCircle, AlertTriangle, Info,
  X, AlertCircle, Loader2,
} from 'lucide-react';

// ── Contexto global ───────────────────────────────────────────
const ToastContext = createContext(null);

let toastExterno = null; // Referência para uso fora de componentes React

// ── Provider ──────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts,   setToasts]   = useState([]);
  const [confirm,  setConfirm]  = useState(null); // { titulo, mensagem, variante, onConfirmar, onCancelar, labelOk, labelCancel }
  const [carregando, setCarregando] = useState(false);
  const idRef = useRef(0);

  const adicionar = useCallback((tipo, mensagem, opcoes = {}) => {
    const id = ++idRef.current;
    const duracao = opcoes.duracao ?? (tipo === 'erro' ? 6000 : 4000);
    setToasts(t => [...t, { id, tipo, mensagem, duracao, ...opcoes }]);
    return id;
  }, []);

  const remover = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const api = {
    sucesso: (msg, opts) => adicionar('sucesso',  msg, opts),
    erro:    (msg, opts) => adicionar('erro',     msg, opts),
    aviso:   (msg, opts) => adicionar('aviso',    msg, opts),
    info:    (msg, opts) => adicionar('info',     msg, opts),
    carregarInicio: () => setCarregando(true),
    carregarFim:    () => setCarregando(false),

    /** Modal de confirmação assíncrona */
    confirmar: (opcoes) => new Promise((resolve) => {
      setConfirm({
        titulo:      opcoes.titulo      || 'Confirmar acção',
        mensagem:    opcoes.mensagem    || 'Tem a certeza?',
        variante:    opcoes.variante    || 'perigo', // perigo | primario
        labelOk:     opcoes.labelOk     || 'Confirmar',
        labelCancel: opcoes.labelCancel || 'Cancelar',
        onConfirmar: () => { setConfirm(null); resolve(true); },
        onCancelar:  () => { setConfirm(null); resolve(false); },
      });
    }),
  };

  // Exposição global (uso fora do React)
  useEffect(() => { toastExterno = api; }, [api]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Área de toasts */}
      {createPortal(
        <ToastArea toasts={toasts} onRemover={remover} />,
        document.body
      )}

      {/* Modal de confirmação */}
      {confirm && createPortal(
        <ModalConfirmacao
          {...confirm}
          onFechar={confirm.onCancelar}
        />,
        document.body
      )}

      {/* Overlay de carregamento global */}
      {carregando && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
            padding: '28px 40px', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: 'var(--shadow-xl)',
          }}>
            <Loader2 size={24} color="var(--ciano)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>A processar...</span>
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}

/** Acesso fora do React (ex: em api.js) */
export const toast = {
  sucesso: (...a) => toastExterno?.sucesso(...a),
  erro:    (...a) => toastExterno?.erro(...a),
  aviso:   (...a) => toastExterno?.aviso(...a),
  info:    (...a) => toastExterno?.info(...a),
  confirmar: (...a) => toastExterno?.confirmar(...a),
};

// ── Área de toasts ────────────────────────────────────────────
function ToastArea({ toasts, onRemover }) {
  return (
    <div
      aria-live="polite"
      aria-label="Notificações"
      style={{
        position: 'fixed',
        bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column-reverse', gap: 10,
        zIndex: 9998,
        maxWidth: 380,
      }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onRemover={onRemover} />
      ))}
    </div>
  );
}

// ── Item individual de toast ──────────────────────────────────
const CONFIG_TIPO = {
  sucesso: {
    icone: CheckCircle2,
    bg:    'var(--verde-100)',
    cor:   '#15803D',
    borda: '#BBF7D0',
  },
  erro: {
    icone: XCircle,
    bg:    'var(--vermelho-100)',
    cor:   '#B91C1C',
    borda: '#FECACA',
  },
  aviso: {
    icone: AlertTriangle,
    bg:    'var(--amarelo-100)',
    cor:   '#92400E',
    borda: '#FDE68A',
  },
  info: {
    icone: Info,
    bg:    'var(--ciano-100)',
    cor:   'var(--ciano-600)',
    borda: '#A5F3FC',
  },
};

function ToastItem({ id, tipo, mensagem, duracao, titulo, onRemover }) {
  const [visivelAnima, setVisivelAnima] = useState(false);
  const [progresso, setProgresso]       = useState(100);
  const { icone: Icone, bg, cor, borda } = CONFIG_TIPO[tipo] || CONFIG_TIPO.info;

  // Animar entrada
  useEffect(() => {
    requestAnimationFrame(() => setVisivelAnima(true));
  }, []);

  // Auto-remover com progresso
  useEffect(() => {
    if (!duracao) return;
    const inicio = Date.now();
    const tick = setInterval(() => {
      const decorrido = Date.now() - inicio;
      const pct = Math.max(0, 100 - (decorrido / duracao) * 100);
      setProgresso(pct);
      if (pct <= 0) {
        clearInterval(tick);
        sair();
      }
    }, 50);
    return () => clearInterval(tick);
  }, [duracao, id]);

  const sair = useCallback(() => {
    setVisivelAnima(false);
    setTimeout(() => onRemover(id), 300);
  }, [id, onRemover]);

  return (
    <div
      role="alert"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${borda}`,
        borderLeft: `4px solid ${cor}`,
        borderRadius: 'var(--r-lg)',
        padding: '14px 16px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        position: 'relative', overflow: 'hidden',
        transform: visivelAnima ? 'translateX(0) scale(1)' : 'translateX(120%) scale(0.9)',
        opacity: visivelAnima ? 1 : 0,
        transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1), opacity 280ms ease',
        maxWidth: 380,
        minWidth: 280,
      }}
    >
      {/* Ícone */}
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <Icone size={18} color={cor} />
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {titulo && (
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: cor, marginBottom: 2 }}>
            {titulo}
          </p>
        )}
        <p style={{ fontSize: '0.85rem', color: 'var(--txt-2)', lineHeight: 1.5 }}>
          {mensagem}
        </p>
      </div>

      {/* Botão fechar */}
      <button
        onClick={sair}
        aria-label="Fechar notificação"
        style={{
          flexShrink: 0, color: 'var(--txt-4)', cursor: 'pointer',
          padding: 2, borderRadius: 'var(--r-xs)',
          transition: 'color 150ms',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-2)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-4)'}
      >
        <X size={15} />
      </button>

      {/* Barra de progresso */}
      {duracao > 0 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          height: 3, background: cor, opacity: 0.5,
          width: `${progresso}%`, transition: 'width 50ms linear',
          borderRadius: '0 0 0 var(--r-sm)',
        }} />
      )}
    </div>
  );
}

// ── Modal de Confirmação ──────────────────────────────────────
function ModalConfirmacao({ titulo, mensagem, variante, labelOk, labelCancel, onConfirmar, onCancelar }) {
  const [carregando, setCarregando] = useState(false);

  const handleConfirmar = async () => {
    setCarregando(true);
    try { await onConfirmar(); } finally { setCarregando(false); }
  };

  // Fechar com Escape
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onCancelar();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancelar]);

  const corBotao = variante === 'perigo' ? 'var(--vermelho)' : 'var(--ciano)';
  const bgBotao  = variante === 'perigo' ? '#DC2626' : 'var(--ciano-600)';
  const IconeModal = variante === 'perigo' ? AlertCircle : Info;
  const corIcone   = variante === 'perigo' ? 'var(--vermelho)' : 'var(--ciano)';
  const bgIcone    = variante === 'perigo' ? 'var(--vermelho-100)' : 'var(--ciano-100)';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9997, padding: 20,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 150ms ease',
      }}
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--r-2xl)',
          padding: '28px',
          width: '100%', maxWidth: 400,
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideUp 200ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Ícone + Título */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-full)',
            background: bgIcone, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconeModal size={22} color={corIcone} />
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.05rem',
              fontWeight: 700, color: 'var(--txt-1)', marginBottom: 6,
            }}>
              {titulo}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--txt-3)', lineHeight: 1.6 }}>
              {mensagem}
            </p>
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onCancelar}
            disabled={carregando}
            style={{
              padding: '9px 20px', borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              color: 'var(--txt-2)', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer', transition: 'background 150ms',
            }}
          >
            {labelCancel}
          </button>
          <button
            onClick={handleConfirmar}
            disabled={carregando}
            style={{
              padding: '9px 20px', borderRadius: 'var(--r-md)',
              background: corBotao, border: 'none',
              color: 'white', fontWeight: 600, fontSize: '0.875rem',
              cursor: carregando ? 'not-allowed' : 'pointer',
              opacity: carregando ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 150ms',
            }}
            onMouseEnter={e => !carregando && (e.currentTarget.style.background = bgBotao)}
            onMouseLeave={e => !carregando && (e.currentTarget.style.background = corBotao)}
          >
            {carregando ? (
              <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> A processar...</>
            ) : labelOk}
          </button>
        </div>
      </div>
    </div>
  );
}
