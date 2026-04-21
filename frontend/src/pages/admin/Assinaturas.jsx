import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Eye,
  Layers3,
  PlusCircle,
  ShieldCheck,
  XCircle,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/ui';
import { adminAPI, BACKEND_BASE_URL, extrairErro } from '../../services/api';
import {
  badgeEstado,
  BadgeModulo,
  BarraFerramentas,
  BotaoAtualizar,
  formatarData,
  formatarMoeda,
  GradeResumo,
  lerLista,
  LinhaVazia,
  ModalBloco,
  PaginaModulo,
  Painel,
  ResumoCard,
  TabelaModulo,
} from './module7-ui.jsx';

const SLUGS_PREDEFINIDOS = [
  { valor: 'basico', label: 'Básico' },
  { valor: 'profissional', label: 'Profissional' },
  { valor: 'empresarial', label: 'Empresarial' },
  { valor: 'premium', label: 'Premium' },
  { valor: 'starter', label: 'Starter' },
  { valor: 'enterprise', label: 'Enterprise' },
];

const valoresIniciaisPacote = {
  slug: '',
  nome: '',
  package_category: 'empresa',
  target_role: 'company',
  descricao: '',
  preco: '',
  moeda: 'AOA',
  duracao_meses: 1,
  duracao_dias: 30,
  consultorias_incluidas: 0,
  consultation_recharge_credits: 0,
  max_oportunidades_ativas: 3,
  max_vagas_ativas: 2,
  publicacoes_oportunidades_ilimitadas: false,
  publicacoes_vagas_ilimitadas: false,
  suporte_prioritario: false,
  beneficios: '',
  ordem: 0,
};

