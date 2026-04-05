// ============================================================
// ULEZI XPB — Dashboards: Aluno, Empresa, Investidor
// Dados reais do backend — validações — toast integrado
// ============================================================
// 
// @author AsdrubaDeveloper
// @version 1.0.0

import {
    AlertCircle,
    BookOpen,
    Briefcase,
    CheckCircle, Clock,
    CreditCard,
    Download,
    Edit,
    FileText,
    Mail,
    MapPin,
    MessageCircle,
    Plus,
    Star,
    Trash2,
    TrendingUp,
    Upload,
    Users,
    X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../components/ui/Toast';
import {
    BadgeStatus,
    EmptyState,
    Modal,
    Spinner,
    StatCard,
} from '../../components/ui/index.jsx';
import { useAuth } from '../../context/AuthContext';
import {
    cursosAPI, empresaAPI,
    extrairErro,
    investidorAPI
} from '../../services/api';
import { formatAOA, formatData } from '../../utils/constants';

function DashboardTabLoading({ label }) {
  return (
    <div className="dashboard-panel__body dashboard-panel__body--loading" role="status" aria-live="polite">
      <Spinner size={32} />
      <span>{label}</span>
    </div>
  );
}

function DashboardHero({ variante, eyebrow, titulo, descricao, acao, destaque }) {
  return (
    <section className={`dashboard-hero dashboard-hero--${variante}`}>
      <div className="dashboard-hero__content">
        <span className="dashboard-hero__eyebrow">{eyebrow}</span>
        <h1 className="dashboard-hero__title">{titulo}</h1>
        <p className="dashboard-hero__copy">{descricao}</p>
      </div>

      <div className="dashboard-hero__aside">
        {destaque ? (
          <div className="dashboard-hero__highlight">
            <span className="dashboard-hero__highlight-label">{destaque.label}</span>
            <strong>{destaque.valor}</strong>
            {destaque.ajuda ? <p>{destaque.ajuda}</p> : null}
          </div>
        ) : null}
        {acao ? <div className="dashboard-hero__action">{acao}</div> : null}
      </div>
    </section>
  );
}

// —
// DASHBOARD ALUNO
// —
export function DashboardAluno() {
  const { utilizador } = useAuth();
  const toast = useToast();
  const [inscricoes, setInscricoes] = useState([]);
  const [abaActiva, setAbaActiva] = useState('inscricoes');
  const [carregando, setCarregando] = useState(true);
  const [modalAvaliar, setModalAvaliar] = useState(null);
  const [avalForm, setAvalForm] = useState({ nota: 5, comentario: '' });
  const [enviando, setEnviando] = useState(false);
  const [agora, setAgora] = useState(Date.now());

  const carregar = useCallback(async () => {
    try {
      const ins = await cursosAPI.minhas();
      setInscricoes(ins.data.dados?.inscricoes || ins.data.dados || []);
    } catch (e) {
      toast.erro('Erro ao carregar dados: ' + extrairErro(e));
    } finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  // Actualiza o timestamp a cada minuto para recalcular prazos restantes
  useEffect(() => {
    const timer = window.setInterval(() => setAgora(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  // Calcula tempo restante até um deadline
  const formatarTempoRestante = (dataLimite) => {
    if (!dataLimite) return 'Sem prazo definido';
    const limite = new Date(dataLimite).getTime();
    if (Number.isNaN(limite)) return 'Prazo inválido';
    const diferenca = limite - agora;
    if (diferenca <= 0) return 'Expirada';
    const minutos = Math.floor(diferenca / 60000);
    const dias    = Math.floor(minutos / 1440);
    const horas   = Math.floor((minutos % 1440) / 60);
    const mins    = minutos % 60;
    if (dias  > 0) return `${dias}d ${horas}h restantes`;
    if (horas > 0) return `${horas}h ${mins}min restantes`;
    return `${mins}min restantes`;
  };

  const cancelarInscricao = async (id) => {
    // Verificar se a inscrição está aprovada/confirmada
    const inscricao = inscricoes.find(i => i.id === id);
    if (inscricao && ['confirmada', 'aprovada', 'concluida'].includes(inscricao.status)) {
      return toast.erro('Inscrições aprovadas ou concluídas não podem ser canceladas pelo aluno. Contacte o administrador se necessário.');
    }
    
    const ok = await toast.confirmar({
      titulo: 'Cancelar inscrição',
      mensagem: 'Tem a certeza que quer cancelar esta inscrição? Esta acção não pode ser desfeita.',
      variante: 'perigo',
      labelOk: 'Cancelar inscrição',
    });
    if (!ok) return;
    try {
      await cursosAPI.cancelar(id);
      setInscricoes(p => p.filter(i => i.id !== id));
      toast.sucesso('Inscrição cancelada.');
    } catch (e) { toast.erro(extrairErro(e)); }
  };

  const enviarAvaliacao = async () => {
    if (!avalForm.nota || avalForm.nota < 1 || avalForm.nota > 5) return toast.aviso('Seleccione uma nota de 1 a 5');
    setEnviando(true);
    try {
      await cursosAPI.avaliar(modalAvaliar.id, avalForm);
      toast.sucesso('Avaliação enviada! Obrigado.');
      setModalAvaliar(null);
      setAvalForm({ nota: 5, comentario: '' });
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setEnviando(false); }
  };

  const descarregarRecibo = async (id) => {
    try {
      const { data } = await cursosAPI.descarregarRecibo(id);
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  };

  return (
    <div className="dashboard">
      <DashboardHero
        variante="aluno"
        eyebrow="Área do aluno"
        titulo={`Olá, ${utilizador?.nome?.split(' ')[0] || 'Estudante'}`}
        descricao="Acompanhe inscrições, prazos de confirmação e recibos aprovados num único lugar."
        destaque={carregando ? {
          label: 'Inscrições',
          valor: '…',
          ajuda: 'A sincronizar os seus dados com o servidor.',
        } : {
          label: 'Inscrições ativas',
          valor: inscricoes.length,
          ajuda: 'O painel mostra o andamento da sua jornada formativa em tempo real.',
        }}
        acao={(
          <a href="/cursos" className="btn btn--secondary">
            <BookOpen size={18}/> Explorar Cursos
          </a>
        )}
      />

      {/* Grid de Estatísticas */}
      <div className="dashboard-stats-row">
        <StatCard
          icone={<BookOpen size={20} color="var(--ciano)" />}
          label="Total de inscrições"
          valor={carregando ? '—' : inscricoes.length}
          corIcone="var(--ciano-100)"
        />
        <StatCard
          icone={<Clock size={20} color="var(--amarelo)" />}
          label="Em análise"
          valor={carregando ? '—' : inscricoes.filter(i=>i.status==='em_analise' || i.status==='pendente').length}
          corIcone="var(--amarelo-100)"
        />
        <StatCard
          icone={<CheckCircle size={20} color="var(--verde)" />}
          label="Aprovadas"
          valor={carregando ? '—' : inscricoes.filter(i=>i.status==='confirmada').length}
          corIcone="var(--verde-100)"
        />
        <StatCard
          icone={<FileText size={20} color="var(--laranja)" />}
          label="Com recibo"
          valor={carregando ? '—' : inscricoes.filter(i=>i.recibo_id).length}
          corIcone="var(--laranja-100)"
        />
      </div>

      {/* Card Principal com Tabs */}
      <div className="dashboard-panel dashboard-panel-shell">
        {/* Header das Tabs */}
        <div className="dashboard-panel__tabs" style={{ 
          padding: '24px 24px 0', 
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)'
        }}>
          <div className="tabs" style={{ 
            margin: 0, 
            borderBottom: 'none',
            display: 'flex',
            gap: '8px'
          }}>
            <button 
              type="button"
              className={`tab-btn${abaActiva==='inscricoes'?' active':''}`} 
              onClick={()=>setAbaActiva('inscricoes')}
              style={{
                padding: '12px 20px',
                borderRadius: 'var(--r-md) var(--r-md) 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <BookOpen size={16}/> Inscrições ativas
            </button>
            <button 
              type="button"
              className={`tab-btn${abaActiva==='historico'?' active':''}`} 
              onClick={()=>setAbaActiva('historico')}
              style={{
                padding: '12px 20px',
                borderRadius: 'var(--r-md) var(--r-md) 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={16}/> Histórico Completo
            </button>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="dashboard-panel__body">
          {carregando ? (
            <DashboardTabLoading label="A carregar as suas inscrições…" />
          ) : (
          <>
          {abaActiva === 'inscricoes' && (
            inscricoes.length === 0 ? (
              <EmptyState
                icone={<BookOpen size={48}/>}
                titulo="Ainda não tem inscrições"
                descricao="Explore os cursos disponíveis e faça a sua primeira inscrição para começar a sua jornada de aprendizagem."
                acao={<a href="/cursos" className="btn btn--primary" style={{ padding: '12px 24px' }}>Explorar Cursos</a>}
              />
            ) : (
              <div className="table-container" style={{ marginTop: 0 }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-3)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--txt-2)' }}>Curso</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--txt-2)' }}>Centro de Formação</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--txt-2)' }}>Documentos</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--txt-2)' }}>Estado</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--txt-2)' }}>Data</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--txt-2)' }}>Acções</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscricoes.map(i => (
                      <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>{i.curso_nome || i.nome_curso || '—'}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              background: 'var(--surface-3)', 
                              borderRadius: 'var(--r-sm)',
                              fontSize: '0.75rem'
                            }}>{i.categoria || 'Formação'}</span>
                            {i.carga_horaria && <span>— {i.carga_horaria}h</span>}
                          </div>
                        </td>
                        <td style={{ padding: '20px 16px', color: 'var(--txt-3)', fontSize: '0.9rem' }}>
                          {(i.centro_nome || i.nome_centro) ? (
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--txt-2)' }}>{i.centro_nome || i.nome_centro}</div>
                              <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                                {[i.municipio_centro, i.provincia_centro].filter(Boolean).join(', ')}
                              </div>
                            </div>
                          ) : 'A definir'}
                        </td>
                        <td style={{ padding: '20px 16px', fontSize: '0.85rem', color: 'var(--txt-3)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ 
                              color: i.comprovativo_url ? 'var(--verde)' : 'var(--txt-4)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {i.comprovativo_url ? <CheckCircle size={14}/> : <Clock size={14}/>}
                              {i.comprovativo_url ? 'Comprovativo enviado' : 'Sem comprovativo'}
                            </span>
                            {i.exige_documento && (
                              <span style={{ 
                                color: i.documento_requisito_url ? 'var(--verde)' : 'var(--amarelo)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {i.documento_requisito_url ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                                {i.documento_requisito_url ? 'Documento enviado' : 'Documento em falta'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <BadgeStatus status={i.status} />
                        </td>
                        <td style={{ padding: '20px 16px', color: 'var(--txt-3)', fontSize: '0.85rem' }}>
                          {formatData(i.criado_em)}
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {i.status === 'confirmada' && (
                              <button className="btn btn--secondary btn--sm" onClick={()=>setModalAvaliar(i)}>
                                <Star size={14}/> Avaliar
                              </button>
                            )}
                            {i.recibo_id && (
                              <button className="btn btn--primary btn--sm" onClick={() => descarregarRecibo(i.id)}>
                                <Download size={14}/> Recibo
                              </button>
                            )}
                            {['pendente', 'em_analise'].includes(i.status) && (
                              <button className="btn btn--ghost btn--sm" onClick={()=>cancelarInscricao(i.id)} title="Cancelar inscrição">
                                <X size={14}/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {abaActiva === 'historico' && (
            inscricoes.length === 0 ? (
              <EmptyState icone={<FileText size={28}/>} titulo="Sem histórico" descricao="As suas inscrições aparecerão aqui depois da primeira submissão." />
            ) : (
              <div className="table-container" style={{ marginTop:20 }}>
                <table>
                  <thead><tr><th>Curso</th><th>Valor</th><th>Estado do pagamento</th><th>Motivo</th><th>Recibo</th></tr></thead>
                  <tbody>
                    {inscricoes.map(i => (
                      <tr key={`hist-${i.id}`}>
                        <td style={{ fontWeight:600 }}>{i.curso_nome || i.nome_curso || '—'}</td>
                        <td style={{ fontWeight:700 }}>{formatAOA(i.valor_pago || i.preco_oferta || 0)}</td>
                        <td><BadgeStatus status={i.status_pagamento || i.payment_status || 'pendente'} /></td>
                        <td style={{ fontSize:'0.8rem', color:'var(--txt-3)' }}>{i.motivo_rejeicao || '—'}</td>
                        <td>
                          {i.recibo_id ? (
                            <button className="btn btn--secondary btn--sm" onClick={() => descarregarRecibo(i.id)}>
                              <Download size={13}/> Descarregar
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
          </>
          )}
        </div>
      </div>

      {/* Modal avaliação */}
      <Modal aberto={!!modalAvaliar} onFechar={()=>setModalAvaliar(null)} titulo="Avaliar Curso"
        acoes={<>
          <button type="button" className="btn btn--secondary" onClick={()=>setModalAvaliar(null)}>Cancelar</button>
          <button type="button" className={`btn btn--primary${enviando?' btn--loading':''}`} onClick={enviarAvaliacao} disabled={enviando}>
            {!enviando && <><Star size={14}/> Enviar Avaliação</>}
          </button>
        </>}
      >
        <p style={{ fontWeight:600, marginBottom:16 }}>{modalAvaliar?.curso_nome}</p>
        <div className="form-group" style={{ marginBottom:14 }}>
          <label className="form-label">Nota (1 a 5)</label>
          <div style={{ display:'flex', gap:8 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={()=>setAvalForm(f=>({...f,nota:n}))}
                style={{
                  width:44, height:44, borderRadius:'var(--r-md)', border:'2px solid',
                  borderColor: avalForm.nota >= n ? 'var(--amarelo)' : 'var(--border)',
                  background: avalForm.nota >= n ? 'var(--amarelo-100)' : 'var(--bg-card)',
                  cursor:'pointer', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                ⭐
              </button>
            ))}
            <span style={{ alignSelf:'center', fontSize:'0.875rem', color:'var(--txt-3)', marginLeft:4 }}>{avalForm.nota}/5</span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Comentário (opcional)</label>
          <textarea className="form-textarea" rows={3} value={avalForm.comentario} onChange={e=>setAvalForm(f=>({...f,comentario:e.target.value}))} placeholder="Partilhe a sua experiência..." />
          {/*
          <div className="form-group">
            <label className="form-label">Data limite para candidaturas *</label>
            <input type="datetime-local" className="form-input" value={formVaga.expires_at} onChange={e=>setFormVaga(p=>({...p,expires_at:e.target.value}))}/>
          </div>
          */}
        </div>
      </Modal>

      {/*
      <Modal aberto={modalServico} onFechar={()=>setModalServico(false)}
        titulo={servicoEdit ? 'Editar Serviço' : 'Novo Serviço'}
        acoes={<>
          <button className="btn btn--secondary" onClick={()=>setModalServico(false)}>Cancelar</button>
          <button className={`btn btn--primary${submServico?' btn--loading':''}`} onClick={submeterServico} disabled={submServico}>
            {!submServico && <>{servicoEdit ? <><Edit size={14}/> Actualizar</> : <><Plus size={14}/> Publicar</>}</>}
          </button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Categoria *</label>
            <select className="form-select" value={formServico.category_id} onChange={e=>setFormServico(p=>({...p,category_id:e.target.value}))}>
              <option value="">Seleccione</option>
              {categoriasServico.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">DescriÃ§Ã£o do serviÃ§o *</label>
            <textarea className="form-textarea" rows={4} placeholder="Explique o que a empresa oferece, condições e benefícios do serviço." value={formServico.descricao} onChange={e=>setFormServico(p=>({...p,descricao:e.target.value}))}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Email de contacto</label>
              <input className="form-input" placeholder="empresa@dominio.com" value={formServico.contacto_email} onChange={e=>setFormServico(p=>({...p,contacto_email:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp (opcional)</label>
              <input className="form-input" placeholder="923 000 000" value={formServico.contacto_whatsapp} onChange={e=>setFormServico(p=>({...p,contacto_whatsapp:e.target.value}))}/>
            </div>
          </div>
        </div>
      </Modal>
      */}
    </div>
  );
}

// —
// DASHBOARD EMPRESA
// —
export function DashboardEmpresa() {
  const { utilizador } = useAuth();
  const toast          = useToast();
  const [oportunidades, setOportunidades] = useState([]);
  const [servicos,      setServicos]      = useState([]);
  const [minhasVagas,   setMinhasVagas]   = useState([]);
  const [stats,         setStats]         = useState({});
  const [documentos,    setDocumentos]    = useState([]);
  const [categoriasServico, setCategoriasServico] = useState([]);
  const [assinaturaInfo,setAssinaturaInfo]= useState(null);
  const [abaActiva,     setAbaActiva]     = useState('oportunidades');
  const [carregando,    setCarregando]    = useState(true);
  const [modalDoc,      setModalDoc]      = useState(false);
  const [ficheiroDoc,   setFicheiroDoc]   = useState(null);
  const [tipoDoc,       setTipoDoc]       = useState('alvara');
  const [enviando,      setEnviando]      = useState(false);
  // Estado do formulário de vaga
  const [modalVaga,     setModalVaga]     = useState(false);
  const [vagaEdit,      setVagaEdit]      = useState(null); // null = criar, objeto = editar
  const [modalServico,  setModalServico]  = useState(false);
  const [servicoEdit,   setServicoEdit]   = useState(null);
  const [formVaga,      setFormVaga]      = useState({
    titulo: '', descricao: '', requisitos: '', localizacao: '',
    tipo: 'efetivo', salario: '', contacto: '', starts_at: '', expires_at: '',
  });
  const [formServico,   setFormServico]   = useState({
    category_id: '', descricao: '', contacto_email: '', contacto_whatsapp: '',
  });
  const [submServico,   setSubmServico]   = useState(false);
  const [submVaga,      setSubmVaga]      = useState(false);
  const [agora,         setAgora]         = useState(Date.now());
  const [modalOportunidade, setModalOportunidade] = useState(false);
  const [submOportunidade, setSubmOportunidade] = useState(false);
  const [formOportunidade, setFormOportunidade] = useState({
    tipo: 'investimento',
    titulo: '',
    descricao: '',
    valor: '',
    moeda: 'AOA',
    termos: '',
    retorno_percentual: '',
    prazo_pagamento: '',
    participacao_percentual: '',
  });
  // Modal rejeição (mostrar motivo)
  const [modalMotivo,   setModalMotivo]   = useState(null);

  const tiposOportunidade = [
    { valor: 'venda_empresa', etiqueta: 'Venda total da empresa' },
    { valor: 'participacao', etiqueta: 'Venda de participação societária' },
    { valor: 'licenciamento', etiqueta: 'Licenciamento de marcas' },
    { valor: 'franquia', etiqueta: 'Expansão por franquia' },
    { valor: 'investimento', etiqueta: 'Busca de financiamento ou investimento' },
  ];

  const carregar = useCallback(async () => {
    try {
      const [st, op, sv, vg, dc, sub, cat] = await Promise.all([
        empresaAPI.stats().catch(() => ({ data: { dados: {} } })),
        empresaAPI.oportunidades().catch(() => ({ data: { dados: [] } })),
        empresaAPI.servicos().catch(() => ({ data: { dados: { servicos: [] } } })),
        empresaAPI.minhasVagas().catch(() => ({ data: { dados: { vagas: [] } } })),
        empresaAPI.documentos().catch(() => ({ data: { dados: [] } })),
        empresaAPI.minhaAssinatura().catch(() => ({ data: { dados: null } })),
        empresaAPI.categoriasServicos().catch(() => ({ data: { dados: [] } })),
      ]);
      setStats(st.data.dados || {});
      setOportunidades(op.data.dados?.oportunidades || op.data.dados || []);
      setServicos(sv.data.dados?.servicos || sv.data.dados || []);
      setMinhasVagas(vg.data.dados?.vagas || vg.data.dados || []);
      setDocumentos(dc.data.dados?.documentos || dc.data.dados || []);
      setAssinaturaInfo(sub.data.dados || null);
      setCategoriasServico(cat.data.dados?.categorias || cat.data.dados || []);
    } catch (e) {
      toast.erro('Erro ao carregar dados: ' + extrairErro(e));
    } finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  // Calcula tempo restante até um deadline
  function formatarTempoRestante(dataLimite) {
    if (!dataLimite) return 'Sem prazo definido';
    const limite = new Date(dataLimite).getTime();
    if (Number.isNaN(limite)) return 'Prazo inválido';
    const diferenca = limite - agora;
    if (diferenca <= 0) return 'Expirada';
    const minutos = Math.floor(diferenca / 60000);
    const dias    = Math.floor(minutos / 1440);
    const horas   = Math.floor((minutos % 1440) / 60);
    const mins    = minutos % 60;
    if (dias  > 0) return `${dias}d ${horas}h restantes`;
    if (horas > 0) return `${horas}h ${mins}min restantes`;
    return `${mins}min restantes`;
  }

  // —— Documentos —
  const enviarDocumento = async () => {
    if (!ficheiroDoc) return toast.aviso('Seleccione um ficheiro');
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('documento', ficheiroDoc);
      fd.append('tipo', tipoDoc); // Backend espera 'tipo', não 'tipo_documento'
      await empresaAPI.enviarDoc(fd);
      toast.sucesso('Documento enviado para análise!');
      setModalDoc(false); setFicheiroDoc(null);
      carregar();
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setEnviando(false); }
  };

  // —— Vagas —
  const paraInputDataHora = (valor) => {
    if (!valor) return '';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '';
    const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const dataLimitePadrao = () => {
    const data = new Date();
    data.setDate(data.getDate() + 30);
    return paraInputDataHora(data);
  };

  const abrirModalVaga = (vaga = null) => {
    setVagaEdit(vaga);
    setFormVaga(vaga ? {
      titulo: vaga.titulo, descricao: vaga.descricao, requisitos: vaga.requisitos || '',
      localizacao: vaga.localizacao || '', tipo: vaga.tipo || 'efetivo',
      salario: vaga.salario || '', contacto: vaga.contacto || '', 
      starts_at: paraInputDataHora(vaga.starts_at) || '',
      expires_at: paraInputDataHora(vaga.expires_at) || dataLimitePadrao(),
    } : { 
      titulo: '', descricao: '', requisitos: '', localizacao: '', 
      tipo: 'efetivo', salario: '', contacto: '', 
      starts_at: '',
      expires_at: dataLimitePadrao() 
    });
    setModalVaga(true);
  };

  const abrirModalServico = (servico = null) => {
    setServicoEdit(servico);
    if (servico) {
      // Modo edição - usar dados do serviço existente
      setFormServico({
        category_id: String(servico.category_id || ''),
        descricao: servico.descricao || servico.servico_descricao || '',
        contacto_email: servico.contacto_email || '',
        contacto_whatsapp: servico.contacto_whatsapp || servico.telefone || '',
      });
    } else {
      // Modo criação - preencher automaticamente com dados da empresa/empresário
      const emailEmpresa = assinaturaInfo?.empresa?.email || utilizador?.email || '';
      // WhatsApp: prioridade 1 = telefone do empresário, prioridade 2 = telefone da empresa
      const telefoneEmpresario = utilizador?.telefone || utilizador?.phone || '';
      const telefoneEmpresa = assinaturaInfo?.empresa?.telefone || assinaturaInfo?.empresa?.phone || '';
      const whatsAppAuto = telefoneEmpresario || telefoneEmpresa || '';
      
      setFormServico({
        category_id: String(categoriasServico[0]?.id || ''),
        descricao: '',
        contacto_email: emailEmpresa,
        contacto_whatsapp: whatsAppAuto,
      });
    }
    setModalServico(true);
  };

  const abrirModalOportunidade = () => {
    setFormOportunidade({
      tipo: 'investimento',
      titulo: '',
      descricao: '',
      valor: '',
      moeda: 'AOA',
      termos: '',
      retorno_percentual: '',
      prazo_pagamento: '',
      participacao_percentual: '',
    });
    setModalOportunidade(true);
  };

  const submeterOportunidade = async () => {
    if (!formOportunidade.titulo.trim()) return toast.aviso('O título da oportunidade é obrigatório.');
    if (!formOportunidade.descricao.trim()) return toast.aviso('A descrição da oportunidade é obrigatória.');
    if (!formOportunidade.valor) return toast.aviso('Informe o valor pretendido para a oportunidade.');
    if (!formOportunidade.termos.trim()) return toast.aviso('Descreva os termos da operação.');

    setSubmOportunidade(true);
    try {
      await empresaAPI.criarOportunidade(formOportunidade);
      toast.sucesso('Oportunidade publicada com sucesso.');
      setModalOportunidade(false);
      carregar();
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setSubmOportunidade(false);
    }
  };

  const submeterVaga = async () => {
    // Validações de datas
    const agora = new Date();
    agora.setSeconds(0, 0); // Ignorar segundos/milissegundos
    
    if (!formVaga.starts_at) return toast.aviso('Defina a data de início das candidaturas.');
    if (!formVaga.expires_at) return toast.aviso('Defina a data limite para candidaturas.');
    
    const dataInicio = new Date(formVaga.starts_at);
    const dataFim = new Date(formVaga.expires_at);
    
    // Validar se data de início não está no passado
    if (dataInicio < agora) {
      return toast.aviso('A data de início das candidaturas não pode ser no passado.');
    }
    
    // Validar se data fim é maior que data início
    if (dataFim <= dataInicio) {
      return toast.aviso('A data de fim das candidaturas deve ser maior que a data de início.');
    }
    
    if (!formVaga.titulo.trim()) return toast.aviso('Título é obrigatório.');
    if (!formVaga.descricao.trim()) return toast.aviso('Descrição é obrigatória.');
    setSubmVaga(true);
    try {
      if (vagaEdit) {
        await empresaAPI.editarVaga(vagaEdit.id, formVaga);
        toast.sucesso('Vaga atualizada com sucesso.');
      } else {
        await empresaAPI.criarVaga(formVaga);
        toast.sucesso('Vaga publicada com sucesso.');
      }
      setModalVaga(false);
      carregar();
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setSubmVaga(false); }
  };

  const eliminarVaga = async (id, titulo) => {
    const ok = await toast.confirmar({
      titulo: 'Eliminar vaga',
      mensagem: `Tem a certeza que quer eliminar a vaga "${titulo}"? Esta acção não pode ser desfeita.`,
      variante: 'perigo', labelOk: 'Eliminar',
    });
    if (!ok) return;
    try {
      await empresaAPI.eliminarVaga(id);
      setMinhasVagas(p => p.filter(v => v.id !== id));
      toast.sucesso('Vaga eliminada.');
    } catch (e) { toast.erro(extrairErro(e)); }
  };

  const submeterServico = async () => {
    if (!formServico.category_id) return toast.aviso('Seleccione a categoria do serviÃ§o.');
    if (!formServico.descricao.trim()) return toast.aviso('Descreva o serviÃ§o prestado.');
    setSubmServico(true);
    try {
      if (servicoEdit) {
        await empresaAPI.editarServico(servicoEdit.id, formServico);
        toast.sucesso('ServiÃ§o actualizado com sucesso.');
      } else {
        await empresaAPI.criarServico(formServico);
        toast.sucesso('ServiÃ§o publicado com sucesso.');
      }
      setModalServico(false);
      carregar();
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setSubmServico(false); }
  };

  const eliminarServico = async (id, titulo) => {
    const ok = await toast.confirmar({
      titulo: 'Eliminar serviÃ§o',
      mensagem: `Tem a certeza que quer eliminar o serviÃ§o "${titulo}"?`,
      variante: 'perigo', labelOk: 'Eliminar',
    });
    if (!ok) return;
    try {
      await empresaAPI.eliminarServico(id);
      setServicos((lista) => lista.filter((item) => item.id !== id));
      toast.sucesso('ServiÃ§o eliminado.');
    } catch (e) { toast.erro(extrairErro(e)); }
  };

  // Cores de estado para vagas
  const estadoVaga = {
    pendente:  { label: 'Pendente',  bg: 'var(--amarelo-100)', color: '#92400E' },
    aprovada:  { label: 'Aprovada',  bg: 'var(--verde-100)',   color: '#166534' },
    rejeitada: { label: 'Rejeitada', bg: 'var(--vermelho-100)', color: '#991B1B' },
    encerrada: { label: 'Encerrada', bg: 'var(--bg-hover)',    color: 'var(--txt-3)' },
  };

  const temAssinaturaAtiva = Boolean(assinaturaInfo?.tem_assinatura_ativa);
  const assinaturaAtual = assinaturaInfo?.assinatura || null;
  const empresaAprovada = Boolean(assinaturaInfo?.empresa?.is_approved);
  const podePublicar = temAssinaturaAtiva && empresaAprovada;

  return (
    <div className="dashboard">
      <DashboardHero
        variante="empresa"
        eyebrow="Área da empresa"
        titulo={utilizador?.nome || 'Empresa'}
        descricao="Gira oportunidades, vagas, documentos e elegibilidade comercial a partir de um único painel."
        destaque={carregando ? {
          label: 'Estado comercial',
          valor: '…',
          ajuda: 'A sincronizar dados com o servidor.',
        } : {
          label: 'Capacidade de publicação',
          valor: podePublicar ? 'Ativa' : 'Condicionada',
          ajuda: podePublicar
            ? 'A empresa pode publicar oportunidades e vagas sem restrições.'
            : 'Regularize assinatura e aprovação para desbloquear toda a operação.',
        }}
        acao={(
          <a href="/empresa/assinatura" className="btn btn--secondary">
            <CreditCard size={14}/> Gerir assinatura
          </a>
        )}
      />

      {!carregando && !temAssinaturaAtiva && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(251, 191, 36, 0.1))',
          border: '1px solid rgba(245, 158, 11, 0.32)',
          borderRadius: 'var(--r-xl)',
          padding: '18px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertCircle size={18} color="var(--amarelo)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Assinatura pendente para desbloquear a plataforma</div>
              <div style={{ color: 'var(--txt-2)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Enquanto a empresa não tiver uma assinatura ativa, o sistema permite apenas atualizar o perfil e os documentos.
              </div>
            </div>
          </div>
          <a href="/empresa/assinatura" className="btn btn--primary btn--sm">
            <CreditCard size={14}/> Ver planos
          </a>
        </div>
      )}

      {!carregando && temAssinaturaAtiva && !empresaAprovada && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.16), rgba(14, 165, 233, 0.08))',
          border: '1px solid rgba(34, 211, 238, 0.32)',
          borderRadius: 'var(--r-xl)',
          padding: '18px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertCircle size={18} color="var(--ciano)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Assinatura ativa, aprovação da empresa pendente</div>
              <div style={{ color: 'var(--txt-2)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                A assinatura já foi confirmada, mas a equipa administrativa ainda precisa concluir a aprovação final da empresa antes de liberar vagas e oportunidades.
              </div>
            </div>
          </div>
          <a href="/perfil" className="btn btn--secondary btn--sm">
            <FileText size={14}/> Rever perfil
          </a>
        </div>
      )}

      {!carregando && temAssinaturaAtiva && assinaturaAtual && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Plano ativo: {assinaturaAtual.package_name || assinaturaAtual.tipo_plano || 'Assinatura empresarial'}</div>
            <div style={{ color: 'var(--txt-3)', fontSize: '0.86rem' }}>
              Válido até {formatData(assinaturaAtual.data_fim)}.
            </div>
          </div>
          <a href="/empresa/assinatura" className="btn btn--secondary btn--sm">
            <CreditCard size={14}/> Gerir assinatura
          </a>
        </div>
      )}

      <div className="stats-grid dashboard-stats-row">
        <StatCard icone={<TrendingUp size={20} color="var(--ciano)"/>} label="Oportunidades" valor={carregando ? '—' : (stats.total_oportunidades || 0)} corIcone="var(--ciano-100)" />
        <StatCard icone={<Users size={20} color="var(--verde)"/>} label="Interessados" valor={carregando ? '—' : (stats.total_interessados || 0)} corIcone="var(--verde-100)" />
        <StatCard icone={<Briefcase size={20} color="var(--laranja)"/>} label="Vagas ativas" valor={carregando ? '—' : minhasVagas.filter(v=>v.status==='aprovada').length} corIcone="var(--laranja-100)" />
        <StatCard icone={<FileText size={20} color="var(--roxo)"/>} label="Documentos" valor={carregando ? '—' : documentos.length} corIcone="var(--roxo-100)" />
      </div>

      <div className="card dashboard-panel dashboard-panel-shell" style={{ padding: 0, marginTop: 0 }}>
        <div className="dashboard-panel__tabs" style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="tabs" style={{ margin: 0, borderBottom: 'none' }}>
            <button type="button" className={`tab-btn${abaActiva==='oportunidades'?' active':''}`} onClick={()=>setAbaActiva('oportunidades')}>
              <TrendingUp size={14}/> Oportunidades
            </button>
            <button type="button" className={`tab-btn${abaActiva==='servicos'?' active':''}`} onClick={()=>setAbaActiva('servicos')}>
              <Briefcase size={14}/> Serviços
            </button>
            <button type="button" className={`tab-btn${abaActiva==='vagas'?' active':''}`} onClick={()=>setAbaActiva('vagas')}>
              <Briefcase size={14}/> Vagas de Emprego
            </button>
            <button type="button" className={`tab-btn${abaActiva==='documentos'?' active':''}`} onClick={()=>setAbaActiva('documentos')}>
              <FileText size={14}/> Documentos
            </button>
          </div>
        </div>

        <div className="dashboard-panel__body">
          {carregando ? (
            <DashboardTabLoading label="A carregar o painel da empresa…" />
          ) : (
          <>
          {/* —— Oportunidades — */}
          {abaActiva === 'oportunidades' && (
            oportunidades.length === 0 ? (
              <EmptyState icone={<TrendingUp size={28}/>} titulo="Sem oportunidades"
                descricao={podePublicar
                  ? 'Publique a sua primeira oportunidade de investimento.'
                  : 'As oportunidades serão liberadas assim que a empresa estiver aprovada e com assinatura ativa.'}
                acao={<button className="btn btn--primary btn--sm" onClick={abrirModalOportunidade} disabled={!podePublicar}><Plus size={14}/> Nova oportunidade</button>} />
            ) : (
              <div className="table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ color: 'var(--txt-3)', fontSize: '0.84rem', lineHeight: 1.6 }}>
                    Publique oportunidades como venda total da empresa, participação societária, licenciamento de marcas, franquia e busca de financiamento.
                  </div>
                  <button className="btn btn--primary btn--sm" onClick={abrirModalOportunidade} disabled={!podePublicar}>
                    <Plus size={14}/> Nova oportunidade
                  </button>
                </div>
                <table>
                  <thead><tr><th>Título</th><th>Tipo</th><th>Valor</th><th>Interessados</th><th>Estado</th><th>Data</th></tr></thead>
                  <tbody>
                    {[...oportunidades].sort((a, b) => new Date(b.criado_em || b.created_at || 0) - new Date(a.criado_em || a.created_at || 0)).map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 500 }}>{o.titulo}</td>
                        <td style={{ color: 'var(--txt-3)', fontSize: '0.85rem' }}>{tiposOportunidade.find((tipo) => tipo.valor === (o.tipo_servico || o.tipo))?.etiqueta || o.tipo_servico || o.tipo}</td>
                        <td style={{ fontWeight: 700 }}>{formatAOA(o.valor || 0)}</td>
                        <td><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} color="var(--txt-3)"/>{o.num_interessados || 0}</span></td>
                        <td><BadgeStatus status={o.status}/></td>
                        <td style={{ color: 'var(--txt-3)', fontSize: '0.8rem' }}>{formatData(o.criado_em || o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {abaActiva === 'servicos' && (
            <>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 16, color: 'var(--txt-2)', fontSize: '0.84rem', lineHeight: 1.6 }}>
                Use esta área para gerir os serviços públicos da empresa. A categoria, descrição, nome da empresa e contactos aparecem na página Comunidade.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn--primary btn--sm" onClick={() => abrirModalServico(null)} disabled={!podePublicar}>
                  <Plus size={14}/> Novo Serviço
                </button>
              </div>

              {servicos.length === 0 ? (
                <EmptyState icone={<Briefcase size={28}/>} titulo="Sem serviços"
                  descricao={podePublicar
                    ? 'Publique o primeiro serviço da empresa para aparecer na Comunidade.'
                    : 'Os serviços serão liberados assim que a empresa estiver aprovada e com assinatura ativa.'}
                  acao={<button className="btn btn--primary btn--sm" onClick={() => abrirModalServico(null)} disabled={!podePublicar}><Plus size={14}/> Publicar Serviço</button>} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {servicos.map((servico) => (
                    <div key={servico.id} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{servico.nome_categoria || servico.categoria || 'Serviço empresarial'}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'var(--surface-3)', color: 'var(--txt-3)', fontSize: '0.72rem' }}>
                            {utilizador?.nome || 'Empresa'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: 'var(--txt-2)', lineHeight: 1.6, marginBottom: 10 }}>
                          {servico.descricao || 'Sem descrição.'}
                        </p>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          {(servico.contacto_email || utilizador?.email) && (
                            <span style={{ fontSize: '0.76rem', color: 'var(--txt-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Mail size={12} /> {servico.contacto_email || utilizador?.email}
                            </span>
                          )}
                          {(servico.contacto_whatsapp || utilizador?.telefone) && (
                            <span style={{ fontSize: '0.76rem', color: 'var(--txt-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <MessageCircle size={12} /> {servico.contacto_whatsapp || utilizador?.telefone}
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--txt-4)' }}>{formatData(servico.created_at)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn--ghost btn--sm" title="Editar" onClick={() => abrirModalServico(servico)}>
                          <Edit size={14}/>
                        </button>
                        <button className="btn btn--ghost btn--sm" title="Eliminar" style={{ color: 'var(--vermelho)' }} onClick={() => eliminarServico(servico.id, servico.nome_categoria || servico.categoria || 'Serviço')}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* —— Vagas de Emprego — */}
          {abaActiva === 'vagas' && (
            <>
              {/* Aviso sobre fluxo de aprovação */}
              <div style={{ background: 'var(--ciano-100)', border: '1px solid var(--ciano-400)', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="var(--ciano)" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: '0.82rem', color: 'var(--ciano-600)', lineHeight: 1.5 }}>
                  Defina sempre a data e hora limite da vaga. O sistema mostra a contagem do tempo restante e remove automaticamente as vagas expiradas da área pública.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn--primary btn--sm" onClick={() => abrirModalVaga(null)} disabled={!podePublicar}>
                  <Plus size={14}/> Nova Vaga
                </button>
              </div>

              {minhasVagas.length === 0 ? (
                <EmptyState icone={<Briefcase size={28}/>} titulo="Sem vagas"
                  descricao={podePublicar
                    ? 'Publique a sua primeira vaga de emprego para encontrar talentos.'
                    : 'A publicação de vagas será liberada assim que a empresa estiver aprovada pela equipa administrativa.'}
                  acao={<button className="btn btn--primary btn--sm" onClick={()=>abrirModalVaga(null)} disabled={!podePublicar}><Plus size={14}/> Criar Vaga</button>} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...minhasVagas].sort((a, b) => new Date(b.aprovado_at || b.created_at || 0) - new Date(a.aprovado_at || a.created_at || 0)).map(v => {
                    const ev = estadoVaga[v.status] || estadoVaga.pendente;
                    return (
                      <div key={v.id} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.titulo}</span>
                            <span style={{ padding: '2px 10px', borderRadius: 'var(--r-full)', background: ev.bg, color: ev.color, fontSize: '0.72rem', fontWeight: 700 }}>
                              {ev.label}
                            </span>
                            {v.tipo && (
                              <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'var(--bg-hover)', color: 'var(--txt-3)', fontSize: '0.72rem' }}>
                                {v.tipo}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.83rem', color: 'var(--txt-2)', lineHeight: 1.5, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {v.descricao}
                          </p>
                          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            {v.localizacao && <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>— {v.localizacao}</span>}
                            {v.salario    && <span style={{ fontSize: '0.75rem', color: 'var(--verde)', fontWeight: 600 }}>— {v.salario}</span>}
                            {v.expires_at && <span style={{ fontSize: '0.75rem', color: v.status === 'encerrada' ? 'var(--txt-4)' : 'var(--amarelo)', fontWeight: 600 }}>Tempo restante: {formatarTempoRestante(v.expires_at)}</span>}
                            {v.expires_at && <span style={{ fontSize: '0.75rem', color: 'var(--txt-4)' }}>Expira em {formatData(v.expires_at)}</span>}
                            <span style={{ fontSize: '0.75rem', color: 'var(--txt-4)' }}>{formatData(v.created_at)}</span>
                          </div>
                          {/* Motivo de rejeição */}
                          {v.status === 'rejeitada' && v.motivo_rejeicao && (
                            <button onClick={() => setModalMotivo(v)} style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--vermelho)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <AlertCircle size={12}/> Ver motivo de rejeição
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button className="btn btn--ghost btn--sm" title="Editar" onClick={() => abrirModalVaga(v)}>
                            <Edit size={14}/>
                          </button>
                          <button className="btn btn--ghost btn--sm" title="Eliminar"
                            style={{ color: 'var(--vermelho)' }}
                            onClick={() => eliminarVaga(v.id, v.titulo)}>
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* —— Documentos — */}
          {abaActiva === 'documentos' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn--primary btn--sm" onClick={()=>setModalDoc(true)}>
                  <Upload size={14}/> Enviar Documento
                </button>
              </div>
              {documentos.length === 0 ? (
                <EmptyState icone={<FileText size={28}/>} titulo="Sem documentos"
                  descricao="Envie os documentos da sua empresa para aprovação." />
              ) : (
                <div className="table-container">
                  <table>
                    <thead><tr><th>Tipo</th><th>Ficheiro</th><th>Estado</th><th>Data</th></tr></thead>
                    <tbody>
                      {documentos.map(d => (
                        <tr key={d.id}>
                          <td style={{ fontWeight: 500, textTransform: 'capitalize' }}>{d.tipo || d.tipo_documento}</td>
                          <td style={{ color: 'var(--txt-3)', fontSize: '0.85rem' }}>{d.nome_ficheiro || d.nome_arquivo}</td>
                          <td><BadgeStatus status={d.status_verificacao || d.status}/></td>
                          <td style={{ color: 'var(--txt-3)', fontSize: '0.8rem' }}>{formatData(d.created_at || d.enviado_em)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          </>
          )}
        </div>
      </div>

      {/* Modal: criar/editar vaga */}
      <Modal aberto={modalVaga} onFechar={()=>setModalVaga(false)}
        titulo={vagaEdit ? 'Editar Vaga' : 'Nova Vaga de Emprego'}
        acoes={<>
          <button className="btn btn--secondary" onClick={()=>setModalVaga(false)}>Cancelar</button>
          <button className={`btn btn--primary${submVaga?' btn--loading':''}`} onClick={submeterVaga} disabled={submVaga}>
            {!submVaga && <>{vagaEdit ? <><Edit size={14}/> Actualizar</> : <><Plus size={14}/> Submeter</>}</>}
          </button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-input" placeholder="Ex: Técnico de Informática" value={formVaga.titulo} onChange={e=>setFormVaga(p=>({...p,titulo:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição *</label>
            <textarea className="form-textarea" placeholder="Descreva as responsabilidades e o que a empresa oferece..." rows={3} value={formVaga.descricao} onChange={e=>setFormVaga(p=>({...p,descricao:e.target.value}))} style={{minHeight:80}}/>
          </div>
          <div className="form-group">
            <label className="form-label">Requisitos</label>
            <textarea className="form-textarea" placeholder="Ex: Licenciatura em Informática, 2 anos de experiência..." rows={2} value={formVaga.requisitos} onChange={e=>setFormVaga(p=>({...p,requisitos:e.target.value}))} style={{minHeight:60}}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Tipo de contrato</label>
              <select className="form-select" value={formVaga.tipo} onChange={e=>setFormVaga(p=>({...p,tipo:e.target.value}))}>
                <option value="efetivo">Efectivo</option>
                <option value="temporario">Temporário</option>
                <option value="estagio">Estágio</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Localização</label>
              <input className="form-input" placeholder="Ex: Luanda, Viana" value={formVaga.localizacao} onChange={e=>setFormVaga(p=>({...p,localizacao:e.target.value}))}/>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Data início das candidaturas *</label>
              <input type="datetime-local" className="form-input" value={formVaga.starts_at} onChange={e=>setFormVaga(p=>({...p,starts_at:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Data fim das candidaturas *</label>
              <input type="datetime-local" className="form-input" value={formVaga.expires_at} onChange={e=>setFormVaga(p=>({...p,expires_at:e.target.value}))}/>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Salário (opcional)</label>
              <input className="form-input" placeholder="Ex: 150.000 Kz" value={formVaga.salario} onChange={e=>setFormVaga(p=>({...p,salario:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Contacto para candidaturas</label>
              <input className="form-input" placeholder="Email ou WhatsApp" value={formVaga.contacto} onChange={e=>setFormVaga(p=>({...p,contacto:e.target.value}))}/>
            </div>
          </div>
        </div>
      </Modal>

      <Modal aberto={modalServico} onFechar={()=>setModalServico(false)}
        titulo={servicoEdit ? 'Editar Serviço' : 'Novo Serviço'}
        acoes={<>
          <button className="btn btn--secondary" onClick={()=>setModalServico(false)}>Cancelar</button>
          <button className={`btn btn--primary${submServico?' btn--loading':''}`} onClick={submeterServico} disabled={submServico}>
            {!submServico && <>{servicoEdit ? <><Edit size={14}/> Actualizar</> : <><Plus size={14}/> Publicar</>}</>}
          </button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Categoria *</label>
            <select className="form-select" value={formServico.category_id} onChange={e=>setFormServico(p=>({...p,category_id:e.target.value}))}>
              <option value="">Seleccione</option>
              {categoriasServico.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição do serviço *</label>
            <textarea className="form-textarea" rows={4} placeholder="Explique o que a empresa oferece, condições e benefícios do serviço." value={formServico.descricao} onChange={e=>setFormServico(p=>({...p,descricao:e.target.value}))}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Email de contacto</label>
              <input 
                className="form-input" 
                placeholder="empresa@dominio.com" 
                value={formServico.contacto_email} 
                onChange={e=>setFormServico(p=>({...p,contacto_email:e.target.value}))}
                readOnly
                style={{ backgroundColor: 'var(--bg-disabled)', cursor: 'not-allowed' }}
                title="Email da conta da empresa"
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp (opcional)</label>
              <input 
                className="form-input" 
                placeholder="923 000 000" 
                value={formServico.contacto_whatsapp} 
                onChange={e=>setFormServico(p=>({...p,contacto_whatsapp:e.target.value}))}
                title="Preenche automaticamente com o telefone do empresário ou empresa"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: nova oportunidade */}
      <Modal aberto={modalOportunidade} onFechar={()=>setModalOportunidade(false)}
        titulo="Nova Oportunidade de Investimento"
        acoes={<>
          <button className="btn btn--secondary" onClick={()=>setModalOportunidade(false)}>Cancelar</button>
          <button className={`btn btn--primary${submOportunidade?' btn--loading':''}`} onClick={submeterOportunidade} disabled={submOportunidade}>
            {!submOportunidade && <><Plus size={14}/> Publicar</>}
          </button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Tipo de oportunidade *</label>
              <select className="form-select" value={formOportunidade.tipo} onChange={e=>setFormOportunidade(p=>({...p,tipo:e.target.value}))}>
                {tiposOportunidade.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>{tipo.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Valor pretendido *</label>
              <input className="form-input" placeholder="Ex: 10.000.000 Kz" value={formOportunidade.valor} onChange={e=>setFormOportunidade(p=>({...p,valor:e.target.value}))}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-input" placeholder="Ex: Venda de participação na empresa" value={formOportunidade.titulo} onChange={e=>setFormOportunidade(p=>({...p,titulo:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição *</label>
            <textarea className="form-textarea" rows={4} placeholder="Explique claramente o contexto da oportunidade, objectivos e condições gerais." value={formOportunidade.descricao} onChange={e=>setFormOportunidade(p=>({...p,descricao:e.target.value}))}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Retorno percentual</label>
              <input className="form-input" placeholder="Ex: 18" value={formOportunidade.retorno_percentual} onChange={e=>setFormOportunidade(p=>({...p,retorno_percentual:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Participação percentual</label>
              <input className="form-input" placeholder="Ex: 30" value={formOportunidade.participacao_percentual} onChange={e=>setFormOportunidade(p=>({...p,participacao_percentual:e.target.value}))}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Prazo / condições de pagamento</label>
            <input className="form-input" placeholder="Ex: 12 meses para liquidação" value={formOportunidade.prazo_pagamento} onChange={e=>setFormOportunidade(p=>({...p,prazo_pagamento:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Termos da operação *</label>
            <textarea className="form-textarea" rows={4} placeholder="Detalhe obrigações, limites, percentagens, forma de retorno e cláusulas principais." value={formOportunidade.termos} onChange={e=>setFormOportunidade(p=>({...p,termos:e.target.value}))}/>
          </div>
        </div>
      </Modal>

      {/* Modal: envio de documento */}
      <Modal aberto={modalDoc} onFechar={()=>{setModalDoc(false);setFicheiroDoc(null);}} titulo="Enviar Documento"
        acoes={<>
          <button className="btn btn--secondary" onClick={()=>{setModalDoc(false);setFicheiroDoc(null);}}>Cancelar</button>
          <button className={`btn btn--primary${enviando?' btn--loading':''}`} onClick={enviarDocumento} disabled={enviando||!ficheiroDoc}>
            {!enviando && <><Upload size={14}/> Enviar</>}
          </button>
        </>}
      >
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Tipo de documento</label>
          <select className="form-select" value={tipoDoc} onChange={e=>setTipoDoc(e.target.value)}>
            <option value="alvara">Alvará Comercial</option>
            <option value="nif">Certidão NIF</option>
            <option value="certidao">Certidão de Existência</option>
            <option value="identificacao">Identificação do Responsável</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div onClick={()=>document.getElementById('doc-input').click()}
          style={{ border: ficheiroDoc?'2px solid var(--verde)':'2px dashed var(--border)', borderRadius:'var(--r-md)', padding:28, textAlign:'center', cursor:'pointer', background:'var(--bg-input)' }}>
          <input id="doc-input" type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display:'none' }} onChange={e=>setFicheiroDoc(e.target.files[0])}/>
          <Upload size={24} style={{ margin:'0 auto 8px', color: ficheiroDoc?'var(--verde)':'var(--txt-4)' }}/>
          <p style={{ fontSize:'0.875rem', color: ficheiroDoc?'var(--verde)':'var(--txt-3)', fontWeight: ficheiroDoc?600:400 }}>
            {ficheiroDoc ? ficheiroDoc.name : 'Clique para seleccionar (JPG, PNG, PDF — max 10MB)'}
          </p>
        </div>
      </Modal>

      {/* Modal: motivo de rejeição */}
      <Modal aberto={!!modalMotivo} onFechar={()=>setModalMotivo(null)} titulo="Motivo de Rejeição"
        acoes={<button className="btn btn--secondary" onClick={()=>setModalMotivo(null)}>Fechar</button>}
      >
        {modalMotivo && (
          <div style={{ background: 'var(--vermelho-100)', border: '1px solid #FCA5A5', borderRadius: 'var(--r-md)', padding: 16 }}>
            <p style={{ color: '#991B1B', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {modalMotivo.motivo_rejeicao}
            </p>
          </div>
        )}
        <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)', marginTop: 12 }}>
          Corrija os problemas indicados e submeta novamente a vaga para aprovação.
        </p>
      </Modal>
    </div>
  );
}

// —
// DASHBOARD INVESTIDOR
// —
export function DashboardInvestidor() {
  const toast = useToast();
  const [interesses,  setInteresses]  = useState([]);
  const [contratos,   setContratos]   = useState([]);
  const [abaActiva,   setAbaActiva]   = useState('interesses');
  const [carregando,  setCarregando]  = useState(true);

  const carregar = useCallback(async () => {
    try {
      const [int, con] = await Promise.all([
        investidorAPI.interesses(),
        investidorAPI.contratos(),
      ]);
      setInteresses(int.data.dados?.interesses || int.data.dados || []);
      setContratos(con.data.dados?.contratos || con.data.dados || []);
    } catch (e) {
      toast.erro('Erro ao carregar dados: ' + extrairErro(e));
    } finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const cancelarInteresse = async (id) => {
    const ok = await toast.confirmar({
      titulo: 'Cancelar interesse',
      mensagem: 'Tem a certeza que quer cancelar este interesse? A empresa será notificada.',
      variante: 'perigo', labelOk: 'Cancelar interesse',
    });
    if (!ok) return;
    try {
      await investidorAPI.cancelarInt(id);
      setInteresses(p => p.filter(i => i.id !== id));
      toast.sucesso('Interesse cancelado.');
    } catch (e) { toast.erro(extrairErro(e)); }
  };

  const totalInvestido = interesses
    .filter(i => ['aprovado','em_processo'].includes(i.status))
    .reduce((s, i) => s + (parseFloat(i.valor_pretendido || i.valor || 0) || 0), 0);

  return (
    <div className="dashboard">
      <DashboardHero
        variante="investidor"
        eyebrow="Área do investidor"
        titulo="Painel do Investidor"
        descricao="Acompanhe interesses enviados, contratos gerados e valor atualmente em negociação."
        destaque={carregando ? {
          label: 'Capital em processo',
          valor: '…',
          ajuda: 'A sincronizar dados com o servidor.',
        } : {
          label: 'Capital em processo',
          valor: formatAOA(totalInvestido),
          ajuda: 'Este valor considera interesses aprovados e processos em andamento.',
        }}
        acao={(
          <a href="/negocios" className="btn btn--secondary">
            <TrendingUp size={15}/> Ver Oportunidades
          </a>
        )}
      />

      <div className="stats-grid dashboard-stats-row">
        <StatCard icone={<TrendingUp size={20} color="var(--ciano)"/>} label="Interesses" valor={carregando ? '—' : interesses.length} corIcone="var(--ciano-100)" />
        <StatCard icone={<CheckCircle size={20} color="var(--verde)"/>} label="Aprovados" valor={carregando ? '—' : interesses.filter(i=>i.status==='aprovado').length} corIcone="var(--verde-100)" />
        <StatCard icone={<FileText size={20} color="var(--roxo)"/>} label="Contratos" valor={carregando ? '—' : contratos.length} corIcone="var(--roxo-100)" />
        <StatCard icone={<CreditCard size={20} color="var(--laranja)"/>} label="Em processo" valor={carregando ? '—' : formatAOA(totalInvestido)} corIcone="var(--laranja-100)" />
      </div>

      <div className="card dashboard-panel dashboard-panel-shell" style={{ padding:0 }}>
        <div className="dashboard-panel__tabs" style={{ padding:'20px 24px 0', borderBottom:'1px solid var(--border)' }}>
          <div className="tabs" style={{ margin:0, borderBottom:'none' }}>
            <button type="button" className={`tab-btn${abaActiva==='interesses'?' active':''}`} onClick={()=>setAbaActiva('interesses')}>
              <TrendingUp size={14}/> Interesses ({carregando ? '…' : interesses.length})
            </button>
            <button type="button" className={`tab-btn${abaActiva==='contratos'?' active':''}`} onClick={()=>setAbaActiva('contratos')}>
              <FileText size={14}/> Contratos ({carregando ? '…' : contratos.length})
            </button>
          </div>
        </div>
        <div className="dashboard-panel__body">
          {carregando ? (
            <DashboardTabLoading label="A carregar interesses e contratos…" />
          ) : (
          <>
          {abaActiva === 'interesses' && (
            interesses.length === 0 ? (
              <EmptyState icone={<TrendingUp size={28}/>} titulo="Sem interesses" descricao="Explore oportunidades de investimento no marketplace."
                acao={<a href="/negocios" className="btn btn--primary btn--sm">Ver Oportunidades</a>} />
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Empresa</th><th>Oportunidade</th><th>Valor</th><th>Estado</th><th>Data</th><th></th></tr></thead>
                  <tbody>
                    {interesses.map(i => (
                      <tr key={i.id}>
                        <td style={{ fontWeight:500 }}>{i.nome_empresa || '—'}</td>
                        <td style={{ color:'var(--txt-3)', fontSize:'0.85rem' }}>{i.oportunidade_titulo || i.titulo || i.tipo_servico || i.tipo || '—'}</td>
                        <td style={{ fontWeight:700 }}>{formatAOA(i.valor_pretendido || i.valor || 0)}</td>
                        <td><BadgeStatus status={i.status} /></td>
                        <td style={{ color:'var(--txt-3)', fontSize:'0.8rem' }}>{formatData(i.criado_em || i.created_at)}</td>
                        <td>
                          {i.status === 'pendente' && (
                            <button className="btn btn--ghost btn--sm" onClick={()=>cancelarInteresse(i.id)} title="Cancelar">
                              <X size={14}/>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {abaActiva === 'contratos' && (
            contratos.length === 0 ? (
              <EmptyState icone={<FileText size={28}/>} titulo="Sem contratos" descricao="Os contratos aparecerão aqui após aprovação dos investimentos." />
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Nº Contrato</th><th>Título</th><th>Valor</th><th>Estado</th><th>Data</th><th></th></tr></thead>
                  <tbody>
                    {contratos.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontSize:'0.8rem', color:'var(--txt-3)', fontWeight:600 }}>{c.numero_contrato || `CON-${c.id}`}</td>
                        <td style={{ fontWeight:500 }}>{c.titulo || c.oportunidade_titulo || 'Contrato de investimento'}</td>
                        <td style={{ fontWeight:700 }}>{formatAOA(c.valor_acordado || c.valor || 0)}</td>
                        <td><BadgeStatus status={c.status} /></td>
                        <td style={{ color:'var(--txt-3)', fontSize:'0.8rem' }}>{formatData(c.criado_em || c.created_at)}</td>
                        <td>
                          {c.pdf_url && (
                            <a href={c.pdf_url} target="_blank" rel="noreferrer" className="btn btn--secondary btn--sm">
                              <Download size={13}/> PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
