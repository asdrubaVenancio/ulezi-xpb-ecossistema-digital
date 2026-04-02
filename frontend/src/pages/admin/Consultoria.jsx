import { Briefcase, CalendarClock, CircleDollarSign, Eye, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/ui';
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

const Consultoria = () => {
  const [consultas, setConsultas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [estatisticas, setEstatisticas] = useState({});
  const [detalhe, setDetalhe] = useState(null);
  const [agendamento, setAgendamento] = useState({
    employee_id: '',
    data_agendada: '',
    hora_inicio: '',
    hora_fim: '',
    link_reuniao: '',
    local_reuniao: '',
    valor: '',
  });

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resConsultas, resStats, resFuncionarios] = await Promise.all([
        api.get('/consultations/admin/all', { params: { status: estado || undefined, tipo_consultoria: tipo || undefined } }),
        api.get('/consultations/admin/stats'),
        api.get('/admin/employees'),
      ]);
      setConsultas(lerLista(resConsultas.data, 'consultas'));
      setEstatisticas(lerObjeto(resStats.data, 'estatisticas_gerais'));
      setFuncionarios(lerLista(resFuncionarios.data, 'funcionarios'));
    } catch (erro) {
      toast.error(`Erro ao carregar consultorias: ${extrairErro(erro)}`);
      setConsultas([]);
      setFuncionarios([]);
      setEstatisticas({});
    } finally {
      setCarregando(false);
    }
  }, [estado, tipo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return consultas;
    return consultas.filter((item) => (
      [
        item.usuario_nome,
        item.usuario_email,
        item.tema,
        item.tipo_consultoria,
      ].filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo))
    ));
  }, [consultas, pesquisa]);

  const abrirDetalhe = async (item) => {
    try {
      const { data } = await api.get(`/consultations/${item.id}`);
      setDetalhe(lerObjeto(data, 'consulta'));
      setAgendamento({
        employee_id: item.employee_id || '',
        data_agendada: item.data_agendada ? String(item.data_agendada).split('T')[0] : '',
        hora_inicio: item.hora_inicio || '',
        hora_fim: item.hora_fim || '',
        link_reuniao: item.link_reuniao || '',
        local_reuniao: item.local_reuniao || '',
        valor: item.valor || '',
      });
    } catch (erro) {
      toast.error(`Erro ao obter detalhe da consultoria: ${extrairErro(erro)}`);
    }
  };

  const agendar = async () => {
    if (!detalhe?.id) return;
    try {
      await api.put(`/consultations/admin/${detalhe.id}/schedule`, agendamento);
      toast.success('Consultoria agendada com sucesso.');
      abrirDetalhe({ id: detalhe.id });
      carregar();
    } catch (erro) {
      toast.error(`Erro ao agendar consultoria: ${extrairErro(erro)}`);
    }
  };

  const concluir = async () => {
    if (!detalhe?.id) return;
    try {
      await api.post(`/consultations/admin/${detalhe.id}/complete`, {
        resumo: 'Sessão realizada com registo administrativo.',
        valor_cobrado: agendamento.valor || detalhe.valor || null,
      });
      toast.success('Consultoria marcada como realizada.');
      setDetalhe(null);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao concluir consultoria: ${extrairErro(erro)}`);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Consultoria"
        subtitulo="Organize a agenda de atendimento, atribua consultores internos e acompanhe os pedidos pagos ou incluídos em assinatura."
        acoes={<BotaoAtualizar onClick={carregar} loading={carregando} />}
      />

      <GradeResumo>
        <ResumoCard icone={<Briefcase size={18} />} titulo="Solicitações" valor={estatisticas.total_consultas || lista.length || 0} />
        <ResumoCard icone={<CalendarClock size={18} />} titulo="Pendentes" valor={estatisticas.pendentes || 0} cor="var(--amarelo-100)" destaque="var(--amarelo)" />
        <ResumoCard icone={<ShieldCheck size={18} />} titulo="Realizadas" valor={estatisticas.realizadas || 0} cor="var(--verde-100)" destaque="var(--verde)" />
        <ResumoCard icone={<CircleDollarSign size={18} />} titulo="Receita" valor={formatarMoeda(estatisticas.receita_total || 0)} cor="var(--laranja-100)" destaque="var(--laranja)" />
      </GradeResumo>

      <BarraFerramentas
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        filtros={(
          <>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estado</label>
              <select className="form-select" value={estado} onChange={(event) => setEstado(event.target.value)}>
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="agendada">Agendada</option>
                <option value="confirmada">Confirmada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo</label>
              <input className="form-input" value={tipo} onChange={(event) => setTipo(event.target.value)} placeholder="Ex.: investimento" />
            </div>
          </>
        )}
      />

      {!lista.length && !carregando ? (
        <LinhaVazia titulo="Sem pedidos de consultoria" descricao="As empresas e investidores que solicitarem apoio especializado aparecerão aqui." />
      ) : (
        <TabelaModulo colunas={['Tema', 'Cliente', 'Tipo', 'Consultor', 'Agenda', 'Estado', 'Ações']}>
          {lista.map((item) => (
            <tr key={item.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{item.tema}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{item.tipo_consultoria}</div>
              </td>
              <td>
                <div>{item.usuario_nome}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{item.usuario_email}</div>
              </td>
              <td>{item.usuario_tipo}</td>
              <td>{item.consultor_nome || 'Não atribuído'}</td>
              <td style={{ color: 'var(--txt-3)' }}>{item.data_agendada ? `${formatarData(item.data_agendada)} · ${item.hora_inicio || ''}` : 'Não agendada'}</td>
              <td><BadgeModulo tonalidade={badgeEstado(item.status)}>{item.status}</BadgeModulo></td>
              <td>
                <button className="btn btn--secondary btn--sm" onClick={() => abrirDetalhe(item)}>
                  <Eye size={14} /> Gerir
                </button>
              </td>
            </tr>
          ))}
        </TabelaModulo>
      )}

      <Modal isOpen={Boolean(detalhe)} onClose={() => setDetalhe(null)} title="Gestão de consultoria" size="xl">
        {detalhe ? (
          <ModalBloco titulo={detalhe.tema} subtitulo="Confirme agenda, consultor atribuído e registo financeiro antes de concluir a sessão.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Cliente</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>{detalhe.usuario_nome}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{detalhe.usuario_email}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Tipo de consultoria</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>{detalhe.tipo_consultoria}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Estado</div>
                <div style={{ marginTop: 6 }}><BadgeModulo tonalidade={badgeEstado(detalhe.status)}>{detalhe.status}</BadgeModulo></div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Valor actual</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>{formatarMoeda(detalhe.valor || 0)}</div>
              </Painel>
            </div>

            <Painel style={{ background: 'var(--bg-2)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Descrição da necessidade</div>
              <div style={{ color: 'var(--txt-2)', lineHeight: 1.7 }}>{detalhe.descricao || 'Sem descrição adicional.'}</div>
            </Painel>

            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Agendamento operacional</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Consultor</label>
                  <select className="form-select" value={agendamento.employee_id} onChange={(event) => setAgendamento((actual) => ({ ...actual, employee_id: event.target.value }))}>
                    <option value="">Selecione um funcionário</option>
                    {funcionarios.map((funcionario) => (
                      <option key={funcionario.id} value={funcionario.id}>{funcionario.nome} · {funcionario.cargo}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Data</label>
                  <input type="date" className="form-input" value={agendamento.data_agendada} onChange={(event) => setAgendamento((actual) => ({ ...actual, data_agendada: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Hora início</label>
                  <input type="time" className="form-input" value={agendamento.hora_inicio} onChange={(event) => setAgendamento((actual) => ({ ...actual, hora_inicio: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Hora fim</label>
                  <input type="time" className="form-input" value={agendamento.hora_fim} onChange={(event) => setAgendamento((actual) => ({ ...actual, hora_fim: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Link</label>
                  <input className="form-input" value={agendamento.link_reuniao} onChange={(event) => setAgendamento((actual) => ({ ...actual, link_reuniao: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Local</label>
                  <input className="form-input" value={agendamento.local_reuniao} onChange={(event) => setAgendamento((actual) => ({ ...actual, local_reuniao: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Valor a cobrar</label>
                  <input type="number" className="form-input" value={agendamento.valor} onChange={(event) => setAgendamento((actual) => ({ ...actual, valor: event.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <button className="btn btn--primary btn--sm" onClick={agendar}>
                  <CalendarClock size={14} /> Guardar agenda
                </button>
                {['agendada', 'confirmada'].includes(detalhe.status) ? (
                  <button className="btn btn--secondary btn--sm" onClick={concluir}>
                    <ShieldCheck size={14} /> Marcar como realizada
                  </button>
                ) : null}
              </div>
            </Painel>
          </ModalBloco>
        ) : null}
      </Modal>
    </div>
  );
};

export default Consultoria;
