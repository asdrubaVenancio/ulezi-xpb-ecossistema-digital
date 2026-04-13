import { Building2, CalendarClock, CheckCircle2, Eye, FileText, ShieldAlert, XCircle } from 'lucide-react';
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

const filtrosEstado = [
  { valor: '', etiqueta: 'Todos os estados' },
  { valor: 'pendente', etiqueta: 'Pendentes' },
  { valor: 'aprovada', etiqueta: 'Aprovadas' },
  { valor: 'rejeitada', etiqueta: 'Rejeitadas' },
];

const GestaoEmpresas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [contagens, setContagens] = useState({});
  const [pesquisa, setPesquisa] = useState('');
  const [estado, setEstado] = useState('');
  const [empresaActiva, setEmpresaActiva] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [aProcessar, setAProcessar] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data } = await adminAPI.empresas({
        status: estado || undefined,
        _ts: Date.now(),
      });
      const lista = lerLista(data, 'empresas');
      const resumo = lerObjeto(data, 'contagens');
      setEmpresas(lista);
      setContagens(resumo);
    } catch (erro) {
      toast.error(`Erro ao carregar empresas: ${extrairErro(erro)}`);
      setEmpresas([]);
      setContagens({});
    } finally {
      setCarregando(false);
    }
  }, [estado]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const empresasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return empresas;
    return empresas.filter((empresa) => (
      [
        empresa.nome_empresa,
        empresa.representante,
        empresa.email,
        empresa.nif,
        empresa.sector,
        empresa.provincia,
      ].filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo))
    ));
  }, [empresas, pesquisa]);

  const abrirDetalhe = async (empresaId) => {
    try {
      const { data } = await adminAPI.empresaDetalhe(empresaId);
      setEmpresaActiva({
        empresa: lerObjeto(data, 'empresa'),
        documentos: lerLista(data, 'documentos'),
        assinaturas: lerLista(data, 'assinaturas'),
      });
      setMotivo('');
    } catch (erro) {
      toast.error(`Erro ao carregar detalhe da empresa: ${extrairErro(erro)}`);
    }
  };

  const abrirDocumento = async (documento) => {
    try {
      const { data } = await adminAPI.visualizarDocumentoEmpresa(documento.id);
      const payload = lerObjeto(data, 'dados');
      const url = payload.url || documento.url_ficheiro;
      const visualizadoEm = payload.visualizado_em || new Date().toISOString();

      setEmpresaActiva((atual) => {
        if (!atual) return atual;
        return {
          ...atual,
          documentos: atual.documentos.map((item) => (
            item.id === documento.id ? { ...item, visualizado_at: visualizadoEm } : item
          )),
        };
      });

      window.open(`${BACKEND_BASE_URL}${url}`, '_blank', 'noopener,noreferrer');
    } catch (erro) {
      toast.error(`Erro ao abrir documento: ${extrairErro(erro)}`);
    }
  };

  const aprovar = async () => {
    if (!empresaActiva?.empresa?.id) return;
    // Verificar se documentos foram visualizados
    if (!empresaActiva.documentos || empresaActiva.documentos.length === 0) {
      toast.error('Não é possível aprovar sem antes visualizar os documentos da empresa.');
      return;
    }
    if (empresaActiva.documentos.some((documento) => !documento.visualizado_at)) {
      toast.error('Abra todos os documentos da empresa antes de aprovar.');
      return;
    }
    setAProcessar(true);
    try {
      await adminAPI.aprovarEmpresa(empresaActiva.empresa.id, {});
      toast.success('Empresa aprovada com sucesso.');
      setEmpresaActiva(null);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao aprovar empresa: ${extrairErro(erro)}`);
    } finally {
      setAProcessar(false);
    }
  };

  const rejeitar = async () => {
    if (!empresaActiva?.empresa?.id) return;
    // Verificar se documentos foram visualizados
    if (!empresaActiva.documentos || empresaActiva.documentos.length === 0) {
      toast.error('Não é possível rejeitar sem antes visualizar os documentos da empresa.');
      return;
    }
    if (empresaActiva.documentos.some((documento) => !documento.visualizado_at)) {
      toast.error('Abra todos os documentos da empresa antes de rejeitar.');
      return;
    }
    if (!motivo.trim()) {
      toast.error('Indique o motivo da rejeição.');
      return;
    }
    setAProcessar(true);
    try {
      await adminAPI.rejeitarEmpresa(empresaActiva.empresa.id, { motivo });
      toast.success('Empresa rejeitada com sucesso.');
      setEmpresaActiva(null);
      carregar();
    } catch (erro) {
      toast.error(`Erro ao rejeitar empresa: ${extrairErro(erro)}`);
    } finally {
      setAProcessar(false);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Empresas"
        subtitulo="Valide documentação, acompanhe assinaturas e tome decisões com mais rigor antes de libertar o acesso empresarial."
        acoes={<BotaoAtualizar onClick={carregar} loading={carregando} />}
      />

      <GradeResumo>
        <ResumoCard icone={<Building2 size={18} />} titulo="Total de perfis" valor={contagens.total || empresas.length || 0} />
        <ResumoCard icone={<CalendarClock size={18} />} titulo="Pendentes" valor={contagens.pendentes || empresas.filter((item) => item.estado === 'pendente').length} cor="var(--amarelo-100)" destaque="var(--amarelo)" />
        <ResumoCard icone={<CheckCircle2 size={18} />} titulo="Aprovadas" valor={contagens.aprovadas || empresas.filter((item) => item.estado === 'aprovada').length} cor="var(--verde-100)" destaque="var(--verde)" />
        <ResumoCard icone={<ShieldAlert size={18} />} titulo="Rejeitadas" valor={contagens.rejeitadas || empresas.filter((item) => item.estado === 'rejeitada').length} cor="var(--vermelho-100)" destaque="var(--vermelho)" />
      </GradeResumo>

      <BarraFerramentas
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        filtros={(
          <>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estado</label>
              <select className="form-select" value={estado} onChange={(event) => setEstado(event.target.value)}>
                {filtrosEstado.map((filtro) => (
                  <option key={filtro.valor || 'todos'} value={filtro.valor}>{filtro.etiqueta}</option>
                ))}
              </select>
            </div>
          </>
        )}
      />

      {empresasFiltradas.length === 0 && !carregando ? (
        <LinhaVazia titulo="Nenhuma empresa encontrada" descricao="Ajuste os filtros ou aguarde novas submissões empresariais." />
      ) : (
        <TabelaModulo colunas={['Empresa', 'Representante', 'Localização', 'Documentos', 'Assinatura', 'Estado', 'Ações']}>
          {empresasFiltradas.map((empresa) => (
            <tr key={empresa.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{empresa.nome_empresa}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>NIF: {empresa.nif || 'Não informado'}</div>
              </td>
              <td>
                <div>{empresa.representante || 'Sem representante'}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{empresa.email || 'Sem e-mail'}</div>
              </td>
              <td style={{ color: 'var(--txt-2)' }}>
                {[empresa.municipio, empresa.provincia].filter(Boolean).join(', ') || 'Sem localização'}
              </td>
              <td>
                <BadgeModulo tonalidade={empresa.num_documentos > 0 ? 'ciano' : 'cinza'}>
                  {empresa.num_documentos || 0} documento(s)
                </BadgeModulo>
              </td>
              <td>
                <div style={{ display: 'grid', gap: 4 }}>
                  <BadgeModulo tonalidade={badgeEstado(empresa.sub_status || 'pendente')}>
                    {empresa.sub_status || 'sem assinatura'}
                  </BadgeModulo>
                  <span style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>
                    {empresa.sub_data_fim ? `Até ${formatarData(empresa.sub_data_fim)}` : 'Sem período ativo'}
                  </span>
                </div>
              </td>
              <td>
                <BadgeModulo tonalidade={badgeEstado(empresa.estado)}>{empresa.estado}</BadgeModulo>
              </td>
              <td>
                <button className="btn btn--secondary btn--sm" onClick={() => abrirDetalhe(empresa.id)}>
                  <Eye size={14} /> Analisar
                </button>
              </td>
            </tr>
          ))}
        </TabelaModulo>
      )}

      <Modal
        aberto={Boolean(empresaActiva)}
        onFechar={() => setEmpresaActiva(null)}
        titulo="Análise de empresa"
        largura={720}
      >
        {empresaActiva?.empresa ? (
          <ModalBloco
            titulo={empresaActiva.empresa.nome_empresa}
            subtitulo="Verifique documentos, histórico de assinatura e situação atual antes da decisão administrativa."
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {[
                ['Representante', empresaActiva.empresa.representante || empresaActiva.empresa.nome],
                ['E-mail', empresaActiva.empresa.email],
                ['Telefone', empresaActiva.empresa.telefone],
                ['Setor', empresaActiva.empresa.sector],
                ['Localização', [empresaActiva.empresa.municipio, empresaActiva.empresa.provincia].filter(Boolean).join(', ')],
                ['Submetida em', formatarData(empresaActiva.empresa.created_at || empresaActiva.empresa.criado_em)],
              ].map(([titulo, valor]) => (
                <Painel key={titulo} style={{ padding: 14, background: 'var(--bg-2)' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--txt-4)', marginBottom: 4 }}>{titulo}</div>
                  <div style={{ fontWeight: 600 }}>{valor || 'Não informado'}</div>
                </Painel>
              ))}
            </div>

            <Painel style={{ background: 'var(--bg-2)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Descrição pública</div>
              <div style={{ color: 'var(--txt-2)', lineHeight: 1.7 }}>{empresaActiva.empresa.descricao || 'Sem descrição enviada.'}</div>
            </Painel>

            <Painel>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700 }}>Documentos submetidos</div>
                <BadgeModulo tonalidade={(empresaActiva.documentos?.length || 0) > 0 ? 'ciano' : 'cinza'}>
                  {empresaActiva.documentos?.length || 0} ficheiro(s)
                </BadgeModulo>
              </div>

              {(empresaActiva.documentos?.length || 0) > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {empresaActiva.documentos.map((documento) => (
                    <div key={documento.id} className="company-doc-card">
                      <div className="company-doc-card__top">
                        <div>
                          <p className="company-doc-card__title">{documento.tipo || 'Documento'}</p>
                          <p className="company-doc-card__name">{documento.nome_ficheiro || 'Ficheiro anexado'}</p>
                        </div>
                        <FileText size={18} color="var(--ciano)" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <BadgeModulo tonalidade={badgeEstado(documento.status_verificacao || 'pendente')}>
                          {documento.status_verificacao || 'pendente'}
                        </BadgeModulo>
                        <button className="btn btn--secondary btn--sm" type="button" onClick={() => abrirDocumento(documento)}>
                          Ver
                        </button>
                      </div>
                      <div style={{ marginTop: 8, fontSize: '0.75rem', color: documento.visualizado_at ? 'var(--verde)' : 'var(--txt-4)' }}>
                        {documento.visualizado_at ? `Visualizado em ${formatarData(documento.visualizado_at)}` : 'Ainda nÃ£o visualizado'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <LinhaVazia titulo="Sem documentos" descricao="A empresa ainda não carregou ficheiros suficientes para avaliação." />
              )}
            </Painel>

            <Painel>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700 }}>Histórico de assinatura</div>
                <BadgeModulo tonalidade={(empresaActiva.assinaturas?.length || 0) > 0 ? 'verde' : 'cinza'}>
                  {empresaActiva.assinaturas?.length || 0} registo(s)
                </BadgeModulo>
              </div>

              {(empresaActiva.assinaturas?.length || 0) > 0 ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {empresaActiva.assinaturas.map((assinatura) => (
                    <Painel key={assinatura.id} style={{ padding: 14, background: 'var(--bg-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{assinatura.plano}</div>
                          <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>
                            {formatarData(assinatura.data_inicio)} até {formatarData(assinatura.data_fim)}
                          </div>
                        </div>
                        <BadgeModulo tonalidade={badgeEstado(assinatura.status)}>{assinatura.status}</BadgeModulo>
                      </div>
                    </Painel>
                  ))}
                </div>
              ) : (
                <LinhaVazia titulo="Sem assinatura" descricao="Nenhuma assinatura foi lançada para esta empresa." />
              )}
            </Painel>

            {empresaActiva.empresa.estado === 'pendente' ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Motivo em caso de rejeição</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={motivo}
                    onChange={(event) => setMotivo(event.target.value)}
                    placeholder="Explique claramente o que precisa ser corrigido antes de nova submissão."
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn--primary" onClick={aprovar} disabled={aProcessar}>
                    <CheckCircle2 size={16} /> Aprovar empresa
                  </button>
                  <button className="btn btn--danger" onClick={rejeitar} disabled={aProcessar}>
                    <XCircle size={16} /> Rejeitar empresa
                  </button>
                </div>
              </div>
            ) : null}
          </ModalBloco>
        ) : null}
      </Modal>
    </div>
  );
};

export default GestaoEmpresas;
