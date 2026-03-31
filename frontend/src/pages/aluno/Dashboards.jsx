// ============================================================
// ULEZI XPB — Dashboards: Aluno, Empresa, Investidor
// Dados reais do backend — validações — toast integrado
// ============================================================

import {
    AlertCircle,
    BookOpen,
    Briefcase,
    CheckCircle, Clock,
    CreditCard,
    Download,
    Edit,
    FileText,
    MapPin,
    Plus,
    Star,
    Trash2,
    TrendingUp,
    Upload,
    Users,
    X
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../components/ui/Toast';
import {
    BadgeStatus,
    EmptyState,
    Modal, PageLoader,
} from '../../components/ui/index.jsx';
import { useAuth } from '../../context/AuthContext';
import {
    cursosAPI, empresaAPI,
    extrairErro,
    investidorAPI
} from '../../services/api';
import { formatAOA, formatData } from '../../utils/constants';

// ── StatCard Moderno ─────────────────────────────────────────────
function StatCard({ icone, label, valor, cor, iconeCor }) {
  return (
    <div className="stat-card" style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--r-xl)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '16px',
      border: '1px solid var(--border)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    }} onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
    }} onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{ 
        width: 56, 
        height: 56, 
        borderRadius: 'var(--r-lg)', 
        background: cor, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: `0 4px 12px ${cor}40`
      }}>
        {React.cloneElement(icone, { size: 26, color: iconeCor })}
      </div>
      <div style={{ 
        fontFamily: 'var(--font-display)', 
        fontSize: '2.2rem', 
        fontWeight: 700, 
        color: 'var(--txt-1)',
        lineHeight: 1
      }}>{valor}</div>
      <div style={{ 
        fontSize: '0.9rem', 
        color: 'var(--txt-3)',
        fontWeight: 500
      }}>{label}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DASHBOARD ALUNO
