import {
  AlertCircle,
  CheckCircle2,
  Headphones,
  LifeBuoy,
  MessageSquare,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/ui';
import api, { extrairErro } from '../../services/api';
import {
  badgeEstado,
  BadgeModulo,
  BarraFerramentas,
  BotaoAtualizar,
  formatarDataHora,
  GradeResumo,
  lerLista,
  lerObjeto,
  LinhaVazia,
  ModalBloco,
  PaginaModulo,
  Painel,
  ResumoCard,
  TabelaModulo,
} from './module7-ui.jsx';

const prioridades = [
  { valor: '', etiqueta: 'Todas as prioridades' },
  { valor: 'baixa', etiqueta: 'Baixa' },
  { valor: 'media', etiqueta: 'Média' },
  { valor: 'alta', etiqueta: 'Alta' },
  { valor: 'urgente', etiqueta: 'Urgente' },
];

const estados = [
  { valor: '', etiqueta: 'Todos os estados' },
  { valor: 'aberto', etiqueta: 'Aberto' },
  { valor: 'em_atendimento', etiqueta: 'Em atendimento' },
  { valor: 'aguardando_resposta', etiqueta: 'Aguardando resposta' },
  { valor: 'resolvido', etiqueta: 'Resolvido' },
  { valor: 'fechado', etiqueta: 'Fechado' },
];

const SuporteTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [funcionarios, setFuncionarios] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [estado, setEstado] = useState('');
  const [prioridade, setPrioridade] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [detalhe, setDetalhe] = useState(null);
  const [ticketActivo, setTicketActivo] = useState(null);
  const [resposta, setResposta] = useState('');
  const [aProcessar, setAProcessar] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resTickets, resStats, resFuncionarios] = await Promise.all([
        api.get('/support/admin/tickets', { params: { status: estado || undefined, prioridade: prioridade || undefined, limit: 100 } }),
        api.get('/support/admin/tickets/stats'),
        api.get('/admin/employees', { params: { status: 'active', limit: 100 } }),
      ]);

      setTickets(lerLista(resTickets.data, 'tickets'));
      setEstatisticas(lerObjeto(resStats.data, 'estatisticas_gerais'));
      setFuncionarios(lerLista(resFuncionarios.data, 'funcionarios'));
    } catch (erro) {
      toast.error(`Erro ao carregar tickets: ${extrairErro(erro)}`);
      setTickets([]);
      setEstatisticas({});
      setFuncionarios([]);
    } finally {
      setCarregando(false);
    }
  }, [estado, prioridade]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const listaFiltrada = useMemo(() => {
    const termo = String(pesquisa || '').trim().toLowerCase();
    if (!termo) return tickets;

    return tickets.filter((ticket) => (
      [
        ticket.ticket_number,
        ticket.assunto,
        ticket.usuario_nome,
        ticket.usuario_email,
        ticket.funcionario_nome,
        ticket.categoria,
      ].filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo))
    ));
  }, [tickets, pesquisa]);

  const abrirDetalhe = async (ticketId) => {
    try {
      const { data } = await api.get(`/support/tickets/${ticketId}`);
      setDetalhe({
        ticket: lerObjeto(data, 'ticket'),
        mensagens: lerLista(data, 'messages'),
      });
      setTicketActivo(ticketId);
      setResposta('');
    } catch (erro) {
      toast.error(`Erro ao abrir ticket: ${extrairErro(erro)}`);
    }
  };

  const atribuir = async (employeeId) => {
    if (!ticketActivo || !employeeId) return;

    setAProcessar(true);
    try {
      await api.put(`/support/admin/tickets/${ticketActivo}/assign`, { employee_id: employeeId });
      toast.success('Ticket atribuído com sucesso.');
      await Promise.all([carregar(), abrirDetalhe(ticketActivo)]);
    } catch (erro) {
      toast.error(`Erro ao atribuir ticket: ${extrairErro(erro)}`);
    } finally {
      setAProcessar(false);
    }
  };

  const actualizarEstado = async (novoEstado) => {
    if (!ticketActivo) return;

    setAProcessar(true);
    try {
      await api.put(`/support/admin/tickets/${ticketActivo}/status`, { status: novoEstado });
      toast.success('Estado do ticket actualizado.');
      await Promise.all([carregar(), abrirDetalhe(ticketActivo)]);
    } catch (erro) {
      toast.error(`Erro ao actualizar estado: ${extrairErro(erro)}`);
    } finally {
      setAProcessar(false);
    }
  };

  const actualizarPrioridade = async (novaPrioridade) => {
    if (!ticketActivo) return;

    setAProcessar(true);
    try {
      await api.put(`/support/admin/tickets/${ticketActivo}/priority`, { prioridade: novaPrioridade });
      toast.success('Prioridade actualizada.');
      await Promise.all([carregar(), abrirDetalhe(ticketActivo)]);
    } catch (erro) {
      toast.error(`Erro ao actualizar prioridade: ${extrairErro(erro)}`);
    } finally {
      setAProcessar(false);
    }
  };

  const enviarResposta = async () => {
    if (!ticketActivo || !resposta.trim()) {
      toast.error('Escreva a resposta antes de enviar.');
      return;
    }

    setAProcessar(true);
    try {
      await api.post(`/support/tickets/${ticketActivo}/messages`, {
        mensagem: resposta.trim(),
        is_internal: false,
      });
      toast.success('Resposta enviada com sucesso.');
      setResposta('');
      await Promise.all([carregar(), abrirDetalhe(ticketActivo)]);
    } catch (erro) {
      toast.error(`Erro ao enviar resposta: ${extrairErro(erro)}`);
    } finally {
      setAProcessar(false);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Suporte"
        subtitulo="Acompanhe tickets de atendimento com um fluxo administrativo mais limpo, sem blocos partidos e com acções claras."
        acoes={<BotaoAtualizar onClick={carregar} loading={carregando} />}
      />

      <GradeResumo>
        <ResumoCard icone={<LifeBuoy size={18} />} titulo="Total de tickets" valor={estatisticas.total_tickets || tickets.length || 0} />
        <ResumoCard icone={<AlertCircle size={18} />} titulo="Abertos" valor={estatisticas.abertos || 0} cor="var(--amarelo-100)" destaque="var(--amarelo)" />
        <ResumoCard icone={<Headphones size={18} />} titulo="Em atendimento" valor={estatisticas.em_atendimento || 0} cor="var(--ciano-100)" destaque="var(--ciano)" />
        <ResumoCard icone={<CheckCircle2 size={18} />} titulo="Resolvidos" valor={estatisticas.resolvidos || 0} cor="var(--verde-100)" destaque="var(--verde)" />
      </GradeResumo>

      <BarraFerramentas
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        filtros={(
          <>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estado</label>
              <select className="form-select" value={estado} onChange={(event) => setEstado(event.target.value)}>
                {estados.map((item) => <option key={item.valor || 'todos'} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prioridade</label>
              <select className="form-select" value={prioridade} onChange={(event) => setPrioridade(event.target.value)}>
                {prioridades.map((item) => <option key={item.valor || 'todas'} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
          </>
        )}
        compacta
      />

      {!listaFiltrada.length && !carregando ? (
        <LinhaVazia titulo="Nenhum ticket encontrado" descricao="Os pedidos de suporte aparecerão aqui assim que forem criados por empresas ou investidores." />
      ) : (
        <TabelaModulo colunas={['Ticket', 'Cliente', 'Categoria', 'Responsável', 'Estado', 'Prioridade', 'Acções']}>
          {listaFiltrada.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{ticket.assunto}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{ticket.ticket_number}</div>
              </td>
              <td>
                <div>{ticket.usuario_nome || 'Sem nome'}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{ticket.usuario_email || 'Sem e-mail'}</div>
              </td>
              <td>{ticket.categoria || 'Geral'}</td>
              <td>{ticket.funcionario_nome || 'Não atribuído'}</td>
              <td><BadgeModulo tonalidade={badgeEstado(ticket.status)}>{ticket.status}</BadgeModulo></td>
              <td><BadgeModulo tonalidade={badgeEstado(ticket.prioridade)}>{ticket.prioridade}</BadgeModulo></td>
              <td>
                <button className="btn btn--secondary btn--sm" onClick={() => abrirDetalhe(ticket.id)}>
                  <MessageSquare size={14} /> Abrir
                </button>
              </td>
            </tr>
          ))}
        </TabelaModulo>
      )}

      <Modal isOpen={Boolean(detalhe)} onClose={() => setDetalhe(null)} title="Atendimento de suporte" size="xl">
        {detalhe?.ticket ? (
          <ModalBloco
            titulo={detalhe.ticket.assunto}
            subtitulo="Revise a conversa, atribua o responsável e conduza o ticket até à resolução com um histórico organizado."
          >
            <div className="module-grid-3">
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Cliente</div>
                <div style={{ fontWeight: 700 }}>{detalhe.ticket.usuario_nome || 'Sem nome'}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Estado</div>
                <BadgeModulo tonalidade={badgeEstado(detalhe.ticket.status)}>{detalhe.ticket.status}</BadgeModulo>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Prioridade</div>
                <BadgeModulo tonalidade={badgeEstado(detalhe.ticket.prioridade)}>{detalhe.ticket.prioridade}</BadgeModulo>
              </Painel>
            </div>

            <Painel>
              <div className="module-grid-3">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Atribuir responsável</label>
                  <select className="form-select" value={detalhe.ticket.employee_id || ''} onChange={(event) => atribuir(event.target.value)} disabled={aProcessar}>
                    <option value="">Selecione um funcionário</option>
                    {funcionarios.map((funcionario) => (
                      <option key={funcionario.id} value={funcionario.id}>{funcionario.nome} · {funcionario.cargo || 'Sem cargo'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Alterar estado</label>
                  <select className="form-select" value={detalhe.ticket.status || ''} onChange={(event) => actualizarEstado(event.target.value)} disabled={aProcessar}>
                    {estados.filter((item) => item.valor).map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prioridade</label>
                  <select className="form-select" value={detalhe.ticket.prioridade || ''} onChange={(event) => actualizarPrioridade(event.target.value)} disabled={aProcessar}>
                    {prioridades.filter((item) => item.valor).map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
                  </select>
                </div>
              </div>
            </Painel>

            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Histórico da conversa</div>
              {detalhe.mensagens.length ? (
                <div className="module-stack">
                  {detalhe.mensagens.map((mensagem) => (
                    <div key={mensagem.id} style={{ padding: 14, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700 }}>{mensagem.sender_nome || 'Utilizador'}</div>
                        <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>{formatarDataHora(mensagem.created_at)}</div>
                      </div>
                      <div style={{ color: 'var(--txt-2)', lineHeight: 1.7 }}>{mensagem.mensagem}</div>
                      {mensagem.is_internal ? (
                        <div style={{ marginTop: 8 }}>
                          <BadgeModulo tonalidade="amarelo">Nota interna</BadgeModulo>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <LinhaVazia titulo="Sem mensagens" descricao="Ainda não há histórico adicional para este ticket." />
              )}
            </Painel>

            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Responder ao cliente</div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mensagem</label>
                <textarea className="form-textarea" rows={4} value={resposta} onChange={(event) => setResposta(event.target.value)} placeholder="Escreva uma resposta clara e profissional para o cliente." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button className={`btn btn--primary btn--sm${aProcessar ? ' btn--loading' : ''}`} onClick={enviarResposta} disabled={aProcessar}>
                  {!aProcessar && <><Send size={14} /> Enviar resposta</>}
                </button>
              </div>
            </Painel>
          </ModalBloco>
        ) : null}
      </Modal>
    </div>
  );
};

export default SuporteTickets;
