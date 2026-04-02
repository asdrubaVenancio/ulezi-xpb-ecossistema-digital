import { Eye, GitMerge, Mail, MessageSquare, ShieldCheck, UserRound } from 'lucide-react';
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
  formatarMoeda,
  lerLista,
  LinhaVazia,
  ModalBloco,
  PaginaModulo,
  Painel,
  GradeResumo,
  ResumoCard,
  TabelaModulo,
} from './module7-ui.jsx';

const opcoesEstado = [
  { valor: '', etiqueta: 'Todos os estados' },
  { valor: 'pendente', etiqueta: 'Pendentes' },
  { valor: 'em_mediacao', etiqueta: 'Em mediação' },
  { valor: 'em_analise', etiqueta: 'Em análise' },
  { valor: 'aprovado', etiqueta: 'Aprovados' },
  { valor: 'cancelado', etiqueta: 'Cancelados' },
];

const InteressesInvestidores = () => {
  const [interesses, setInteresses] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [estado, setEstado] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [detalhe, setDetalhe] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [funcionarioId, setFuncionarioId] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [criandoMediacao, setCriandoMediacao] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resInteresses, resFuncionarios] = await Promise.all([
        api.get('/admin/interests'),
        api.get('/admin/employees/available-for-mediation'),
      ]);

      const lista = lerLista(resInteresses.data, 'interesses');
      setInteresses(lista);
      setFuncionarios(lerLista(resFuncionarios.data, 'funcionarios'));
    } catch (erro) {
      toast.error(`Erro ao carregar interesses: ${extrairErro(erro)}`);
      setInteresses([]);
      setFuncionarios([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    return interesses.filter((item) => {
      const matchPesquisa = !termo || [
        item.nome_investidor,
        item.nome_empresa,
        item.titulo,
        item.tipo,
      ].filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo));
      const matchEstado = !estado || String(item.status).toLowerCase() === estado;
      return matchPesquisa && matchEstado;
    });
  }, [interesses, pesquisa, estado]);

  const resumo = useMemo(() => ({
    total: lista.length,
    pendentes: lista.filter((item) => String(item.status).toLowerCase() === 'pendente').length,
    emMediacao: lista.filter((item) => ['em_mediacao', 'em_analise'].includes(String(item.status).toLowerCase())).length,
    aprovados: lista.filter((item) => String(item.status).toLowerCase() === 'aprovado').length,
  }), [lista]);

  const iniciarMediacao = async () => {
    if (!detalhe?.id) return;
    if (!funcionarioId) {
      toast.error('Selecione um funcionário responsável pela mediação.');
      return;
    }

    setCriandoMediacao(true);
    try {
      await api.post('/admin/mediations', {
        interest_id: detalhe.id,
        employee_id: Number(funcionarioId),
        prioridade,
      });
      toast.success('Mediação iniciada com sucesso.');
      setDetalhe(null);
      setFuncionarioId('');
      setPrioridade('media');
      carregar();
    } catch (erro) {
      toast.error(`Erro ao iniciar mediação: ${extrairErro(erro)}`);
    } finally {
      setCriandoMediacao(false);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Interesses"
        subtitulo="Centralize o primeiro contacto dos investidores e converta apenas os casos qualificados em processos formais de mediação."
        acoes={<BotaoAtualizar onClick={carregar} loading={carregando} />}
      />

      <GradeResumo>
        <ResumoCard icone={<UserRound size={18} />} titulo="Interesses registados" valor={resumo.total} />
        <ResumoCard icone={<MessageSquare size={18} />} titulo="Pendentes" valor={resumo.pendentes} cor="var(--amarelo-100)" destaque="var(--amarelo)" />
        <ResumoCard icone={<GitMerge size={18} />} titulo="Em tratamento" valor={resumo.emMediacao} cor="var(--ciano-100)" destaque="var(--ciano)" />
        <ResumoCard icone={<ShieldCheck size={18} />} titulo="Aprovados" valor={resumo.aprovados} cor="var(--verde-100)" destaque="var(--verde)" />
      </GradeResumo>

      <BarraFerramentas
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        filtros={(
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Estado do interesse</label>
            <select className="form-select" value={estado} onChange={(event) => setEstado(event.target.value)}>
              {opcoesEstado.map((opcao) => (
                <option key={opcao.valor || 'todos'} value={opcao.valor}>{opcao.etiqueta}</option>
              ))}
            </select>
          </div>
        )}
      />

      {!lista.length && !carregando ? (
        <LinhaVazia titulo="Sem interesses" descricao="Os sinais de interesse dos investidores vão aparecer aqui para análise da equipa." />
      ) : (
        <TabelaModulo colunas={['Investidor', 'Oportunidade', 'Empresa', 'Valor', 'Estado', 'Data', 'Ações']}>
          {lista.map((item) => (
            <tr key={item.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{item.nome_investidor}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{item.email_investidor || 'Sem e-mail'}</div>
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>{item.titulo || 'Oportunidade sem título'}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{item.tipo || 'Sem tipo'}</div>
              </td>
              <td>{item.nome_empresa || 'Empresa não informada'}</td>
              <td>{formatarMoeda(item.valor || 0, item.moeda || 'AOA')}</td>
              <td><BadgeModulo tonalidade={badgeEstado(item.status)}>{item.status || 'pendente'}</BadgeModulo></td>
              <td style={{ color: 'var(--txt-3)' }}>{formatarDataHora(item.created_at)}</td>
              <td>
                <button className="btn btn--secondary btn--sm" onClick={() => setDetalhe(item)}>
                  <Eye size={14} /> Ver
                </button>
              </td>
            </tr>
          ))}
        </TabelaModulo>
      )}

      <Modal isOpen={Boolean(detalhe)} onClose={() => setDetalhe(null)} title="Análise do interesse" size="lg">
        {detalhe ? (
          <ModalBloco titulo={detalhe.titulo || 'Interesse de investimento'} subtitulo="Confirme contexto, valor e responsável interno antes de acionar a mediação.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem', marginBottom: 4 }}>Investidor</div>
                <div style={{ fontWeight: 700 }}>{detalhe.nome_investidor}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem', marginTop: 4 }}>{detalhe.email_investidor}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem', marginBottom: 4 }}>Empresa</div>
                <div style={{ fontWeight: 700 }}>{detalhe.nome_empresa}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem', marginBottom: 4 }}>Valor de referência</div>
                <div style={{ fontWeight: 700 }}>{formatarMoeda(detalhe.valor || 0, detalhe.moeda || 'AOA')}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem', marginBottom: 4 }}>Estado</div>
                <BadgeModulo tonalidade={badgeEstado(detalhe.status)}>{detalhe.status || 'pendente'}</BadgeModulo>
              </Painel>
            </div>

            <Painel style={{ background: 'var(--bg-2)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Mensagem do investidor</div>
              <div style={{ color: 'var(--txt-2)', lineHeight: 1.7 }}>{detalhe.mensagem || 'Sem mensagem adicional.'}</div>
            </Painel>

            {String(detalhe.status).toLowerCase() === 'pendente' ? (
              <Painel>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>Transformar em mediação</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Funcionário mediador</label>
                    <select className="form-select" value={funcionarioId} onChange={(event) => setFuncionarioId(event.target.value)}>
                      <option value="">Selecione um responsável</option>
                      {funcionarios.map((funcionario) => (
                        <option key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome} · {funcionario.cargo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Prioridade</label>
                    <select className="form-select" value={prioridade} onChange={(event) => setPrioridade(event.target.value)}>
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button className="btn btn--primary" onClick={iniciarMediacao} disabled={criandoMediacao}>
                    <GitMerge size={16} /> Iniciar mediação
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

export default InteressesInvestidores;
