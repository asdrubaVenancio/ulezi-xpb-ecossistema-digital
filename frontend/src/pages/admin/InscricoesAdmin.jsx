import { BookOpen, CheckCircle, Eye, FileText, Filter, MapPin, Search, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../components/ui/Toast';
import { BadgeStatus, EmptyState, Modal, PageLoader } from '../../components/ui/index.jsx';
import { adminAPI, extrairErro } from '../../services/api';
import { formatAOA, formatData } from '../../utils/constants';

const BACKEND_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function InscricoesAdmin() {
  const toast = useToast();
  const [inscricoes, setInscricoes] = useState([]);
  const [inscricoesFiltradas, setInscricoesFiltradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(null);
  const [submetendo, setSubmetendo] = useState(false);
  const [motivo, setMotivo] = useState('');
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroAluno, setFiltroAluno] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await adminAPI.inscricoes();
      const lista = data.dados || [];
      setInscricoes(lista);
      aplicarFiltros(lista, filtroStatus, filtroCurso, filtroAluno);
    } catch (e) {
      console.error('[InscricoesAdmin] Erro ao carregar:', e);
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus, filtroCurso, filtroAluno]);

  const aplicarFiltros = (lista, status, curso, aluno) => {
    let filtrada = [...lista];
    if (status) filtrada = filtrada.filter(i => i.status === status);
    if (curso) filtrada = filtrada.filter(i => (i.nome_curso || '').toLowerCase().includes(curso.toLowerCase()));
    if (aluno) filtrada = filtrada.filter(i => (i.nome_aluno || '').toLowerCase().includes(aluno.toLowerCase()));
    setInscricoesFiltradas(filtrada);
  };

  const limparFiltros = () => {
    setFiltroStatus('');
    setFiltroCurso('');
    setFiltroAluno('');
    setInscricoesFiltradas(inscricoes);
  };

  useEffect(() => { carregar(); }, [carregar]);

  const abrirDocumento = async (item, tipo) => {
    try {
      const { data } = await adminAPI.verDocumentoInscricao(item.id, tipo);
      const url = data.dados?.url;
      if (url) {
        window.open(`${BACKEND_BASE_URL}${url}`, '_blank', 'noopener,noreferrer');
        // Atualiza o estado local da modal para refletir que o documento foi visualizado
        setModal(prev => {
          const docsVisualizados = {
            ...prev.documentos_visualizados,
            [tipo]: true
          };
          // Recalcular pode_decidir: precisa ter visualizado comprovativo e documento_requisito (se existir)
          const precisaDocRequisito = !!prev.documento_requisito_url;
          const comprovativoVisto = docsVisualizados.comprovativo || tipo === 'comprovativo';
          const requisitoVisto = !precisaDocRequisito || docsVisualizados.requisito || docsVisualizados.documento || tipo === 'documento' || tipo === 'requisito';
          const podeDecidir = comprovativoVisto && requisitoVisto;
          return {
            ...prev,
            documentos_visualizados: docsVisualizados,
            pode_decidir: podeDecidir
          };
        });
      }
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  };

  const decidir = async (aprovado) => {
    if (!modal) return;
    // Verificar se pode decidir (documentos visualizados)
    if (!modal.pode_decidir) {
      toast.aviso('Visualize todos os documentos obrigatórios antes de tomar uma decisão.');
      return;
    }
    if (!aprovado && motivo.trim().length < 10) {
      toast.aviso('O motivo da rejeição deve ter pelo menos 10 caracteres.');
      return;
    }

    setSubmetendo(true);
    try {
      await adminAPI.reverInscricao(modal.id, aprovado ? { aprovado: true } : { aprovado: false, motivo_rejeicao: motivo });
      toast.sucesso(aprovado ? 'Inscrição aprovada com sucesso.' : 'Inscrição cancelada com sucesso.');
      setModal(null);
      setMotivo('');
      await carregar();
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setSubmetendo(false);
    }
  };

  if (carregando) return <PageLoader />;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Inscrições de cursos</h2>
          <p className="page-header__sub">Analise comprovativos, documentos exigidos e aprove ou rejeite inscrições.</p>
        </div>
        <button 
          className="btn btn--secondary btn--sm" 
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Filter size={16} />
          {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      {mostrarFiltros && (
        <div className="card" style={{ padding: 16, background: 'var(--bg-2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Status</label>
              <select 
                className="form-select" 
                value={filtroStatus} 
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="confirmada">Confirmada</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Curso</label>
              <div className="form-input-wrapper">
                <Search size={14} />
                <input 
                  className="form-input form-input--icon" 
                  value={filtroCurso}
                  onChange={(e) => setFiltroCurso(e.target.value)}
                  placeholder="Nome do curso..."
                />
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Aluno</label>
              <div className="form-input-wrapper">
                <Search size={14} />
                <input 
                  className="form-input form-input--icon" 
                  value={filtroAluno}
                  onChange={(e) => setFiltroAluno(e.target.value)}
                  placeholder="Nome do aluno..."
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn--ghost btn--sm" onClick={limparFiltros}>
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {inscricoesFiltradas.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState icone={<BookOpen size={26} />} titulo={inscricoes.length === 0 ? "Sem inscrições pendentes" : "Nenhuma inscrição encontrada"} descricao={inscricoes.length === 0 ? "As novas inscrições aparecerão aqui para validação." : "Tente ajustar os filtros para ver mais resultados."} />
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Curso</th>
                  <th>Centro</th>
                  <th>Estado</th>
                  <th>Pagamento</th>
                  <th>Data</th>
                  <th>Acções</th>
                </tr>
              </thead>
              <tbody>
                {inscricoesFiltradas.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.nome_aluno}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--txt-3)' }}>{item.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.nome_curso}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--txt-3)' }}>
                        {item.carga_horaria ? `${item.carga_horaria}h` : 'Carga horária a confirmar'}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--txt-3)' }}>
                      <div>{item.nome_centro || 'Centro não atribuído'}</div>
                      <div>{[item.municipio_aluno, item.provincia_aluno].filter(Boolean).join(', ')}</div>
                    </td>
                    <td><BadgeStatus status={item.status} /></td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{formatAOA(item.valor_pago || item.preco_oferta || 0)}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--txt-3)' }}><BadgeStatus status={item.status_pagamento || 'pendente'} /></div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>{formatData(item.created_at)}</td>
                    <td>
                      <button className="btn btn--secondary btn--sm" onClick={() => { setModal(item); setMotivo(item.motivo_rejeicao || ''); }}>
                        <Eye size={13} /> Rever
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        aberto={!!modal}
        onFechar={() => { setModal(null); setMotivo(''); }}
        titulo="Revisão da inscrição"
        largura={760}
        acoes={
          <>
            <button className="btn btn--secondary" onClick={() => { setModal(null); setMotivo(''); }}>Fechar</button>
            <button className="btn btn--ghost" style={{ color: 'var(--vermelho)' }} onClick={() => decidir(false)} disabled={submetendo || !modal?.pode_decidir}>
              <XCircle size={14} /> Rejeitar
            </button>
            <button className={`btn btn--primary${submetendo ? ' btn--loading' : ''}`} onClick={() => decidir(true)} disabled={submetendo || !modal?.pode_decidir}>
              {!submetendo && <><CheckCircle size={14} /> Aprovar</>}
            </button>
          </>
        }
      >
        {modal && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Resumo label="Aluno" valor={modal.nome_aluno} />
              <Resumo label="Curso" valor={modal.nome_curso} />
              <Resumo label="Centro" valor={modal.nome_centro || 'Não atribuído'} />
              <Resumo label="Valor" valor={formatAOA(modal.valor_pago || modal.preco_oferta || 0)} />
            </div>

            <div style={{ background: 'var(--bg-soft)', borderRadius: 'var(--r-lg)', padding: 16, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, fontWeight: 700 }}>
                <MapPin size={16} /> Localização do aluno
              </div>
              <p style={{ color: 'var(--txt-3)' }}>{[modal.municipio_aluno, modal.provincia_aluno].filter(Boolean).join(', ') || 'Não informada'}</p>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: 'var(--bg-soft)' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Comprovativo de pagamento</div>
                  <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{modal.documentos_visualizados?.comprovativo ? 'Visualizado' : 'Ainda não visualizado'}</div>
                </div>
                <button className="btn btn--secondary btn--sm" onClick={() => abrirDocumento(modal, 'comprovativo')}>
                  <Eye size={13} /> Ver comprovativo
                </button>
              </div>

              {modal.exige_documento && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: 'var(--bg-soft)' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Documento obrigatório</div>
                    <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{modal.documentos_visualizados?.requisito ? 'Visualizado' : 'Ainda não visualizado'}</div>
                  </div>
                  <button className="btn btn--secondary btn--sm" onClick={() => abrirDocumento(modal, 'documento')}>
                    <FileText size={13} /> Ver documento
                  </button>
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: modal.pode_decidir ? 'var(--verde-100)' : 'var(--amarelo-100)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: modal.pode_decidir ? 'var(--verde)' : 'var(--amarelo-600, #92400e)' }}>{modal.pode_decidir ? 'Aprovação desbloqueada' : 'Aprovação bloqueada'}</div>
              <div style={{ fontSize: '0.84rem', color: modal.pode_decidir ? 'var(--verde-700, #166534)' : 'var(--amarelo-700, #78350f)' }}>
                {modal.pode_decidir
                  ? 'Os documentos obrigatórios já foram visualizados. Pode aprovar ou rejeitar a inscrição.'
                  : 'Os botões de decisão ficam activos apenas depois da visualização do comprovativo e do documento obrigatório, quando aplicável.'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Motivo da rejeição</label>
              <textarea className="form-textarea" rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Preencha apenas se a inscrição for cancelada." />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Resumo({ label, valor }) {
  return (
    <div style={{ padding: 14, borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div style={{ fontSize: '0.76rem', color: 'var(--txt-3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{valor}</div>
    </div>
  );
}
