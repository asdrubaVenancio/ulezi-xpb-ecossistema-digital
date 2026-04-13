import { CalendarDays, CheckCircle2, Eye, MapPinned, PlusCircle, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/ui';
import api, { BACKEND_BASE_URL, extrairErro } from '../../services/api';
import {
  badgeEstado,
  BadgeModulo,
  BarraFerramentas,
  BotaoAtualizar,
  formatarData,
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

const visitaInicial = {
  company_id: '',
  employee_id: '',
  data_visita: '',
  hora_visita: '',
  endereco_visita: '',
  observacoes: '',
};

const resultadoInicial = {
  resultado: 'aprovado',
  relatorio_visita: '',
  recomendacoes: '',
  motivo_rejeicao: '',
  requer_segunda_visita: false,
};

const GestaoVisitas = () => {
  const [visitas, setVisitas] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [empresas, setEmpresas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [estado, setEstado] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [modalAgendamentoAberto, setModalAgendamentoAberto] = useState(false);
  const [novaVisita, setNovaVisita] = useState(visitaInicial);
  const [resultado, setResultado] = useState(resultadoInicial);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resVisitas, resStats, resEmpresas, resFuncionarios] = await Promise.all([
        api.get('/admin/visits', { params: { status: estado || undefined } }),
        api.get('/admin/visits/stats'),
        api.get('/admin/empresas'),
        api.get('/admin/employees/available-for-mediation', { params: { tipo_responsabilidade: 'verificacao_fisica' } }),
      ]);

      setVisitas(lerLista(resVisitas.data, 'visitas'));
      setEstatisticas(lerObjeto(resStats.data, 'estatisticas_gerais'));
      setEmpresas(lerLista(resEmpresas.data, 'empresas').filter((empresa) => empresa.estado === 'pendente'));
      setFuncionarios(lerLista(resFuncionarios.data, 'funcionarios'));
    } catch (erro) {
      toast.error(`Erro ao carregar visitas: ${extrairErro(erro)}`);
      setVisitas([]);
      setEstatisticas({});
      setEmpresas([]);
      setFuncionarios([]);
    } finally {
      setCarregando(false);
    }
  }, [estado]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return visitas;

    return visitas.filter((item) => (
      [
        item.nome_empresa,
        item.nome_funcionario,
        item.provincia,
        item.municipio,
        item.endereco_visita,
      ].filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo))
    ));
  }, [visitas, pesquisa]);

  const agendar = async () => {
    try {
      await api.post('/admin/visits', novaVisita);
      toast.success('Visita agendada com sucesso.');
      setNovaVisita(visitaInicial);
      setModalAgendamentoAberto(false);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao agendar visita: ${extrairErro(erro)}`);
    }
  };

  const abrirDetalhe = async (id) => {
    try {
      const { data } = await api.get(`/admin/visits/${id}`);
      setDetalhe({
        visita: lerObjeto(data, 'visita'),
        documentos: lerLista(data, 'documentos_empresa'),
      });
      setResultado(resultadoInicial);
    } catch (erro) {
      toast.error(`Erro ao carregar visita: ${extrairErro(erro)}`);
    }
  };

  const concluir = async () => {
    if (!detalhe?.visita?.id) return;

    try {
      await api.post(`/admin/visits/${detalhe.visita.id}/complete`, resultado);
      toast.success('Visita concluída com sucesso.');
      setDetalhe(null);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao concluir visita: ${extrairErro(erro)}`);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Visitas"
        subtitulo="Coordene a validação física das empresas e mantenha o fluxo mais leve, com pesquisa rápida e agendamento separado do ecrã principal."
        acoes={(
          <div className="module-inline-actions">
            <BotaoAtualizar onClick={carregar} loading={carregando} />
            <button className="btn btn--primary btn--sm" onClick={() => setModalAgendamentoAberto(true)}>
              <PlusCircle size={14} /> Nova visita
            </button>
          </div>
        )}
      />

      <GradeResumo>
        <ResumoCard icone={<MapPinned size={18} />} titulo="Visitas totais" valor={estatisticas.total_visitas || lista.length || 0} />
        <ResumoCard icone={<CalendarDays size={18} />} titulo="Agendadas" valor={estatisticas.agendadas || 0} cor="var(--amarelo-100)" destaque="var(--amarelo)" />
        <ResumoCard icone={<CheckCircle2 size={18} />} titulo="Aprovadas" valor={estatisticas.aprovadas || 0} cor="var(--verde-100)" destaque="var(--verde)" />
        <ResumoCard icone={<ShieldAlert size={18} />} titulo="Reprovadas" valor={estatisticas.reprovadas || 0} cor="var(--vermelho-100)" destaque="var(--vermelho)" />
      </GradeResumo>

      <BarraFerramentas
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        filtros={(
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Estado</label>
            <select className="form-select" value={estado} onChange={(event) => setEstado(event.target.value)}>
              <option value="">Todos</option>
              <option value="agendada">Agendada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        )}
        compacta
      />

      {!lista.length && !carregando ? (
        <LinhaVazia titulo="Sem visitas registadas" descricao="Agende a primeira visita assim que uma empresa estiver pronta para validação física." />
      ) : (
        <TabelaModulo colunas={['Empresa', 'Responsável', 'Agenda', 'Local', 'Estado', 'Resultado', 'Acções']}>
          {lista.map((item) => (
            <tr key={item.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{item.nome_empresa}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{[item.municipio, item.provincia].filter(Boolean).join(', ') || 'Sem localização'}</div>
              </td>
              <td>{item.nome_funcionario || 'Sem responsável'}</td>
              <td>{formatarData(item.data_visita)} {item.hora_visita ? `· ${item.hora_visita}` : ''}</td>
              <td style={{ color: 'var(--txt-3)' }}>{item.endereco_visita || item.endereco_empresa || 'Sede da empresa'}</td>
              <td><BadgeModulo tonalidade={badgeEstado(item.status)}>{item.status}</BadgeModulo></td>
              <td><BadgeModulo tonalidade={badgeEstado(item.resultado || 'pendente')}>{item.resultado || 'pendente'}</BadgeModulo></td>
              <td>
                <button className="btn btn--secondary btn--sm" onClick={() => abrirDetalhe(item.id)}>
                  <Eye size={14} /> Ver detalhe
                </button>
              </td>
            </tr>
          ))}
        </TabelaModulo>
      )}

      <Modal isOpen={modalAgendamentoAberto} onClose={() => setModalAgendamentoAberto(false)} title="Agendar visita" size="xl">
        <ModalBloco
          titulo="Nova visita de verificação"
          subtitulo="Escolha a empresa, defina o funcionário e registe as indicações logísticas num espaço dedicado."
        >
          <Painel style={{ background: 'var(--bg-2)' }}>
            <div className="module-grid-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Empresa</label>
                <select className="form-select" value={novaVisita.company_id} onChange={(event) => setNovaVisita((actual) => ({ ...actual, company_id: event.target.value }))}>
                  <option value="">Selecione</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>{empresa.nome_empresa}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Funcionário</label>
                <select className="form-select" value={novaVisita.employee_id} onChange={(event) => setNovaVisita((actual) => ({ ...actual, employee_id: event.target.value }))}>
                  <option value="">Selecione</option>
                  {funcionarios.map((funcionario) => (
                    <option key={funcionario.id} value={funcionario.id}>{funcionario.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Endereço</label>
                <input className="form-input" value={novaVisita.endereco_visita} onChange={(event) => setNovaVisita((actual) => ({ ...actual, endereco_visita: event.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Data</label>
                <input type="date" className="form-input" value={novaVisita.data_visita} onChange={(event) => setNovaVisita((actual) => ({ ...actual, data_visita: event.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hora</label>
                <input type="time" className="form-input" value={novaVisita.hora_visita} onChange={(event) => setNovaVisita((actual) => ({ ...actual, hora_visita: event.target.value }))} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
              <label className="form-label">Observações operacionais</label>
              <textarea className="form-textarea" rows={3} value={novaVisita.observacoes} onChange={(event) => setNovaVisita((actual) => ({ ...actual, observacoes: event.target.value }))} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn--primary btn--sm" onClick={agendar}>
                <PlusCircle size={14} /> Confirmar agendamento
              </button>
            </div>
          </Painel>
        </ModalBloco>
      </Modal>

      <Modal isOpen={Boolean(detalhe)} onClose={() => setDetalhe(null)} title="Conclusão da visita" size="xl">
        {detalhe?.visita ? (
          <ModalBloco
            titulo={detalhe.visita.nome_empresa}
            subtitulo="Verifique os documentos observados em campo e registe o parecer final do funcionário responsável."
          >
            <div className="module-grid-3">
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Funcionário</div>
                <div style={{ fontWeight: 700 }}>{detalhe.visita.nome_funcionario || 'Sem responsável'}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Data da visita</div>
                <div style={{ fontWeight: 700 }}>{formatarData(detalhe.visita.data_visita)}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Estado</div>
                <BadgeModulo tonalidade={badgeEstado(detalhe.visita.status)}>{detalhe.visita.status}</BadgeModulo>
              </Painel>
            </div>

            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Documentos observados em campo</div>
              {detalhe.documentos.length ? (
                <div className="module-stack">
                  {detalhe.documentos.map((documento) => (
                    <Painel key={documento.id} style={{ padding: 14, background: 'var(--bg-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{documento.tipo}</div>
                          <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{documento.nome_ficheiro}</div>
                        </div>
                        <a className="btn btn--secondary btn--sm" href={`${BACKEND_BASE_URL}${documento.url_ficheiro}`} target="_blank" rel="noreferrer">
                          Abrir
                        </a>
                      </div>
                    </Painel>
                  ))}
                </div>
              ) : (
                <LinhaVazia titulo="Sem documentos anexados" descricao="Os ficheiros da empresa ainda não estão disponíveis para esta visita." />
              )}
            </Painel>

            {detalhe.visita.status === 'agendada' ? (
              <Painel>
                <div className="module-grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Resultado</label>
                    <select className="form-select" value={resultado.resultado} onChange={(event) => setResultado((actual) => ({ ...actual, resultado: event.target.value }))}>
                      <option value="aprovado">Aprovado</option>
                      <option value="condicional">Condicional</option>
                      <option value="reprovado">Reprovado</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Requer segunda visita</label>
                    <select className="form-select" value={resultado.requer_segunda_visita ? 'sim' : 'nao'} onChange={(event) => setResultado((actual) => ({ ...actual, requer_segunda_visita: event.target.value === 'sim' }))}>
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                  <label className="form-label">Relatório da visita</label>
                  <textarea className="form-textarea" rows={4} value={resultado.relatorio_visita} onChange={(event) => setResultado((actual) => ({ ...actual, relatorio_visita: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                  <label className="form-label">Recomendações</label>
                  <textarea className="form-textarea" rows={3} value={resultado.recomendacoes} onChange={(event) => setResultado((actual) => ({ ...actual, recomendacoes: event.target.value }))} />
                </div>
                {resultado.resultado === 'reprovado' ? (
                  <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                    <label className="form-label">Motivo da reprovação</label>
                    <textarea className="form-textarea" rows={3} value={resultado.motivo_rejeicao} onChange={(event) => setResultado((actual) => ({ ...actual, motivo_rejeicao: event.target.value }))} />
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn btn--primary btn--sm" onClick={concluir}>
                    <CheckCircle2 size={14} /> Fechar visita
                  </button>
                </div>
              </Painel>
            ) : null}
          </ModalBloco>
        ) : null}
      </Modal>
    </div>
  );
};

export default GestaoVisitas;
