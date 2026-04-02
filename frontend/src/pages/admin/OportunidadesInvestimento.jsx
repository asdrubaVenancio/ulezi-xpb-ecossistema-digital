import { Briefcase, Building2, CircleDollarSign, Eye, Layers3, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/ui';
import { adminAPI, extrairErro } from '../../services/api';
import {
  badgeEstado,
  BadgeModulo,
  BarraFerramentas,
  BotaoAtualizar,
  formatarData,
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

const tipos = [
  { valor: '', etiqueta: 'Todos os tipos' },
  { valor: 'venda_empresa', etiqueta: 'Venda da empresa' },
  { valor: 'participacao', etiqueta: 'Participação societária' },
  { valor: 'licenciamento', etiqueta: 'Licenciamento de marca' },
  { valor: 'franquia', etiqueta: 'Franquia' },
  { valor: 'investimento', etiqueta: 'Financiamento / investimento' },
];

const OportunidadesInvestimento = () => {
  const [oportunidades, setOportunidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [tipo, setTipo] = useState('');
  const [detalhe, setDetalhe] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data } = await adminAPI.oportunidades({ tipo_servico: tipo || undefined });
      setOportunidades(lerLista(data, 'oportunidades'));
    } catch (erro) {
      toast.error(`Erro ao carregar oportunidades: ${extrairErro(erro)}`);
      setOportunidades([]);
    } finally {
      setCarregando(false);
    }
  }, [tipo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return oportunidades;
    return oportunidades.filter((oportunidade) => (
      [
        oportunidade.titulo,
        oportunidade.nome_empresa,
        oportunidade.tipo_servico,
        oportunidade.status,
      ].filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo))
    ));
  }, [oportunidades, pesquisa]);

  const estatisticas = useMemo(() => ({
    total: lista.length,
    ativas: lista.filter((item) => String(item.status).toLowerCase() === 'ativa').length,
    analise: lista.filter((item) => ['pendente', 'em_analise'].includes(String(item.status).toLowerCase())).length,
    valorTotal: lista.reduce((acc, item) => acc + Number(item.valor_pedido || 0), 0),
  }), [lista]);

  return (
    <div>
      <PaginaModulo
        titulo="Investimentos"
        subtitulo="Acompanhe oportunidades empresariais publicadas, veja o estado de cada captação e valide a qualidade do que está a ser apresentado aos investidores."
        acoes={<BotaoAtualizar onClick={carregar} loading={carregando} />}
      />

      <GradeResumo>
        <ResumoCard icone={<Briefcase size={18} />} titulo="Oportunidades" valor={estatisticas.total} />
        <ResumoCard icone={<TrendingUp size={18} />} titulo="Ativas" valor={estatisticas.ativas} cor="var(--verde-100)" destaque="var(--verde)" />
        <ResumoCard icone={<Layers3 size={18} />} titulo="Em análise" valor={estatisticas.analise} cor="var(--amarelo-100)" destaque="var(--amarelo)" />
        <ResumoCard icone={<CircleDollarSign size={18} />} titulo="Valor agregado" valor={formatarMoeda(estatisticas.valorTotal)} cor="var(--laranja-100)" destaque="var(--laranja)" />
      </GradeResumo>

      <BarraFerramentas
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        filtros={(
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tipo de oportunidade</label>
            <select className="form-select" value={tipo} onChange={(event) => setTipo(event.target.value)}>
              {tipos.map((opcao) => (
                <option key={opcao.valor || 'todos'} value={opcao.valor}>{opcao.etiqueta}</option>
              ))}
            </select>
          </div>
        )}
      />

      {!lista.length && !carregando ? (
        <LinhaVazia titulo="Sem oportunidades" descricao="Ainda não existem publicações com os filtros seleccionados." />
      ) : (
        <TabelaModulo colunas={['Oportunidade', 'Empresa', 'Tipo', 'Valor', 'Estado', 'Publicação', 'Ações']}>
          {lista.map((item) => (
            <tr key={item.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{item.titulo}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>ID #{item.id}</div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={14} color="var(--txt-4)" />
                  <span>{item.nome_empresa || 'Empresa indisponível'}</span>
                </div>
              </td>
              <td style={{ color: 'var(--txt-2)' }}>{item.tipo_servico || 'Não especificado'}</td>
              <td style={{ fontWeight: 700 }}>{formatarMoeda(item.valor_pedido || 0)}</td>
              <td><BadgeModulo tonalidade={badgeEstado(item.status)}>{item.status || 'pendente'}</BadgeModulo></td>
              <td style={{ color: 'var(--txt-3)' }}>{formatarData(item.criado_em)}</td>
              <td>
                <button className="btn btn--secondary btn--sm" onClick={() => setDetalhe(item)}>
                  <Eye size={14} /> Ver
                </button>
              </td>
            </tr>
          ))}
        </TabelaModulo>
      )}

      <Modal isOpen={Boolean(detalhe)} onClose={() => setDetalhe(null)} title="Detalhe da oportunidade" size="lg">
        {detalhe ? (
          <ModalBloco titulo={detalhe.titulo} subtitulo="Resumo administrativo da publicação visível para investidores.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem', marginBottom: 4 }}>Empresa</div>
                <div style={{ fontWeight: 700 }}>{detalhe.nome_empresa || 'Não informado'}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem', marginBottom: 4 }}>Tipo</div>
                <div style={{ fontWeight: 700 }}>{detalhe.tipo_servico || 'Não especificado'}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem', marginBottom: 4 }}>Valor pedido</div>
                <div style={{ fontWeight: 700 }}>{formatarMoeda(detalhe.valor_pedido || 0)}</div>
              </Painel>
              <Painel style={{ padding: 14, background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--txt-4)', fontSize: '0.76rem', marginBottom: 4 }}>Estado</div>
                <BadgeModulo tonalidade={badgeEstado(detalhe.status)}>{detalhe.status || 'pendente'}</BadgeModulo>
              </Painel>
            </div>

            <Painel style={{ background: 'var(--bg-2)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Descrição</div>
              <div style={{ color: 'var(--txt-2)', lineHeight: 1.7 }}>{detalhe.descricao || 'Sem descrição administrativa disponível.'}</div>
            </Painel>
          </ModalBloco>
        ) : null}
      </Modal>
    </div>
  );
};

export default OportunidadesInvestimento;
