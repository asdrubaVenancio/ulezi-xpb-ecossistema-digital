import { CalendarClock, Eye, GitMerge, Save, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api, { extrairErro } from '../../services/api';
import {
  badgeEstado,
  BadgeModulo,
  BarraFerramentas,
  BotaoAtualizar,
  formatarData,
  formatarMoeda,
  lerLista,
  lerObjeto,
  LinhaVazia,
  ModalBloco,
  PaginaModulo,
  Painel,
  GradeResumo,
  ResumoCard,
  TabelaModulo,
} from './module7-ui.jsx';

const filtrosEstado = [
  { valor: '', etiqueta: 'Todos os estados' },
  { valor: 'pendente', etiqueta: 'Pendentes' },
  { valor: 'agendada', etiqueta: 'Reuniao agendada' },
  { valor: 'concluida', etiqueta: 'Concluidas' },
  { valor: 'cancelada', etiqueta: 'Canceladas' },
];

const formAgendamentoInicial = {
  meeting_id: null,
  data_reuniao: '',
  hora_inicio: '',
  hora_fim: '',
  local_reuniao: '',
  tipo_reuniao: 'presencial',
  link_video: '',
  objetivo: '',
  pauta: '',
};

const tipoReuniaoLabel = {
  presencial: 'Presencial',
  video_chamada: 'Videochamada',
  telefonica: 'Telefonica',
};

const formatarTipoReuniao = (tipo) => tipoReuniaoLabel[tipo] || tipo || 'A definir';

const GestaoMediacaoV2 = () => {
  const { utilizador } = useAuth();
  const [mediacoes, setMediacoes] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [pesquisa, setPesquisa] = useState('');
  const [estado, setEstado] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [detalhe, setDetalhe] = useState(null);
  const [funcionariosMediacao, setFuncionariosMediacao] = useState([]);
  const [aSalvarMediador, setASalvarMediador] = useState(false);
  const [aSalvarReuniao, setASalvarReuniao] = useState(false);
  const [aCancelarReuniao, setACancelarReuniao] = useState(false);
  const [modalCancelamento, setModalCancelamento] = useState(null);
  const [formAgendamento, setFormAgendamento] = useState(formAgendamentoInicial);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resMediacoes, resStats] = await Promise.all([
        api.get('/admin/mediations', { params: { status: estado || undefined } }),
        api.get('/admin/mediations/stats'),
      ]);
      setMediacoes(lerLista(resMediacoes.data, 'mediacoes'));
      setEstatisticas(lerObjeto(resStats.data, 'estatisticas_gerais'));
    } catch (erro) {
      toast.error(`Erro ao carregar mediacoes: ${extrairErro(erro)}`);
      setMediacoes([]);
      setEstatisticas({});
    } finally {
      setCarregando(false);
    }
  }, [estado]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return mediacoes;
    return mediacoes.filter((item) => (
      [
        item.titulo_oportunidade,
        item.nome_investidor,
        item.nome_empresa,
        item.nome_funcionario,
      ].filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo))
    ));
  }, [mediacoes, pesquisa]);

  const carregarFuncionariosMediacao = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/employees', { params: { status: 'active', limit: 100 } });
      const funcionarios = lerLista(data, 'funcionarios');
      setFuncionariosMediacao(
        funcionarios.filter((item) => (
          item.is_active && (item.responsabilidades || []).some((resp) => resp.tipo === 'mediacao_negocios')
        ))
      );
    } catch (erro) {
      toast.error(`Erro ao carregar mediadores: ${extrairErro(erro)}`);
      setFuncionariosMediacao([]);
    }
  }, []);

  const abrirDetalhe = async (id) => {
    try {
      const { data } = await api.get(`/admin/mediations/${id}`);
      const mediacao = lerObjeto(data, 'mediacao');
      const reunioes = lerLista(data, 'reunioes');
      const interesse = lerObjeto(data, 'interesse');
      const permissoes = lerObjeto(data, 'permissoes');

      setDetalhe({
        mediacao: {
          ...mediacao,
          mediadorDestino: mediacao.employee_id ? String(mediacao.employee_id) : 'admin',
        },
        reunioes,
        interesse,
        permissoes,
      });
      setFormAgendamento(formAgendamentoInicial);

      if (permissoes?.pode_indicar_mediador) {
        await carregarFuncionariosMediacao();
      } else {
        setFuncionariosMediacao([]);
      }
    } catch (erro) {
      toast.error(`Erro ao carregar detalhe: ${extrairErro(erro)}`);
    }
  };

  const actualizarMediacao = async (payload) => {
    if (!detalhe?.mediacao?.id || !detalhe?.permissoes?.pode_gerir) return;
    try {
      await api.put(`/admin/mediations/${detalhe.mediacao.id}`, payload);
      toast.success('Mediacao actualizada com sucesso.');
      await abrirDetalhe(detalhe.mediacao.id);
      await carregar();
    } catch (erro) {
      toast.error(`Erro ao actualizar mediacao: ${extrairErro(erro)}`);
    }
  };

  const guardarMediador = async () => {
    if (!detalhe?.mediacao?.id || !detalhe?.permissoes?.pode_indicar_mediador) return;
    setASalvarMediador(true);
    try {
      const destino = detalhe.mediacao.mediadorDestino;
      const payload = destino === 'admin'
        ? { assign_to_admin: true }
        : { employee_id: Number(destino) };
      await api.put(`/admin/mediations/${detalhe.mediacao.id}`, payload);
      toast.success('Mediador actualizado com sucesso.');
      await abrirDetalhe(detalhe.mediacao.id);
      await carregar();
    } catch (erro) {
      toast.error(`Erro ao actualizar mediador: ${extrairErro(erro)}`);
    } finally {
      setASalvarMediador(false);
    }
  };

  const guardarReuniao = async () => {
    if (!detalhe?.mediacao?.id || !detalhe?.permissoes?.pode_gerir) return;
    setASalvarReuniao(true);
    try {
      const { data } = await api.post(`/admin/mediations/${detalhe.mediacao.id}/meetings`, formAgendamento);
      const dados = data?.dados || data?.data || {};
      const avisosEmail = dados.avisos_email || [];
      if (avisosEmail.length) {
        toast.error(avisosEmail.join(' '));
      } else {
        toast.success(dados.message || (formAgendamento.meeting_id ? 'Reuniao reagendada com sucesso.' : 'Reuniao agendada com sucesso.'));
      }
      setFormAgendamento(formAgendamentoInicial);
      await abrirDetalhe(detalhe.mediacao.id);
      await carregar();
    } catch (erro) {
      toast.error(`Erro ao guardar reuniao: ${extrairErro(erro)}`);
    } finally {
      setASalvarReuniao(false);
    }
  };

  const editarReuniao = (reuniao) => {
    setFormAgendamento({
      meeting_id: reuniao.id,
      data_reuniao: reuniao.data_reuniao ? String(reuniao.data_reuniao).slice(0, 10) : '',
      hora_inicio: reuniao.hora_inicio || '',
      hora_fim: reuniao.hora_fim || '',
      local_reuniao: reuniao.local_reuniao || '',
      tipo_reuniao: reuniao.tipo_reuniao || 'presencial',
      link_video: reuniao.link_video || '',
      objetivo: reuniao.objetivo || '',
      pauta: reuniao.pauta || '',
    });
  };

  const cancelarEdicaoReuniao = () => {
    setFormAgendamento(formAgendamentoInicial);
  };

  const confirmarCancelamentoReuniao = async () => {
    if (!detalhe?.mediacao?.id || !detalhe?.permissoes?.pode_gerir || !modalCancelamento?.reuniao) return;
    setACancelarReuniao(true);
    try {
      await api.post(`/admin/mediations/${detalhe.mediacao.id}/meetings/${modalCancelamento.reuniao.id}/cancel`, {
        motivo: modalCancelamento.motivo || 'Imprevisto operacional.',
      });
      toast.success('Reuniao cancelada com sucesso.');
      if (formAgendamento.meeting_id === modalCancelamento.reuniao.id) {
        setFormAgendamento(formAgendamentoInicial);
      }
      setModalCancelamento(null);
      await abrirDetalhe(detalhe.mediacao.id);
      await carregar();
    } catch (erro) {
      toast.error(`Erro ao cancelar reuniao: ${extrairErro(erro)}`);
    } finally {
      setACancelarReuniao(false);
    }
  };

  const concluir = async (resultado_final) => {
    if (!detalhe?.mediacao?.id || !detalhe?.permissoes?.pode_gerir) return;
    try {
      await api.post(`/admin/mediations/${detalhe.mediacao.id}/complete`, { resultado_final });
      toast.success('Mediacao concluida com sucesso.');
      setDetalhe(null);
      await carregar();
    } catch (erro) {
      toast.error(`Erro ao concluir mediacao: ${extrairErro(erro)}`);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Mediacao"
        subtitulo="Faca a ponte entre investidor e empresa, conduza a triagem e deixe a definicao da reuniao nas maos do mediador responsavel."
        acoes={<BotaoAtualizar onClick={carregar} loading={carregando} />}
      />

      <GradeResumo>
        <ResumoCard icone={<GitMerge size={18} />} titulo="Total de mediacoes" valor={estatisticas.total_mediacoes || lista.length || 0} />
        <ResumoCard icone={<UserRoundCheck size={18} />} titulo="Pendentes" valor={estatisticas.pendentes || 0} cor="var(--amarelo-100)" destaque="var(--amarelo)" />
        <ResumoCard icone={<CalendarClock size={18} />} titulo="Concluidas" valor={estatisticas.concluidas || 0} cor="var(--verde-100)" destaque="var(--verde)" />
        <ResumoCard icone={<ShieldCheck size={18} />} titulo="Valor negociado" valor={formatarMoeda(estatisticas.valor_total_negociado || 0)} cor="var(--roxo-100)" destaque="var(--roxo)" />
      </GradeResumo>

      <BarraFerramentas
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        filtros={(
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Estado</label>
            <select className="form-select" value={estado} onChange={(event) => setEstado(event.target.value)}>
              {filtrosEstado.map((item) => (
                <option key={item.valor || 'todos'} value={item.valor}>{item.etiqueta}</option>
              ))}
            </select>
          </div>
        )}
      />

      {!lista.length && !carregando ? (
        <LinhaVazia titulo="Sem mediacoes" descricao="As mediacoes iniciadas a partir dos interesses vao aparecer aqui para acompanhamento." />
      ) : (
        <TabelaModulo colunas={['Processo', 'Investidor', 'Empresa', 'Mediador', 'Valor', 'Estado', 'Acoes']}>
          {lista.map((item) => (
            <tr key={item.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{item.titulo_oportunidade}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{item.etapa_atual || 'triagem'}</div>
              </td>
              <td>{item.nome_investidor || '—'}</td>
              <td>{item.nome_empresa || '—'}</td>
              <td>{item.nome_funcionario || 'Sem mediador'}</td>
              <td>{formatarMoeda(item.valor_negociado || item.valor_original || 0)}</td>
              <td><BadgeModulo tonalidade={badgeEstado(item.status)}>{item.status || 'pendente'}</BadgeModulo></td>
              <td>
                <button className="btn btn--secondary btn--sm" onClick={() => abrirDetalhe(item.id)}>
                  <Eye size={14} /> Gerir
                </button>
              </td>
            </tr>
          ))}
        </TabelaModulo>
      )}

      <Modal aberto={Boolean(detalhe)} onFechar={() => setDetalhe(null)} titulo="Gestao de mediacao" largura={1040}>
        {detalhe?.mediacao ? (
          <ModalBloco
            titulo={detalhe.mediacao.titulo_oportunidade}
            subtitulo={
              detalhe.permissoes?.somente_leitura
                ? 'Este processo foi encerrado e a modal permanece apenas para consulta informativa.'
                : 'So o administrador e o mediador indicado podem gerir este processo. A reuniao deve ser definida manualmente pelo responsavel da mediacao.'
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Investidor</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>{detalhe.mediacao.nome_investidor}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Empresa</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>{detalhe.mediacao.nome_empresa}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Estado</div>
                <div style={{ marginTop: 6 }}><BadgeModulo tonalidade={badgeEstado(detalhe.mediacao.status)}>{detalhe.mediacao.status}</BadgeModulo></div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Mediador actual</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>{detalhe.mediacao.nome_funcionario || 'Administrador'}</div>
              </Painel>
            </div>

            {detalhe.permissoes?.pode_indicar_mediador ? (
              <Painel>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Indicacao do mediador</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Responsavel pelo caso</label>
                    <select
                      className="form-select"
                      value={detalhe.mediacao.mediadorDestino || 'admin'}
                      onChange={(event) => setDetalhe((actual) => ({
                        ...actual,
                        mediacao: { ...actual.mediacao, mediadorDestino: event.target.value },
                      }))}
                    >
                      <option value="admin">Administrador actual ({utilizador?.nome || 'Admin'})</option>
                      {funcionariosMediacao.map((funcionario) => (
                        <option key={funcionario.id} value={String(funcionario.id)}>
                          {funcionario.nome} - {funcionario.cargo || 'Mediador'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className={`btn btn--secondary btn--sm${aSalvarMediador ? ' btn--loading' : ''}`}
                    onClick={guardarMediador}
                    disabled={aSalvarMediador}
                  >
                    {!aSalvarMediador && 'Guardar mediador'}
                  </button>
                </div>
              </Painel>
            ) : null}

            <Painel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Etapa actual</label>
                  <input
                    className="form-input"
                    value={detalhe.mediacao.etapa_atual || ''}
                    disabled={!detalhe.permissoes?.pode_gerir}
                    onChange={(event) => setDetalhe((actual) => ({ ...actual, mediacao: { ...actual.mediacao, etapa_atual: event.target.value } }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Valor negociado</label>
                  <input
                    className="form-input"
                    type="number"
                    value={detalhe.mediacao.valor_negociado || ''}
                    disabled={!detalhe.permissoes?.pode_gerir}
                    onChange={(event) => setDetalhe((actual) => ({ ...actual, mediacao: { ...actual.mediacao, valor_negociado: event.target.value } }))}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="form-label">Observacoes internas</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={detalhe.mediacao.observacoes_internas || ''}
                  disabled={!detalhe.permissoes?.pode_gerir}
                  onChange={(event) => setDetalhe((actual) => ({ ...actual, mediacao: { ...actual.mediacao, observacoes_internas: event.target.value } }))}
                />
              </div>
              {detalhe.permissoes?.pode_gerir ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => actualizarMediacao({
                      etapa_atual: detalhe.mediacao.etapa_atual,
                      valor_negociado: detalhe.mediacao.valor_negociado || null,
                      observacoes_internas: detalhe.mediacao.observacoes_internas || null,
                    })}
                  >
                    <Save size={14} /> Guardar actualizacao
                  </button>
                </div>
              ) : null}
            </Painel>

            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>
                {formAgendamento.meeting_id ? 'Reagendar reuniao' : 'Agendar reuniao'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Data</label>
                  <input
                    type="date"
                    className="form-input"
                    disabled={!detalhe.permissoes?.pode_gerir}
                    value={formAgendamento.data_reuniao}
                    onChange={(event) => setFormAgendamento((actual) => ({ ...actual, data_reuniao: event.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Hora inicial</label>
                  <input
                    type="time"
                    className="form-input"
                    disabled={!detalhe.permissoes?.pode_gerir}
                    value={formAgendamento.hora_inicio}
                    onChange={(event) => setFormAgendamento((actual) => ({ ...actual, hora_inicio: event.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Hora final</label>
                  <input
                    type="time"
                    className="form-input"
                    disabled={!detalhe.permissoes?.pode_gerir}
                    value={formAgendamento.hora_fim}
                    onChange={(event) => setFormAgendamento((actual) => ({ ...actual, hora_fim: event.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo</label>
                  <select
                    className="form-select"
                    disabled={!detalhe.permissoes?.pode_gerir}
                    value={formAgendamento.tipo_reuniao}
                    onChange={(event) => setFormAgendamento((actual) => ({ ...actual, tipo_reuniao: event.target.value }))}
                  >
                    <option value="presencial">Presencial</option>
                    <option value="video_chamada">Videochamada</option>
                    <option value="telefonica">Telefonica</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Local</label>
                  <input
                    className="form-input"
                    disabled={!detalhe.permissoes?.pode_gerir}
                    value={formAgendamento.local_reuniao}
                    onChange={(event) => setFormAgendamento((actual) => ({ ...actual, local_reuniao: event.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Link de video</label>
                  <input
                    className="form-input"
                    disabled={!detalhe.permissoes?.pode_gerir}
                    value={formAgendamento.link_video}
                    onChange={(event) => setFormAgendamento((actual) => ({ ...actual, link_video: event.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="form-label">Objectivo</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  disabled={!detalhe.permissoes?.pode_gerir}
                  value={formAgendamento.objetivo}
                  onChange={(event) => setFormAgendamento((actual) => ({ ...actual, objetivo: event.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="form-label">Pauta</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  disabled={!detalhe.permissoes?.pode_gerir}
                  value={formAgendamento.pauta}
                  onChange={(event) => setFormAgendamento((actual) => ({ ...actual, pauta: event.target.value }))}
                />
              </div>
              {detalhe.permissoes?.pode_gerir ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                  {formAgendamento.meeting_id ? (
                    <button className="btn btn--secondary btn--sm" onClick={cancelarEdicaoReuniao}>
                      Cancelar edicao
                    </button>
                  ) : null}
                  <button
                    className={`btn btn--primary btn--sm${aSalvarReuniao ? ' btn--loading' : ''}`}
                    onClick={guardarReuniao}
                    disabled={aSalvarReuniao}
                  >
                    {!aSalvarReuniao && (
                      <>
                        <CalendarClock size={14} /> {formAgendamento.meeting_id ? 'Guardar nova data' : 'Agendar reuniao'}
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </Painel>

            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Reunioes do processo</div>
              {detalhe.reunioes.length ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {detalhe.reunioes.map((reuniao) => (
                    <Painel key={reuniao.id} style={{ padding: 14, background: 'var(--bg-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{formatarData(reuniao.data_reuniao)} · {reuniao.hora_inicio}</div>
                          <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>
                            {formatarTipoReuniao(reuniao.tipo_reuniao)} · {reuniao.local_reuniao || reuniao.link_video || 'Sem local definido'}
                          </div>
                          {reuniao.objetivo ? (
                            <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem', marginTop: 6 }}>{reuniao.objetivo}</div>
                          ) : null}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <BadgeModulo tonalidade={badgeEstado(reuniao.status || 'agendada')}>{reuniao.status || 'agendada'}</BadgeModulo>
                          {detalhe.permissoes?.pode_gerir ? (
                            <>
                              <button className="btn btn--secondary btn--sm" onClick={() => editarReuniao(reuniao)}>
                                Editar data
                              </button>
                              {reuniao.status !== 'cancelada' ? (
                                <button
                                  className="btn btn--danger btn--sm"
                                  onClick={() => setModalCancelamento({
                                    reuniao,
                                    motivo: 'Imprevisto operacional.',
                                  })}
                                >
                                  Anular
                                </button>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </Painel>
                  ))}
                </div>
              ) : (
                <LinhaVazia titulo="Sem reunioes" descricao="O mediador indicado deve marcar a primeira reuniao quando alinhar disponibilidade com investidor e empresa." />
              )}
            </Painel>

            {detalhe.permissoes?.pode_gerir ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn--primary" onClick={() => concluir('sucesso')}>
                  <ShieldCheck size={16} /> Concluir com sucesso
                </button>
                <button className="btn btn--danger" onClick={() => concluir('insucesso')}>
                  Encerrar sem acordo
                </button>
              </div>
            ) : (
              <LinhaVazia titulo="Processo apenas para consulta" descricao="Esta mediação foi encerrada e não permite novas alterações." />
            )}
          </ModalBloco>
        ) : null}
      </Modal>

      <Modal
        aberto={Boolean(modalCancelamento)}
        onFechar={() => !aCancelarReuniao && setModalCancelamento(null)}
        titulo="Anular reuniao"
        largura={560}
      >
        {modalCancelamento ? (
          <ModalBloco
            titulo="Confirmar anulacao da reuniao"
            subtitulo="Explique o motivo para que o sistema envie a comunicacao correcta ao investidor e a empresa."
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Motivo do cancelamento</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={modalCancelamento.motivo || ''}
                onChange={(event) => setModalCancelamento((actual) => ({ ...actual, motivo: event.target.value }))}
                placeholder="Descreva o motivo do cancelamento..."
                disabled={aCancelarReuniao}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setModalCancelamento(null)}
                disabled={aCancelarReuniao}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`btn btn--danger${aCancelarReuniao ? ' btn--loading' : ''}`}
                onClick={confirmarCancelamentoReuniao}
                disabled={aCancelarReuniao}
              >
                {!aCancelarReuniao && 'Anular reuniao'}
              </button>
            </div>
          </ModalBloco>
        ) : null}
      </Modal>
    </div>
  );
};

export default GestaoMediacaoV2;
