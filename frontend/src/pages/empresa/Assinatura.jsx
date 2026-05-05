import { AlertCircle, Briefcase, Calendar, Check, Copy, Crown, FileText, Landmark, Lock, Upload, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, Badge, Spinner } from '../../components/ui/index.jsx';
import { useToast } from '../../components/ui/Toast';
import { coordenadasBancariasAPI, empresaAPI, extrairErro } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Assinatura.css';

// Coordenadas bancárias para pagamento
const COORDENADAS_BANCARIAS = {
  banco: 'Banco de Fomento Angola (BFA)',
  iban: 'AO06 0055 0000 1234 5678 9012 3',
  titular: 'ULEZI XPB - SOLUÇÕES DIGITAIS LDA',
  swift: 'BFAOAOAAXXX',
};

export function AssinaturaPage() {
  const [pacotes, setPacotes] = useState([]);
  const [minhaAssinatura, setMinhaAssinatura] = useState(null);
  const [coordenadas, setCoordenadas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [assinando, setAssinando] = useState(false);
  const [pacoteSelecionado, setPacoteSelecionado] = useState(null);
  
  // Estados para modal de pagamento
  const [modalPagamento, setModalPagamento] = useState(false);
  const [passoPagamento, setPassoPagamento] = useState(1); // 1: Coordenadas, 2: Upload
  const [comprovativo, setComprovativo] = useState(null);
  const [referencia, setReferencia] = useState('');
  const [coordenadaSelecionada, setCoordenadaSelecionada] = useState(null);
  
  const toast = useToast();

  const { utilizador } = useAuth();
  // Verifica se a empresa está aprovada (is_approved = true na company_profile)
  // O backend retorna os dados da empresa em 'profile' (company_profiles)
  const empresaAprovada = utilizador?.profile?.is_approved === 1 ||
                          utilizador?.profile?.is_approved === true ||
                          utilizador?.empresa?.is_approved === true ||
                          minhaAssinatura?.empresa?.is_approved === true ||
                          minhaAssinatura?.empresa?.is_approved === 1;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [resAssinatura, resPacotes, resCoordenadas] = await Promise.all([
        empresaAPI.minhaAssinatura(),
        empresaAPI.pacotesAssinatura(),
        coordenadasBancariasAPI.listar(),
      ]);

      setMinhaAssinatura(resAssinatura.data.dados || null);
      setPacotes(resPacotes.data.dados?.pacotes || []);
      setCoordenadas(resCoordenadas.data.dados?.coordenadas || []);
    } catch (err) {
      toast.erro(`Erro ao carregar dados: ${extrairErro(err)}`);
    } finally {
      setCarregando(false);
    }
  };

  const handleAssinar = async (pacote) => {
    if (minhaAssinatura?.tem_assinatura_ativa) {
      toast.aviso('Você já possui uma assinatura ativa. Aguarde o vencimento para renovar.');
      return;
    }

    if (minhaAssinatura?.ultima_solicitacao?.status === 'pendente') {
      toast.aviso('Já existe uma solicitação pendente em análise.');
      return;
    }

    // Abrir modal de pagamento
    setPacoteSelecionado(pacote);
    setPassoPagamento(1);
    setComprovativo(null);
    setReferencia(`ASS-${Date.now()}`);
    setCoordenadaSelecionada(coordenadas[0] || null); // Selecionar a primeira por padrão
    setModalPagamento(true);
  };

  const handleCopiar = (texto, label) => {
    navigator.clipboard.writeText(texto);
    toast.sucesso(`${label} copiado!`);
  };

  const handleUploadComprovativo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo e tamanho
    const tiposValidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!tiposValidos.includes(file.type)) {
      toast.erro('Formato inválido. Use JPG, PNG ou PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.erro('Ficheiro muito grande. Máximo 5MB.');
      return;
    }

    setComprovativo(file);
    toast.sucesso('Comprovativo anexado!');
  };

  const handleEnviarSolicitacao = async () => {
    if (!pacoteSelecionado || !comprovativo) {
      toast.erro('Anexe o comprovativo de pagamento.');
      return;
    }

    setAssinando(true);
    try {
      const formData = new FormData();
      formData.append('package_id', pacoteSelecionado.id);
      formData.append('comprovativo', comprovativo);
      formData.append('metodo_pagamento', 'transferencia');
      formData.append('referencia_pagamento', referencia);

      await empresaAPI.assinarComComprovativo(formData);
      toast.sucesso('Solicitação enviada com sucesso! Aguarde a aprovação.');
      setModalPagamento(false);
      setComprovativo(null);
      setPacoteSelecionado(null);
      carregarDados();
    } catch (err) {
      toast.erro(extrairErro(err));
    } finally {
      setAssinando(false);
    }
  };

  const handleRenovar = async () => {
    setAssinando(true);
    try {
      const res = await empresaAPI.renovarAssinatura();
      toast.sucesso(res.data.dados?.mensagem || 'Renovação solicitada com sucesso.');
      await carregarDados();
    } catch (err) {
      toast.erro(extrairErro(err));
    } finally {
      setAssinando(false);
    }
  };

  if (carregando) {
    return (
      <div className="assinatura-page">
        <div className="assinatura-loading">
          <Spinner size={40} />
          <p>Carregando planos...</p>
        </div>
      </div>
    );
  }

  const temAssinaturaAtiva = Boolean(minhaAssinatura?.tem_assinatura_ativa);
  const assinaturaAtual = minhaAssinatura?.assinatura || null;
  const coordenadaPrincipal = coordenadaSelecionada || coordenadas[0] || null;
  const solicitacaoPendente = !temAssinaturaAtiva && minhaAssinatura?.ultima_solicitacao?.status === 'pendente'
    ? minhaAssinatura.ultima_solicitacao
    : null;
  const diasRestantes = assinaturaAtual
    ? Math.ceil((new Date(assinaturaAtual.data_fim) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;
  const ehAssinaturaConsultoria = assinaturaAtual?.package_category === 'consultoria' ||
                                  assinaturaAtual?.package_category === 'recarga_consultoria';

  return (
    <div className="assinatura-page">
      <div className="assinatura-header">
        <h1>Planos de assinatura</h1>
        <p>Escolha o pacote que desbloqueia os privilégios da sua empresa na plataforma.</p>
      </div>

      {temAssinaturaAtiva && assinaturaAtual && (
        <div className="assinatura-atual">
          <div className="assinatura-card atual">
            <div className="assinatura-card-header">
              <Crown size={24} />
              <h3>Sua assinatura atual</h3>
            </div>
            <div className="assinatura-card-body">
              <div className="plano-info">
                <h4>{assinaturaAtual.package_name || assinaturaAtual.tipo_plano || 'Plano ativo'}</h4>
                <p className="plano-preco">
                  {assinaturaAtual.valor_pago} {assinaturaAtual.moeda}
                  <span>/ciclo</span>
                </p>
              </div>
              <div className="plano-datas">
                <p>
                  <Calendar size={16} />
                  Válido até: {new Date(assinaturaAtual.data_fim).toLocaleDateString('pt-AO')}
                </p>
                <Badge cor={diasRestantes <= 7 ? 'vermelho' : diasRestantes <= 15 ? 'amarelo' : 'verde'}>
                  {diasRestantes} dias restantes
                </Badge>
              </div>
              <div className="plano-uso">
                <h5>Uso atual do pacote:</h5>
                <ul>
                  {!ehAssinaturaConsultoria && (
                    <>
                      <li>
                        <Briefcase size={14} />
                        Oportunidades: {minhaAssinatura?.uso?.oportunidades_ativas || 0} / {minhaAssinatura?.uso?.limite_oportunidades || 'ilimitado'}
                      </li>
                      <li>
                        <Users size={14} />
                        Vagas: {minhaAssinatura?.uso?.vagas_ativas || 0} / {minhaAssinatura?.uso?.limite_vagas || 'ilimitado'}
                      </li>
                    </>
                  )}
                  <li>
                    <FileText size={14} />
                    Consultorias: {minhaAssinatura?.uso?.consultorias_usadas || 0} / {minhaAssinatura?.uso?.limite_consultorias || 'ilimitado'}
                  </li>
                </ul>
              </div>
              {diasRestantes <= 7 && (
                <button type="button" className="btn-renovar" onClick={handleRenovar} disabled={assinando}>
                  {assinando ? 'Processando...' : 'Renovar agora'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!temAssinaturaAtiva && (
        <Alert tipo="warning" titulo="Assinatura necessária">
          Enquanto a assinatura não estiver ativa, a empresa poderá apenas atualizar o perfil e os documentos.
        </Alert>
      )}

      {solicitacaoPendente && (
        <div className="assinatura-atual">
          <div className="assinatura-card">
            <div className="assinatura-card-header">
              <AlertCircle size={24} />
              <h3>Solicitação em análise</h3>
            </div>
            <div className="assinatura-card-body">
              <div className="plano-info">
                <h4>{solicitacaoPendente.package_name || solicitacaoPendente.tipo_plano || 'Plano selecionado'}</h4>
                <p className="plano-preco">
                  {solicitacaoPendente.valor_pago} {solicitacaoPendente.moeda}
                  <span>/solicitação</span>
                </p>
              </div>
              <div className="plano-datas">
                <p>
                  <Calendar size={16} />
                  Referência: {solicitacaoPendente.referencia_pagamento || 'a gerar'}
                </p>
                <Badge cor="amarelo">Aguardando validação administrativa</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pacotes-grid">
        {pacotes.map((pacote) => {
          const beneficios = Array.isArray(pacote.beneficios)
            ? pacote.beneficios
            : [];

          return (
            <div
              key={pacote.id}
              className={`pacote-card ${pacoteSelecionado?.id === pacote.id ? 'selecionado' : ''}`}
            >
              <div className="pacote-header">
                <h3>{pacote.nome}</h3>
                <div className="pacote-preco">
                  <span className="preco-valor">{pacote.preco}</span>
                  <span className="preco-moeda">{pacote.moeda}</span>
                  <span className="preco-periodo">/{pacote.duracao_meses} mes(es)</span>
                </div>
              </div>

              <div className="pacote-descricao">
                <p>{pacote.descricao}</p>
              </div>

              <div className="pacote-beneficios">
                <h4>O que está incluído:</h4>
                <ul>
                  {pacote.package_category !== 'consultoria' && pacote.package_category !== 'recarga_consultoria' && (
                    <>
                      <li>
                        <Check size={16} className="icon-check" />
                        {pacote.publicacoes_oportunidades_ilimitadas
                          ? 'Oportunidades ilimitadas'
                          : `Até ${pacote.max_oportunidades_ativas} oportunidades ativas`}
                      </li>
                      <li>
                        <Check size={16} className="icon-check" />
                        {pacote.publicacoes_vagas_ilimitadas
                          ? 'Vagas ilimitadas'
                          : `Até ${pacote.max_vagas_ativas} vagas ativas`}
                      </li>
                    </>
                  )}
                  <li>
                    <Check size={16} className="icon-check" />
                    {pacote.consultorias_incluidas > 0
                      ? `${pacote.consultorias_incluidas} consultoria(s) incluída(s)`
                      : 'Sem consultorias incluídas'}
                  </li>
                  <li>
                    {pacote.suporte_prioritario
                      ? <><Check size={16} className="icon-check" /> Suporte prioritário</>
                      : <><X size={16} className="icon-x" /> Suporte padrão</>}
                  </li>
                </ul>

                {beneficios.length > 0 && (
                  <>
                    <h4>Benefícios extras:</h4>
                    <ul className="beneficios-extras">
                      {beneficios.map((beneficio, idx) => (
                        <li key={`${pacote.id}-${idx}`}>
                          <Check size={14} className="icon-check" />
                          {beneficio}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="pacote-acoes">
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  {!empresaAprovada ? (
                    <button className="btn btn-secondary" disabled>
                      <X size={18} style={{ marginRight: 8 }} />
                      Aguardando aprovação da conta
                    </button>
                  ) : temAssinaturaAtiva ? (
                    <button className="btn btn-success" disabled>
                      <Check size={18} style={{ marginRight: 8 }} />
                      Já possui assinatura
                    </button>
                  ) : solicitacaoPendente ? (
                    <button className="btn btn-warning" disabled>
                      <AlertCircle size={18} style={{ marginRight: 8 }} />
                      Solicitação em análise
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-assinar"
                      onClick={() => handleAssinar(pacote)}
                      disabled={carregando}
                    >
                      <Briefcase size={18} style={{ marginRight: 8 }} />
                      {carregando ? 'Processando...' : 'Solicitar assinatura'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Pagamento com Coordenadas Bancárias */}
      {modalPagamento && (
        <div className="assinatura-modal-overlay" onClick={() => !assinando && setModalPagamento(false)}>
          <div className="assinatura-modal-content" onClick={e => e.stopPropagation()}>
            <div className="assinatura-modal-header">
              <h3>Pagamento da Assinatura</h3>
              <button 
                type="button"
                className="btn-fechar" 
                onClick={() => setModalPagamento(false)}
                disabled={assinando}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            
            {pacoteSelecionado && (
              <div className="assinatura-modal-body">
                {/* Resumo do Plano */}
                <div className="plano-resumo">
                  <h4>{pacoteSelecionado.nome}</h4>
                  <p className="valor">
                    {pacoteSelecionado.preco} {pacoteSelecionado.moeda}
                    <span> / {pacoteSelecionado.duracao_meses} {pacoteSelecionado.duracao_meses === 1 ? 'mês' : 'meses'}</span>
                  </p>
                </div>

                {/* Passos */}
                <div className="passos-pagamento" role="list" aria-label="Etapas do pagamento">
                  <div className={`passo ${passoPagamento === 1 ? 'ativo' : ''} ${passoPagamento > 1 ? 'concluido' : ''}`} role="listitem">
                    <span className="numero">{passoPagamento > 1 ? '✓' : '1'}</span>
                    <span className="texto">Coordenadas</span>
                  </div>
                  <div className={`passo ${passoPagamento === 2 ? 'ativo' : ''}`} role="listitem">
                    <span className="numero">2</span>
                    <span className="texto">Comprovativo</span>
                  </div>
                </div>

                {/* Passo 1: Coordenadas Bancárias */}
                {passoPagamento === 1 && (
                  <div className="assinatura-passo-conteudo">
                    <div className="banco-header">
                      <Landmark size={32} />
                      <div>
                        <h4>Coordenadas Bancárias</h4>
                        <p>Escolha uma opção para pagamento</p>
                      </div>
                    </div>

                    {/* Lista de coordenadas bancárias */}
                    {coordenadas.length > 0 ? (
                      <div className="lista-coordenadas">
                        {coordenadas.map((coord) => (
                          <div 
                            key={coord.id} 
                            className={`coordenada-card ${coordenadaPrincipal?.id === coord.id ? 'selecionada' : ''}`}
                            onClick={() => setCoordenadaSelecionada(coord)}
                          >
                            <div className="coordenada-card-header">
                              <div className="coordenada-info-principal">
                                <h5>{coord.banco || coord.titulo}</h5>
                                <span className="coordenada-tipo">{coord.tipo}</span>
                              </div>
                              {coordenadaPrincipal?.id === coord.id && (
                                <span className="selecionada-badge">Selecionada</span>
                              )}
                            </div>
                            
                            <div className="coordenada-card-body">
                              <div className="coordenada-valor">
                                <label>{coord.tipo}</label>
                                <div className="valor-com-copiar">
                                  <code>{coord.numero_formatado || coord.numero}</code>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopiar(coord.numero_formatado || coord.numero, coord.tipo);
                                    }}
                                    className="btn-copiar"
                                  >
                                    <Copy size={14} /> Copiar
                                  </button>
                                </div>
                              </div>
                              
                              {coord.titular && (
                                <div className="coordenada-detalhe">
                                  <label>Titular:</label>
                                  <span>{coord.titular}</span>
                                </div>
                              )}
                            </div>
                            
                            {coord.descricao && (
                              <div className="coordenada-descricao">{coord.descricao}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="sem-coordenadas">
                        <AlertCircle size={32} />
                        <p>Nenhuma coordenada bancária disponível.</p>
                      </div>
                    )}

                    <div className="coordenadas-grid">
                      <div className="coordenada-item destaque">
                        <label>Valor a Transferir</label>
                        <p className="valor-final">
                          {pacoteSelecionado.preco} {pacoteSelecionado.moeda}
                        </p>
                      </div>
                    </div>

                    <div className="alerta-comprovativo">
                      <AlertCircle size={16} />
                      <p>
                        <strong>Importante:</strong> Guarde o comprovativo de pagamento. 
                        Você precisará dele no próximo passo.
                      </p>
                    </div>

                    <div className="modal-acoes">
                      <button 
                        type="button"
                        className="btn-secundario"
                        onClick={() => setModalPagamento(false)}
                        disabled={assinando}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button"
                        className="btn-primario"
                        onClick={() => setPassoPagamento(2)}
                        disabled={!coordenadaPrincipal}
                      >
                        Já realizei o pagamento →
                      </button>
                    </div>
                  </div>
                )}

                {/* Passo 2: Upload do Comprovativo */}
                {passoPagamento === 2 && (
                  <div className="assinatura-passo-conteudo">
                    <div className="upload-area">
                      <div className="upload-icone">
                        <Upload size={32} />
                      </div>
                      <h4>Anexar Comprovativo</h4>
                      <p>Arraste o ficheiro ou clique para selecionar</p>

                      <input
                        type="file"
                        id="comprovativo"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleUploadComprovativo}
                        style={{ display: 'none' }}
                        disabled={assinando}
                      />

                      {!comprovativo ? (
                        <label htmlFor="comprovativo" className="btn-upload">
                          Selecionar Ficheiro
                        </label>
                      ) : (
                        <div className="ficheiro-selecionado">
                          <FileText size={24} />
                          <div className="ficheiro-info">
                            <p className="nome">{comprovativo.name}</p>
                            <p className="tamanho">{(comprovativo.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button 
                            type="button"
                            className="btn-remover"
                            onClick={() => setComprovativo(null)}
                            disabled={assinando}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}

                      <p className="formatos-aceites">
                        Formatos: JPG, PNG, PDF (máx. 5MB)
                      </p>
                    </div>

                    <div className="modal-acoes">
                      <button 
                        type="button"
                        className="btn-secundario"
                        onClick={() => setPassoPagamento(1)}
                        disabled={assinando}
                      >
                        ← Voltar
                      </button>
                      <button 
                        type="button"
                        className="btn-primario"
                        onClick={handleEnviarSolicitacao}
                        disabled={!comprovativo || assinando}
                      >
                        {assinando ? (
                          <>
                            <Spinner size={18} /> Enviando...
                          </>
                        ) : (
                          'Enviar Solicitação'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssinaturaPage;
