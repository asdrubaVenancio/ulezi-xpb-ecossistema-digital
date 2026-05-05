/**
 * Pagina de Notificacoes
 * Exibe todas as notificacoes do usuario com redirecionamento para paginas destino
 * Utilizado por: Aluno, Empresa (normal e consultoria)
 */
import { Bell, CheckCheck, ChevronLeft, Clock, Info, AlertTriangle, CheckCircle2, XCircle, ArrowRight, ChevronRight, ChevronFirst, ChevronLast, Users, Calendar, Briefcase, FileText, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifAPI, extrairErro } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/index.jsx';
import './Notificacoes.css';

// Mapeamento de tipos de notificacao para icones e cores
const TIPO_CONFIG = {
  info: { icone: Info, cor: 'azul', label: 'Informação' },
  success: { icone: CheckCircle2, cor: 'verde', label: 'Sucesso' },
  warning: { icone: AlertTriangle, cor: 'amarelo', label: 'Atenção' },
  error: { icone: XCircle, cor: 'vermelho', label: 'Erro' },
  curso: { icone: CheckCircle2, cor: 'verde', label: 'Curso' },
  inscricao: { icone: Info, cor: 'azul', label: 'Inscrição' },
  pagamento: { icone: CheckCircle2, cor: 'verde', label: 'Pagamento' },
  oportunidade: { icone: Briefcase, cor: 'roxo', label: 'Oportunidade' },
  sistema: { icone: Info, cor: 'cinza', label: 'Sistema' },
  // Novos tipos para eventos de perfis
  bem_vindo: { icone: Bell, cor: 'azul', label: 'Bem-vindo' },
  conta_ativada: { icone: CheckCircle2, cor: 'verde', label: 'Conta Ativada' },
  empresa_aprovada: { icone: CheckCircle2, cor: 'verde', label: 'Empresa Aprovada' },
  empresa_rejeitada: { icone: XCircle, cor: 'vermelho', label: 'Empresa Rejeitada' },
  novo_interesse: { icone: Users, cor: 'roxo', label: 'Novo Interesse' },
  negociacao_aprovada: { icone: CheckCircle2, cor: 'verde', label: 'Negociação Aprovada' },
  negociacao_rejeitada: { icone: XCircle, cor: 'vermelho', label: 'Negociação Rejeitada' },
  negociacao_pendente: { icone: Clock, cor: 'amarelo', label: 'Negociação Pendente' },
  negociacao_concluida: { icone: CheckCircle2, cor: 'verde', label: 'Negociação Concluída' },
  reuniao_agendada: { icone: Calendar, cor: 'azul', label: 'Reunião Agendada' },
  lembrete_reuniao: { icone: Clock, cor: 'amarelo', label: 'Lembrete' },
  ticket_atualizado: { icone: Info, cor: 'azul', label: 'Suporte' },
  assinatura_expirando: { icone: AlertTriangle, cor: 'amarelo', label: 'Assinatura' },
  oportunidade_criada: { icone: Briefcase, cor: 'roxo', label: 'Oportunidade' },
  vaga_criada: { icone: Briefcase, cor: 'azul', label: 'Vaga Criada' },
  vaga_aprovada: { icone: CheckCircle2, cor: 'verde', label: 'Vaga Aprovada' },
  novo_candidato: { icone: Users, cor: 'azul', label: 'Novo Candidato' },
  candidatura_em_analise: { icone: Clock, cor: 'amarelo', label: 'Candidatura' },
  candidatura_aprovada: { icone: CheckCircle2, cor: 'verde', label: 'Candidatura Aprovada' },
  candidatura_rejeitada: { icone: XCircle, cor: 'vermelho', label: 'Candidatura Rejeitada' },
  candidatura_entrevista: { icone: Calendar, cor: 'azul', label: 'Entrevista' },
  inscricao_curso: { icone: FileText, cor: 'azul', label: 'Inscrição Curso' },
  pagamento_confirmado: { icone: CheckCircle2, cor: 'verde', label: 'Pagamento' },
  consultoria_agendada: { icone: Calendar, cor: 'roxo', label: 'Consultoria' },
  contrato_gerado: { icone: FileText, cor: 'azul', label: 'Contrato' },
  assinatura_contrato: { icone: FileText, cor: 'amarelo', label: 'Assinatura Pendente' },
  contrato_assinado: { icone: CheckCircle2, cor: 'verde', label: 'Contrato Assinado' },
};