// ════════════════════════════════════════════════════════════
export function DashboardAluno() {
  const { utilizador } = useAuth();
  const toast = useToast();
  const [inscricoes, setInscricoes] = useState([]);
  const [abaActiva, setAbaActiva] = useState('inscricoes');
  const [carregando, setCarregando] = useState(true);
  const [modalAvaliar, setModalAvaliar] = useState(null);
  const [avalForm, setAvalForm] = useState({ nota: 5, comentario: '' });
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const ins = await cursosAPI.minhas();
      setInscricoes(ins.data.dados?.inscricoes || ins.data.dados || []);
    } catch (e) {
      toast.erro('Erro ao carregar dados: ' + extrairErro(e));
    } finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

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

  if (carregando) return <PageLoader />;

  return (
    <div className="dashboard">
      {/* Cabeçalho com boas-vindas */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--ciano-600) 0%, var(--ciano) 100%)',
        borderRadius: 'var(--r-xl)',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 8px 32px rgba(6, 182, 212, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 700, 
            color: 'white',
            marginBottom: '8px'
          }}>Olá, {utilizador?.nome?.split(' ')[0] || 'Estudante'} 👋</h1>
          <p style={{ 
            fontSize: '1rem', 
            color: 'rgba(255, 255, 255, 0.85)',
            fontWeight: 400
          }}>Acompanhe o estado das suas inscrições e descarregue os recibos aprovados.</p>
        </div>
        <a href="/cursos" className="btn" style={{
          background: 'white',
          color: 'var(--ciano)',
          padding: '12px 24px',
          borderRadius: 'var(--r-lg)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }} onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}>
          <BookOpen size={18}/> Explorar Cursos
        </a>
      </div>

      {/* Grid de Estatísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        <StatCard 
          icone={<BookOpen />} 
          label="Total de Inscrições" 
          valor={inscricoes.length} 
          cor="var(--ciano-100)" 
          iconeCor="var(--ciano)"
        />
        <StatCard 
          icone={<Clock />} 
          label="Em Análise" 
          valor={inscricoes.filter(i=>i.status==='em_analise' || i.status==='pendente').length} 
          cor="var(--amarelo-100)" 
          iconeCor="var(--amarelo)"
        />
        <StatCard 
          icone={<CheckCircle />} 
          label="Aprovadas" 
          valor={inscricoes.filter(i=>i.status==='confirmada').length} 
          cor="var(--verde-100)" 
          iconeCor="var(--verde)"
        />
        <StatCard 
          icone={<FileText />} 
          label="Com Recibo" 
          valor={inscricoes.filter(i=>i.recibo_id).length} 
          cor="var(--laranja-100)" 
          iconeCor="var(--laranja)"
        />
      </div>

      {/* Card Principal com Tabs */}
      <div style={{ 
        background: 'var(--bg-card)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        {/* Header das Tabs */}
        <div style={{ 
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
              <BookOpen size={16}/> Inscrições Activas
            </button>
            <button 
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
        <div style={{ padding: '24px' }}>
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
                            {i.carga_horaria && <span>• {i.carga_horaria}h</span>}
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
        </div>
      </div>

      {/* Modal avaliação */}
      <Modal aberto={!!modalAvaliar} onFechar={()=>setModalAvaliar(null)} titulo="Avaliar Curso"
        acoes={<>
          <button className="btn btn--secondary" onClick={()=>setModalAvaliar(null)}>Cancelar</button>
          <button className={`btn btn--primary${enviando?' btn--loading':''}`} onClick={enviarAvaliacao} disabled={enviando}>
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
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DASHBOARD EMPRESA
// ════════════════════════════════════════════════════════════
export function DashboardEmpresa() {
  const { utilizador } = useAuth();
  const toast          = useToast();
  const [oportunidades, setOportunidades] = useState([]);
  const [minhasVagas,   setMinhasVagas]   = useState([]);
  const [stats,         setStats]         = useState({});
  const [documentos,    setDocumentos]    = useState([]);
  const [abaActiva,     setAbaActiva]     = useState('oportunidades');
  const [carregando,    setCarregando]    = useState(true);
  const [modalDoc,      setModalDoc]      = useState(false);
  const [ficheiroDoc,   setFicheiroDoc]   = useState(null);
  const [tipoDoc,       setTipoDoc]       = useState('alvara');
  const [enviando,      setEnviando]      = useState(false);
  // Estado do formulário de vaga
  const [modalVaga,     setModalVaga]     = useState(false);
  const [vagaEdit,      setVagaEdit]      = useState(null); // null = criar, objeto = editar
  const [formVaga,      setFormVaga]      = useState({
    titulo: '', descricao: '', requisitos: '', localizacao: '',
    tipo: 'efetivo', salario: '', contacto: '',
  });
  const [submVaga,      setSubmVaga]      = useState(false);
  // Modal rejeição (mostrar motivo)
  const [modalMotivo,   setModalMotivo]   = useState(null);

  const carregar = useCallback(async () => {
    try {
      const [st, op, vg, dc] = await Promise.all([
        empresaAPI.stats().catch(() => ({ data: { dados: {} } })),
        empresaAPI.oportunidades().catch(() => ({ data: { dados: [] } })),
        empresaAPI.minhasVagas().catch(() => ({ data: { dados: { vagas: [] } } })),
        empresaAPI.documentos().catch(() => ({ data: { dados: [] } })),
      ]);
      setStats(st.data.dados || {});
      setOportunidades(op.data.dados?.oportunidades || op.data.dados || []);
      setMinhasVagas(vg.data.dados?.vagas || vg.data.dados || []);
      setDocumentos(dc.data.dados?.documentos || dc.data.dados || []);
    } catch (e) {
      toast.erro('Erro ao carregar dados: ' + extrairErro(e));
    } finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  // ── Documentos ────────────────────────────────────────────
  const enviarDocumento = async () => {
    if (!ficheiroDoc) return toast.aviso('Seleccione um ficheiro');
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('documento', ficheiroDoc);
      fd.append('tipo_documento', tipoDoc);
      await empresaAPI.enviarDoc(fd);
      toast.sucesso('Documento enviado para análise!');
      setModalDoc(false); setFicheiroDoc(null);
      carregar();
    } catch (e) { toast.erro(extrairErro(e)); }
    finally { setEnviando(false); }
  };

  // ── Vagas ─────────────────────────────────────────────────
  const abrirModalVaga = (vaga = null) => {
    setVagaEdit(vaga);
    setFormVaga(vaga ? {
      titulo: vaga.titulo, descricao: vaga.descricao, requisitos: vaga.requisitos || '',
      localizacao: vaga.localizacao || '', tipo: vaga.tipo || 'efetivo',
      salario: vaga.salario || '', contacto: vaga.contacto || '',
    } : { titulo: '', descricao: '', requisitos: '', localizacao: '', tipo: 'efetivo', salario: '', contacto: '' });
    setModalVaga(true);
  };

  const submeterVaga = async () => {
    if (!formVaga.titulo.trim())    return toast.aviso('Título é obrigatório.');
    if (!formVaga.descricao.trim()) return toast.aviso('Descrição é obrigatória.');
    setSubmVaga(true);
    try {
      if (vagaEdit) {
        await empresaAPI.editarVaga(vagaEdit.id, formVaga);
        toast.sucesso('Vaga actualizada! Será reanalisada pela equipa.');
      } else {
        await empresaAPI.criarVaga(formVaga);
        toast.sucesso('Vaga submetida! Aguarda aprovação da equipa administrativa.');
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

  // Cores de estado para vagas
  const estadoVaga = {
    pendente:  { label: 'Pendente',  bg: 'var(--amarelo-100)', color: '#92400E' },
    aprovada:  { label: 'Aprovada',  bg: 'var(--verde-100)',   color: '#166534' },
    rejeitada: { label: 'Rejeitada', bg: 'var(--vermelho-100)', color: '#991B1B' },
    encerrada: { label: 'Encerrada', bg: 'var(--bg-hover)',    color: 'var(--txt-3)' },
  };

  if (carregando) return <PageLoader />;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">{utilizador?.nome || 'Empresa'}</h1>
          <p className="page-header__sub">Painel da empresa</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icone={<TrendingUp size={20} color="var(--ciano)"/>}  label="Oportunidades" valor={stats.total_oportunidades || 0} cor="var(--ciano-100)" />
        <StatCard icone={<Users size={20} color="var(--verde)"/>}       label="Interessados"  valor={stats.total_interessados  || 0} cor="var(--verde-100)" />
        <StatCard icone={<Briefcase size={20} color="var(--laranja)"/>} label="Vagas Activas" valor={minhasVagas.filter(v=>v.status==='aprovada').length} cor="var(--laranja-100)" />
        <StatCard icone={<FileText size={20} color="var(--roxo)"/>}     label="Documentos"    valor={documentos.length} cor="var(--roxo-100)" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="tabs" style={{ margin: 0, borderBottom: 'none' }}>
            <button className={`tab-btn${abaActiva==='oportunidades'?' active':''}`} onClick={()=>setAbaActiva('oportunidades')}>
              <TrendingUp size={14}/> Oportunidades
            </button>
            <button className={`tab-btn${abaActiva==='vagas'?' active':''}`} onClick={()=>setAbaActiva('vagas')}>
              <Briefcase size={14}/> Vagas de Emprego
            </button>
            <button className={`tab-btn${abaActiva==='documentos'?' active':''}`} onClick={()=>setAbaActiva('documentos')}>
              <FileText size={14}/> Documentos
            </button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>

          {/* ── Oportunidades ─────────────────────────────── */}
          {abaActiva === 'oportunidades' && (
            oportunidades.length === 0 ? (
              <EmptyState icone={<TrendingUp size={28}/>} titulo="Sem oportunidades"
                descricao="Publique a sua primeira oportunidade de investimento." />
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Título</th><th>Tipo</th><th>Interessados</th><th>Estado</th><th>Data</th></tr></thead>
                  <tbody>
                    {oportunidades.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 500 }}>{o.titulo}</td>
                        <td style={{ color: 'var(--txt-3)', fontSize: '0.85rem' }}>{o.tipo_servico || o.tipo}</td>
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

          {/* ── Vagas de Emprego ──────────────────────────── */}
          {abaActiva === 'vagas' && (
            <>
              {/* Aviso sobre fluxo de aprovação */}
              <div style={{ background: 'var(--ciano-100)', border: '1px solid var(--ciano-400)', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="var(--ciano)" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: '0.82rem', color: 'var(--ciano-600)', lineHeight: 1.5 }}>
                  As vagas publicadas passam por revisão antes de ficarem visíveis ao público. O processo demora normalmente até 24 horas.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn--primary btn--sm" onClick={() => abrirModalVaga(null)}>
                  <Plus size={14}/> Nova Vaga
                </button>
              </div>

              {minhasVagas.length === 0 ? (
                <EmptyState icone={<Briefcase size={28}/>} titulo="Sem vagas"
                  descricao="Publique a sua primeira vaga de emprego para encontrar talentos."
                  acao={<button className="btn btn--primary btn--sm" onClick={()=>abrirModalVaga(null)}><Plus size={14}/> Criar Vaga</button>} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {minhasVagas.map(v => {
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
                            {v.localizacao && <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>📍 {v.localizacao}</span>}
                            {v.salario    && <span style={{ fontSize: '0.75rem', color: 'var(--verde)', fontWeight: 600 }}>💰 {v.salario}</span>}
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
                          {(v.status === 'pendente' || v.status === 'rejeitada') && (
                            <button className="btn btn--ghost btn--sm" title="Editar" onClick={() => abrirModalVaga(v)}>
                              <Edit size={14}/>
                            </button>
                          )}
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

          {/* ── Documentos ────────────────────────────────── */}
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

// ════════════════════════════════════════════════════════════
// DASHBOARD INVESTIDOR
// ════════════════════════════════════════════════════════════
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

  if (carregando) return <PageLoader />;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Painel do Investidor</h1>
          <p className="page-header__sub">Gerencie os seus investimentos</p>
        </div>
        <a href="/negocios" className="btn btn--primary btn--sm">
          <TrendingUp size={15}/> Ver Oportunidades
        </a>
      </div>

      <div className="stats-grid">
        <StatCard icone={<TrendingUp size={20} color="var(--ciano)"/>}   label="Interesses"  valor={interesses.length} cor="var(--ciano-100)" />
        <StatCard icone={<CheckCircle size={20} color="var(--verde)"/>}  label="Aprovados"   valor={interesses.filter(i=>i.status==='aprovado').length} cor="var(--verde-100)" />
        <StatCard icone={<FileText size={20} color="var(--roxo)"/>}      label="Contratos"   valor={contratos.length} cor="var(--roxo-100)" />
        <StatCard icone={<CreditCard size={20} color="var(--laranja)"/>} label="Em Processo" valor={formatAOA(totalInvestido)} cor="var(--laranja-100)" />
      </div>

      <div className="card" style={{ padding:0 }}>
        <div style={{ padding:'20px 24px 0', borderBottom:'1px solid var(--border)' }}>
          <div className="tabs" style={{ margin:0, borderBottom:'none' }}>
            <button className={`tab-btn${abaActiva==='interesses'?' active':''}`} onClick={()=>setAbaActiva('interesses')}>
              <TrendingUp size={14}/> Interesses ({interesses.length})
            </button>
            <button className={`tab-btn${abaActiva==='contratos'?' active':''}`} onClick={()=>setAbaActiva('contratos')}>
              <FileText size={14}/> Contratos ({contratos.length})
            </button>
          </div>
        </div>
        <div style={{ padding:'24px' }}>
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
        </div>
      </div>
    </div>
  );
}
