import { AlertTriangle, BellRing, Eye, Mail, RefreshCw, RotateCcw, Send } from 'lucide-react';
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

const NotificacoesAssinatura = () => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [detalhe, setDetalhe] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resLista, resStats, resPendentes] = await Promise.all([
        api.get('/admin/subscription-notifications', { params: { notification_type: tipo || undefined, status: estado || undefined } }),
        api.get('/admin/subscription-notifications/stats'),
        api.get('/admin/subscription-notifications/pending-expirations'),
      ]);
      setNotificacoes(lerLista(resLista.data, 'notificacoes'));
      setEstatisticas(lerObjeto(resStats.data, 'estatisticas_gerais'));
      setPendentes(lerLista(resPendentes.data, 'lista_completa'));
    } catch (erro) {
      toast.error(`Erro ao carregar notificações: ${extrairErro(erro)}`);
      setNotificacoes([]);
      setEstatisticas({});
      setPendentes([]);
    } finally {
      setCarregando(false);
    }
  }, [estado, tipo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return notificacoes;
    return notificacoes.filter((item) => (
      [
        item.nome_empresa,
        item.email,
        item.title,
        item.notification_type,
      ].filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo))
    ));
  }, [notificacoes, pesquisa]);

  const executarVerificacao = async () => {
    try {
      await api.post('/admin/subscription-notifications/check');
      toast.success('Verificação executada com sucesso.');
      carregar();
    } catch (erro) {
      toast.error(`Erro ao executar verificação: ${extrairErro(erro)}`);
    }
  };

  const executarRenovacoes = async () => {
    try {
      await api.post('/admin/subscription-notifications/auto-renew');
      toast.success('Processamento de renovações executado.');
      carregar();
    } catch (erro) {
      toast.error(`Erro ao processar renovações: ${extrairErro(erro)}`);
    }
  };

  const abrirDetalhe = async (item) => {
    try {
      const { data } = await api.get(`/admin/subscription-notifications/${item.id}`);
      setDetalhe(lerObjeto(data, 'notificacao'));
    } catch (erro) {
      toast.error(`Erro ao abrir notificação: ${extrairErro(erro)}`);
    }
  };

  const reenviar = async (id) => {
    try {
      await api.post(`/admin/subscription-notifications/${id}/resend`);
      toast.success('Notificação reenviada com sucesso.');
      carregar();
      if (detalhe?.id === id) abrirDetalhe({ id });
    } catch (erro) {
      toast.error(`Erro ao reenviar notificação: ${extrairErro(erro)}`);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Notif. Assinatura"
        subtitulo="Monitore vencimentos, dispare lembretes e acompanhe a saúde financeira das contas empresariais activas."
        acoes={<BotaoAtualizar onClick={carregar} loading={carregando} />}
      />

      <GradeResumo>
        <ResumoCard icone={<BellRing size={18} />} titulo="Notificações" valor={estatisticas.total_notificacoes || lista.length || 0} />
        <ResumoCard icone={<Send size={18} />} titulo="Enviadas hoje" valor={estatisticas.hoje || 0} cor="var(--verde-100)" destaque="var(--verde)" />
        <ResumoCard icone={<Mail size={18} />} titulo="Pendentes" valor={estatisticas.emails_pendentes || 0} cor="var(--amarelo-100)" destaque="var(--amarelo)" />
        <ResumoCard icone={<AlertTriangle size={18} />} titulo="Vencimentos críticos" valor={pendentes.filter((item) => item.nivel_urgencia === 'critico').length} cor="var(--vermelho-100)" destaque="var(--vermelho)" />
      </GradeResumo>

      <Painel style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn--primary btn--sm" onClick={executarVerificacao}>
            <RefreshCw size={14} /> Verificar vencimentos
          </button>
          <button className="btn btn--secondary btn--sm" onClick={executarRenovacoes}>
            <RotateCcw size={14} /> Processar renovações
          </button>
        </div>
      </Painel>

      {pendentes.length ? (
        <Painel style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Assinaturas próximas do vencimento</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {pendentes.slice(0, 6).map((item) => (
              <Painel key={item.id} style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>{item.nome_empresa}</div>
                  <BadgeModulo tonalidade={badgeEstado(item.nivel_urgencia)}>{item.nivel_urgencia}</BadgeModulo>
                </div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{item.nome_plano || item.tipo_plano}</div>
                <div style={{ color: 'var(--txt-2)', marginTop: 8 }}>Vence em {item.dias_restantes} dia(s)</div>
              </Painel>
            ))}
          </div>
        </Painel>
      ) : null}

      <BarraFerramentas
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        filtros={(
          <>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo</label>
              <input className="form-input" value={tipo} onChange={(event) => setTipo(event.target.value)} placeholder="Ex.: vencimento_7_dias" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estado</label>
              <input className="form-input" value={estado} onChange={(event) => setEstado(event.target.value)} placeholder="Ex.: enviado" />
            </div>
          </>
        )}
      />

      {!lista.length && !carregando ? (
        <LinhaVazia titulo="Sem notificações" descricao="O histórico de alertas de assinatura aparecerá aqui quando o serviço processar os vencimentos." />
      ) : (
        <TabelaModulo colunas={['Empresa', 'Título', 'Tipo', 'Estado', 'Dias restantes', 'Criada em', 'Ações']}>
          {lista.map((item) => (
            <tr key={item.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{item.nome_empresa}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{item.email}</div>
              </td>
              <td>{item.title}</td>
              <td><BadgeModulo tonalidade="ciano">{item.notification_type}</BadgeModulo></td>
              <td><BadgeModulo tonalidade={badgeEstado(item.status)}>{item.status}</BadgeModulo></td>
              <td>{item.dias_restantes ?? '—'}</td>
              <td style={{ color: 'var(--txt-3)' }}>{formatarDataHora(item.created_at)}</td>
              <td>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn--secondary btn--sm" onClick={() => abrirDetalhe(item)}>
                    <Eye size={14} /> Ver
                  </button>
                  <button className="btn btn--secondary btn--sm" onClick={() => reenviar(item.id)}>
                    <Send size={14} /> Reenviar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </TabelaModulo>
      )}

      <Modal isOpen={Boolean(detalhe)} onClose={() => setDetalhe(null)} title="Detalhe da notificação" size="lg">
        {detalhe ? (
          <ModalBloco titulo={detalhe.title} subtitulo="Resumo do alerta enviado à empresa e estado operacional do serviço de comunicação.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Empresa</div>
                <div style={{ fontWeight: 700 }}>{detalhe.nome_empresa}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{detalhe.email}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Plano</div>
                <div style={{ fontWeight: 700 }}>{detalhe.nome_plano || detalhe.tipo_plano || 'Sem plano'}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem' }}>Estado</div>
                <div style={{ marginTop: 6 }}><BadgeModulo tonalidade={badgeEstado(detalhe.status)}>{detalhe.status}</BadgeModulo></div>
              </Painel>
            </div>
            <Painel style={{ background: 'var(--bg-2)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Mensagem</div>
              <div style={{ color: 'var(--txt-2)', lineHeight: 1.7 }}>{detalhe.message}</div>
            </Painel>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn--primary btn--sm" onClick={() => reenviar(detalhe.id)}>
                <Send size={14} /> Reenviar notificação
              </button>
            </div>
          </ModalBloco>
        ) : null}
      </Modal>
    </div>
  );
};

export default NotificacoesAssinatura;
