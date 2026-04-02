import {
  Briefcase,
  Edit3,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/ui';
import api, { extrairErro } from '../../services/api';
import {
  BadgeModulo,
  BarraFerramentas,
  BotaoAtualizar,
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

const departamentosDisponiveis = [
  'Geral',
  'Negócios',
  'Investimentos',
  'Verificação',
  'Suporte',
  'Administração',
  'Tecnologia',
];

const tiposContrato = ['efetivo', 'temporario', 'estagio', 'pj'];

const cargosDisponiveis = [
  'Administrador',
  'Gestor Operacional',
  'Gestor de Negócios',
  'Analista de Investimentos',
  'Mediador de Negócios',
  'Verificador',
  'Consultor',
  'Agente de Suporte',
  'Assistente Administrativo',
];

const responsabilidadesDisponiveis = [
  { tipo: 'mediacao_negocios', etiqueta: 'Mediação de negócios' },
  { tipo: 'verificacao_fisica', etiqueta: 'Verificação física' },
  { tipo: 'suporte_clientes', etiqueta: 'Suporte ao cliente' },
  { tipo: 'consultoria', etiqueta: 'Consultoria' },
  { tipo: 'assinaturas', etiqueta: 'Gestão de assinaturas' },
];

const estadoOptions = [
  { valor: 'active', etiqueta: 'Activos' },
  { valor: 'inactive', etiqueta: 'Inactivos' },
  { valor: 'all', etiqueta: 'Todos' },
];

const valorSeguro = (valor) => String(valor || '').trim();

const formInicial = {
  nome: '',
  email: '',
  telefone: '',
  departamento: 'Geral',
  cargo: cargosDisponiveis[0],
  tipo_contrato: 'efetivo',
  responsabilidades: [],
};

function FuncionariosModal({ aberto, aoFechar, aoGuardar, emEdicao, funcionario }) {
  const [formulario, setFormulario] = useState(formInicial);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    if (!aberto) return;

    if (funcionario && emEdicao) {
      setFormulario({
        nome: funcionario.nome || '',
        email: funcionario.email || '',
        telefone: funcionario.telefone || '',
        departamento: funcionario.departamento || 'Geral',
        cargo: funcionario.cargo || cargosDisponiveis[0],
        tipo_contrato: funcionario.tipo_contrato || 'efetivo',
        responsabilidades: (funcionario.responsabilidades || []).map((item, indice) => ({
          tipo: item.tipo || item.tipo_responsabilidade,
          descricao: item.descricao || '',
          prioridade: item.prioridade || indice + 1,
        })),
      });
      return;
    }

    setFormulario(formInicial);
  }, [aberto, funcionario, emEdicao]);

  const alternarResponsabilidade = (tipo) => {
    setFormulario((actual) => {
      const existe = actual.responsabilidades.some((item) => item.tipo === tipo);
      if (existe) {
        return {
          ...actual,
          responsabilidades: actual.responsabilidades.filter((item) => item.tipo !== tipo),
        };
      }

      return {
        ...actual,
        responsabilidades: [
          ...actual.responsabilidades,
          { tipo, descricao: '', prioridade: actual.responsabilidades.length + 1 },
        ],
      };
    });
  };

  const submeter = async () => {
    if (!valorSeguro(formulario.nome) || !valorSeguro(formulario.email) || !valorSeguro(formulario.cargo)) {
      toast.error('Preencha nome, e-mail e cargo.');
      return;
    }

    setAGuardar(true);
    try {
      const payload = {
        nome: formulario.nome,
        email: formulario.email,
        telefone: formulario.telefone,
        departamento: formulario.departamento,
        cargo: formulario.cargo,
        tipo_contrato: formulario.tipo_contrato,
        responsabilidades: formulario.responsabilidades,
      };
      await aoGuardar(payload);
      aoFechar();
    } catch (erro) {
      toast.error(extrairErro(erro));
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <Modal aberto={aberto} onFechar={aoFechar} titulo={emEdicao ? 'Editar funcionário' : 'Novo funcionário'} largura={960}>
      <ModalBloco
        titulo={emEdicao ? 'Actualizar dados do colaborador' : 'Adicionar novo colaborador'}
        subtitulo="Defina os dados profissionais e as responsabilidades operacionais para manter a equipa bem organizada."
      >
        <div className="module-stack">
          <Painel style={{ background: 'var(--bg-2)' }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Dados principais</div>
            <div className="module-grid-2">
              <div className="form-group">
                <label className="form-label">Nome completo</label>
                <input className="form-input" value={formulario.nome} onChange={(event) => setFormulario((actual) => ({ ...actual, nome: event.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input type="email" className="form-input" value={formulario.email} onChange={(event) => setFormulario((actual) => ({ ...actual, email: event.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input className="form-input" value={formulario.telefone} onChange={(event) => setFormulario((actual) => ({ ...actual, telefone: event.target.value }))} />
              </div>
            </div>
          </Painel>

          <Painel style={{ background: 'var(--bg-2)' }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Estrutura profissional</div>
            <div className="module-grid-3">
              <div className="form-group">
                <label className="form-label">Cargo</label>
                <select className="form-select" value={formulario.cargo} onChange={(event) => setFormulario((actual) => ({ ...actual, cargo: event.target.value }))}>
                  {cargosDisponiveis.map((cargo) => <option key={cargo} value={cargo}>{cargo}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Departamento</label>
                <select className="form-select" value={formulario.departamento} onChange={(event) => setFormulario((actual) => ({ ...actual, departamento: event.target.value }))}>
                  {departamentosDisponiveis.map((departamento) => <option key={departamento} value={departamento}>{departamento}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de contrato</label>
                <select className="form-select" value={formulario.tipo_contrato} onChange={(event) => setFormulario((actual) => ({ ...actual, tipo_contrato: event.target.value }))}>
                  {tiposContrato.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
            </div>
          </Painel>

          <Painel style={{ background: 'var(--bg-2)' }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Responsabilidades</div>
            <div className="module-inline-actions">
              {responsabilidadesDisponiveis.map((responsabilidade) => {
                const activa = formulario.responsabilidades.some((item) => item.tipo === responsabilidade.tipo);
                return (
                  <button
                    key={responsabilidade.tipo}
                    type="button"
                    className={`sector-chip${activa ? ' sector-chip--active' : ''}`}
                    onClick={() => alternarResponsabilidade(responsabilidade.tipo)}
                  >
                    {responsabilidade.etiqueta}
                  </button>
                );
              })}
            </div>
          </Painel>

          <div className="module-inline-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn--secondary" onClick={aoFechar}>Cancelar</button>
            <button type="button" className={`btn btn--primary${aGuardar ? ' btn--loading' : ''}`} onClick={submeter} disabled={aGuardar}>
              {!aGuardar && (emEdicao ? 'Actualizar funcionário' : 'Criar funcionário')}
            </button>
          </div>
        </div>
      </ModalBloco>
    </Modal>
  );
}

const GestaoFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [estado, setEstado] = useState('active');
  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(false);
  const [funcionarioActivo, setFuncionarioActivo] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resFuncionarios, resStats] = await Promise.all([
        api.get('/admin/employees', { params: { status: estado, limit: 100 } }),
        api.get('/admin/employees/stats'),
      ]);

      setFuncionarios(lerLista(resFuncionarios.data, 'funcionarios'));
      setEstatisticas(lerObjeto(resStats.data, 'estatisticas_gerais'));
    } catch (erro) {
      toast.error(`Erro ao carregar funcionários: ${extrairErro(erro)}`);
      setFuncionarios([]);
      setEstatisticas({});
    } finally {
      setCarregando(false);
    }
  }, [estado]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const listaFiltrada = useMemo(() => {
    const termo = valorSeguro(pesquisa).toLowerCase();
    if (!termo) return funcionarios;

    return funcionarios.filter((funcionario) => (
      [
        funcionario.nome,
        funcionario.email,
        funcionario.cargo,
        funcionario.departamento,
      ].filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo))
    ));
  }, [funcionarios, pesquisa]);

  const abrirNovo = () => {
    setFuncionarioActivo(null);
    setEmEdicao(false);
    setModalAberto(true);
  };

  const abrirEdicao = async (funcionario) => {
    try {
      const { data } = await api.get(`/admin/employees/${funcionario.id}`);
      setFuncionarioActivo(lerObjeto(data, 'funcionario'));
      setEmEdicao(true);
      setModalAberto(true);
    } catch (erro) {
      toast.error(`Erro ao carregar detalhe do funcionário: ${extrairErro(erro)}`);
    }
  };

  const criar = async (payload) => {
    await api.post('/admin/employees', payload);
    toast.success('Funcionário criado com sucesso.');
    carregar();
  };

  const actualizar = async (payload) => {
    await api.put(`/admin/employees/${funcionarioActivo.id}`, payload);
    toast.success('Funcionário actualizado com sucesso.');
    carregar();
  };

  const desactivar = async (funcionario) => {
    if (!window.confirm(`Deseja desactivar ${funcionario.nome}?`)) return;

    try {
      await api.delete(`/admin/employees/${funcionario.id}`, { data: { motivo: 'Desactivação administrativa.' } });
      toast.success('Funcionário desactivado com sucesso.');
      carregar();
    } catch (erro) {
      toast.error(`Erro ao desactivar funcionário: ${extrairErro(erro)}`);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Funcionários"
        subtitulo="Gerencie a equipa interna, distribua responsabilidades e mantenha o controlo operacional com um painel limpo e responsivo."
        acoes={(
          <div className="module-inline-actions">
            <BotaoAtualizar onClick={carregar} loading={carregando} />
            <button className="btn btn--primary btn--sm" onClick={abrirNovo}>
              <Plus size={14} /> Novo funcionário
            </button>
          </div>
        )}
      />

      <GradeResumo>
        <ResumoCard icone={<Users size={18} />} titulo="Total de funcionários" valor={estatisticas.total_funcionarios || funcionarios.length || 0} />
        <ResumoCard icone={<ShieldCheck size={18} />} titulo="Activos" valor={estatisticas.ativos || funcionarios.filter((item) => item.is_active).length} cor="var(--verde-100)" destaque="var(--verde)" />
        <ResumoCard icone={<UserCog size={18} />} titulo="Departamentos" valor={estatisticas.total_departamentos || 0} cor="var(--ciano-100)" destaque="var(--ciano)" />
        <ResumoCard icone={<Briefcase size={18} />} titulo="Inactivos" valor={estatisticas.inativos || funcionarios.filter((item) => !item.is_active).length} cor="var(--vermelho-100)" destaque="var(--vermelho)" />
      </GradeResumo>

      <BarraFerramentas
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        filtros={(
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Estado</label>
            <select className="form-select" value={estado} onChange={(event) => setEstado(event.target.value)}>
              {estadoOptions.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
            </select>
          </div>
        )}
        compacta
      />

      {!listaFiltrada.length && !carregando ? (
        <LinhaVazia titulo="Nenhum funcionário encontrado" descricao="Crie novos colaboradores ou ajuste a pesquisa para ver mais resultados." />
      ) : (
        <TabelaModulo colunas={['Funcionário', 'Estrutura', 'Contacto', 'Responsabilidades', 'Estado', 'Acções']}>
          {listaFiltrada.map((funcionario) => (
            <tr key={funcionario.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{funcionario.nome}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>ID interno: {funcionario.id}</div>
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>{funcionario.cargo || 'Sem cargo'}</div>
                <div style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>{funcionario.departamento || 'Sem departamento'}</div>
              </td>
              <td>
                <div className="module-stack" style={{ gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={13} /> {funcionario.email || 'Sem e-mail'}
                  </span>
                  <span style={{ color: 'var(--txt-3)', fontSize: '0.82rem' }}>
                    {funcionario.telefone || 'Sem telefone'}
                  </span>
                </div>
              </td>
              <td>
                <div className="module-inline-actions">
                  {(funcionario.responsabilidades || []).length ? (
                    funcionario.responsabilidades.slice(0, 2).map((responsabilidade, indice) => (
                      <BadgeModulo key={`${funcionario.id}-${indice}`} tonalidade="ciano">
                        {responsabilidade.tipo}
                      </BadgeModulo>
                    ))
                  ) : (
                    <BadgeModulo tonalidade="cinza">Sem funções atribuídas</BadgeModulo>
                  )}
                  {(funcionario.responsabilidades || []).length > 2 ? (
                    <BadgeModulo tonalidade="amarelo">+{funcionario.responsabilidades.length - 2}</BadgeModulo>
                  ) : null}
                </div>
              </td>
              <td>
                <BadgeModulo tonalidade={funcionario.is_active ? 'verde' : 'vermelho'}>
                  {funcionario.is_active ? 'activo' : 'inactivo'}
                </BadgeModulo>
              </td>
              <td>
                <div className="module-inline-actions">
                  <button className="btn btn--secondary btn--sm" onClick={() => abrirEdicao(funcionario)}>
                    <Edit3 size={14} /> Editar
                  </button>
                  {funcionario.is_active ? (
                    <button className="btn btn--danger btn--sm" onClick={() => desactivar(funcionario)}>
                      <Trash2 size={14} /> Desactivar
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </TabelaModulo>
      )}

      <FuncionariosModal
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoGuardar={emEdicao ? actualizar : criar}
        emEdicao={emEdicao}
        funcionario={funcionarioActivo}
      />
    </div>
  );
};

export default GestaoFuncionarios;