export default function Notificacoes() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState('todas'); // todas, nao-lidas, lidas

  // Paginacao
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Carregar notificacoes
  useEffect(() => {
    carregarNotificacoes();
  }, []);

  // Resetar pagina ao mudar filtro
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtro]);

  const carregarNotificacoes = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const resposta = await notifAPI.listar();
      // API retorna { success: true, data: { notificacoes: [...], nao_lidas: n } }
      let dados = [];
      // Verificar em data.data (Axios) ou data.dados (backend bilingue)
      const payload = resposta.data?.data || resposta.data?.dados;
      if (payload?.notificacoes && Array.isArray(payload.notificacoes)) {
        dados = payload.notificacoes;
      } else if (resposta.data?.notificacoes && Array.isArray(resposta.data.notificacoes)) {
        dados = resposta.data.notificacoes;
      } else if (Array.isArray(resposta.data)) {
        dados = resposta.data;
      }
      setNotificacoes(dados);
    } catch (err) {
      const msg = extrairErro(err);
      setErro(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setCarregando(false);
    }
  };

  // Marcar notificacao como lida
  const marcarComoLida = async (id) => {
    try {
      await notifAPI.marcarLida(id);
      setNotificacoes(prev =>
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      );
    } catch (err) {
      showToast({ type: 'error', message: extrairErro(err) });
    }
  };

  // Marcar todas como lidas
  const marcarTodasComoLidas = async () => {
    try {
      await notifAPI.marcarTodas();
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      showToast({ type: 'success', message: 'Todas as notificações foram marcadas como lidas' });
    } catch (err) {
      showToast({ type: 'error', message: extrairErro(err) });
    }
  };

  // Navegar para pagina destino
  const navegarParaDestino = (notificacao) => {
    // Marcar como lida antes de navegar
    if (!notificacao.lida) {
      marcarComoLida(notificacao.id);
    }

    // Navegar para o link se existir
    if (notificacao.link) {
      navigate(notificacao.link);
    }
  };

  // Filtrar notificacoes
  const notificacoesFiltradas = notificacoes.filter(n => {
    if (filtro === 'nao-lidas') return !n.lida;
    if (filtro === 'lidas') return n.lida;
    return true;
  });

  // Paginacao - calcular notificacoes da pagina atual
  const totalPaginas = Math.ceil(notificacoesFiltradas.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const notificacoesPaginadas = notificacoesFiltradas.slice(indiceInicial, indiceFinal);

  // Contagem de nao lidas
  const naoLidasCount = notificacoes.filter(n => !n.lida).length;

  // Info de paginacao
  const infoPaginacao = notificacoesFiltradas.length > 0
    ? `Mostrando ${indiceInicial + 1}-${Math.min(indiceFinal, notificacoesFiltradas.length)} de ${notificacoesFiltradas.length}`
    : '';

  // Componente de item de notificacao
  const NotificacaoItem = ({ notificacao }) => {
    const config = TIPO_CONFIG[notificacao.tipo] || TIPO_CONFIG.info;
    const Icone = config.icone;
    const data = new Date(notificacao.created_at || notificacao.data).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div
        className={`notificacao-item ${!notificacao.lida ? 'nao-lida' : ''}`}
        onClick={() => navegarParaDestino(notificacao)}
        role="button"
        tabIndex={0}
      >
        <div className={`notificacao-icone ${config.cor}`}>
          <Icone size={20} />
        </div>

        <div className="notificacao-conteudo">
          <div className="notificacao-cabecalho">
            <span className={`notificacao-tipo ${config.cor}`}>
              {config.label}
            </span>
            <span className="notificacao-data">
              <Clock size={12} style={{ marginRight: 4 }} />
              {data}
            </span>
          </div>

          <h4 className="notificacao-titulo">{notificacao.titulo}</h4>
          <p className="notificacao-mensagem">{notificacao.mensagem}</p>

          {notificacao.link && (
            <div className="notificacao-acao">
              <span>Ver detalhes</span>
              <ArrowRight size={14} />
            </div>
          )}
        </div>

        {!notificacao.lida && (
          <div className="notificacao-indicador" />
        )}
      </div>
    );
  };

  return (
    <div className="pagina-notificacoes">
      {/* Header */}
      <div className="notificacoes-header">
        <button
          className="btn-voltar"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>

        <div className="notificacoes-titulo">
          <Bell size={24} />
          <h1>Notificações</h1>
          {naoLidasCount > 0 && (
            <span className="badge-nao-lidas">{naoLidasCount}</span>
          )}
        </div>

        {naoLidasCount > 0 && (
          <button
            className="btn-marcar-todas"
            onClick={marcarTodasComoLidas}
          >
            <CheckCheck size={18} />
            <span>Marcar todas como lidas</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="notificacoes-filtros">
        <button
          className={`filtro-btn ${filtro === 'todas' ? 'ativo' : ''}`}
          onClick={() => setFiltro('todas')}
        >
          Todas
          <span className="contador">{notificacoes.length}</span>
        </button>
        <button
          className={`filtro-btn ${filtro === 'nao-lidas' ? 'ativo' : ''}`}
          onClick={() => setFiltro('nao-lidas')}
        >
          Não lidas
          {naoLidasCount > 0 && <span className="contador-destaque">{naoLidasCount}</span>}
        </button>
        <button
          className={`filtro-btn ${filtro === 'lidas' ? 'ativo' : ''}`}
          onClick={() => setFiltro('lidas')}
        >
          Lidas
        </button>
      </div>

      {/* Conteudo */}
      <div className="notificacoes-conteudo">
        {carregando ? (
          <div className="notificacoes-loading">
            <Spinner />
            <p>A carregar notificações...</p>
          </div>
        ) : erro ? (
          <div className="notificacoes-erro">
            <AlertTriangle size={48} />
            <p>{erro}</p>
            <button className="btn-tentar-novamente" onClick={carregarNotificacoes}>
              Tentar novamente
            </button>
          </div>
        ) : notificacoesFiltradas.length === 0 ? (
          <div className="notificacoes-vazio">
            <Bell size={48} />
            <h3>Sem notificações</h3>
            <p>
              {filtro === 'nao-lidas'
                ? 'Não tem notificações não lidas.'
                : filtro === 'lidas'
                ? 'Não tem notificações lidas.'
                : 'Ainda não recebeu nenhuma notificação.'}
            </p>
          </div>
        ) : (
          <>
            <div className="notificacoes-lista">
              {notificacoesPaginadas.map(notificacao => (
                <NotificacaoItem key={notificacao.id} notificacao={notificacao} />
              ))}
            </div>

            {/* Paginacao */}
            {totalPaginas > 1 && (
              <div className="notificacoes-paginacao">
                <div className="paginacao-info">{infoPaginacao}</div>
                <div className="paginacao-controles">
                  <button
                    className="paginacao-btn"
                    onClick={() => setPaginaAtual(1)}
                    disabled={paginaAtual === 1}
                    title="Primeira página"
                  >
                    <ChevronFirst size={18} />
                  </button>
                  <button
                    className="paginacao-btn"
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    title="Página anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="paginacao-numeros">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                      <button
                        key={num}
                        className={`paginacao-numero ${paginaAtual === num ? 'ativo' : ''}`}
                        onClick={() => setPaginaAtual(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    className="paginacao-btn"
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    title="Próxima página"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    className="paginacao-btn"
                    onClick={() => setPaginaAtual(totalPaginas)}
                    disabled={paginaAtual === totalPaginas}
                    title="Última página"
                  >
                    <ChevronLast size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
