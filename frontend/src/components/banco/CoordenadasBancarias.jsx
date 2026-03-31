/**
 * Componente de exibição de coordenadas bancárias para alunos
 * Permite visualizar e copiar os dados bancários para pagamento
 */
import { useState, useEffect, useCallback } from 'react';
import { coordenadasBancariasAPI } from '../../services/api.js';
import { CreditCard, Copy, Check, Building2, Wallet, Landmark, AlertCircle } from 'lucide-react';

// Ícones por tipo de coordenada
const iconesPorTipo = {
  IBAN: Landmark,
  MULTICAIXA_EXPRESS: Wallet,
  CONTA_BANCARIA: Building2,
  OUTRO: CreditCard,
};

// Labels por tipo de coordenada
const labelsPorTipo = {
  IBAN: 'IBAN',
  MULTICAIXA_EXPRESS: 'Multicaixa Express',
  CONTA_BANCARIA: 'Conta Bancária',
  OUTRO: 'Outro',
};

/**
 * Componente individual de coordenada bancária
 */
const CoordenadaCard = ({ coordenada }) => {
  const [copiado, setCopiado] = useState({
    numero: false,
    titular: false,
  });

  const Icone = iconesPorTipo[coordenada.tipo] || CreditCard;

  /**
   * Copia texto para a área de transferência
   */
  const copiarParaClipboard = useCallback(async (texto, campo) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado((prev) => ({ ...prev, [campo]: true }));

      // Reseta o estado após 2 segundos
      setTimeout(() => {
        setCopiado((prev) => ({ ...prev, [campo]: false }));
      }, 2000);
    } catch (err) {
      console.error('[COPY_ERROR]', err);
      // Fallback para dispositivos móveis
      const textArea = document.createElement('textarea');
      textArea.value = texto;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      setCopiado((prev) => ({ ...prev, [campo]: true }));
      setTimeout(() => {
        setCopiado((prev) => ({ ...prev, [campo]: false }));
      }, 2000);
    }
  }, []);

  return (
    <div
      style={{
        background: 'var(--surface-0)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--border-1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}
    >
      {/* Header com ícone e tipo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <Icone size={22} />
        </div>
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--txt-1)',
              margin: 0,
            }}
          >
            {coordenada.titulo}
          </h4>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--primary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {labelsPorTipo[coordenada.tipo]}
          </span>
        </div>
      </div>

      {/* Número da coordenada com botão de copiar */}
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            color: 'var(--txt-3)',
            marginBottom: '6px',
            fontWeight: 500,
          }}
        >
          Número
        </label>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            background: 'var(--surface-1)',
            borderRadius: '10px',
            padding: '12px 16px',
            border: '1px solid var(--border-1)',
          }}
        >
          <code
            style={{
              flex: 1,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.9rem',
              color: 'var(--txt-1)',
              letterSpacing: '0.5px',
              wordBreak: 'break-all',
            }}
          >
            {coordenada.numero_formatado || coordenada.numero}
          </code>
          <button
            onClick={() => copiarParaClipboard(coordenada.numero, 'numero')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: copiado.numero ? 'var(--success-light)' : 'var(--primary)',
              color: copiado.numero ? 'var(--success)' : 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            aria-label={copiado.numero ? 'Copiado!' : 'Copiar número'}
          >
            {copiado.numero ? <Check size={14} /> : <Copy size={14} />}
            {copiado.numero ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Titular */}
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            color: 'var(--txt-3)',
            marginBottom: '6px',
            fontWeight: 500,
          }}
        >
          Titular
        </label>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            background: 'var(--surface-1)',
            borderRadius: '10px',
            padding: '10px 16px',
            border: '1px solid var(--border-1)',
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: '0.9rem',
              color: 'var(--txt-1)',
              fontWeight: 500,
            }}
          >
            {coordenada.titular}
          </span>
          <button
            onClick={() => copiarParaClipboard(coordenada.titular, 'titular')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: copiado.titular ? 'var(--success-light)' : 'transparent',
              color: copiado.titular ? 'var(--success)' : 'var(--txt-3)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-label={copiado.titular ? 'Copiado!' : 'Copiar titular'}
          >
            {copiado.titular ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Banco (opcional) */}
      {coordenada.banco && (
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'var(--txt-3)',
              marginBottom: '4px',
              fontWeight: 500,
            }}
          >
            Banco
          </label>
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--txt-2)',
            }}
          >
            {coordenada.banco}
          </span>
        </div>
      )}

      {/* Descrição (opcional) */}
      {coordenada.descricao && (
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--txt-3)',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-1)',
            lineHeight: 1.5,
          }}
        >
          {coordenada.descricao}
        </p>
      )}
    </div>
  );
};