const normalizarBeneficios = (beneficios) => {
  if (Array.isArray(beneficios)) return beneficios;
  if (typeof beneficios === 'string') {
    try {
      const parsed = JSON.parse(beneficios);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const Assinaturas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [pacotes, setPacotes] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [abaActiva, setAbaActiva] = useState('pacotes');
  const [filtroPacotes, setFiltroPacotes] = useState('todos');
  const [filtroSolicitacoes, setFiltroSolicitacoes] = useState('todos');
  const [filtroEmpresas, setFiltroEmpresas] = useState('todos');
  const [modalPacote, setModalPacote] = useState(false);
  const [modalEmpresa, setModalEmpresa] = useState(null);
  const [modalAssinatura, setModalAssinatura] = useState(null);
  const [assinaturaAnalisada, setAssinaturaAnalisada] = useState(null);
  const [modalEliminarAssinatura, setModalEliminarAssinatura] = useState(null);
  const [assinaturaParaEliminar, setAssinaturaParaEliminar] = useState(null);
  const [eliminandoAssinatura, setEliminandoAssinatura] = useState(false);
  const [modalEliminarPacote, setModalEliminarPacote] = useState(false);
  const [pacoteParaEliminar, setPacoteParaEliminar] = useState(null);
  const [eliminandoPacote, setEliminandoPacote] = useState(false);
  const [pacoteEdicao, setPacoteEdicao] = useState(null);
  const [formularioPacote, setFormularioPacote] = useState(valoresIniciaisPacote);
  const [salvandoPacote, setSalvandoPacote] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const resultados = await Promise.allSettled([
      adminAPI.empresas({ limite: 50 }),
      adminAPI.pacotesAssinatura({ limit: 100 }),
      adminAPI.assinaturasEmpresas({ limit: 100 }),
    ]);

    const [resEmpresas, resPacotes, resSolicitacoes] = resultados;

    if (resEmpresas.status === 'fulfilled') {
      setEmpresas(lerLista(resEmpresas.value.data, 'empresas'));
    } else {
      setEmpresas([]);
      toast.error(`Erro ao carregar empresas: ${extrairErro(resEmpresas.reason)}`);
    }

    if (resPacotes.status === 'fulfilled') {
      setPacotes(lerLista(resPacotes.value.data, 'pacotes'));
    } else {
      setPacotes([]);
      toast.error(`Erro ao carregar pacotes: ${extrairErro(resPacotes.reason)}`);
    }

    if (resSolicitacoes.status === 'fulfilled') {
      setSolicitacoes(lerLista(resSolicitacoes.value.data, 'assinaturas'));
    } else {
      setSolicitacoes([]);
      toast.error(`Erro ao carregar solicitações: ${extrairErro(resSolicitacoes.reason)}`);
    }

    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const resumo = useMemo(() => ({
    pacotesAtivos: pacotes.filter((item) => item.status === 'ativo').length,
    pacotesPendentes: pacotes.filter((item) => item.status === 'pendente').length,
    assinaturasPendentes: solicitacoes.filter((item) => item.status === 'pendente').length,
    assinaturasAtivas: solicitacoes.filter((item) => item.status === 'ativa').length,
  }), [pacotes, solicitacoes]);

  const listaPacotes = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    return pacotes.filter((item) => {
      const batePesquisa = !termo || [item.nome, item.slug, item.status, item.descricao]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo));
      const bateEstado = filtroPacotes === 'todos' || item.status === filtroPacotes;
      return batePesquisa && bateEstado;
    });
  }, [pacotes, pesquisa, filtroPacotes]);

  const listaSolicitacoes = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    return solicitacoes.filter((item) => {
      const batePesquisa = !termo || [item.nome_empresa, item.representante_nome, item.representante_email, item.pacote_nome, item.status]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo));
      const bateEstado = filtroSolicitacoes === 'todos' || item.status === filtroSolicitacoes;
      return batePesquisa && bateEstado;
    });
  }, [solicitacoes, pesquisa, filtroSolicitacoes]);

  const listaEmpresasSemAssinatura = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    return empresas
      .filter((empresa) => !empresa.sub_status)
      .filter((empresa) => {
        const batePesquisa = !termo || [empresa.nome_empresa, empresa.email, empresa.estado, empresa.nif]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(termo));
        const bateEstado = filtroEmpresas === 'todos' || empresa.estado === filtroEmpresas;
        return batePesquisa && bateEstado;
      });
  }, [empresas, pesquisa, filtroEmpresas]);

  const calcularDiasDeMeses = (meses) => {
    return Math.round(Number(meses || 0) * 30.44); // Média de dias por mês (365.25/12)
  };

  const calcularMesesDeDias = (dias) => {
    return Math.round(Number(dias || 0) / 30.44);
  };

  const handleMesesChange = (meses) => {
    const mesesNum = Number(meses || 0);
    const diasCalculados = calcularDiasDeMeses(mesesNum);
    setFormularioPacote((atual) => ({
      ...atual,
      duracao_meses: mesesNum,
      duracao_dias: diasCalculados,
    }));
  };

  const handleDiasChange = (dias) => {
    const diasNum = Number(dias || 0);
    const mesesCalculados = calcularMesesDeDias(diasNum);
    setFormularioPacote((atual) => ({
      ...atual,
      duracao_dias: diasNum,
      duracao_meses: mesesCalculados,
    }));
  };

  const abrirCriacaoPacote = () => {
    setPacoteEdicao(null);
    setFormularioPacote(valoresIniciaisPacote);
    setModalPacote(true);
  };

  const abrirEdicaoPacote = (pacote) => {
    setPacoteEdicao(pacote);
    const ehConsultoria = pacote.package_category === 'consultoria' || pacote.package_category === 'recarga_consultoria';
    setFormularioPacote({
      slug: pacote.slug || '',
      nome: pacote.nome || '',
      package_category: pacote.package_category || 'empresa',
      target_role: pacote.target_role || 'company',
      descricao: pacote.descricao || '',
      preco: pacote.preco || '',
      moeda: pacote.moeda || 'AOA',
      duracao_meses: pacote.duracao_meses || 1,
      duracao_dias: pacote.duracao_dias || 30,
      consultorias_incluidas: pacote.consultorias_incluidas || 0,
      consultation_recharge_credits: pacote.consultation_recharge_credits || 0,
      // Para consultoria, oportunidades e vagas não são usadas
      max_oportunidades_ativas: ehConsultoria ? 0 : (pacote.max_oportunidades_ativas || 0),
      max_vagas_ativas: ehConsultoria ? 0 : (pacote.max_vagas_ativas || 0),
      publicacoes_oportunidades_ilimitadas: ehConsultoria ? false : Boolean(pacote.publicacoes_oportunidades_ilimitadas),
      publicacoes_vagas_ilimitadas: ehConsultoria ? false : Boolean(pacote.publicacoes_vagas_ilimitadas),
      suporte_prioritario: Boolean(pacote.suporte_prioritario),
      beneficios: normalizarBeneficios(pacote.beneficios).join('\n'),
      ordem: pacote.ordem || 0,
    });
    setModalPacote(true);
  };

  const guardarPacote = async () => {
    if (salvandoPacote) return; // Prevenir duplo clique
    if (!formularioPacote.slug.trim() || !formularioPacote.nome.trim()) {
      toast.error('Slug e nome do pacote são obrigatórios.');
      return;
    }
    setSalvandoPacote(true);

    const ehConsultoria = formularioPacote.package_category === 'consultoria' || formularioPacote.package_category === 'recarga_consultoria';

    const payload = {
      ...formularioPacote,
      preco: Number(formularioPacote.preco || 0),
      duracao_meses: Number(formularioPacote.duracao_meses || 1),
      duracao_dias: Number(formularioPacote.duracao_dias || 30),
      consultorias_incluidas: Number(formularioPacote.consultorias_incluidas || 0),
      consultation_recharge_credits: Number(formularioPacote.consultation_recharge_credits || 0),
      // Para consultoria, oportunidades e vagas devem ser 0
      max_oportunidades_ativas: ehConsultoria ? 0 : Number(formularioPacote.max_oportunidades_ativas || 0),
      max_vagas_ativas: ehConsultoria ? 0 : Number(formularioPacote.max_vagas_ativas || 0),
      publicacoes_oportunidades_ilimitadas: ehConsultoria ? false : formularioPacote.publicacoes_oportunidades_ilimitadas,
      publicacoes_vagas_ilimitadas: ehConsultoria ? false : formularioPacote.publicacoes_vagas_ilimitadas,
      ordem: Number(formularioPacote.ordem || 0),
      beneficios: formularioPacote.beneficios
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      if (pacoteEdicao?.id) {
        await adminAPI.atualizarPacoteAssinatura(pacoteEdicao.id, payload);
        const msgAtualizado = (() => {
          const cats = { empresa: 'empresarial', consultoria: 'de consultoria', recarga_consultoria: 'de recarga de consultoria' };
          return `Pacote ${cats[formularioPacote.package_category] || ''} actualizado com sucesso.`;
        })();
        toast.success(msgAtualizado);
      } else {
        const { data } = await adminAPI.criarPacoteAssinatura(payload);
        const msgCriado = (() => {
          const cats = { empresa: 'empresarial', consultoria: 'de consultoria', recarga_consultoria: 'de recarga de consultoria' };
          return data?.mensagem?.replace('Pacote', `Pacote ${cats[formularioPacote.package_category] || ''}`) || `Pacote ${cats[formularioPacote.package_category] || ''} criado com sucesso.`;
        })();
        toast.success(msgCriado);
      }
      setModalPacote(false);
      setPacoteEdicao(null);
      setFormularioPacote(valoresIniciaisPacote);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao guardar pacote: ${extrairErro(erro)}`);
    } finally {
      setSalvandoPacote(false);
    }
  };

  const processarPacote = async (pacote, aprovado) => {
    try {
      if (aprovado) {
        await adminAPI.aprovarPacoteAssinatura(pacote.id, { aprovado: true });
        toast.success('Pacote aprovado.');
      } else {
        const motivo = window.prompt('Indique o motivo da rejeição do pacote:') || '';
        if (!motivo.trim()) {
          toast.error('O motivo da rejeição é obrigatório.');
          return;
        }
        await adminAPI.rejeitarPacoteAssinatura(pacote.id, motivo.trim());
        toast.success('Pacote rejeitado.');
      }
      carregar();
    } catch (erro) {
      toast.error(`Erro ao processar pacote: ${extrairErro(erro)}`);
    }
  };

  const eliminarPacote = async () => {
    if (!pacoteParaEliminar) return;
    setEliminandoPacote(true);
    try {
      await adminAPI.eliminarPacoteAssinatura(pacoteParaEliminar.id);
      toast.success('Pacote eliminado com sucesso.');
      setModalEliminarPacote(false);
      setPacoteParaEliminar(null);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao eliminar pacote: ${extrairErro(erro)}`);
    } finally {
      setEliminandoPacote(false);
    }
  };

  const abrirAssinatura = (assinatura) => {
    setAssinaturaAnalisada(assinatura);
    setModalAssinatura(true);
  };

  const visualizarComprovativo = async (assinatura) => {
    try {
      const { data } = await adminAPI.verComprovativoAssinatura(assinatura.id);
      const url = data?.dados?.url;
      const visualizadoEm = data?.dados?.visualizado_em;

      if (!url) {
        toast.error('Comprovativo não encontrado.');
        return;
      }

      window.open(`${BACKEND_BASE_URL}${url}`, '_blank', 'noopener,noreferrer');

      setAssinaturaAnalisada((atual) => (
        atual?.id === assinatura.id
          ? { ...atual, comprovante_url: url, comprovante_visualizado_em: visualizadoEm }
          : atual
      ));

      setSolicitacoes((atuais) => atuais.map((item) => (
        item.id === assinatura.id
          ? { ...item, comprovante_url: url, comprovante_visualizado_em: visualizadoEm }
          : item
      )));
    } catch (erro) {
      toast.error(`Erro ao visualizar comprovativo: ${extrairErro(erro)}`);
    }
  };

  const processarSolicitacao = async (assinatura, aprovado) => {
    // Verificar se comprovativo foi visualizado
    if (assinatura.pagamento_status !== 'confirmado' && !assinatura.comprovante_url) {
      toast.error('Não é possível aprovar sem antes visualizar o comprovativo de pagamento.');
      return;
    }
    try {
      if (aprovado) {
        await adminAPI.aprovarAssinaturaEmpresa(assinatura.id);
        toast.success('Assinatura activada com sucesso.');
      } else {
        const motivo = window.prompt('Motivo da rejeição da assinatura:') || '';
        if (!motivo.trim()) {
          toast.error('O motivo da rejeição é obrigatório.');
          return;
        }
        await adminAPI.rejeitarAssinaturaEmpresa(assinatura.id, { motivo: motivo.trim() });
        toast.success('Assinatura rejeitada.');
      }
      setModalAssinatura(false);
      setAssinaturaAnalisada(null);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao processar solicitação: ${extrairErro(erro)}`);
    }
  };

  const eliminarAssinatura = async () => {
    if (!assinaturaParaEliminar) return;
    setEliminandoAssinatura(true);
    try {
      await adminAPI.eliminarAssinaturaEmpresa(assinaturaParaEliminar.id);
      toast.success('Assinatura eliminada com sucesso.');
      setModalEliminarAssinatura(false);
      setAssinaturaParaEliminar(null);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao eliminar assinatura: ${extrairErro(erro)}`);
    } finally {
      setEliminandoAssinatura(false);
    }
  };

  const abrirEmpresa = async (empresa) => {
    try {
      const { data } = await adminAPI.empresaDetalhe(empresa.id);
      setModalEmpresa(data?.dados || null);
    } catch (erro) {
      toast.error(`Erro ao carregar detalhe da empresa: ${extrairErro(erro)}`);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Assinaturas"
        subtitulo="Gerencie pacotes, valide solicitações empresariais e controle o acesso das empresas através dos planos activos."
        acoes={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <BotaoAtualizar onClick={carregar} loading={carregando} />
            <button type="button" className="btn btn--primary btn--sm" onClick={abrirCriacaoPacote}>
              <PlusCircle size={14} /> Novo pacote
            </button>
          </div>
        }
      />

      <GradeResumo>
        <ResumoCard icone={<Layers3 size={18} />} titulo="Pacotes activos" valor={resumo.pacotesAtivos} />
        <ResumoCard icone={<ShieldCheck size={18} />} titulo="Pacotes pendentes" valor={resumo.pacotesPendentes} cor="var(--amarelo-100)" destaque="var(--amarelo)" />
        <ResumoCard icone={<CreditCard size={18} />} titulo="Assinaturas pendentes" valor={resumo.assinaturasPendentes} cor="var(--laranja-100)" destaque="var(--laranja)" />
        <ResumoCard icone={<BadgeCheck size={18} />} titulo="Assinaturas activas" valor={resumo.assinaturasAtivas} cor="var(--verde-100)" destaque="var(--verde)" />
      </GradeResumo>

      <BarraFerramentas pesquisa={pesquisa} onPesquisa={setPesquisa} />

      <Painel style={{ paddingBottom: 12, marginBottom: 18 }}>
        <div className="tabs" style={{ margin: 0, borderBottom: 'none', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className={`tab-btn${abaActiva === 'pacotes' ? ' active' : ''}`} onClick={() => setAbaActiva('pacotes')}>
            Catálogo de pacotes
          </button>
          <button type="button" className={`tab-btn${abaActiva === 'solicitacoes' ? ' active' : ''}`} onClick={() => setAbaActiva('solicitacoes')}>
            Solicitações de assinatura das empresas
          </button>
          <button type="button" className={`tab-btn${abaActiva === 'empresas' ? ' active' : ''}`} onClick={() => setAbaActiva('empresas')}>
            Empresas sem assinatura activa
          </button>
        </div>
      </Painel>

      {abaActiva === 'pacotes' && (
        <Painel>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800 }}>Catálogo de pacotes</div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 220 }}>
              <label className="form-label">Estado do pacote</label>
              <select className="form-select" value={filtroPacotes} onChange={(event) => setFiltroPacotes(event.target.value)}>
                <option value="todos">Todos</option>
                <option value="ativo">Activos</option>
                <option value="pendente">Pendentes</option>
                <option value="inativo">Inactivos</option>
                <option value="rejeitado">Rejeitados</option>
              </select>
            </div>
          </div>

          {!listaPacotes.length && !carregando ? (
            <LinhaVazia titulo="Sem pacotes" descricao="Crie o primeiro pacote de assinatura para começar a controlar privilégios empresariais." />
          ) : (
            <TabelaModulo colunas={['Pacote', 'Preço', 'Duração', 'Privilégios', 'Estado', 'Ações']}>
              {listaPacotes.map((pacote) => (
                <tr key={pacote.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{pacote.nome}</div>
                    <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{pacote.slug}</div>
                  </td>
                  <td>{formatarMoeda(pacote.preco, pacote.moeda)}</td>
                  <td>{pacote.duracao_meses} mês(es)</td>
                  <td style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>
                    {pacote.package_category !== 'consultoria' && pacote.package_category !== 'recarga_consultoria' && (
                      <>
                        {pacote.publicacoes_oportunidades_ilimitadas ? 'Oportunidades ilimitadas' : `${pacote.max_oportunidades_ativas} oportunidades`}
                        <br />
                        {pacote.publicacoes_vagas_ilimitadas ? 'Vagas ilimitadas' : `${pacote.max_vagas_ativas} vagas`}
                        <br />
                      </>
                    )}
                    {pacote.consultorias_incluidas || 0} consultoria(s)
                  </td>
                  <td><BadgeModulo tonalidade={badgeEstado(pacote.status)}>{pacote.status}</BadgeModulo></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn--secondary btn--sm" onClick={() => abrirEdicaoPacote(pacote)}>
                        <Eye size={14} /> Ver
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ color: 'var(--vermelho)' }}
                        onClick={() => { setPacoteParaEliminar(pacote); setModalEliminarPacote(true); }}
                        title="Eliminar pacote"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                      {pacote.status === 'pendente' && (
                        <>
                          <button type="button" className="btn btn--primary btn--sm" onClick={() => processarPacote(pacote, true)}>
                            <CheckCircle2 size={14} /> Aprovar
                          </button>
                          <button type="button" className="btn btn--ghost btn--sm" style={{ color: 'var(--vermelho)' }} onClick={() => processarPacote(pacote, false)}>
                            <XCircle size={14} /> Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </TabelaModulo>
          )}
        </Painel>
      )}

      {abaActiva === 'solicitacoes' && (
        <Painel>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800 }}>Solicitações de assinatura das empresas</div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 220 }}>
              <label className="form-label">Estado da solicitação</label>
              <select className="form-select" value={filtroSolicitacoes} onChange={(event) => setFiltroSolicitacoes(event.target.value)}>
                <option value="todos">Todos</option>
                <option value="pendente">Pendentes</option>
                <option value="ativa">Activas</option>
                <option value="cancelada">Rejeitadas/Canceladas</option>
                <option value="expirada">Expiradas</option>
                <option value="vencida">Vencidas</option>
              </select>
            </div>
          </div>

          {!listaSolicitacoes.length && !carregando ? (
            <LinhaVazia titulo="Sem solicitações" descricao="Quando uma empresa escolher um pacote, a solicitação aparecerá aqui para análise." />
          ) : (
            <TabelaModulo colunas={['Empresa', 'Pacote', 'Pagamento', 'Estado', 'Período', 'Ações']}>
              {listaSolicitacoes.map((assinatura) => (
                <tr key={assinatura.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{assinatura.nome_empresa}</div>
                    <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{assinatura.representante_nome} • {assinatura.representante_email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{assinatura.pacote_nome || assinatura.tipo_plano || 'Sem pacote'}</div>
                    <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{formatarMoeda(assinatura.valor_pago, assinatura.moeda)}</div>
                  </td>
                  <td style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>
                    <div>{assinatura.metodo_pagamento || 'referência'}</div>
                    <div>Ref.: {assinatura.referencia_pagamento || 'a gerar'}</div>
                    <div>Pagamento: {assinatura.pagamento_status || 'pendente'}</div>
                  </td>
                  <td><BadgeModulo tonalidade={badgeEstado(assinatura.status)}>{assinatura.status}</BadgeModulo></td>
                  <td style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>
                    {formatarData(assinatura.data_inicio)} até {formatarData(assinatura.data_fim)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn--secondary btn--sm" onClick={() => abrirAssinatura(assinatura)}>
                        <Eye size={14} /> Analisar
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ color: 'var(--vermelho)' }}
                        onClick={() => { setAssinaturaParaEliminar(assinatura); setModalEliminarAssinatura(true); }}
                        title="Eliminar assinatura"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                      {assinatura.status === 'pendente' && (
                        <>
                          <button type="button" className="btn btn--primary btn--sm" onClick={() => abrirAssinatura(assinatura)}>
                            <CheckCircle2 size={14} /> Activar
                          </button>
                          <button type="button" className="btn btn--ghost btn--sm" style={{ color: 'var(--vermelho)' }} onClick={() => abrirAssinatura(assinatura)}>
                            <XCircle size={14} /> Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </TabelaModulo>
          )}
        </Painel>
      )}

      {abaActiva === 'empresas' && (
        <Painel>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800 }}>Empresas sem assinatura activa</div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 220 }}>
              <label className="form-label">Estado da empresa</label>
              <select className="form-select" value={filtroEmpresas} onChange={(event) => setFiltroEmpresas(event.target.value)}>
                <option value="todos">Todos</option>
                <option value="pendente">Pendentes</option>
                <option value="aprovada">Aprovadas</option>
                <option value="rejeitada">Rejeitadas</option>
              </select>
            </div>
          </div>

          {!listaEmpresasSemAssinatura.length && !carregando ? (
            <LinhaVazia titulo="Sem pendências" descricao="Todas as empresas carregadas têm pelo menos um registo de assinatura associado." />
          ) : (
            <TabelaModulo colunas={['Empresa', 'Estado', 'Documentos', 'Último ciclo', 'Ações']}>
              {listaEmpresasSemAssinatura.map((empresa) => (
                <tr key={empresa.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{empresa.nome_empresa}</div>
                    <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{empresa.email || 'Sem e-mail'}</div>
                  </td>
                  <td><BadgeModulo tonalidade={badgeEstado(empresa.estado)}>{empresa.estado}</BadgeModulo></td>
                  <td>{empresa.num_documentos || empresa.total_docs || 0} documento(s)</td>
                  <td style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{empresa.sub_data_fim ? formatarData(empresa.sub_data_fim) : 'Sem ciclo activo'}</td>
                  <td>
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => abrirEmpresa(empresa)}>
                      <Eye size={14} /> Ver empresa
                    </button>
                  </td>
                </tr>
              ))}
            </TabelaModulo>
          )}
        </Painel>
      )}

      <Modal aberto={modalPacote} onFechar={() => setModalPacote(false)} titulo={pacoteEdicao ? 'Editar pacote' : 'Novo pacote de assinatura'} largura={960}>
        <ModalBloco
          titulo={pacoteEdicao ? 'Actualizar pacote' : (() => {
            const cats = { empresa: 'empresarial', consultoria: 'de consultoria', recarga_consultoria: 'de recarga de consultoria' };
            return `Criar pacote ${cats[formularioPacote.package_category] || 'empresarial'}`;
          })()}
          subtitulo={(() => {
            const subs = {
              empresa: 'Defina duração, limites, consultorias e privilégios operacionais que a empresa terá enquanto a assinatura estiver activa.',
              consultoria: 'Defina o plano específico para empresas de consultoria: duração, agenda e privilégios de atendimento.',
              recarga_consultoria: 'Defina o pacote de recarga de créditos de consultoria: quantidade, valor unitário e período de validade.'
            };
            return subs[formularioPacote.package_category] || subs.empresa;
          })()}
        >
          {(() => {
            const cat = formularioPacote.package_category;
            const ehEmpresa = cat === 'empresa';
            const ehConsultoria = cat === 'consultoria';
            const ehRecarga = cat === 'recarga_consultoria';
            return (
              <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Slug</label>
              <select
                className="form-select"
                value={formularioPacote.slug}
                onChange={(event) => setFormularioPacote((atual) => ({ ...atual, slug: event.target.value }))}
              >
                <option value="">Selecione o tipo de pacote</option>
                {SLUGS_PREDEFINIDOS.map((slug) => (
                  <option key={slug.valor} value={slug.valor}>
                    {slug.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome do pacote</label>
              <input className="form-input" value={formularioPacote.nome} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, nome: event.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Categoria do pacote</label>
              <select
                className="form-select"
                value={formularioPacote.package_category}
                onChange={(event) => {
                  const categoria = event.target.value;
                  // Define target_role padrão baseado na categoria
                  const targetPorCategoria = {
                    empresa: 'company',
                    consultoria: 'consultancy',
                    recarga_consultoria: 'all'
                  };
                  const ehConsultoria = categoria === 'consultoria' || categoria === 'recarga_consultoria';
                  setFormularioPacote((atual) => ({
                    ...atual,
                    package_category: categoria,
                    target_role: targetPorCategoria[categoria] || atual.target_role,
                    // Para consultoria, oportunidades e vagas não são usadas
                    max_oportunidades_ativas: ehConsultoria ? 0 : atual.max_oportunidades_ativas,
                    max_vagas_ativas: ehConsultoria ? 0 : atual.max_vagas_ativas,
                    publicacoes_oportunidades_ilimitadas: ehConsultoria ? false : atual.publicacoes_oportunidades_ilimitadas,
                    publicacoes_vagas_ilimitadas: ehConsultoria ? false : atual.publicacoes_vagas_ilimitadas,
                  }));
                }}
              >
                <option value="empresa">Assinatura empresarial</option>
                <option value="consultoria">Assinatura de consultoria</option>
                <option value="recarga_consultoria">Recarga de consultoria</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Perfil alvo</label>
              <select className="form-select" value={formularioPacote.target_role} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, target_role: event.target.value }))}>
                <option value="company">Empresa</option>
                <option value="consultancy">Consultoria</option>
                <option value="investor">Investidor</option>
                <option value="all">Todos</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Preço</label>
              <input type="number" min="0" className="form-input" value={formularioPacote.preco} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, preco: event.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Moeda</label>
              <input className="form-input" value={formularioPacote.moeda} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, moeda: event.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Duração (meses)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formularioPacote.duracao_meses}
                onChange={(event) => handleMesesChange(event.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Duração (dias)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formularioPacote.duracao_dias}
                onChange={(event) => handleDiasChange(event.target.value)}
              />
            </div>
            {ehEmpresa && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Consultorias incluídas (para solicitar)</label>
                  <input type="number" min="0" className="form-input" value={formularioPacote.consultorias_incluidas} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, consultorias_incluidas: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Máx. oportunidades activas</label>
                  <input type="number" min="0" className="form-input" value={formularioPacote.max_oportunidades_ativas} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, max_oportunidades_ativas: event.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Máx. vagas activas</label>
                  <input type="number" min="0" className="form-input" value={formularioPacote.max_vagas_ativas} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, max_vagas_ativas: event.target.value }))} />
                </div>
              </>
            )}
            {ehConsultoria && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Consultorias incluídas (para solicitar)</label>
                <input type="number" min="0" className="form-input" value={formularioPacote.consultorias_incluidas} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, consultorias_incluidas: event.target.value }))} />
              </div>
            )}
            {ehRecarga && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Créditos de recarga (quantidade)</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formularioPacote.consultation_recharge_credits}
                  onChange={(event) => setFormularioPacote((atual) => ({ ...atual, consultation_recharge_credits: event.target.value }))}
                />
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ordem no catálogo</label>
              <input type="number" min="0" className="form-input" value={formularioPacote.ordem} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, ordem: event.target.value }))} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Descrição</label>
            <textarea className="form-textarea" rows={3} value={formularioPacote.descricao} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, descricao: event.target.value }))} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Benefícios extras (uma linha por item)</label>
            <textarea className="form-textarea" rows={4} value={formularioPacote.beneficios} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, beneficios: event.target.value }))} />
          </div>

          {ehEmpresa && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <label className="checkbox" style={{ marginBottom: 0 }}>
                <input type="checkbox" checked={formularioPacote.publicacoes_oportunidades_ilimitadas} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, publicacoes_oportunidades_ilimitadas: event.target.checked }))} />
                <span>Oportunidades ilimitadas</span>
              </label>
              <label className="checkbox" style={{ marginBottom: 0 }}>
                <input type="checkbox" checked={formularioPacote.publicacoes_vagas_ilimitadas} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, publicacoes_vagas_ilimitadas: event.target.checked }))} />
                <span>Vagas ilimitadas</span>
              </label>
              <label className="checkbox" style={{ marginBottom: 0 }}>
                <input type="checkbox" checked={formularioPacote.suporte_prioritario} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, suporte_prioritario: event.target.checked }))} />
                <span>Suporte prioritário</span>
              </label>
            </div>
          )}

          {ehConsultoria && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <label className="checkbox" style={{ marginBottom: 0 }}>
                <input type="checkbox" checked={formularioPacote.suporte_prioritario} onChange={(event) => setFormularioPacote((atual) => ({ ...atual, suporte_prioritario: event.target.checked }))} />
                <span>Suporte prioritário</span>
              </label>
              <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem', padding: '8px 0' }}>
                <strong>Nota:</strong> Empresas de consultoria têm acesso a agenda semanal e dashboard de solicitações.
              </div>
            </div>
          )}

          {ehRecarga && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12, color: 'var(--txt-2)', fontSize: '0.84rem' }}>
              <strong>Resumo da recarga:</strong>
              <div style={{ marginTop: 8 }}>
                • Quantidade: {formularioPacote.consultation_recharge_credits || 0} créditos
                <br/>
                • Valor unitário estimado: {formularioPacote.preco && formularioPacote.consultation_recharge_credits ? (Number(formularioPacote.preco) / Number(formularioPacote.consultation_recharge_credits)).toFixed(2) : '—'} {formularioPacote.moeda}
                <br/>
                • Perfil alvo: {formularioPacote.target_role === 'all' ? 'Todos (empresas e investidores)' : formularioPacote.target_role}
              </div>
            </div>
          )}

              </>
            );
          })()}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn--secondary" onClick={() => setModalPacote(false)}>Cancelar</button>
            <button type="button" className="btn btn--primary" onClick={guardarPacote} disabled={salvandoPacote}>
              <PlusCircle size={14} /> {salvandoPacote ? 'A guardar...' : (pacoteEdicao ? 'Actualizar pacote' : 'Guardar pacote')}
            </button>
          </div>
        </ModalBloco>
      </Modal>

      <Modal aberto={Boolean(modalEmpresa)} onFechar={() => setModalEmpresa(null)} titulo="Detalhe da empresa" largura={880}>
        {modalEmpresa?.empresa ? (
          <ModalBloco
            titulo={modalEmpresa.empresa.nome_empresa}
            subtitulo="Valide documentação, estado da empresa e histórico de assinaturas antes de decidir."
          >
            <Painel style={{ background: 'var(--bg-2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Representante</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{modalEmpresa.empresa.nome || 'Não informado'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Estado</div>
                  <div style={{ marginTop: 4 }}><BadgeModulo tonalidade={badgeEstado(modalEmpresa.empresa.estado)}>{modalEmpresa.empresa.estado}</BadgeModulo></div>
                </div>
                <div>
                  <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Documentos</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{modalEmpresa.documentos?.length || 0}</div>
                </div>
              </div>
            </Painel>

            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Histórico de assinaturas</div>
              {(modalEmpresa.assinaturas || []).length ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {modalEmpresa.assinaturas.map((assinatura) => (
                    <Painel key={assinatura.id} style={{ background: 'var(--bg-2)', padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{assinatura.tipo_plano || assinatura.plano || 'Plano'}</div>
                          <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>
                            {formatarData(assinatura.data_inicio)} até {formatarData(assinatura.data_fim)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <BadgeModulo tonalidade={badgeEstado(assinatura.status)}>{assinatura.status}</BadgeModulo>
                          <div style={{ marginTop: 6, fontWeight: 700 }}>{formatarMoeda(assinatura.valor_pago || assinatura.valor || 0, assinatura.moeda || 'AOA')}</div>
                        </div>
                      </div>
                    </Painel>
                  ))}
                </div>
              ) : (
                <LinhaVazia titulo="Sem histórico" descricao="A empresa ainda não tem ciclos de assinatura registados." />
              )}
            </Painel>
          </ModalBloco>
        ) : null}
      </Modal>

      <Modal aberto={modalAssinatura} onFechar={() => setModalAssinatura(false)} titulo="Análise de assinatura" largura={720}>
        {assinaturaAnalisada ? (
          <ModalBloco
            titulo={assinaturaAnalisada.nome_empresa || 'Assinatura'}
            subtitulo="Verifique o comprovativo de pagamento e detalhes da assinatura antes de aprovar ou rejeitar."
          >
            <Painel style={{ background: 'var(--bg-2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Pacote</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{assinaturaAnalisada.pacote_nome || assinaturaAnalisada.tipo_plano || 'Sem pacote'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Valor</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{formatarMoeda(assinaturaAnalisada.valor_pago, assinaturaAnalisada.moeda)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Período</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{formatarData(assinaturaAnalisada.data_inicio)} até {formatarData(assinaturaAnalisada.data_fim)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Status Pagamento</div>
                  <div style={{ marginTop: 4 }}>
                    <BadgeModulo tonalidade={badgeEstado(assinaturaAnalisada.pagamento_status || 'pendente')}>
                      {assinaturaAnalisada.pagamento_status || 'pendente'}
                    </BadgeModulo>
                  </div>
                </div>
              </div>
            </Painel>

            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Comprovativo de pagamento</div>
              {assinaturaAnalisada.comprovante_url ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 8 }}>
                    <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem', marginBottom: 8 }}>Referência: {assinaturaAnalisada.referencia_pagamento || 'N/A'}</div>
                    <a
                      href="#"
                      className="btn btn--secondary btn--sm"
                      onClick={(event) => {
                        event.preventDefault();
                        visualizarComprovativo(assinaturaAnalisada);
                      }}
                    >
                      <Eye size={14} /> Visualizar comprovativo
                    </a>
                  </div>
                  <div style={{ color: assinaturaAnalisada.comprovante_visualizado_em ? 'var(--verde)' : 'var(--amarelo)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} />
                    {assinaturaAnalisada.comprovante_visualizado_em ? 'Comprovativo visualizado pela equipa administrativa' : 'Comprovativo anexado e pendente de visualização'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 8 }}>
                    <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>Referência: {assinaturaAnalisada.referencia_pagamento || 'a gerar'}</div>
                  </div>
                  <div style={{ color: 'var(--amarelo)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={14} /> Aguardando upload do comprovativo
                  </div>
                </div>
              )}
            </Painel>

            {assinaturaAnalisada.status === 'pendente' && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn--primary"
                    onClick={() => processarSolicitacao(assinaturaAnalisada, true)}
                    disabled={!assinaturaAnalisada.comprovante_url || !assinaturaAnalisada.comprovante_visualizado_em}
                  >
                    <CheckCircle2 size={16} /> Activar assinatura
                  </button>
                  <button
                    className="btn btn--danger"
                    onClick={() => processarSolicitacao(assinaturaAnalisada, false)}
                    disabled={!assinaturaAnalisada.comprovante_url || !assinaturaAnalisada.comprovante_visualizado_em}
                  >
                    <XCircle size={16} /> Rejeitar assinatura
                  </button>
                </div>
                {(!assinaturaAnalisada.comprovante_url || !assinaturaAnalisada.comprovante_visualizado_em) && (
                  <div style={{ color: 'var(--vermelho)', fontSize: '0.82rem' }}>
                    ⚠️ Não é possível aprovar sem o comprovativo de pagamento.
                  </div>
                )}
              </div>
            )}
          </ModalBloco>
        ) : null}
      </Modal>

      {/* Modal de confirmação de eliminação de assinatura */}
      <Modal
        aberto={modalEliminarAssinatura}
        onFechar={() => { setModalEliminarAssinatura(false); setAssinaturaParaEliminar(null); }}
        titulo="Eliminar assinatura"
        largura={480}
      >
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <AlertCircle size={28} color="var(--vermelho)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Confirma a eliminação?</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--txt-3)', fontSize: '0.9rem' }}>
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          {assinaturaParaEliminar && (
            <div style={{ background: 'var(--bg-2)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontWeight: 600 }}>{assinaturaParaEliminar.nome_empresa}</div>
              <div style={{ color: 'var(--txt-3)', fontSize: '0.85rem' }}>
                Pacote: {assinaturaParaEliminar.pacote_nome || assinaturaParaEliminar.tipo_plano || 'N/A'}<br/>
                Período: {formatarData(assinaturaParaEliminar.data_inicio)} até {formatarData(assinaturaParaEliminar.data_fim)}<br/>
                Estado: <BadgeModulo tonalidade={badgeEstado(assinaturaParaEliminar.status)}>{assinaturaParaEliminar.status}</BadgeModulo>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => { setModalEliminarAssinatura(false); setAssinaturaParaEliminar(null); }}
              disabled={eliminandoAssinatura}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`btn btn--danger${eliminandoAssinatura ? ' btn--loading' : ''}`}
              onClick={eliminarAssinatura}
              disabled={eliminandoAssinatura}
            >
              {!eliminandoAssinatura && <><Trash2 size={14} /> Sim, eliminar</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação de eliminação de pacote */}
      <Modal
        aberto={modalEliminarPacote}
        onFechar={() => { setModalEliminarPacote(false); setPacoteParaEliminar(null); }}
        titulo="Eliminar pacote"
        largura={480}
      >
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <AlertCircle size={28} color="var(--vermelho)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Confirma a eliminação?</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--txt-3)', fontSize: '0.9rem' }}>
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          {pacoteParaEliminar && (
            <div style={{ background: 'var(--bg-2)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontWeight: 600 }}>{pacoteParaEliminar.nome}</div>
              <div style={{ color: 'var(--txt-3)', fontSize: '0.85rem' }}>
                Slug: {pacoteParaEliminar.slug}<br/>
                Preço: {formatarMoeda(pacoteParaEliminar.preco, pacoteParaEliminar.moeda)}<br/>
                Duração: {pacoteParaEliminar.duracao_meses} mês(es)<br/>
                Estado: <BadgeModulo tonalidade={badgeEstado(pacoteParaEliminar.status)}>{pacoteParaEliminar.status}</BadgeModulo>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => { setModalEliminarPacote(false); setPacoteParaEliminar(null); }}
              disabled={eliminandoPacote}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`btn btn--danger${eliminandoPacote ? ' btn--loading' : ''}`}
              onClick={eliminarPacote}
              disabled={eliminandoPacote}
            >
              {!eliminandoPacote && <><Trash2 size={14} /> Sim, eliminar</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Assinaturas;
