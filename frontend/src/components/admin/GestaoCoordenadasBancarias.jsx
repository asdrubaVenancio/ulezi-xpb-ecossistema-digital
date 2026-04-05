/**
 * Componente de gestão de coordenadas bancárias (Admin)
 * Permite criar, editar, desativar e excluir coordenadas bancárias
 */
import {
    Building2,
    CreditCard,
    Edit2,
    GripVertical,
    Landmark,
    Plus,
    Power,
    Trash2,
    Wallet,
    X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../components/ui/Toast';
import { coordenadasBancariasAPI } from '../../services/api.js';

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
 * Modal de formulário para criar/editar coordenada
 */
const ModalCoordenada = ({ coordenada, aberto, onFechar, onSalvar, carregando }) => {
  const [form, setForm] = useState({
    tipo: 'IBAN',
    titulo: '',
    numero: '',
    titular: '',
    banco: '',
    descricao: '',
    ordem: 0,
  });

  // Preenche o formulário ao editar
  useEffect(() => {
    if (coordenada) {
      setForm({
        tipo: coordenada.tipo || 'IBAN',
        titulo: coordenada.titulo || '',
        numero: coordenada.numero || '',
        titular: coordenada.titular || '',
        banco: coordenada.banco || '',
        descricao: coordenada.descricao || '',
        ordem: coordenada.ordem || 0,
      });
    } else {
      setForm({
        tipo: 'IBAN',
        titulo: '',
        numero: '',
        titular: '',
        banco: '',
        descricao: '',
        ordem: 0,
      });
    }
  }, [coordenada, aberto]);

  if (!aberto) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar(form);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-1)',
    fontSize: '0.9rem',
    background: 'var(--surface-0)',
    color: 'var(--txt-1)',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--txt-2)',
    marginBottom: '6px',
  };

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" style={{ maxWidth: '500px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header" style={{
          background: 'linear-gradient(135deg, var(--ciano) 0%, var(--ciano-600) 100%)',
          color: 'white',
          borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
            {coordenada ? 'Editar Coordenada' : 'Nova Coordenada'}
          </h3>
          <button
            onClick={onFechar}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.9)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={(e) => (e.target.style.background = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Tipo */}
            <div>
              <label style={labelStyle}>Tipo de Coordenada</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                style={inputStyle}
                required
              >
                <option value="IBAN">IBAN</option>
                <option value="MULTICAIXA_EXPRESS">Multicaixa Express</option>
                <option value="CONTA_BANCARIA">Conta Bancária</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            {/* Título */}
            <div>
              <label style={labelStyle}>Título *</label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Conta Principal BFA"
                style={inputStyle}
                required
                minLength={2}
              />
            </div>

            {/* Número */}
            <div>
              <label style={labelStyle}>Número / IBAN *</label>
              <input
                type="text"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="Ex: AO06 0040 0000 1234 5678 9012 3"
                style={inputStyle}
                required
                minLength={5}
              />
            </div>

            {/* Titular */}
            <div>
              <label style={labelStyle}>Titular da Conta *</label>
              <input
                type="text"
                value={form.titular}
                onChange={(e) => setForm({ ...form, titular: e.target.value })}
                placeholder="Ex: ULEZI XPB, LDA"
                style={inputStyle}
                required
                minLength={2}
              />
            </div>

            {/* Banco */}
            <div>
              <label style={labelStyle}>Banco (opcional)</label>
              <input
                type="text"
                value={form.banco}
                onChange={(e) => setForm({ ...form, banco: e.target.value })}
                placeholder="Ex: BFA"
                style={inputStyle}
              />
            </div>

            {/* Descrição */}
            <div>
              <label style={labelStyle}>Descrição (opcional)</label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Instruções adicionais para o aluno..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Ordem */}
            <div>
              <label style={labelStyle}>Ordem de exibição</label>
              <input
                type="number"
                value={form.ordem}
                onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })}
                style={{ ...inputStyle, width: '120px' }}
                min={0}
              />
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onFechar}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--border-1)',
                background: 'var(--surface-1)',
                color: 'var(--txt-2)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 600,
                cursor: carregando ? 'not-allowed' : 'pointer',
                opacity: carregando ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {carregando ? 'Salvando...' : coordenada ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Componente principal de gestão de coordenadas bancárias
 */
const GestaoCoordenadasBancarias = () => {
  const toast = useToast();
  const [coordenadas, setCoordenadas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [coordenadaEditando, setCoordenadaEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  /**
   * Carrega as coordenadas bancárias
   */
  const carregarCoordenadas = useCallback(async () => {
    try {
      setCarregando(true);
      const response = await coordenadasBancariasAPI.adminListar();

      if (response.data.success) {
        setCoordenadas(response.data.dados?.coordenadas || []);
      }
    } catch {
      toast.erro('Erro ao carregar coordenadas bancárias.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCoordenadas();
  }, [carregarCoordenadas]);

  /**
   * Abre o modal para criar nova coordenada
   */
  const abrirModalCriar = () => {
    setCoordenadaEditando(null);
    setModalAberto(true);
  };

  /**
   * Abre o modal para editar coordenada
   */
  const abrirModalEditar = (coordenada) => {
    setCoordenadaEditando(coordenada);
    setModalAberto(true);
  };

  /**
   * Fecha o modal
   */
  const fecharModal = () => {
    setModalAberto(false);
    setCoordenadaEditando(null);
  };

  /**
   * Salva (cria ou atualiza) uma coordenada
   */
  const salvarCoordenada = async (dados) => {
    try {
      setSalvando(true);

      if (coordenadaEditando) {
        // Atualiza
        await coordenadasBancariasAPI.atualizar(coordenadaEditando.id, dados);
        toast.sucesso('Coordenada atualizada com sucesso!');
      } else {
        // Cria nova
        await coordenadasBancariasAPI.criar(dados);
        toast.sucesso('Coordenada criada com sucesso!');
      }

      fecharModal();
      carregarCoordenadas();
    } catch (err) {
      console.error('[SAVE_COORD_ERROR]', err);
      toast.erro('Erro ao salvar coordenada: ' + (err.response?.data?.message || err.message));
    } finally {
      setSalvando(false);
    }
  };

  /**
   * Alterna o status (ativo/inativo) de uma coordenada
   */
  const alternarStatus = async (coordenada) => {
    try {
      await coordenadasBancariasAPI.atualizar(coordenada.id, {
        is_active: !coordenada.is_active,
      });
      carregarCoordenadas();
    } catch (err) {
      console.error('[TOGGLE_STATUS_ERROR]', err);
      toast.erro('Erro ao alterar status.');
    }
  };

  /**
   * Exclui uma coordenada permanentemente
   */
  const excluirCoordenada = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta coordenada permanentemente?')) {
      return;
    }

    try {
      await coordenadasBancariasAPI.excluir(id);
      toast.sucesso('Coordenada excluída com sucesso!');
      carregarCoordenadas();
    } catch (err) {
      console.error('[DELETE_COORD_ERROR]', err);
      toast.erro('Erro ao excluir coordenada.');
    }
  };

  if (carregando) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--txt-3)' }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--verde-100) 0%, var(--verde) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Landmark size={20} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--txt-1)',
              }}
            >
              Coordenadas Bancárias
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--txt-3)' }}>
              Gerencie os dados para pagamento das inscrições
            </p>
          </div>
        </div>

        <button
          onClick={abrirModalCriar}
          className="btn btn--primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'var(--ciano)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(6,182,212,0.35)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(6,182,212,0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 14px rgba(6,182,212,0.35)';
          }}
        >
          <Plus size={20} />
          Nova Coordenada
        </button>
      </div>

      {/* Lista de coordenadas */}
      {coordenadas.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: 'var(--surface-1)',
            borderRadius: '12px',
            border: '1px dashed var(--border-2)',
            color: 'var(--txt-3)',
          }}
        >
          <CreditCard size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>Nenhuma coordenada bancária cadastrada.</p>
          <p style={{ margin: '8px 0 0', fontSize: '0.85rem' }}>
            Clique em "Nova Coordenada" para adicionar.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {coordenadas.map((coord) => {
            const Icone = iconesPorTipo[coord.tipo] || CreditCard;

            return (
              <div
                key={coord.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: coord.is_active ? 'var(--surface-0)' : 'var(--surface-1)',
                  borderRadius: '12px',
                  border: `1px solid ${coord.is_active ? 'var(--border-1)' : 'var(--border-2)'}`,
                  opacity: coord.is_active ? 1 : 0.7,
                  transition: 'all 0.2s',
                }}
              >
                {/* Ícone de drag (ordem) */}
                <div style={{ color: 'var(--txt-3)', cursor: 'grab' }}>
                  <GripVertical size={18} />
                </div>

                {/* Ícone do tipo */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: coord.is_active
                      ? 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                      : 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: coord.is_active ? 'white' : 'var(--txt-3)',
                    flexShrink: 0,
                  }}
                >
                  <Icone size={18} />
                </div>

                {/* Informações */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: 'var(--txt-1)',
                      }}
                    >
                      {coord.titulo}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: coord.is_active ? 'var(--success-light)' : 'var(--surface-2)',
                        color: coord.is_active ? 'var(--success)' : 'var(--txt-3)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {coord.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '4px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                      {labelsPorTipo[coord.tipo]}
                    </span>
                    <code
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--txt-2)',
                        background: 'var(--surface-1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {coord.numero}
                    </code>
                    <span style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>
                      Titular: {coord.titular}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {/* Toggle status */}
                  <button
                    onClick={() => alternarStatus(coord)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: 'none',
                      background: coord.is_active ? 'var(--warning-light)' : 'var(--success-light)',
                      color: coord.is_active ? 'var(--warning)' : 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title={coord.is_active ? 'Desativar' : 'Ativar'}
                  >
                    <Power size={16} />
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => abrirModalEditar(coord)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--surface-1)',
                      color: 'var(--txt-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>

                  {/* Excluir */}
                  <button
                    onClick={() => excluirCoordenada(coord.id)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--error-light)',
                      color: 'var(--error)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ModalCoordenada
        coordenada={coordenadaEditando}
        aberto={modalAberto}
        onFechar={fecharModal}
        onSalvar={salvarCoordenada}
        carregando={salvando}
      />
    </div>
  );
};

export default GestaoCoordenadasBancarias;