/**
 * Componente principal de coordenadas bancárias
 * Exibe todas as coordenadas disponíveis para pagamento
 */
const CoordenadasBancarias = ({ onContinuar, mostrarBotaoContinuar = true }) => {
  const [coordenadas, setCoordenadas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  /**
   * Carrega as coordenadas bancárias da API
   */
  const carregarCoordenadas = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await coordenadasBancariasAPI.listar();

      if (response.data.success) {
        setCoordenadas(response.data.dados?.coordenadas || []);
      } else {
        setErro('Não foi possível carregar as coordenadas bancárias.');
      }
    } catch (err) {
      console.error('[COORDENADAS_ERROR]', err);
      setErro('Erro ao carregar coordenadas bancárias. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCoordenadas();
  }, [carregarCoordenadas]);

  // Estado de carregamento
  if (carregando) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--txt-3)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-2)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p>Carregando coordenadas bancárias...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Estado de erro
  if (erro) {
    return (
      <div
        style={{
          padding: '24px',
          background: 'var(--error-light)',
          borderRadius: '12px',
          border: '1px solid var(--error)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--error)',
        }}
      >
        <AlertCircle size={24} />
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>Erro ao carregar</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', opacity: 0.8 }}>{erro}</p>
        </div>
      </div>
    );
  }

  // Sem coordenadas cadastradas
  if (coordenadas.length === 0) {
    return (
      <div
        style={{
          padding: '32px 24px',
          background: 'var(--surface-1)',
          borderRadius: '12px',
          border: '1px dashed var(--border-2)',
          textAlign: 'center',
          color: 'var(--txt-3)',
        }}
      >
        <CreditCard size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h4 style={{ margin: '0 0 8px', color: 'var(--txt-2)' }}>Nenhuma coordenada disponível</h4>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Entre em contato com o suporte para obter os dados bancários.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary-light) 0%, rgba(255,255,255,0.5) 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid var(--primary-light)',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--primary)',
            margin: '0 0 8px',
          }}
        >
          Dados para Pagamento
        </h3>
        <p
          style={{
            margin: 0,
            color: 'var(--txt-2)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}
        >
          Copie os dados bancários abaixo para realizar o pagamento da inscrição.
          Após efetuar o pagamento, guarde o comprovativo para enviar na próxima etapa.
        </p>
      </div>

      {/* Grid de coordenadas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: mostrarBotaoContinuar ? '24px' : '0',
        }}
      >
        {coordenadas.map((coordenada) => (
          <CoordenadaCard key={coordenada.id} coordenada={coordenada} />
        ))}
      </div>

      {/* Botão de continuar */}
      {mostrarBotaoContinuar && onContinuar && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <button
            onClick={onContinuar}
            style={{
              padding: '14px 32px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            Já efetuei o pagamento →
          </button>
          <p
            style={{
              marginTop: '12px',
              fontSize: '0.8rem',
              color: 'var(--txt-3)',
            }}
          >
            Clique após copiar os dados e efetuar o pagamento
          </p>
        </div>
      )}
    </div>
  );
};

export default CoordenadasBancarias;
