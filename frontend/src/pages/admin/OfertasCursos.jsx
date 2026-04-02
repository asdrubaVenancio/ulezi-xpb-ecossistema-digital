/**
 * Página de Gestão de Ofertas de Cursos - Painel Administrativo
 * 
 * Permite aos administradores gerenciar todas as ofertas de cursos,
 * incluindo preços, carga horária, exigências e especificações
 * definidas por cada centro de formação.
 * 
 * @author AsdrubaDeveloper
 * @version 1.0.0
 */

import {
    AlertCircle,
    Award,
    BookOpen,
    Building,
    Building2,
    Clock,
    DollarSign,
    Edit2,
    FileText,
    Filter,
    GraduationCap,
    Plus,
    Trash2,
    TrendingUp,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../../components/ui/Toast';
import { centrosAPI, cursosAPI, ofertasAPI } from '../../services/trainingAPI';

/**
 * Componente principal de gestão de ofertas de cursos
 */
const OfertasCursos = () => {
  // Hook de notificações
  const toast = useToast();
  
  // Estados principais
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ofertaSelecionada, setOfertaSelecionada] = useState(null);
  const [listaCentros, setListaCentros] = useState([]);
  const [listaCursos, setListaCursos] = useState([]);

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    search: '',
    center_id: '',
    course_id: '',
    status: 'ativo',
    min_preco: '',
    max_preco: ''
  });

  // Estados de paginação
  const [paginacao, setPaginacao] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Estados de formulário
  const [formData, setFormData] = useState({
    center_id: '',
    course_id: '',
    preco: '',
    carga_horaria: '',
    certificado_exigido: false,
    especificacoes: ''
  });

  // Estados para selects dinâmicos
  const [carregandoCentros, setCarregandoCentros] = useState(false);
  const [carregandoCursos, setCarregandoCursos] = useState(false);

  /**
   * Carrega lista de ofertas de cursos com paginação
   */
  const carregarOfertas = async (page = paginacao.page) => {
    try {
      setLoading(true);
      
      // Prepara os parâmetros para a API incluindo paginação
      const params = {
        ...filtros,
        page,
        limit: paginacao.limit
      };
      
      // Remove parâmetros vazios
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await ofertasAPI.listar(params);
      
      // A resposta vem aninhada: response.data.data.data (array de ofertas)
      const ofertasData = response.data?.data?.data || response.data?.data || [];
      const paginationData = response.data?.data?.pagination || {};
      
      setOfertas(Array.isArray(ofertasData) ? ofertasData : []);
      
      // Atualiza informações de paginação
      if (paginationData.total_items !== undefined) {
        setPaginacao(prev => ({
          ...prev,
          page: paginationData.page || page,
          total: paginationData.total_items || 0,
          totalPages: paginationData.total_pages || Math.ceil((paginationData.total_items || 0) / prev.limit)
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar ofertas:', error);
      
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
      
      toast.erro('Erro ao carregar ofertas de cursos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega centros de formação disponíveis
   */
  const carregarCentros = async () => {
    try {
      setCarregandoCentros(true);
      const response = await centrosAPI.listar({ limit: 100 });
      // A resposta vem aninhada: response.data.data.data (array de centros)
      const centrosData = response.data?.data?.data || response.data?.data || [];
      setListaCentros(Array.isArray(centrosData) ? centrosData : []);
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
      setCarregandoCentros(false);
    }
  };

  /**
   * Carrega cursos disponíveis
   */
  const carregarCursos = async () => {
    try {
      setCarregandoCursos(true);
      const response = await cursosAPI.listar({ limit: 100 });
      // A resposta vem aninhada: response.data.data.data (array de cursos)
      const cursosData = response.data?.data?.data || response.data?.data || [];
      setListaCursos(Array.isArray(cursosData) ? cursosData : []);
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
    } finally {
      setCarregandoCursos(false);
    }
  };

  /**
   * Salva oferta de curso (criar ou editar)
   */
  const salvarOferta = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSend = {
        ...formData,
        preco: parseFloat(formData.preco),
        carga_horaria: parseInt(formData.carga_horaria) || null
      };
      
      if (ofertaSelecionada) {
        // Editar oferta existente
        await ofertasAPI.atualizar(ofertaSelecionada.id, dataToSend);
        toast.sucesso('Oferta atualizada com sucesso!');
      } else {
        // Criar nova oferta
        await ofertasAPI.criar(dataToSend);
        toast.sucesso('Oferta criada com sucesso!');
      }

      fecharModal();
      carregarOfertas();
    } catch (error) {
      console.error('Erro ao salvar oferta:', error);
      toast.erro(error.response?.data?.message || 'Erro ao salvar oferta');
    }
  };

  /**
   * Exclui/desativa oferta de curso com confirmação
   */
  const excluirOferta = async (id) => {
    const ok = await toast.confirmar({
      titulo: 'Desativar Oferta',
      mensagem: 'Tem certeza que deseja desativar esta oferta? Esta ação pode ser revertida.',
      variante: 'perigo',
      labelOk: 'Desativar',
      labelCancel: 'Cancelar'
    });
    
    if (!ok) return;

    try {
      await ofertasAPI.desativar(id);
      toast.sucesso('Oferta desativada com sucesso!');
      carregarOfertas();
    } catch (error) {
      console.error('Erro ao desativar oferta:', error);
      toast.erro(error.response?.data?.message || 'Erro ao desativar oferta');
    }
  };

  /**
   * Abre modal de criação
   */
  const abrirModalCriacao = async () => {
    // Recarrega centros e cursos antes de abrir a modal
    await carregarCentros();
    await carregarCursos();
    
    setOfertaSelecionada(null);
    setFormData({
      center_id: '',
      course_id: '',
      preco: '',
      carga_horaria: '',
      certificado_exigido: false,
      especificacoes: ''
    });
    setShowModal(true);
  };

  /**
   * Abre modal de edição
   */
  const abrirModalEdicao = async (oferta) => {
    // Recarrega centros e cursos antes de abrir a modal
    await carregarCentros();
    await carregarCursos();
    
    setOfertaSelecionada(oferta);
    setFormData({
      center_id: oferta.center_id || '',
      course_id: oferta.course_id || '',
      preco: oferta.preco || '',
      carga_horaria: oferta.carga_horaria || '',
      certificado_exigido: oferta.certificado_exigido || false,
      especificacoes: oferta.especificacoes || ''
    });
    setShowModal(true);
  };

  /**
   * Fecha modal e reseta formulários
   */
  const fecharModal = () => {
    setShowModal(false);
    setOfertaSelecionada(null);
    setFormData({
      center_id: '',
      course_id: '',
      preco: '',
      carga_horaria: '',
      certificado_exigido: false,
      especificacoes: ''
    });
  };

  /**
   * Atualiza filtros e volta para página 1
   */
  const atualizarFiltros = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
    setPaginacao(prev => ({ ...prev, page: 1 })); // Reset para página 1 ao filtrar
  };

  /**
   * Limpa filtros e volta para página 1
   */
  const limparFiltros = () => {
    setFiltros({
      search: '',
      center_id: '',
      course_id: '',
      status: 'ativo',
      min_preco: '',
      max_preco: ''
    });
    setPaginacao(prev => ({ ...prev, page: 1 }));
  };

  /**
   * Formata valor monetário
   */
  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return '0,00 Kz';
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2
    }).format(valor);
  };

  // Carrega dados iniciais
  useEffect(() => {
    carregarOfertas(1);
    carregarCentros();
    carregarCursos();
  }, []);

  // Recarrega quando filtros ou página mudam
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      carregarOfertas(paginacao.page);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filtros, paginacao.page]);

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
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--txt-1)', marginBottom: '4px' }}>
                Ofertas de Cursos
              </h1>
              <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem' }}>
                Gerencie preços, carga horária e especificações dos cursos por centro
              </p>
            </div>
            <button
              onClick={abrirModalCriacao}
              className="btn btn--primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              Nova Oferta
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'var(--ciano-100)', color: 'var(--ciano)' }}>
              <BookOpen size={20} />
            </div>
            <div className="stat-card__value">{ofertas.length}</div>
            <div className="stat-card__label">Total de Ofertas</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'var(--verde-100)', color: 'var(--verde)' }}>
              <TrendingUp size={20} />
            </div>
            <div className="stat-card__value">
              {ofertas.filter(o => o.status === 'ativo').length}
            </div>
            <div className="stat-card__label">Ofertas Ativas</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'var(--laranja-100)', color: 'var(--laranja)' }}>
              <DollarSign size={20} />
            </div>
            <div className="stat-card__value">
              {ofertas.length > 0 
                ? formatarMoeda(ofertas.reduce((sum, o) => sum + (o.preco || 0), 0) / ofertas.length)
                : formatarMoeda(0)
              }
            </div>
            <div className="stat-card__label">Preço Médio</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'var(--roxo-100)', color: 'var(--roxo)' }}>
              <Users size={20} />
            </div>
            <div className="stat-card__value">
              {ofertas.reduce((sum, o) => sum + (o.total_inscricoes || 0), 0)}
            </div>
            <div className="stat-card__label">Total Inscrições</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 24px' }}>
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
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <input
              type="text"
              placeholder="Buscar ofertas..."
              value={filtros.search}
              onChange={(e) => atualizarFiltros('search', e.target.value)}
              className="form-input"
            />
            <select
              value={filtros.center_id}
              onChange={(e) => atualizarFiltros('center_id', e.target.value)}
              className="form-select"
            >
              <option value="">Todos os centros</option>
              {listaCentros.map(centro => (
                <option key={centro.id} value={centro.id}>{centro.nome}</option>
              ))}
            </select>
            <select
              value={filtros.course_id}
              onChange={(e) => atualizarFiltros('course_id', e.target.value)}
              className="form-select"
            >
              <option value="">Todos os cursos</option>
              {listaCursos.map(curso => (
                <option key={curso.id} value={curso.id}>{curso.nome}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Preço mín."
              value={filtros.min_preco}
              onChange={(e) => atualizarFiltros('min_preco', e.target.value)}
              className="form-input"
            />
            <input
              type="number"
              placeholder="Preço máx."
              value={filtros.max_preco}
              onChange={(e) => atualizarFiltros('max_preco', e.target.value)}
              className="form-input"
            />
            <select
              value={filtros.status}
              onChange={(e) => atualizarFiltros('status', e.target.value)}
              className="form-select"
            >
              <option value="ativo">Ativas</option>
              <option value="inativo">Inativas</option>
              <option value="todos">Todas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Ofertas */}
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
        ) : ofertas.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <BookOpen size={64} color="var(--txt-4)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--txt-1)', marginBottom: '8px' }}>
              Nenhuma oferta encontrada
            </h3>
            <p style={{ color: 'var(--txt-3)', marginBottom: '16px' }}>
              Comece criando uma nova oferta de curso.
            </p>
            <button
              onClick={abrirModalCriacao}
              className="btn btn--primary"
            >
              Criar Primeira Oferta
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Centro</th>
                  <th>Preço</th>
                  <th>Carga Horária</th>
                  <th>Exigências</th>
                  <th>Inscrições</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {ofertas.map((oferta) => (
                  <tr key={oferta.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--txt-1)' }}>{oferta.nome_curso}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--txt-3)' }}>{oferta.categoria_curso}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={16} color="var(--txt-4)" />
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--txt-1)' }}>{oferta.nome_centro}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--txt-3)' }}>{oferta.municipio_centro}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--verde)' }}>
                        {formatarMoeda(oferta.preco)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--txt-2)' }}>
                        <Clock size={16} />
                        <span>
                          {oferta.carga_horaria ? `${oferta.carga_horaria}h` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {oferta.certificado_exigido && (
                          <span className="badge badge--laranja">
                            <Award size={12} />
                            Certificado
                          </span>
                        )}
                        {oferta.especificacoes && (
                          <span className="badge badge--ciano">
                            Especificações
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--txt-1)' }}>
                        <div style={{ fontWeight: '500' }}>{oferta.total_inscricoes || 0}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--verde)' }}>
                          {oferta.total_confirmadas || 0} confirmadas
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${oferta.status === 'ativo' ? 'badge--verde' : 'badge--vermelho'}`}>
                        {oferta.status === 'ativo' ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => abrirModalEdicao(oferta)}
                          style={{ color: 'var(--ciano)', cursor: 'pointer' }}
                          title="Editar oferta"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => excluirOferta(oferta.id)}
                          style={{ color: 'var(--vermelho)', cursor: 'pointer' }}
                          title="Desativar oferta"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginação */}
            {paginacao.totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 24px',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface-2)'
              }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--txt-3)' }}>
                  Mostrando {(paginacao.page - 1) * paginacao.limit + 1} - {Math.min(paginacao.page * paginacao.limit, paginacao.total)} de {paginacao.total} ofertas
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => setPaginacao(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={paginacao.page === 1}
                    className="btn btn--secondary"
                    style={{ 
                      padding: '8px 12px',
                      opacity: paginacao.page === 1 ? 0.5 : 1,
                      cursor: paginacao.page === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ← Anterior
                  </button>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: Math.min(5, paginacao.totalPages) }, (_, i) => {
                      // Lógica para mostrar páginas ao redor da página atual
                      let pageNum;
                      if (paginacao.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (paginacao.page <= 3) {
                        pageNum = i + 1;
                      } else if (paginacao.page >= paginacao.totalPages - 2) {
                        pageNum = paginacao.totalPages - 4 + i;
                      } else {
                        pageNum = paginacao.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPaginacao(prev => ({ ...prev, page: pageNum }))}
                          className="btn"
                          style={{ 
                            padding: '8px 12px',
                            minWidth: '40px',
                            background: paginacao.page === pageNum ? 'var(--ciano)' : 'var(--surface-3)',
                            color: paginacao.page === pageNum ? 'white' : 'var(--txt-2)',
                            border: 'none',
                            borderRadius: 'var(--r-md)'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPaginacao(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={paginacao.page === paginacao.totalPages}
                    className="btn btn--secondary"
                    style={{ 
                      padding: '8px 12px',
                      opacity: paginacao.page === paginacao.totalPages ? 0.5 : 1,
                      cursor: paginacao.page === paginacao.totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Próximo →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px', width: '95%' }}>
            <div className="modal__header" style={{ 
              background: 'linear-gradient(135deg, var(--ciano) 0%, var(--ciano-600) 100%)',
              color: 'white',
              borderRadius: 'var(--r-lg) var(--r-lg) 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarSign size={20} color="white" />
                </div>
                <div>
                  <h2 className="modal__title" style={{ color: 'white', margin: 0 }}>
                    {ofertaSelecionada ? 'Editar Oferta' : 'Nova Oferta de Curso'}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                    {ofertaSelecionada 
                      ? 'Atualize as informações desta oferta' 
                      : 'Defina preço, carga horária e especificações'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={salvarOferta} className="modal__body" style={{ padding: '32px' }}>
              {/* Seleção de Centro e Curso */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', 
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontWeight: '600',
                    color: 'var(--txt-2)'
                  }}>
                    <Building2 size={16} color="var(--ciano)" />
                    Centro de Formação *
                  </label>
                  <select
                    required
                    value={formData.center_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, center_id: e.target.value }))}
                    className="form-select"
                    style={{ 
                      padding: '14px 40px 14px 16px',
                      border: '2px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      appearance: 'none',
                      background: 'var(--surface-2) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center',
                      backgroundSize: '20px'
                    }}
                    title={listaCentros.find(c => c.id === formData.center_id)?.nome || 'Selecione um centro'}
                  >
                    <option value="">Selecione um centro...</option>
                    {listaCentros.map(centro => (
                      <option key={centro.id} value={centro.id} title={`${centro.nome} (${centro.municipio}, ${centro.provincia})`}>
                        {centro.nome.length > 35 ? centro.nome.substring(0, 35) + '...' : centro.nome} {centro.municipio ? `(${centro.municipio})` : ''}
                      </option>
                    ))}
                  </select>
                  {carregandoCentros && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', marginTop: '8px' }}>
                      <div className="spinner spinner--sm"></div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontWeight: '600',
                    color: 'var(--txt-2)'
                  }}>
                    <GraduationCap size={16} color="var(--ciano)" />
                    Curso *
                  </label>
                  <select
                    required
                    value={formData.course_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                    className="form-select"
                    style={{ 
                      padding: '14px 40px 14px 16px',
                      border: '2px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      appearance: 'none',
                      background: 'var(--surface-2) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center',
                      backgroundSize: '20px'
                    }}
                    disabled={!formData.center_id}
                    title={listaCursos.find(c => c.id === formData.course_id)?.nome || 'Selecione um curso'}
                  >
                    <option value="">
                      {!formData.center_id ? 'Selecione um centro primeiro' : 'Selecione um curso...'}
                    </option>
                    {listaCursos.map(curso => (
                      <option key={curso.id} value={curso.id} title={`${curso.nome} — ${curso.categoria || 'Sem categoria'}`}>
                        {curso.nome.length > 35 ? curso.nome.substring(0, 35) + '...' : curso.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preço e Carga Horária */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr', 
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div className="form-group">
                  <label className="form-label" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontWeight: '600',
                    color: 'var(--txt-2)'
                  }}>
                    <DollarSign size={16} color="var(--ciano)" />
                    Preço (Kz) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData(prev => ({ ...prev, preco: e.target.value }))}
                    className="form-input"
                    placeholder="Ex: 25.000,00"
                    style={{ 
                      padding: '14px 16px',
                      border: '2px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--verde)'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontWeight: '600',
                    color: 'var(--txt-2)'
                  }}>
                    <Clock size={16} color="var(--ciano)" />
                    Carga Horária
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.carga_horaria}
                    onChange={(e) => setFormData(prev => ({ ...prev, carga_horaria: e.target.value }))}
                    className="form-input"
                    placeholder="Horas"
                    style={{ 
                      padding: '14px 16px',
                      border: '2px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              {/* Checkbox Certificado */}
              <div style={{ 
                marginBottom: '24px',
                padding: '20px',
                background: formData.certificado_exigido ? 'var(--laranja-50)' : 'var(--bg-2)',
                borderRadius: 'var(--r-lg)',
                border: `2px solid ${formData.certificado_exigido ? 'var(--laranja)' : 'var(--border)'}`,
                transition: 'all 0.3s ease'
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.certificado_exigido}
                    onChange={(e) => setFormData(prev => ({ ...prev, certificado_exigido: e.target.checked }))}
                    style={{ 
                      width: '24px', 
                      height: '24px',
                      accentColor: 'var(--laranja)'
                    }}
                  />
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: formData.certificado_exigido ? '600' : '500', 
                    color: formData.certificado_exigido ? 'var(--laranja)' : 'var(--txt-2)'
                  }}>
                    Exigir certificado ou documento obrigatório para inscrição
                  </span>
                </label>
                
                {formData.certificado_exigido && (
                  <div style={{ marginTop: '12px', paddingLeft: '36px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '12px 16px',
                      background: 'white',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--laranja-200)'
                    }}>
                      <AlertCircle size={18} color="var(--laranja)" />
                      <p style={{ fontSize: '0.875rem', color: 'var(--laranja-700)', margin: 0 }}>
                        Os alunos precisarão enviar um documento obrigatório para se inscreverem neste curso.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Especificações */}
              <div className="form-group">
                <label className="form-label" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontWeight: '600',
                  color: 'var(--txt-2)'
                }}>
                  <FileText size={16} color="var(--ciano)" />
                  Especificações e Detalhes
                </label>
                <textarea
                  value={formData.especificacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, especificacoes: e.target.value }))}
                  className="form-textarea"
                  rows={4}
                  placeholder="Descreva detalhes específicos: materiais incluídos, horários de funcionamento, requisitos adicionais, etc."
                  style={{ 
                    padding: '16px',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--r-lg)',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                    minHeight: '120px'
                  }}
                />
              </div>

              {/* Footer */}
              <div className="modal__footer" style={{ 
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={fecharModal}
                  className="btn btn--secondary"
                  style={{ 
                    padding: '12px 24px',
                    fontSize: '0.95rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ 
                    padding: '12px 32px',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {ofertaSelecionada ? 'Atualizar Oferta' : (
                    <>
                      <Plus size={18} />
                      Criar Oferta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfertasCursos;
