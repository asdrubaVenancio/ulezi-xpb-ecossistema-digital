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
  { valor: 'agendada', etiqueta: 'Reunião agendada' },
  { valor: 'concluida', etiqueta: 'Concluídas' },
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
  telefonica: 'TelefÃ³nica',
};

const formatarTipoReuniao = (tipo) => tipoReuniaoLabel[tipo] || tipo || 'A definir';

const GestaoMediacao = () => {
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
      toast.error(`Erro ao carregar mediações: ${extrairErro(erro)}`);
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
        carregarFuncionariosMediacao();
      } else {
        setFuncionariosMediacao([]);
      }
    } catch (erro) {
      toast.error(`Erro ao carregar detalhe: ${extrairErro(erro)}`);
    }
  };

  const actualizarMediacao = async (payload) => {
    if (!detalhe?.mediacao?.id) return;
    try {
      await api.put(`/admin/mediations/${detalhe.mediacao.id}`, payload);
      toast.success('Mediação actualizada com sucesso.');
      await abrirDetalhe(detalhe.mediacao.id);
      await carregar();
    } catch (erro) {
      toast.error(`Erro ao actualizar mediação: ${extrairErro(erro)}`);
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

  const agendarReuniao = async () => {
    if (!detalhe?.mediacao?.id || !detalhe?.permissoes?.pode_gerir) return;
    setASalvarReuniao(true);
    try {
      await api.post(`/admin/mediations/${detalhe.mediacao.id}/meetings`, formAgendamento);
      const mensagemSucesso = formAgendamento.meeting_id ? 'Reuniao reagendada com sucesso.' : 'Reuniao agendada com sucesso.';
      setFormAgendamento(formAgendamentoInicial);
      await abrirDetalhe(detalhe.mediacao.id);
      await carregar();
      toast.success('Reunião agendada com sucesso.');
      abrirDetalhe(detalhe.mediacao.id);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao agendar reunião: ${extrairErro(erro)}`);
    }
  };

  const concluir = async (resultado_final) => {
    if (!detalhe?.mediacao?.id) return;
    try {
      await api.post(`/admin/mediations/${detalhe.mediacao.id}/complete`, { resultado_final });
      toast.success('Mediação concluída com sucesso.');
      setDetalhe(null);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao concluir mediação: ${extrairErro(erro)}`);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Mediação"
        subtitulo="Faça a ponte entre investidor e empresa, agende reuniões com rastreio operacional e só formalize quando o processo estiver maduro."
        acoes={<BotaoAtualizar onClick={carregar} loading={carregando} />}
      />

      <GradeResumo>
        <ResumoCard icone={<GitMerge size={18} />} titulo="Total de mediações" valor={estatisticas.total_mediacoes || lista.length || 0} />
        <ResumoCard icone={<UserRoundCheck size={18} />} titulo="Pendentes" valor={estatisticas.pendentes || 0} cor="var(--amarelo-100)" destaque="var(--amarelo)" />
        <ResumoCard icone={<CalendarClock size={18} />} titulo="Concluídas" valor={estatisticas.concluidas || 0} cor="var(--verde-100)" destaque="var(--verde)" />
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
        <LinhaVazia titulo="Sem mediações" descricao="As mediações iniciadas a partir dos interesses vão aparecer aqui para acompanhamento." />
      ) : (
        <TabelaModulo colunas={['Processo', 'Investidor', 'Empresa', 'Mediador', 'Valor', 'Estado', 'Ações']}>
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

      <Modal aberto={Boolean(detalhe)} onFechar={() => setDetalhe(null)} titulo="Gestão de mediação" largura={960}>
        {detalhe?.mediacao ? (
          <ModalBloco titulo={detalhe.mediacao.titulo_oportunidade} subtitulo="Use esta vista para acompanhar a operação, alterar etapa e preparar a reunião entre as partes.">
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
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Mediador</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>{detalhe.mediacao.nome_funcionario || 'Não atribuído'}</div>
              </Painel>
            </div>

            <Painel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Etapa actual</label>
                  <input className="form-input" value={detalhe.mediacao.etapa_atual || ''} onChange={(event) => setDetalhe((actual) => ({ ...actual, mediacao: { ...actual.mediacao, etapa_atual: event.target.value } }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Valor negociado</label>
                  <input className="form-input" type="number" value={detalhe.mediacao.valor_negociado || ''} onChange={(event) => setDetalhe((actual) => ({ ...actual, mediacao: { ...actual.mediacao, valor_negociado: event.target.value } }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="form-label">Observações internas</label>
                <textarea className="form-textarea" rows={3} value={detalhe.mediacao.observacoes_internas || ''} onChange={(event) => setDetalhe((actual) => ({ ...actual, mediacao: { ...actual.mediacao, observacoes_internas: event.target.value } }))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => actualizarMediacao({
                    etapa_atual: detalhe.mediacao.etapa_atual,
                    valor_negociado: detalhe.mediacao.valor_negociado || null,
                    observacoes_internas: detalhe.mediacao.observacoes_internas || null,
                  })}
                >
                  <Save size={14} /> Guardar actualização
                </button>
              </div>
            </Painel>

            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Agendar reunião</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Data</label>
                  <input type="date" className="form-input" value={formAgendamento.data_reuniao} onChange={(event) => setFormAgendamento((actual) => ({ ...actual, data_reuniao: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Hora inicial</label>
                  <input type="time" className="form-input" value={formAgendamento.hora_inicio} onChange={(event) => setFormAgendamento((actual) => ({ ...actual, hora_inicio: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Hora final</label>
                  <input type="time" className="form-input" value={formAgendamento.hora_fim} onChange={(event) => setFormAgendamento((actual) => ({ ...actual, hora_fim: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={formAgendamento.tipo_reuniao} onChange={(event) => setFormAgendamento((actual) => ({ ...actual, tipo_reuniao: event.target.value }))}>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                    <option value="hibrida">Híbrida</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Local</label>
                  <input className="form-input" value={formAgendamento.local_reuniao} onChange={(event) => setFormAgendamento((actual) => ({ ...actual, local_reuniao: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Link de vídeo</label>
                  <input className="form-input" value={formAgendamento.link_video} onChange={(event) => setFormAgendamento((actual) => ({ ...actual, link_video: event.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="form-label">Objectivo</label>
                <textarea className="form-textarea" rows={2} value={formAgendamento.objetivo} onChange={(event) => setFormAgendamento((actual) => ({ ...actual, objetivo: event.target.value }))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn btn--primary btn--sm" onClick={agendarReuniao}>
                  <CalendarClock size={14} /> Agendar reunião
                </button>
              </div>
            </Painel>

            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Reuniões já marcadas</div>
              {detalhe.reunioes.length ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {detalhe.reunioes.map((reuniao) => (
                    <Painel key={reuniao.id} style={{ padding: 14, background: 'var(--bg-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{formatarData(reuniao.data_reuniao)} · {reuniao.hora_inicio}</div>
                          <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{reuniao.tipo_reuniao} · {reuniao.local_reuniao || reuniao.link_video || 'Sem local definido'}</div>
                        </div>
                        <BadgeModulo tonalidade={badgeEstado(reuniao.status || 'agendada')}>{reuniao.status || 'agendada'}</BadgeModulo>
                      </div>
                    </Painel>
                  ))}
                </div>
              ) : (
                <LinhaVazia titulo="Sem reuniões" descricao="Agende a primeira reunião para avançar a negociação com acompanhamento institucional." />
              )}
            </Painel>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn--primary" onClick={() => concluir('sucesso')}>
                <ShieldCheck size={16} /> Concluir com sucesso
              </button>
              <button className="btn btn--danger" onClick={() => concluir('insucesso')}>
                Encerrar sem acordo
              </button>
            </div>
          </ModalBloco>
        ) : null}
      </Modal>
    </div>
  );
};

export default GestaoMediacao;
