import React from 'react';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';

export const lerLista = (payload, chave) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados?.[chave])) return payload.dados[chave];
  if (Array.isArray(payload?.data?.dados?.[chave])) return payload.data.dados[chave];
  if (Array.isArray(payload?.[chave])) return payload[chave];
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const lerObjeto = (payload, chave) => {
  if (!payload) return {};
  if (payload?.dados?.[chave] && typeof payload.dados[chave] === 'object') return payload.dados[chave];
  if (payload?.data?.dados?.[chave] && typeof payload.data.dados[chave] === 'object') return payload.data.dados[chave];
  if (payload?.[chave] && typeof payload[chave] === 'object') return payload[chave];
  if (payload?.dados && typeof payload.dados === 'object' && !Array.isArray(payload.dados)) return payload.dados;
  if (typeof payload === 'object' && !Array.isArray(payload)) return payload;
  return {};
};

export const formatarData = (valor) => {
  if (!valor) return 'Sem data';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return 'Sem data';
  return data.toLocaleDateString('pt-AO');
};

export const formatarDataHora = (valor) => {
  if (!valor) return 'Sem data';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return 'Sem data';
  return data.toLocaleString('pt-AO');
};

export const formatarMoeda = (valor, moeda = 'AOA') => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: moeda || 'AOA',
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
};

export function PaginaModulo({ titulo, subtitulo, acoes, children }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">{titulo}</h2>
          <p className="page-header__sub">{subtitulo}</p>
        </div>
        {acoes ? <div className="page-header__actions">{acoes}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function GradeResumo({ children, colunas = 'repeat(auto-fit, minmax(220px, 1fr))' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: colunas, gap: 16, marginBottom: 20 }}>
      {children}
    </div>
  );
}

export function ResumoCard({ icone, titulo, valor, detalhe, cor = 'var(--ciano-100)', destaque = 'var(--ciano)' }) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon" style={{ background: cor, color: destaque }}>
        {icone}
      </div>
      <div className="stat-card__value">{valor}</div>
      <div className="stat-card__label">{titulo}</div>
      {detalhe ? <div style={{ marginTop: 6, fontSize: '0.76rem', color: 'var(--txt-3)' }}>{detalhe}</div> : null}
    </div>
  );
}

export function Painel({ children, style }) {
  return (
    <div className="card" style={{ padding: 20, ...style }}>
      {children}
    </div>
  );
}

export function BarraFerramentas({ pesquisa, onPesquisa, filtros, botoes, compacta = false }) {
  return (
    <Painel style={{ marginBottom: 18 }}>
      <div className={`module-toolbar${compacta ? ' module-toolbar--compact' : ''}`}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Pesquisa</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-4)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 38 }}
              value={pesquisa}
              onChange={(event) => onPesquisa?.(event.target.value)}
              placeholder="Filtrar resultados..."
            />
          </div>
        </div>
        {filtros}
      </div>
      {botoes ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          {botoes}
        </div>
      ) : null}
    </Painel>
  );
}

export function TabelaModulo({ colunas, children }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna}>{coluna}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function LinhaVazia({ titulo, descricao }) {
  return (
    <Painel style={{ textAlign: 'center', color: 'var(--txt-3)' }}>
      <AlertCircle size={30} style={{ margin: '0 auto 12px', opacity: 0.45 }} />
      <div style={{ fontWeight: 700, color: 'var(--txt-2)', marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontSize: '0.85rem' }}>{descricao}</div>
    </Painel>
  );
}

export function BotaoAtualizar({ onClick, loading, children = 'Actualizar' }) {
  return (
    <button className={`btn btn--secondary btn--sm${loading ? ' btn--loading' : ''}`} onClick={onClick} disabled={loading}>
      {!loading && <><RefreshCw size={14} /> {children}</>}
    </button>
  );
}

export function BadgeModulo({ tonalidade = 'cinza', children }) {
  return <span className={`badge badge--${tonalidade}`}>{children}</span>;
}

export function badgeEstado(estado) {
  const valor = String(estado || '').toLowerCase();
  if (['ativo', 'ativa', 'approved', 'aprovada', 'realizada', 'resolvido', 'concluida', 'sucesso', 'enviado'].includes(valor)) return 'verde';
  if (['pendente', 'pending', 'aberto', 'agendada', 'em_atendimento', 'em_andamento', 'aguardando_resposta'].includes(valor)) return 'amarelo';
  if (['cancelada', 'cancelado', 'rejeitada', 'reprovado', 'falhou', 'vencida', 'fechado'].includes(valor)) return 'vermelho';
  if (['critico', 'urgente', 'alta'].includes(valor)) return 'laranja';
  if (['confirmada', 'em_mediacao', 'em_negociacao', 'media'].includes(valor)) return 'ciano';
  return 'cinza';
}

export function ModalBloco({ titulo, subtitulo, children }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <div style={{ fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--txt-1)', fontSize: '1.1rem' }}>{titulo}</div>
        {subtitulo ? <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem', marginTop: 4 }}>{subtitulo}</div> : null}
      </div>
      {children}
    </div>
  );
}
