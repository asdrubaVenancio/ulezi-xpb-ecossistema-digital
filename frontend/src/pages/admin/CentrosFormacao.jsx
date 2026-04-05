/**
 * Página de Gestão de Centros de Formação - Painel Administrativo
 * 
 * Permite aos administradores e funcionários gerenciar todos os centros
 * de formação profissional, incluindo cadastro, edição, associação de cursos
 * e definição de ofertas específicas (preços, carga horária, etc.).
 * 
 * @author AsdrubaDeveloper
 * @version 1.0.0
 */

import {
    AlertCircle,
    BookOpen,
    Building,
    Check,
    DollarSign,
    Edit2,
    Filter,
    Mail,
    MapPin,
    Phone,
    Plus,
    Trash2,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../../components/ui/Toast';
import { centrosAPI, cursosAPI, ofertasAPI } from '../../services/trainingAPI';

/**
 * Componente principal de gestão de centros de formação
 */
const CentrosFormacao = () => {
  // Hook de notificações
  const toast = useToast();
  
  // Estados principais
  const [centros, setCentros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssociacaoModal, setShowAssociacaoModal] = useState(false);
  const [showOfertaModal, setShowOfertaModal] = useState(false);
  const [centroSelecionado, setCentroSelecionado] = useState(null);
  const [cursosDisponiveis, setCursosDisponiveis] = useState([]);

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    search: '',
    provincia: '',
    municipio: '',
    status: 'ativo'
  });

  // Estados de formulário
  const [formData, setFormData] = useState({
    nome: '',
    provincia: '',
    municipio: '',
    endereco: '',
    email: '',
    telefone: '',
    descricao: '',
    cursos_associados: []
  });

  // Estados de associação
  const [associacaoData, setAssociacaoData] = useState({
    cursos: []
  });

  // Estados de oferta
  const [ofertaData, setOfertaData] = useState({
    course_id: '',
    preco: '',
    carga_horaria: '',
    modalidade: 'presencial',
    certificado_exigido: false,
    especificacoes: ''
  });

  /**
   * Carrega lista de centros de formação
   */
  const carregarCentros = async () => {
    try {
      setLoading(true);
      const response = await centrosAPI.listar(filtros);
      // A resposta vem aninhada: response.data.data.data (array de centros)
      const centrosData = response.data?.data?.data || response.data?.data || [];
      setCentros(Array.isArray(centrosData) ? centrosData : []);
    } catch (error) {
      console.error('Erro ao carregar centros:', error);
      
      // Verifica se é erro de autenticação
      if (error.response?.status === 401) {
        toast.erro('Sessão expirada. Por favor, faça login novamente.');
        return;
      }
      
      // Verifica se é erro de autorização
      if (error.response?.status === 403) {
        toast.erro('Você não tem permissão para acessar esta funcionalidade.');
        return;
      }
      
      toast.erro('Erro ao carregar centros de formação');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega cursos disponíveis para associação
   */
  const carregarCursosDisponiveis = async () => {
    try {
      const response = await cursosAPI.listar({ limit: 100 });
      // A resposta vem aninhada: response.data.data.data (array de cursos)
      const cursosData = response.data?.data?.data || response.data?.data || [];
      setCursosDisponiveis(Array.isArray(cursosData) ? cursosData : []);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      
      // Verifica se é erro de autenticação
      if (error.response?.status === 401) {
        toast.erro('Sessão expirada. Por favor, faça login novamente.');
        return;
      }
      
      // Verifica se é erro de autorização
      if (error.response?.status === 403) {
        toast.erro('Você não tem permissão para acessar esta funcionalidade.');
        return;
      }
      
      toast.erro('Erro ao carregar cursos disponíveis');
    }
  };

  /**
   * Salva centro de formação (criar ou editar)
   */
  const salvarCentro = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = { ...formData };

      if (centroSelecionado) {
        await centrosAPI.atualizar(centroSelecionado.id, dataToSend);
        toast.sucesso('Centro actualizado com sucesso.');
      } else {
        await centrosAPI.criar(dataToSend);
        toast.sucesso('Centro criado com sucesso.');
      }

      fecharModal();
      carregarCentros();
    } catch (error) {
      toast.erro(error.response?.data?.message || 'Erro ao guardar o centro.');
    }
  };

  /**
   * Exclui centro de formação com confirmação
   */
  const excluirCentro = async (id) => {
    const ok = await toast.confirmar({
      titulo: 'Excluir Centro de Formação',
      mensagem: 'Tem certeza que deseja excluir este centro? Esta ação não pode ser desfeita.',
      variante: 'perigo',
      labelOk: 'Excluir',
      labelCancel: 'Cancelar'
    });
    
    if (!ok) return;

    try {
      await centrosAPI.excluir(id);
      toast.sucesso('Centro excluído com sucesso!');
      carregarCentros();
    } catch (error) {
      console.error('Erro ao excluir centro:', error);
      toast.erro(error.response?.data?.message || 'Erro ao excluir centro');
    }
  };

  /**
   * Abre modal de associação de cursos
   */
  const abrirModalAssociacao = (centro) => {
    setCentroSelecionado(centro);
    setAssociacaoData({
      cursos: centro.cursos?.map(c => c.id) || []
    });
    setShowAssociacaoModal(true);
  };

  /**
   * Salva associação de cursos
   */
  const salvarAssociacao = async () => {
    try {
      await centrosAPI.associarCursos(centroSelecionado.id, {
        courses: associacaoData.cursos
      });
      
      toast.sucesso('Cursos associados com sucesso!');
      setShowAssociacaoModal(false);
      carregarCentros();
    } catch (error) {
      console.error('Erro ao associar cursos:', error);
      toast.erro(error.response?.data?.message || 'Erro ao associar cursos');
    }
  };

  /**
   * Abre modal de criação de oferta
   */
  const abrirModalOferta = (centro) => {
    setCentroSelecionado(centro);
    setOfertaData({
      course_id: '',
      preco: '',
      carga_horaria: '',
      modalidade: 'presencial',
      certificado_exigido: false,
      especificacoes: ''
    });
    setShowOfertaModal(true);
  };

  /**
   * Salva oferta de curso
   */
  const salvarOferta = async () => {
    try {
      const dataToSend = {
        center_id: centroSelecionado.id,
        ...ofertaData,
        preco: parseFloat(ofertaData.preco),
        carga_horaria: parseInt(ofertaData.carga_horaria) || null
      };

      await ofertasAPI.criar(dataToSend);
      toast.sucesso('Oferta criada com sucesso!');
      setShowOfertaModal(false);
      carregarCentros();
    } catch (error) {
      console.error('Erro ao criar oferta:', error);
      toast.erro(error.response?.data?.message || 'Erro ao criar oferta');
    }
  };

  /**
   * Abre modal de edição
   */
  const abrirModalEdicao = (centro) => {
    setCentroSelecionado(centro);
    setFormData({
      nome: centro.nome || '',
      provincia: centro.provincia || '',
      municipio: centro.municipio || '',
      endereco: centro.endereco || '',
      email: centro.email || '',
      telefone: centro.telefone || '',
      descricao: centro.descricao || ''
    });
    setShowModal(true);
  };

  /**
   * Fecha modal e reseta formulários
   */
  const fecharModal = () => {
    setShowModal(false);
    setCentroSelecionado(null);
    setFormData({
      nome: '',
      provincia: '',
      municipio: '',
      endereco: '',
      email: '',
      telefone: '',
      descricao: '',
      cursos_associados: []
    });
  };

  /**
   * Atualiza filtros e recarrega dados
   */
  const atualizarFiltros = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Limpa filtros
   */
  const limparFiltros = () => {
    setFiltros({
      search: '',
      provincia: '',
      municipio: '',
      status: 'ativo'
    });
  };

  // Carrega dados iniciais
  useEffect(() => {
    carregarCentros();
    carregarCursosDisponiveis();
  }, []);

  // Recarrega quando filtros mudam
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      carregarCentros();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filtros]);

  return (
    <div className="admin-page">
      {/* Cabeçalho */}
      <div style={{ 
        background: 'var(--bg-card)', 
        borderBottom: '1px solid var(--border)',
        padding: '24px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--txt-1)', marginBottom: '4px' }}>
                Centros de Formação
              </h2>
              <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem' }}>
                Gerencie centros de formação profissional e suas ofertas
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn btn--primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              Novo Centro
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--txt-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} />
              Filtros
            </h2>
            <button
              onClick={limparFiltros}
              style={{ color: 'var(--txt-4)', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              Limpar filtros
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <input
                type="text"
                placeholder="Buscar centros..."
                value={filtros.search}
                onChange={(e) => atualizarFiltros('search', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <select
                value={filtros.provincia}
                onChange={(e) => atualizarFiltros('provincia', e.target.value)}
                className="form-select"
              >
                <option value="">Todas as províncias</option>
                <option value="Luanda">Luanda</option>
                <option value="Benguela">Benguela</option>
                <option value="Huambo">Huambo</option>
                <option value="Lubango">Lubango</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder="Município..."
                value={filtros.municipio}
                onChange={(e) => atualizarFiltros('municipio', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <select
                value={filtros.status}
                onChange={(e) => atualizarFiltros('status', e.target.value)}
                className="form-select"
              >
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Centros */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '3px solid var(--border)', 
              borderTop: '3px solid var(--ciano)', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        ) : centros.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <Building size={64} color="var(--txt-4)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--txt-1)', marginBottom: '8px' }}>
              Nenhum centro encontrado
            </h3>
            <p style={{ color: 'var(--txt-3)', marginBottom: '16px' }}>
              Comece cadastrando um novo centro de formação.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn--primary"
            >
              Cadastrar Primeiro Centro
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {centros.map((centro) => (
              <div key={centro.id} className="card card--hoverable" style={{ overflow: 'hidden' }}>
                {/* Cabeçalho do card */}
                <div style={{ 
                  background: 'linear-gradient(135deg, var(--ciano) 0%, var(--ciano-600) 100%)',
                  padding: '16px'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                    {centro.nome}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
                    <MapPin size={14} />
                    <span>{centro.municipio}, {centro.provincia}</span>
                  </div>
                </div>

                {/* Conteúdo do card */}
                <div style={{ padding: '16px' }}>
                  {/* Estatísticas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--ciano)' }}>
                        <BookOpen size={16} />
                        <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>{centro.total_cursos || 0}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>Cursos</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--verde)' }}>
                        <Users size={16} />
                        <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>{centro.total_inscricoes || 0}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>Inscrições</div>
                    </div>
                  </div>

                  {/* Descrição */}
                  {centro.descricao && (
                    <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: '1.5' }}>
                      {centro.descricao}
                    </p>
                  )}

                  {/* Contato */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {centro.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--txt-3)', fontSize: '0.875rem' }}>
                        <Mail size={16} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {centro.email}
                        </span>
                      </div>
                    )}
                    {centro.telefone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--txt-3)', fontSize: '0.875rem' }}>
                        <Phone size={16} />
                        <span>{centro.telefone}</span>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => abrirModalEdicao(centro)}
                      className="btn btn--secondary btn--sm"
                      style={{ flex: 1 }}
                    >
                      <Edit2 size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => abrirModalAssociacao(centro)}
                      className="btn btn--primary btn--sm"
                      style={{ flex: 1 }}
                    >
                      <BookOpen size={14} />
                      Cursos
                    </button>
                    <button
                      onClick={() => abrirModalOferta(centro)}
                      className="btn btn--laranja btn--sm"
                      style={{ flex: 1 }}
                    >
                      <DollarSign size={14} />
                      Oferta
                    </button>
                    <button
                      onClick={() => excluirCentro(centro.id)}
                      className="btn btn--danger btn--sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '672px' }}>
            <div className="modal__header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
              <h2 className="modal__title">
                {centroSelecionado ? 'Editar Centro de Formação' : 'Novo Centro de Formação'}
              </h2>
            </div>

            <form onSubmit={salvarCentro} className="modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nome do Centro *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="form-input"
                    placeholder="Ex: Centro de Formação Técnica"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Província *</label>
                  <select
                    required
                    value={formData.provincia}
                    onChange={(e) => setFormData(prev => ({ ...prev, provincia: e.target.value }))}
                    className="form-select"
                  >
                    <option value="">Selecione...</option>
                    <option value="Luanda">Luanda</option>
                    <option value="Benguela">Benguela</option>
                    <option value="Huambo">Huambo</option>
                    <option value="Lubango">Lubango</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Município *</label>
                  <input
                    type="text"
                    required
                    value={formData.municipio}
                    onChange={(e) => setFormData(prev => ({ ...prev, municipio: e.target.value }))}
                    className="form-input"
                    placeholder="Ex: Talatona"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="form-input"
                    placeholder="centro@exemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    className="form-input"
                    placeholder="+244 923 000 000"
                  />
                </div>

                              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Endereço</label>
                <textarea
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  className="form-textarea"
                  rows={2}
                  placeholder="Rua Principal, nº 123, Bairro Central"
                />
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="form-textarea"
                  rows={3}
                  placeholder="Descreva o centro, sua missão e principais áreas de atuação..."
                />
              </div>

              <div className="modal__footer" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={fecharModal}
                  className="btn btn--secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                >
                  {centroSelecionado ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Associação de Cursos */}
      {showAssociacaoModal && centroSelecionado && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '768px' }}>
            <div className="modal__header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
              <h2 className="modal__title">
                Associar Cursos - {centroSelecionado.nome}
              </h2>
              <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', margin: 0 }}>
                Selecione os cursos que este centro irá oferecer
              </p>
            </div>

            <div className="modal__body">
              <div style={{ maxHeight: '384px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cursosDisponiveis.map((curso) => {
                  const isSelected = associacaoData.cursos.includes(curso.id);
                  const isAlreadyAssociated = centroSelecionado.cursos?.some(c => c.id === curso.id);
                  
                  return (
                    <label
                      key={curso.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        border: `1px solid ${isSelected ? 'var(--ciano)' : 'var(--border)'}`,
                        borderRadius: 'var(--r-lg)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        background: isSelected ? 'var(--ciano-50)' : 'var(--bg-card)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssociacaoData(prev => ({
                              ...prev,
                              cursos: [...prev.cursos, curso.id]
                            }));
                          } else {
                            setAssociacaoData(prev => ({
                              ...prev,
                              cursos: prev.cursos.filter(id => id !== curso.id)
                            }));
                          }
                        }}
                        style={{ marginRight: '12px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: 'var(--txt-1)' }}>{curso.nome}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--txt-3)' }}>
                          {curso.categoria} • {curso.nivel}
                        </div>
                        {isAlreadyAssociated && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--verde)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} />
                            Já associado
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="modal__footer">
                <button
                  onClick={() => setShowAssociacaoModal(false)}
                  className="btn btn--secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarAssociacao}
                  disabled={associacaoData.cursos.length === 0}
                  className="btn btn--primary"
                  style={{ opacity: associacaoData.cursos.length === 0 ? 0.5 : 1 }}
                >
                  Associar {associacaoData.cursos.length} {associacaoData.cursos.length === 1 ? 'curso' : 'cursos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Oferta */}
      {showOfertaModal && centroSelecionado && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '672px' }}>
            <div className="modal__header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
              <h2 className="modal__title">
                Nova Oferta - {centroSelecionado.nome}
              </h2>
              <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', margin: 0 }}>
                Defina preço, carga horária e especificações para este curso
              </p>
            </div>

            <div className="modal__body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Curso *</label>
                  <select
                    required
                    value={ofertaData.course_id}
                    onChange={(e) => setOfertaData(prev => ({ ...prev, course_id: e.target.value }))}
                    className="form-select"
                  >
                    <option value="">Selecione um curso...</option>
                    {cursosDisponiveis.map((curso) => (
                      <option key={curso.id} value={curso.id}>
                        {curso.nome} - {curso.categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Preço (Kz) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={ofertaData.preco}
                      onChange={(e) => setOfertaData(prev => ({ ...prev, preco: e.target.value }))}
                      className="form-input"
                      placeholder="50.000"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Carga Horária (horas)</label>
                    <input
                      type="number"
                      min="1"
                      value={ofertaData.carga_horaria}
                      onChange={(e) => setOfertaData(prev => ({ ...prev, carga_horaria: e.target.value }))}
                      className="form-input"
                      placeholder="120"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Modalidade *</label>
                  <select
                    value={ofertaData.modalidade}
                    onChange={(e) => setOfertaData(prev => ({ ...prev, modalidade: e.target.value }))}
                    className="form-select"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="online">Online</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={ofertaData.certificado_exigido}
                      onChange={(e) => setOfertaData(prev => ({ ...prev, certificado_exigido: e.target.checked }))}
                      style={{ borderRadius: '4px' }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--txt-2)' }}>
                      Exigir certificado para inscrição
                    </span>
                  </label>
                  {ofertaData.certificado_exigido && (
                    <div style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: 'var(--laranja-100)',
                      border: '1px solid var(--laranja)',
                      borderRadius: 'var(--r-lg)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <AlertCircle size={16} color="var(--laranja)" style={{ marginTop: '2px' }} />
                        <p style={{ fontSize: '0.875rem', color: 'var(--laranja-600)' }}>
                          Os alunos precisarão enviar um certificado ou documento obrigatório 
                          para se inscreverem neste curso.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Especificações</label>
                  <textarea
                    value={ofertaData.especificacoes}
                    onChange={(e) => setOfertaData(prev => ({ ...prev, especificacoes: e.target.value }))}
                    className="form-textarea"
                    rows={4}
                    placeholder="Descreva detalhes específicos desta oferta no seu centro: materiais incluídos, horários, requisitos específicos, etc."
                  />
                </div>
              </div>

              <div className="modal__footer" style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => setShowOfertaModal(false)}
                  className="btn btn--secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarOferta}
                  className="btn btn--primary"
                >
                  Criar Oferta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentrosFormacao;
