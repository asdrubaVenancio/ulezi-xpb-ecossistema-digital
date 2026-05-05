// ============================================================
// Secções do painel administrativo (extraídas de DashboardAdmin)
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  CheckCircle,
  CreditCard,
  Eye,
  FileText,
  Folder,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Download,
  Shield,
  Users,
  X,
} from "lucide-react";
import GestaoCoordenadasBancarias from "../../../components/admin/GestaoCoordenadasBancarias.jsx";
import { useToast } from "../../../components/ui/Toast";
import {
  BadgeStatus,
  EmptyState,
  Modal,
  PageLoader,
  StatCard,
} from "../../../components/ui/index.jsx";
import { useAuth } from "../../../context/AuthContext";
import {
  adminAPI,
  authAPI,
  extrairErro,
  pagamentosAPI,
} from "../../../services/api";
import { formatAOA, formatData, iniciais } from "../../../utils/constants";

const BACKEND_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

// —
// PAINEL GERAL — dados reais
// —
export function PainelGeral({ navegarSecao }) {
  const [stats, setStats] = useState(null);
  const [empresasPend, setEmpresasPend] = useState([]);
  const [inscricoesPend, setInscricoesPend] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const toast = useToast();

  const carregar = useCallback(async () => {
    try {
      const [sRes, eRes, iRes] = await Promise.all([
        adminAPI.stats(),
        adminAPI.empresas({ status: "pendente", limite: 5 }),
        adminAPI.inscricoes({ status: "pendente", limite: 5 }),
      ]);
      const dadosStats = sRes.data.dados?.stats || sRes.data.dados || {};
      setStats(dadosStats);
      const empresasData = eRes.data.dados?.empresas || [];
      setEmpresasPend(empresasData);
      setInscricoesPend(iRes.data.dados?.slice(0, 5) || []);
    } catch (e) {
      toast.erro("Erro ao carregar estatísticas: " + extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) return <PageLoader />;

  return (
    <div className="dashboard">
      <div className="admin-toolbar admin-toolbar--end">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => carregar()}
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          icone={<Users size={20} color="var(--ciano)" />}
          label="Utilizadores"
          valor={stats?.total_utilizadores?.toLocaleString("pt-AO") || "0"}
          corIcone="var(--ciano-100)"
        />
        <StatCard
          icone={<BookOpen size={20} color="var(--laranja)" />}
          label="Inscrições"
          valor={stats?.total_inscricoes?.toLocaleString("pt-AO") || "0"}
          corIcone="var(--laranja-100)"
        />
        <StatCard
          icone={<Building2 size={20} color="var(--verde)" />}
          label="Empresas"
          valor={stats?.total_empresas?.toLocaleString("pt-AO") || "0"}
          corIcone="var(--verde-100)"
        />
        <StatCard
          icone={<CreditCard size={20} color="var(--vermelho)" />}
          label="Pag. pendentes"
          valor={stats?.pagamentos_pendentes?.toLocaleString("pt-AO") || "0"}
          corIcone="var(--vermelho-100)"
          alerta={stats?.pagamentos_pendentes > 0}
        />
      </div>

      <div className="dashboard-summary-grid">
        {/* Linha de actividade real */}
        <div className="card" style={{ padding: 24 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Resumo do sistema
          </h2>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--txt-3)",
              marginBottom: 20,
            }}
          >
            Estado atual do ecossistema
          </p>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {[
              {
                label: "Oportunidades activas",
                valor: stats?.total_oportunidades || 0,
                cor: "var(--ciano)",
              },
              {
                label: "Vagas em aberto",
                valor: stats?.total_vagas || 0,
                cor: "var(--verde)",
              },
              {
                label: "Empresas pendentes",
                valor: stats?.empresas_pendentes || 0,
                cor: "var(--amarelo)",
                alerta: true,
              },
              {
                label: "Op. em anlise",
                valor: stats?.oportunidades_pendentes || 0,
                cor: "var(--roxo)",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: 16,
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-input)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    color:
                      item.alerta && item.valor > 0
                        ? "var(--amarelo)"
                        : item.cor,
                  }}
                >
                  {item.valor}
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--txt-3)",
                    marginTop: 2,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1rem",
                fontWeight: 700,
              }}
            >
              Aprovações pendentes
            </h2>
            <button
              type="button"
              className="badge badge--amarelo"
              style={{ border: "none", cursor: "pointer" }}
              onClick={() => {
                if (empresasPend.length > 0) return navegarSecao?.("empresas");
                if (inscricoesPend.length > 0)
                  return navegarSecao?.("inscricoes");
              }}
              title="Abrir secção de aprovações pendentes"
            >
              {empresasPend.length + inscricoesPend.length} pendentes
            </button>
          </div>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--txt-3)",
              marginBottom: 16,
            }}
          >
            Empresas e inscrições aguardando validação
          </p>
          {inscricoesPend.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--txt-2)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Inscries ({inscricoesPend.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {inscricoesPend.map((i) => (
                  <div
                    key={i.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)",
                      padding: 10,
                      background: "var(--bg-2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {i.nome_aluno}
                      </span>
                      <span
                        className="badge badge--amarelo"
                        style={{ fontSize: "0.7rem" }}
                      >
                        Inscrio
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--txt-3)",
                        marginBottom: 6,
                      }}
                    >
                      {i.nome_curso} {formatData(i.created_at)}
                    </p>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm btn--full"
                      onClick={() => navegarSecao?.("inscricoes")}
                    >
                      Analisar inscrição
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empresas Pendentes */}
          {empresasPend.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--txt-2)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Empresas ({empresasPend.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {empresasPend.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)",
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {e.nome_empresa}
                      </span>
                      <span
                        className="badge badge--amarelo"
                        style={{ fontSize: "0.7rem" }}
                      >
                        Empresa
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--txt-3)",
                        marginBottom: 6,
                      }}
                    >
                      {formatData(e.criado_em)} {e.num_documentos} docs
                    </p>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm btn--full"
                      onClick={() => navegarSecao?.("empresas")}
                    >
                      Analisar empresa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {empresasPend.length === 0 && inscricoesPend.length === 0 && (
            <p
              style={{
                color: "var(--txt-4)",
                fontSize: "0.875rem",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              Nenhuma aprovação pendente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// —
// UTILIZADORES — dados reais
// —
export function Utilizadores() {
  const toast = useToast();

  // Mapeamento de papéis para português
  const traduzirPapel = (role) => {
    const mapa = {
      'student': 'Estudante',
      'admin': 'Administrador',
      'funcionario': 'Funcionário',
      'employee': 'Funcionário',
      'empresa': 'Empresa',
      'investidor': 'Investidor',
      'company': 'Empresa',
      'investor': 'Investidor',
    };
    return mapa[role] || role;
  };

  const [utilizadores, setUtilizadores] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroRole, setFiltroRole] = useState("");
  const [tipoEmpresa, setTipoEmpresa] = useState("");
  const [pagina, setPagina] = useState(1);

  const [modalUser, setModalUser] = useState(null);
  const [formatoExportacao, setFormatoExportacao] = useState("csv");
  const [exportando, setExportando] = useState(false);
  const [tipoListaExportacao, setTipoListaExportacao] = useState("estudantes");
  const [filtroCentroExportacao, setFiltroCentroExportacao] = useState("");
  const [filtroCursoExportacao, setFiltroCursoExportacao] = useState("");
  const [dataInicioExportacao, setDataInicioExportacao] = useState("");
  const [dataFimExportacao, setDataFimExportacao] = useState("");
  const [periodoPagamentoExportacao, setPeriodoPagamentoExportacao] =
    useState("todos");
  const [centrosExportacao, setCentrosExportacao] = useState([]);
  const [cursosExportacao, setCursosExportacao] = useState([]);
  const pesquisaTimer = useRef(null);

  const LIMITE = 20;

  const carregar = useCallback(
    async (p = pesquisa, r = filtroRole, te = tipoEmpresa, pg = pagina) => {
      setCarregando(true);
      try {
        const { data } = await adminAPI.utilizadores({
          pesquisa: p || undefined,
          role: r || undefined,
          tipo_empresa: te || undefined,
          page: pg,
          limit: LIMITE,
        });

        setUtilizadores(data.dados?.utilizadores || []);
        setTotal(data.dados?.total || 0);
        setTotalPaginas(data.dados?.total_paginas || 1);
      } catch (e) {
        toast.erro(extrairErro(e));
      } finally {
        setCarregando(false);
      }
    },
    [toast, pesquisa, filtroRole, tipoEmpresa, pagina],
  );

  useEffect(() => {
    setPagina(1);
    carregar(pesquisa, filtroRole, tipoEmpresa, 1);
  }, [filtroRole, tipoEmpresa]);

  const handlePesquisa = (v) => {
    setPesquisa(v);
    clearTimeout(pesquisaTimer.current);
    pesquisaTimer.current = setTimeout(() => {
      setPagina(1);
      carregar(v, filtroRole, tipoEmpresa, 1);
    }, 400);
  };

  const irPagina = (pg) => {
    setPagina(pg);
    carregar(pesquisa, filtroRole, tipoEmpresa, pg);
  };

  const alterarStatus = useCallback(
    async (id, novoStatus, roleUtilizador) => {
      if (roleUtilizador === "admin") {
        return toast.aviso("Não é possível alterar o estado do administrador.");
      }

      const ok = await toast.confirmar({
        titulo:
          novoStatus === "bloqueado"
            ? "Bloquear utilizador"
            : "Activar utilizador",
        mensagem:
          novoStatus === "bloqueado"
            ? "O utilizador não conseguirá entrar na plataforma. Continuar?"
            : "O utilizador voltará a ter acesso à plataforma.",
        variante: novoStatus === "bloqueado" ? "perigo" : "primário",
        labelOk: novoStatus === "bloqueado" ? "Bloquear" : "Activar",
      });
      if (!ok) return;

      try {
        await adminAPI.statusUser(id, novoStatus);
        setUtilizadores((p) =>
          p.map((u) => (u.id === id ? { ...u, status: novoStatus } : u)),
        );
        setModalUser(null);
        toast.sucesso("Estado do utilizador atualizado.");
      } catch (e) {
        toast.erro(extrairErro(e));
      }
    },
    [toast],
  );

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    adminAPI
      .centros({ limite: 200 })
      .then(({ data }) => {
        const bruto = data?.dados;
        const lista =
          (Array.isArray(bruto) && bruto) ||
          (Array.isArray(bruto?.centros) && bruto.centros) ||
          (Array.isArray(bruto?.data) && bruto.data) ||
          (Array.isArray(bruto?.data?.data) && bruto.data.data) ||
          [];
        setCentrosExportacao(lista);
      })
      .catch(() => setCentrosExportacao([]));

    adminAPI
      .cursos({ limite: 200 })
      .then(({ data }) => {
        const bruto = data?.dados;
        const lista =
          (Array.isArray(bruto) && bruto) ||
          (Array.isArray(bruto?.cursos) && bruto.cursos) ||
          (Array.isArray(bruto?.data) && bruto.data) ||
          [];
        setCursosExportacao(lista);
      })
      .catch(() => setCursosExportacao([]));
  }, []);

  const exportarLista = useCallback(async () => {
    try {
      setExportando(true);

      const resposta = await adminAPI.exportarLista(tipoListaExportacao, {
        formato: formatoExportacao,
        pesquisa: pesquisa || undefined,
        role: filtroRole || undefined,
        tipo_empresa: tipoEmpresa || undefined,
        centro_id:
          tipoListaExportacao === "estudantes"
            ? filtroCentroExportacao || undefined
            : undefined,
        curso_id:
          tipoListaExportacao === "estudantes"
            ? filtroCursoExportacao || undefined
            : undefined,
        data_inicio:
          tipoListaExportacao === "estudantes"
            ? dataInicioExportacao || undefined
            : undefined,
        data_fim:
          tipoListaExportacao === "estudantes"
            ? dataFimExportacao || undefined
            : undefined,
        periodo_pagamento:
          tipoListaExportacao === "estudantes"
            ? periodoPagamentoExportacao
            : undefined,
      });

      const extensao =
        formatoExportacao === "word"
          ? "doc"
          : formatoExportacao === "pdf"
            ? "pdf"
            : "csv";

      const blob = new Blob([resposta.data], {
        type:
          formatoExportacao === "pdf"
            ? "application/pdf"
            : formatoExportacao === "word"
              ? "application/msword"
              : "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lista-${tipoListaExportacao}.${extensao}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.sucesso("Lista exportada com sucesso.");
    } catch (e) {
      toast.erro("Erro ao exportar lista: " + extrairErro(e));
    } finally {
      setExportando(false);
    }
  }, [
    toast,
    tipoListaExportacao,
    formatoExportacao,
    pesquisa,
    filtroRole,
    tipoEmpresa,
    filtroCentroExportacao,
    filtroCursoExportacao,
    dataInicioExportacao,
    dataFimExportacao,
    periodoPagamentoExportacao,
  ]);

  const stats = {
    total,
    estudantes: utilizadores.filter((u) =>
      ["estudante", "student"].includes(u.role),
    ).length,
    empresas: utilizadores.filter((u) =>
      ["empresa", "company"].includes(u.role),
    ).length,
    investidores: utilizadores.filter((u) =>
      ["investidor", "investor"].includes(u.role),
    ).length,
  };

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: "Total", valor: total },
          { label: "Estudantes", valor: stats.estudantes },
          { label: "Empresas", valor: stats.empresas },
          { label: "Investidores", valor: stats.investidores },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "20px 24px" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 800,
              }}
            >
              {s.valor.toLocaleString("pt")}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div className="form-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} />
          <input
            className="form-input form-input--icon"
            placeholder="Pesquisar por nome ou e-mail..."
            value={pesquisa}
            onChange={(e) => handlePesquisa(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 170 }}
          value={filtroRole}
          onChange={(e) => setFiltroRole(e.target.value)}
        >
          <option value="">Todos os papéis</option>
          <option value="estudante">Estudante</option>
          <option value="empresa">Empresa</option>
          <option value="investidor">Investidor</option>
          <option value="funcionario">Funcionário</option>
        </select>
        <select
          className="form-select"
          style={{ width: 190 }}
          value={tipoEmpresa}
          onChange={(e) => setTipoEmpresa(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="empresa">Empresa normal</option>
          <option value="consultoria">Empresa consultoria</option>
        </select>
      </div>

      <div
        className="admin-toolbar"
        style={{ marginTop: 8, marginBottom: 16, gap: 10, flexWrap: "wrap" }}
      >
        <select
          className="form-select"
          style={{ width: 220 }}
          value={tipoListaExportacao}
          onChange={(e) => setTipoListaExportacao(e.target.value)}
        >
          <option value="geral">
            Lista geral (aluno + empresa + investidor)
          </option>
          <option value="estudantes">Lista de estudantes</option>
          <option value="empresas">Lista de empresas</option>
          <option value="investidores">Lista de investidores</option>
          <option value="funcionarios">Lista de funcionários</option>
        </select>

        {tipoListaExportacao === "estudantes" && (
          <>
            <select
              className="form-select"
              style={{ width: 220 }}
              value={filtroCentroExportacao}
              onChange={(e) => setFiltroCentroExportacao(e.target.value)}
            >
              <option value="">Todos os centros</option>
              {centrosExportacao.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 220 }}
              value={filtroCursoExportacao}
              onChange={(e) => setFiltroCursoExportacao(e.target.value)}
            >
              <option value="">Todos os cursos</option>
              {cursosExportacao.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="form-input"
              style={{ width: 180 }}
              value={dataInicioExportacao}
              onChange={(e) => setDataInicioExportacao(e.target.value)}
            />

            <input
              type="date"
              className="form-input"
              style={{ width: 180 }}
              value={dataFimExportacao}
              onChange={(e) => setDataFimExportacao(e.target.value)}
            />

            <select
              className="form-select"
              style={{ width: 220 }}
              value={periodoPagamentoExportacao}
              onChange={(e) => setPeriodoPagamentoExportacao(e.target.value)}
            >
              <option value="todos">Inscrição ou pagamento</option>
              <option value="inscricao">Apenas inscrição</option>
              <option value="pagamento">Apenas pagamento</option>
            </select>
          </>
        )}

        <select
          className="form-select"
          style={{ width: 170 }}
          value={formatoExportacao}
          onChange={(e) => setFormatoExportacao(e.target.value)}
        >
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
          <option value="word">WORD</option>
        </select>

        <button
          type="button"
          className={`btn btn--secondary btn--sm${exportando ? " btn--loading" : ""}`}
          disabled={exportando}
          onClick={exportarLista}
        >
          {!exportando && (
            <>
              <Download size={14} /> Exportar lista
            </>
          )}
        </button>
      </div>

      {carregando ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Estado</th>
                <th>Registo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {utilizadores.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "var(--txt-3)",
                    }}
                  >
                    Nenhum utilizador encontrado
                  </td>
                </tr>
              ) : (
                utilizadores.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "var(--ciano-100)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--ciano-600)",
                            flexShrink: 0,
                          }}
                        >
                          {iniciais(u.nome)}
                        </div>
                        <div>
                          <span style={{ fontWeight: 500 }}>{u.nome}</span>
                          {u.tipo_empresa === "consultoria" && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: "0.7rem",
                                background: "var(--ciano-100)",
                                color: "var(--ciano-600)",
                                padding: "1px 6px",
                                borderRadius: "var(--r-full)",
                                fontWeight: 600,
                              }}
                            >
                              Consultoria
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--txt-3)", fontSize: "0.85rem" }}>
                      {u.email}
                    </td>
                    <td>
                      <BadgeStatus status={u.role} />
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background:
                              u.status === "ativo"
                                ? "var(--verde)"
                                : u.status === "pendente"
                                  ? "var(--amarelo)"
                                  : "var(--txt-4)",
                          }}
                        />
                        <span
                          style={{
                            textTransform: "capitalize",
                            fontSize: "0.875rem",
                          }}
                        >
                          {u.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "var(--txt-3)", fontSize: "0.8rem" }}>
                      {formatData(u.created_at || u.criado_em)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setModalUser(u)}
                        title="Ações"
                        aria-label={`Ações para ${u.nome}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginTop: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={pagina === 1}
          onClick={() => irPagina(pagina - 1)}
        >
          ← Anterior
        </button>
        {Array.from({ length: Math.min(totalPaginas, 7) }, (_, i) => {
          const pg = pagina <= 4 ? i + 1 : pagina - 3 + i;
          if (pg < 1 || pg > totalPaginas) return null;
          return (
            <button
              key={pg}
              type="button"
              className={`btn btn--sm ${pagina === pg ? "btn--primary" : "btn--secondary"}`}
              onClick={() => irPagina(pg)}
            >
              {pg}
            </button>
          );
        })}
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={pagina === totalPaginas}
          onClick={() => irPagina(pagina + 1)}
        >
          Próxima →
        </button>
        <span style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
          Página {pagina} de {totalPaginas} · {total} utilizadores
        </span>
      </div>

      <Modal
        aberto={!!modalUser}
        onFechar={() => setModalUser(null)}
        titulo={`Conta — ${modalUser?.nome}`}
      >
        <p
          style={{
            color: "var(--txt-3)",
            fontSize: "0.875rem",
            marginBottom: 16,
          }}
        >
          Estado atual: <BadgeStatus status={modalUser?.status} />
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {modalUser?.status !== "ativo" && (
            <button
              type="button"
              className="btn btn--primary btn--full"
              onClick={() =>
                alterarStatus(modalUser.id, "ativo", modalUser.role)
              }
            >
              <Check size={15} /> Activar utilizador
            </button>
          )}
          {modalUser?.status !== "bloqueado" && (
            <button
              type="button"
              className="btn btn--danger btn--full"
              onClick={() =>
                alterarStatus(modalUser.id, "bloqueado", modalUser.role)
              }
            >
              <X size={15} /> Bloquear utilizador
            </button>
          )}
          {modalUser?.status !== "inativo" && (
            <button
              type="button"
              className="btn btn--secondary btn--full"
              onClick={() =>
                alterarStatus(modalUser.id, "inativo", modalUser.role)
              }
            >
              Desactivar conta
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

// —
// CURSOS — dados reais
// —
export function Cursos() {
  const toast = useToast();
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nome: "", categoria: "" });
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await adminAPI.cursos({ limite: 50 });
      setCursos(data.dados?.cursos || []);
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirModal = (curso = null) => {
    setEditando(curso);
    setForm(
      curso
        ? {
            nome: curso.nome,
            categoria: curso.categoria || "",
          }
        : { nome: "", categoria: "" },
    );
    setModalAberto(true);
  };

  const guardar = async () => {
    if (!form.nome.trim()) return toast.aviso("Nome do curso obrigatório");
    setEnviando(true);
    try {
      if (editando) {
        await adminAPI.editarCurso(editando.id, form);
        toast.sucesso("Curso atualizado!");
      } else {
        await adminAPI.criarCurso(form);
        toast.sucesso("Curso criado!");
      }
      setModalAberto(false);
      carregar();
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setEnviando(false);
    }
  };

  const toggleActivo = async (curso) => {
    const ok = await toast.confirmar({
      titulo: curso.ativo ? "Desactivar curso" : "Activar curso",
      mensagem: curso.ativo
        ? "Este curso ficar indisponível para inscrições."
        : "Este curso ficar visível para inscrições.",
      variante: curso.ativo ? "perigo" : "primário",
      labelOk: curso.ativo ? "Desactivar" : "Activar",
    });
    if (!ok) return;
    try {
      await adminAPI.editarCurso(curso.id, { ativo: !curso.ativo });
      setCursos((p) =>
        p.map((c) => (c.id === curso.id ? { ...c, ativo: !c.ativo } : c)),
      );
      toast.sucesso(curso.ativo ? "Curso desactivado." : "Curso activado.");
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  };

  return (
    <div>
      <div className="admin-toolbar admin-toolbar--split">
        <span className="admin-toolbar__hint">
          Catálogo e disponibilidade para inscrições
        </span>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => abrirModal()}
        >
          <Plus size={15} /> Novo curso
        </button>
      </div>

      {carregando ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cursos.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "var(--txt-3)",
                    }}
                  >
                    Nenhum curso encontrado
                  </td>
                </tr>
              ) : (
                cursos.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.nome}</td>
                    <td style={{ color: "var(--txt-2)" }}>
                      {c.categoria || "?"}
                    </td>
                    <td>
                      <BadgeStatus status={c.ativo ? "activo" : "inactivo"} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => abrirModal(c)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`btn btn--sm ${c.ativo ? "btn--danger" : "btn--primary"}`}
                          onClick={() => toggleActivo(c)}
                        >
                          {c.ativo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo={editando ? "Editar Curso" : "Novo Curso"}
        acoes={
          <>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setModalAberto(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`btn btn--primary${enviando ? " btn--loading" : ""}`}
              onClick={guardar}
              disabled={enviando}
            >
              {!enviando && (
                <>
                  <Save size={14} /> Guardar
                </>
              )}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome do curso *</label>
            <input
              className="form-input"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Informtica bsica"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <input
              className="form-input"
              value={form.categoria}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoria: e.target.value }))
              }
              placeholder="Ex: Informática"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

// —
// EMPRESAS — dados reais
// —
export function Empresas() {
  const toast = useToast();
  const [empresas, setEmpresas] = useState([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [abaActiva, setAbaActiva] = useState("todas");
  const [pesquisa, setPesquisa] = useState("");
  const [modalEmp, setModalEmp] = useState(null);
  const [motivo, setMotivo] = useState("");

  const carregar = useCallback(
    async (status = "") => {
      setCarregando(true);
      try {
        const { data } = await adminAPI.empresas({
          status,
          pesquisa,
          limite: 50,
        });
        setEmpresas(data.dados?.empresas || []);
        setTotal(data.dados?.total || 0);
      } catch (e) {
        toast.erro(extrairErro(e));
      } finally {
        setCarregando(false);
      }
    },
    [pesquisa, toast],
  );

  useEffect(() => {
    carregar(abaActiva === "pendentes" ? "pendente" : "");
  }, [abaActiva]);

  const aprovar = async (id, aprovado) => {
    // Backend exige motivo quando rejeitado
    if (!aprovado && !motivo.trim()) {
      toast.aviso("O motivo de rejeição é obrigatório");
      return;
    }

    const ok = await toast.confirmar({
      titulo: aprovado ? "Aprovar empresa" : "Rejeitar empresa",
      mensagem: aprovado
        ? "A empresa ficará visível no marketplace e poderá publicar oportunidades."
        : `Motivo: "${motivo}"`,
      variante: aprovado ? "primário" : "perigo",
      labelOk: aprovado ? "Aprovar" : "Rejeitar",
    });
    if (!ok) return;

    try {
      await adminAPI.aprovarEmpresa(id, { aprovado, motivo: motivo || null });
      setEmpresas((p) =>
        p.map((e) =>
          e.id === id
            ? { ...e, status_aprovacao: aprovado ? "aprovada" : "rejeitada" }
            : e,
        ),
      );
      setModalEmp(null);
      setMotivo("");
      toast.sucesso(
        aprovado ? "Empresa aprovada com sucesso!" : "Empresa rejeitada.",
      );
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  };

  const pendentes = empresas.filter((e) => e.status_aprovacao === "pendente");

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: "Total", valor: total },
          {
            label: "Aprovadas",
            valor: empresas.filter((e) => e.status_aprovacao === "aprovada")
              .length,
          },
          {
            label: "Pendentes",
            valor: pendentes.length,
            alerta: pendentes.length > 0,
          },
          {
            label: "Rejeitadas",
            valor: empresas.filter((e) => e.status_aprovacao === "rejeitada")
              .length,
          },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "20px 24px" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 800,
                color: s.alerta ? "var(--amarelo)" : undefined,
              }}
            >
              {s.valor}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`tab-btn${abaActiva === "todas" ? " active" : ""}`}
          onClick={() => setAbaActiva("todas")}
        >
          Todas
        </button>
        <button
          type="button"
          className={`tab-btn${abaActiva === "pendentes" ? " active" : ""}`}
          onClick={() => setAbaActiva("pendentes")}
        >
          Pendentes{" "}
          {pendentes.length > 0 && (
            <span
              style={{
                background: "var(--amarelo)",
                color: "white",
                fontSize: "0.7rem",
                padding: "0 6px",
                borderRadius: "var(--r-full)",
              }}
            >
              {pendentes.length}
            </span>
          )}
        </button>
      </div>

      {carregando ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Setor</th>
                <th>Estado</th>
                <th>Documentos</th>
                <th>Registo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {empresas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "var(--txt-3)",
                    }}
                  >
                    Nenhuma empresa encontrada
                  </td>
                </tr>
              ) : (
                empresas.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            background: "var(--bg-input)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Building2 size={14} color="var(--txt-3)" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                            {e.nome_empresa}
                          </p>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--txt-3)",
                            }}
                          >
                            {formatData(e.criado_em)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--txt-2)" }}>
                      {e.setor_atividade || "?"}
                    </td>
                    <td>
                      <BadgeStatus status={e.status_aprovacao} />
                    </td>
                    <td>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "0.875rem",
                          color: "var(--txt-3)",
                        }}
                      >
                        <FileText size={14} /> {e.num_documentos || 0}
                      </span>
                    </td>
                    <td style={{ color: "var(--txt-3)", fontSize: "0.8rem" }}>
                      {formatData(e.criado_em)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          setModalEmp(e);
                          setMotivo("");
                        }}
                        aria-label={`Opções — ${e.nome_empresa}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        aberto={!!modalEmp}
        onFechar={() => setModalEmp(null)}
        titulo={`Empresa — ${modalEmp?.nome_empresa}`}
      >
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--txt-2)",
            marginBottom: 16,
          }}
        >
          Estado: <BadgeStatus status={modalEmp?.status_aprovacao} />
        </p>
        {modalEmp?.status_aprovacao === "pendente" ? (
          <>
            <button
              type="button"
              className="btn btn--primary btn--full"
              style={{ marginBottom: 8 }}
              onClick={() => aprovar(modalEmp.id, true)}
            >
              <Check size={15} /> Aprovar empresa
            </button>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">Motivo de rejeio (opcional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Documentação incompleta, NIF inválido?"
              />
            </div>
            <button
              type="button"
              className="btn btn--danger btn--full"
              onClick={() => aprovar(modalEmp.id, false)}
            >
              <X size={15} /> Rejeitar empresa
            </button>
          </>
        ) : (
          <p style={{ color: "var(--txt-3)", fontSize: "0.875rem" }}>
            {modalEmp?.status_aprovacao === "aprovada"
              ? "Esta empresa já foi aprovada."
              : "Esta empresa foi rejeitada."}
          </p>
        )}
      </Modal>
    </div>
  );
}

// —
// INVESTIMENTOS
// —
export function Investimentos() {
  const toast = useToast();
  const [empresas, setEmpresas] = useState([]);
  const [contagens, setContagens] = useState({
    total: 0,
    aprovadas: 0,
    pendentes: 0,
    rejeitadas: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [abaActiva, setAbaActiva] = useState("todas");
  const [pesquisa, setPesquisa] = useState("");
  const [modalEmp, setModalEmp] = useState(null);
  const [detalheEmpresa, setDetalheEmpresa] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviandoAcao, setEnviandoAcao] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const status =
        abaActiva === "pendentes"
          ? "pendente"
          : abaActiva === "aprovadas"
            ? "aprovada"
            : abaActiva === "rejeitadas"
              ? "rejeitada"
              : "";

      const { data } = await adminAPI.empresas({
        status,
        pesquisa,
        limite: 50,
      });
      setEmpresas(data.dados?.empresas || []);
      setContagens(
        data.dados?.contagens || {
          total: 0,
          aprovadas: 0,
          pendentes: 0,
          rejeitadas: 0,
        },
      );
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [abaActiva, pesquisa, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirAnalise = useCallback(
    async (empresaBase) => {
      setModalEmp(empresaBase);
      setMotivo("");
      setCarregandoDetalhe(true);

      try {
        const { data } = await adminAPI.empresaDetalhe(empresaBase.id);
        setDetalheEmpresa(data.dados || null);
      } catch (e) {
        toast.erro(
          "Nao foi possivel carregar os documentos da empresa: " +
            extrairErro(e),
        );
        setDetalheEmpresa(null);
      } finally {
        setCarregandoDetalhe(false);
      }
    },
    [toast],
  );

  const decidirEmpresa = async (empresaId, aprovado) => {
    if (!aprovado && !motivo.trim()) {
      toast.aviso("O motivo de rejeicao e obrigatorio");
      return;
    }

    const ok = await toast.confirmar({
      titulo: aprovado ? "Aprovar empresa" : "Rejeitar empresa",
      mensagem: aprovado
        ? "A empresa ficara visivel no marketplace e podera publicar oportunidades."
        : `Motivo: "${motivo}"`,
      variante: aprovado ? "primário" : "perigo",
      labelOk: aprovado ? "Aprovar" : "Rejeitar",
    });
    if (!ok) return;

    try {
      setEnviandoAcao(true);
      if (aprovado) {
        await adminAPI.aprovarEmpresa(empresaId, {});
      } else {
        await adminAPI.rejeitarEmpresa(empresaId, { motivo: motivo.trim() });
      }
      await carregar();
      setModalEmp(null);
      setDetalheEmpresa(null);
      setMotivo("");
      toast.sucesso(
        aprovado ? "Empresa aprovada com sucesso!" : "Empresa rejeitada.",
      );
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setEnviandoAcao(false);
    }
  };

  const empresaSelecionada = detalheEmpresa?.empresa || modalEmp;
  const documentos = detalheEmpresa?.documentos || [];
  const assinaturas = detalheEmpresa?.assinaturas || [];
  const estadoEmpresa = empresaSelecionada?.estado || "pendente";

  const obterUrlDocumento = (url) => {
    if (!url) return "#";
    if (/^https?:\/\//i.test(url)) return url;
    return `${BACKEND_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div>
      <div className="admin-toolbar admin-toolbar--split admin-toolbar--wrap">
        <p
          className="admin-toolbar__hint"
          style={{ maxWidth: "min(100%, 420px)", margin: 0 }}
        >
          Validar documentao e decidir aprovação com contexto completo.
        </p>
        <div className="admin-toolbar__actions">
          <div
            className="form-input-wrapper"
            style={{ minWidth: 200, flex: "1 1 200px" }}
          >
            <Search size={16} />
            <input
              className="form-input form-input--icon"
              placeholder="Empresa, representante ou NIF"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              aria-label="Pesquisar empresas"
            />
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={carregar}
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: "Total", valor: contagens.total || 0 },
          { label: "Aprovadas", valor: contagens.aprovadas || 0 },
          {
            label: "Pendentes",
            valor: contagens.pendentes || 0,
            alerta: (contagens.pendentes || 0) > 0,
          },
          { label: "Rejeitadas", valor: contagens.rejeitadas || 0 },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "20px 24px" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 800,
                color: s.alerta ? "var(--amarelo)" : undefined,
              }}
            >
              {s.valor}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`tab-btn${abaActiva === "todas" ? " active" : ""}`}
          onClick={() => setAbaActiva("todas")}
        >
          Todas
        </button>
        <button
          type="button"
          className={`tab-btn${abaActiva === "pendentes" ? " active" : ""}`}
          onClick={() => setAbaActiva("pendentes")}
        >
          Pendentes{" "}
          {(contagens.pendentes || 0) > 0 && (
            <span
              style={{
                background: "var(--amarelo)",
                color: "white",
                fontSize: "0.7rem",
                padding: "0 6px",
                borderRadius: "var(--r-full)",
              }}
            >
              {contagens.pendentes}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`tab-btn${abaActiva === "aprovadas" ? " active" : ""}`}
          onClick={() => setAbaActiva("aprovadas")}
        >
          Aprovadas
        </button>
        <button
          type="button"
          className={`tab-btn${abaActiva === "rejeitadas" ? " active" : ""}`}
          onClick={() => setAbaActiva("rejeitadas")}
        >
          Rejeitadas
        </button>
      </div>

      {carregando ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Sector</th>
                <th>Estado</th>
                <th>Documentos</th>
                <th>Localização</th>
                <th>Registo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {empresas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "var(--txt-3)",
                    }}
                  >
                    Nenhuma empresa encontrada
                  </td>
                </tr>
              ) : (
                empresas.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            background: "var(--bg-input)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Building2 size={14} color="var(--txt-3)" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                            {e.nome_empresa}
                          </p>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--txt-3)",
                            }}
                          >
                            {e.representante || "Representante nao informado"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--txt-2)" }}>{e.sector || "—"}</td>
                    <td>
                      <BadgeStatus status={e.estado} />
                    </td>
                    <td>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "0.875rem",
                          color: "var(--txt-3)",
                        }}
                      >
                        <FileText size={14} /> {e.num_documentos || 0}
                      </span>
                    </td>
                    <td style={{ color: "var(--txt-3)", fontSize: "0.8rem" }}>
                      {[e.provincia, e.municipio].filter(Boolean).join(", ") ||
                        "—"}
                    </td>
                    <td style={{ color: "var(--txt-3)", fontSize: "0.8rem" }}>
                      {formatData(e.criado_em)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => abrirAnalise(e)}
                      >
                        <Eye size={15} /> Analisar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        aberto={!!modalEmp}
        onFechar={() => {
          setModalEmp(null);
          setDetalheEmpresa(null);
          setMotivo("");
        }}
        titulo={
          empresaSelecionada
            ? `Avaliação documental — ${empresaSelecionada.nome_empresa}`
            : "Avaliação documental"
        }
        largura={980}
      >
        {carregandoDetalhe ? (
          <PageLoader />
        ) : !empresaSelecionada ? (
          <EmptyState
            icone={<Building2 size={28} />}
            titulo="Empresa indisponível"
            descricao="Nao foi possivel carregar os dados desta empresa."
          />
        ) : (
          <div className="company-review-shell">
            <div className="company-review-summary">
              <BadgeStatus status={estadoEmpresa} />
              <span className="badge badge--cinza">
                {documentos.length} documento(s)
              </span>
              <span className="badge badge--cinza">
                {assinaturas.length} assinatura(s)
              </span>
            </div>

            <div className="company-review-grid">
              <div className="company-review-panel">
                <p className="company-review-panel__title">Dados da empresa</p>
                <p className="company-review-panel__desc">
                  Confirme a identidade da empresa, o responsável e a
                  consistência dos campos apresentados.
                </p>

                <div className="company-metadata-grid">
                  {[
                    ["Empresa", empresaSelecionada.nome_empresa],
                    [
                      "Responsável",
                      empresaSelecionada.nome ||
                        empresaSelecionada.representante,
                    ],
                    ["E-mail", empresaSelecionada.email],
                    ["Telefone", empresaSelecionada.telefone],
                    ["NIF", empresaSelecionada.nif],
                    ["Sector", empresaSelecionada.sector],
                    ["Província", empresaSelecionada.provincia],
                    ["Município", empresaSelecionada.municipio],
                  ].map(([label, value]) => (
                    <div key={label} className="company-meta-item">
                      <p className="company-meta-item__label">{label}</p>
                      <p className="company-meta-item__value">{value || "—"}</p>
                    </div>
                  ))}
                </div>

                {empresaSelecionada.motivo_rejeicao && (
                  <div
                    className="alert alert--warning"
                    style={{ marginTop: 16 }}
                  >
                    <AlertCircle size={16} />
                    <div>
                      <strong>Motivo da rejeição anterior</strong>
                      <p>{empresaSelecionada.motivo_rejeicao}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="company-review-panel">
                <p className="company-review-panel__title">
                  Decisão administrativa
                </p>
                <p className="company-review-panel__desc">
                  Aprove ou rejeite apenas depois de validar a documentação e a
                  legitimidade do perfil.
                </p>

                <div className="company-review-actions">
                  <div className="form-group">
                    <label className="form-label">
                      Observações ou motivo de rejeição
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ex.: documentação ilegível, dados inconsistentes, falta de confirmação presencial..."
                    />
                  </div>

                  {estadoEmpresa === "pendente" ? (
                    <>
                      <button
                        type="button"
                        className={`btn btn--primary btn--full${enviandoAcao ? " btn--loading" : ""}`}
                        onClick={() =>
                          decidirEmpresa(empresaSelecionada.id, true)
                        }
                        disabled={enviandoAcao}
                      >
                        {!enviandoAcao && (
                          <>
                            <Check size={15} /> Aprovar empresa
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className={`btn btn--danger btn--full${enviandoAcao ? " btn--loading" : ""}`}
                        onClick={() =>
                          decidirEmpresa(empresaSelecionada.id, false)
                        }
                        disabled={enviandoAcao}
                      >
                        {!enviandoAcao && (
                          <>
                            <X size={15} /> Rejeitar empresa
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div
                      className={`alert ${estadoEmpresa === "aprovada" ? "alert--success" : "alert--warning"}`}
                    >
                      {estadoEmpresa === "aprovada" ? (
                        <CheckCircle size={16} />
                      ) : (
                        <AlertCircle size={16} />
                      )}
                      <div>
                        <strong>
                          {estadoEmpresa === "aprovada"
                            ? "Empresa já aprovada"
                            : "Empresa rejeitada"}
                        </strong>
                        <p>
                          {estadoEmpresa === "aprovada"
                            ? "Este perfil já foi validado e pode operar segundo as regras actuais da plataforma."
                            : "Revise o motivo da rejeição antes de solicitar novos documentos ou nova submissão."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="company-review-panel">
              <p className="company-review-panel__title">Documentos enviados</p>
              <p className="company-review-panel__desc">
                Abra os ficheiros, confirme se estão legíveis e compare com os
                dados do cadastro.
              </p>

              {documentos.length === 0 ? (
                <EmptyState
                  icone={<FileText size={24} />}
                  titulo="Sem documentos"
                  descricao="Esta empresa ainda não anexou documentos para validação."
                />
              ) : (
                <div className="company-docs-grid">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="company-doc-card">
                      <div className="company-doc-card__top">
                        <div>
                          <p className="company-doc-card__title">
                            {doc.tipo || "Documento"}
                          </p>
                          <p className="company-doc-card__name">
                            {doc.nome_ficheiro || "Ficheiro anexado"}
                          </p>
                        </div>
                        <BadgeStatus
                          status={doc.status_verificacao || "pendente"}
                        />
                      </div>
                      <p style={{ color: "var(--txt-4)", fontSize: "0.74rem" }}>
                        {formatData(doc.created_at)}
                      </p>
                      <a
                        className="btn btn--secondary btn--sm"
                        href={obterUrlDocumento(doc.url_ficheiro)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Eye size={14} /> Ver documento
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="company-review-panel">
              <p className="company-review-panel__title">
                Histórico de assinaturas
              </p>
              <p className="company-review-panel__desc">
                Consulte a situação comercial do perfil empresarial.
              </p>

              {assinaturas.length === 0 ? (
                <EmptyState
                  icone={<CreditCard size={24} />}
                  titulo="Sem assinaturas"
                  descricao="Ainda não existem assinaturas registadas para esta empresa."
                />
              ) : (
                <div className="company-subscription-list">
                  {assinaturas.map((assinatura) => (
                    <div
                      key={assinatura.id}
                      className="company-subscription-item"
                    >
                      <div className="company-subscription-item__meta">
                        <strong>
                          {assinatura.plano || "Plano não definido"}
                        </strong>
                        <BadgeStatus status={assinatura.status} />
                      </div>
                      <p style={{ color: "var(--txt-3)", fontSize: "0.8rem" }}>
                        {formatData(assinatura.data_inicio)} até{" "}
                        {formatData(assinatura.data_fim)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// —
// PAGAMENTOS — dados reais
// —
export function Pagamentos() {
  const toast = useToast();
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalPag, setModalPag] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [cursos, setCursos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [meta, setMeta] = useState({
    total: 0,
    pagina: 1,
    limite: 25,
    totalPaginas: 1,
  });
  const [resumo, setResumo] = useState({
    receitaConfirmada: 0,
    pendentes: 0,
    confirmados: 0,
    total: 0,
  });
  const [filtros, setFiltros] = useState({
    pesquisa: "",
    status: "",
    metodo: "",
    curso_id: "",
    data_inicio: "",
    data_fim: "",
    valor_min: "",
    valor_max: "",
    comprovativo: "",
    limite: 25,
  });

  const carregar = async (paginaAtual = pagina, filtrosAtuais = filtros) => {
    try {
      setCarregando(true);
      const params = {
        ...filtrosAtuais,
        pagina: paginaAtual,
        limite: Number(filtrosAtuais.limite) || 25,
      };

      Object.keys(params).forEach((chave) => {
        if (params[chave] === "" || params[chave] == null) delete params[chave];
      });

      const { data } = await pagamentosAPI.adminListar(params);
      setPagamentos(data.dados?.pagamentos || []);
      setMeta({
        total: Number(data.dados?.total || 0),
        pagina: Number(data.dados?.pagina || paginaAtual),
        limite: Number(data.dados?.limite || params.limite),
        totalPaginas: Number(data.dados?.total_paginas || 1),
      });
      setResumo({
        receitaConfirmada: Number(data.dados?.resumo?.receita_confirmada || 0),
        pendentes: Number(data.dados?.resumo?.pendentes || 0),
        confirmados: Number(data.dados?.resumo?.confirmados || 0),
        total: Number(data.dados?.resumo?.total || 0),
      });
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
    adminAPI
      .cursos({ limite: 200 })
      .then(({ data }) => setCursos(data.dados?.cursos || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pagina !== 1) carregar(pagina);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  const actualizarFiltro = (campo, valor) => {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }));
  };

  const aplicarFiltros = () => {
    setPagina(1);
    carregar(1, filtros);
  };

  const limparFiltros = () => {
    const limpos = {
      pesquisa: "",
      status: "",
      metodo: "",
      curso_id: "",
      data_inicio: "",
      data_fim: "",
      valor_min: "",
      valor_max: "",
      comprovativo: "",
      limite: 25,
    };
    setFiltros(limpos);
    setPagina(1);
    carregar(1, limpos);
  };

  const validar = async (id, aprovado) => {
    if (!aprovado && (!motivo || motivo.trim().length < 10)) {
      toast.aviso("Indique o motivo da rejeio (mnimo 10 caracteres)");
      return;
    }

    const ok = await toast.confirmar({
      titulo: aprovado ? "Confirmar pagamento" : "Rejeitar pagamento",
      mensagem: aprovado
        ? "O utilizador receber confirmao e a inscrio ser activada."
        : `Motivo: "${motivo}"`,
      variante: aprovado ? "primário" : "perigo",
      labelOk: aprovado ? "Confirmar" : "Rejeitar",
    });
    if (!ok) return;

    try {
      await pagamentosAPI.adminValidar(id, {
        aprovado,
        motivo_rejeicao: motivo || null,
      });
      setPagamentos((anteriores) =>
        anteriores.map((pg) =>
          pg.id === id
            ? { ...pg, status: aprovado ? "confirmado" : "rejeitado" }
            : pg,
        ),
      );
      setModalPag(null);
      setMotivo("");
      toast.sucesso(
        aprovado ? "Pagamento confirmado!" : "Pagamento rejeitado.",
      );
      carregar(meta.pagina || 1);
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  };

  const totalReceita = resumo.receitaConfirmada;
  const pendentes = resumo.pendentes;
  const totalRegistos = meta.total;
  const indiceInicial =
    totalRegistos === 0 ? 0 : (meta.pagina - 1) * meta.limite + 1;
  const indiceFinal =
    totalRegistos === 0
      ? 0
      : Math.min(meta.pagina * meta.limite, totalRegistos);
  const paginasVisiveis = [];
  const primeiraPagina = Math.max(1, meta.pagina - 2);
  const ultimaPagina = Math.min(meta.totalPaginas, meta.pagina + 2);

  for (let i = primeiraPagina; i <= ultimaPagina; i += 1)
    paginasVisiveis.push(i);

  return (
    <div>
      <div
        className="admin-toolbar admin-toolbar--end"
        style={{ marginBottom: 16 }}
      >
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => carregar(meta.pagina || 1)}
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            className="form-group"
            style={{ gridColumn: "span 2", minWidth: 0 }}
          >
            <label className="form-label">Pesquisa</label>
            <div className="form-input-wrapper">
              <Search size={16} />
              <input
                className="form-input form-input--icon"
                placeholder="Referncia, utilizador, curso ou ID"
                value={filtros.pesquisa}
                onChange={(e) => actualizarFiltro("pesquisa", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") aplicarFiltros();
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Estado</label>
            <select
              className="form-select"
              value={filtros.status}
              onChange={(e) => actualizarFiltro("status", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="rejeitado">Rejeitado</option>
              <option value="reembolsado">Reembolsado</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Mtodo</label>
            <select
              className="form-select"
              value={filtros.metodo}
              onChange={(e) => actualizarFiltro("metodo", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="transferencia">Transferncia</option>
              <option value="referencia">Referncia</option>
              <option value="multibanco">Multibanco</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Curso</label>
            <select
              className="form-select"
              value={filtros.curso_id}
              onChange={(e) => actualizarFiltro("curso_id", e.target.value)}
            >
              <option value="">Todos</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Comprovativo</label>
            <select
              className="form-select"
              value={filtros.comprovativo}
              onChange={(e) => actualizarFiltro("comprovativo", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="com">Com comprovativo</option>
              <option value="sem">Sem comprovativo</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Data inicial</label>
            <input
              type="date"
              className="form-input"
              value={filtros.data_inicio}
              onChange={(e) => actualizarFiltro("data_inicio", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Data final</label>
            <input
              type="date"
              className="form-input"
              value={filtros.data_fim}
              onChange={(e) => actualizarFiltro("data_fim", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valor mnimo</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="form-input"
              value={filtros.valor_min}
              onChange={(e) => actualizarFiltro("valor_min", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valor mximo</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="form-input"
              value={filtros.valor_max}
              onChange={(e) => actualizarFiltro("valor_max", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Itens por pgina</label>
            <select
              className="form-select"
              value={filtros.limite}
              onChange={(e) =>
                actualizarFiltro("limite", Number(e.target.value))
              }
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={aplicarFiltros}
          >
            Filtrar
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={limparFiltros}
          >
            Limpar
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "0.85rem", color: "var(--txt-3)" }}>
          {totalRegistos > 0
            ? `A mostrar ${indiceInicial}-${indiceFinal} de ${totalRegistos} pagamentos`
            : "Nenhum pagamento encontrado"}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: "20px 24px" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.6rem",
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            {formatAOA(totalReceita)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
            Receita Confirmada
          </div>
        </div>
        <div className="card" style={{ padding: "20px 24px" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.6rem",
              fontWeight: 800,
              marginBottom: 4,
              color: pendentes > 0 ? "var(--amarelo)" : undefined,
            }}
          >
            {pendentes}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
            Aguardam Validao
          </div>
        </div>
        <div className="card" style={{ padding: "20px 24px" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.6rem",
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            {totalRegistos}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
            Total de Transaes
          </div>
        </div>
        <div className="card" style={{ padding: "20px 24px" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.6rem",
              fontWeight: 800,
              marginBottom: 4,
              color: "var(--verde)",
            }}
          >
            {resumo.confirmados}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
            Confirmados
          </div>
        </div>
      </div>

      {carregando ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Referência</th>
                <th>Utilizador</th>
                <th>Curso</th>
                <th>Método</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "var(--txt-3)",
                    }}
                  >
                    Nenhum pagamento encontrado
                  </td>
                </tr>
              ) : (
                pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td
                      style={{
                        fontWeight: 600,
                        color: "var(--txt-3)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {p.referencia || `PAG-${p.id}`}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {p.nome_utilizador || p.user_nome || "?"}
                    </td>
                    <td style={{ color: "var(--txt-3)", fontSize: "0.85rem" }}>
                      {p.nome_curso || "?"}
                    </td>
                    <td
                      style={{
                        color: "var(--txt-3)",
                        fontSize: "0.85rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {p.metodo || "?"}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatAOA(p.valor)}</td>
                    <td>
                      <BadgeStatus status={p.status} />
                    </td>
                    <td style={{ color: "var(--txt-3)", fontSize: "0.8rem" }}>
                      {formatData(p.criado_em || p.data)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {p.comprovativo_url && (
                          <a
                            href={`${BACKEND_BASE_URL}${p.comprovativo_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn--secondary btn--sm"
                            title="Ver comprovativo"
                          >
                            <Eye size={13} />
                          </a>
                        )}
                        {["pendente", "aguardando_validacao"].includes(
                          p.status,
                        ) && (
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={() => {
                              setModalPag(p);
                              setMotivo("");
                            }}
                          >
                            Validar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPaginas > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "var(--txt-3)" }}>
            Pgina {meta.pagina} de {meta.totalPaginas}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={meta.pagina <= 1}
              onClick={() => setPagina((anterior) => Math.max(1, anterior - 1))}
            >
              Anterior
            </button>
            {paginasVisiveis.map((numero) => (
              <button
                type="button"
                key={numero}
                className={`btn btn--sm ${numero === meta.pagina ? "btn--primary" : "btn--secondary"}`}
                onClick={() => setPagina(numero)}
              >
                {numero}
              </button>
            ))}
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={meta.pagina >= meta.totalPaginas}
              onClick={() =>
                setPagina((anterior) =>
                  Math.min(meta.totalPaginas, anterior + 1),
                )
              }
            >
              Seguinte
            </button>
          </div>
        </div>
      )}

      <Modal
        aberto={!!modalPag}
        onFechar={() => setModalPag(null)}
        titulo={`Validar Pagamento`}
      >
        <div
          style={{
            background: "var(--bg-input)",
            borderRadius: "var(--r-md)",
            padding: 14,
            marginBottom: 16,
          }}
        >
          <p style={{ fontWeight: 600 }}>{modalPag?.nome_utilizador || "?"}</p>
          <p
            style={{ fontSize: "0.85rem", color: "var(--txt-3)", marginTop: 4 }}
          >
            {formatAOA(modalPag?.valor)} {modalPag?.metodo || "Pagamento"}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--full"
          style={{ marginBottom: 8 }}
          onClick={() => validar(modalPag.id, true)}
        >
          <Check size={15} /> Confirmar pagamento
        </button>
        <div className="form-group" style={{ marginBottom: 8 }}>
          <label className="form-label">Motivo de rejeio (se aplicvel)</label>
          <textarea
            className="form-textarea"
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Comprovativo ilegvel, valor incorreto..."
          />
        </div>
        <button
          type="button"
          className="btn btn--danger btn--full"
          onClick={() => validar(modalPag.id, false)}
        >
          <X size={15} /> Rejeitar pagamento
        </button>
      </Modal>
    </div>
  );
}
// SEC—ES SIMPLES
// —
export function Contratos() {
  return (
    <SecaoSimples
      icone={<FileText />}
      titulo="Contratos"
      desc="Gestão de contratos digitais"
    />
  );
}

// —
// VAGAS DE EMPRESAS — Aprovação/Rejeição
// —
export function VagasEmpresa() {
  const toast = useToast();
  const [vagas, setVagas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("pendente");
  const [contagens, setContagens] = useState({});
  const [modalRej, setModalRej] = useState(null); // vaga para rejeitar
  const [motivoRej, setMotivoRej] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(
    async (status = filtro) => {
      setCarregando(true);
      try {
        const { data } = await adminAPI.vagasEmpresa({ status });
        setVagas(data.dados?.vagas || []);
        setContagens(data.dados?.contagens || {});
      } catch (e) {
        toast.erro("Erro ao carregar vagas: " + extrairErro(e));
      } finally {
        setCarregando(false);
      }
    },
    [filtro, toast],
  );

  useEffect(() => {
    carregar();
  }, []);

  const mudarFiltro = (s) => {
    setFiltro(s);
    carregar(s);
  };

  const aprovar = async (id, titulo) => {
    const ok = await toast.confirmar({
      titulo: "Aprovar vaga",
      mensagem: `Aprovar a vaga "${titulo}"? Ficará visível publicamente.`,
      labelOk: "Aprovar",
    });
    if (!ok) return;
    try {
      await adminAPI.aprovarVaga(id);
      toast.sucesso("Vaga aprovada e publicada!");
      carregar(filtro);
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  };

  const abrirRejeicao = (vaga) => {
    setModalRej(vaga);
    setMotivoRej("");
  };

  const confirmarRejeicao = async () => {
    if (!motivoRej.trim()) return toast.aviso("Indique o motivo de rejeição.");
    setEnviando(true);
    try {
      await adminAPI.rejeitarVaga(modalRej.id, { motivo: motivoRej });
      toast.sucesso("Vaga rejeitada. A empresa foi notificada.");
      setModalRej(null);
      carregar(filtro);
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setEnviando(false);
    }
  };

  const estadoCor = {
    pendente: { bg: "var(--amarelo-100)", color: "#92400E", label: "Pendente" },
    aprovada: { bg: "var(--verde-100)", color: "#166534", label: "Aprovada" },
    rejeitada: {
      bg: "var(--vermelho-100)",
      color: "#991B1B",
      label: "Rejeitada",
    },
    encerrada: {
      bg: "var(--bg-hover)",
      color: "var(--txt-3)",
      label: "Encerrada",
    },
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Vagas de Empresas</h2>
          <p className="section-desc">
            Aprovar ou rejeitar vagas submetidas pelas empresas
          </p>
        </div>
      </div>

      {/* Contadores */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          {
            label: "Pendentes",
            val: contagens.pendentes || 0,
            cor: "var(--amarelo-100)",
            corT: "#92400E",
          },
          {
            label: "Aprovadas",
            val: contagens.aprovadas || 0,
            cor: "var(--verde-100)",
            corT: "#166534",
          },
          {
            label: "Rejeitadas",
            val: contagens.rejeitadas || 0,
            cor: "var(--vermelho-100)",
            corT: "#991B1B",
          },
          {
            label: "Total",
            val: contagens.total || 0,
            cor: "var(--ciano-100)",
            corT: "var(--ciano-600)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="stat-card"
            style={{ background: s.cor }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 800,
                color: s.corT,
              }}
            >
              {s.val}
            </div>
            <div style={{ fontSize: "0.8rem", color: s.corT, opacity: 0.8 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["pendente", "aprovada", "rejeitada", "encerrada"].map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => mudarFiltro(s)}
            className={`btn btn--sm ${filtro === s ? "btn--primary" : "btn--secondary"}`}
            style={{ textTransform: "capitalize" }}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => mudarFiltro("")}
          className={`btn btn--sm ${filtro === "" ? "btn--primary" : "btn--secondary"}`}
        >
          Todas
        </button>
      </div>

      {carregando ? (
        <PageLoader />
      ) : vagas.length === 0 ? (
        <EmptyState
          icone={<Briefcase size={28} />}
          titulo="Sem vagas"
          descricao={`Nenhuma vaga ${filtro || ""} encontrada.`}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {vagas.map((v) => {
            const ec = estadoCor[v.status] || estadoCor.pendente;
            return (
              <div key={v.id} className="card" style={{ padding: "16px 20px" }}>
                <div
                  style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{v.titulo}</span>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: "var(--r-full)",
                          background: ec.bg,
                          color: ec.color,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        {ec.label}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--txt-3)",
                        marginBottom: 8,
                      }}
                    >
                      — {v.nome_empresa} · — {v.tipo}{" "}
                      {v.localizacao ? `· — ${v.localizacao}` : ""}
                    </div>
                    <p
                      style={{
                        fontSize: "0.83rem",
                        color: "var(--txt-2)",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {v.descricao}
                    </p>
                    {v.motivo_rejeicao && (
                      <p
                        style={{
                          fontSize: "0.78rem",
                          color: "#991B1B",
                          marginTop: 6,
                          background: "var(--vermelho-100)",
                          padding: "6px 10px",
                          borderRadius: "var(--r-sm)",
                        }}
                      >
                        —️ {v.motivo_rejeicao}
                      </p>
                    )}
                  </div>
                  {v.status === "pendente" && (
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn--sm"
                        style={{ background: "var(--verde)", color: "white" }}
                        onClick={() => aprovar(v.id, v.titulo)}
                      >
                        <CheckCircle size={14} /> Aprovar
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--danger"
                        onClick={() => abrirRejeicao(v)}
                      >
                        <X size={14} /> Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: motivo de rejeição */}
      <Modal
        aberto={!!modalRej}
        onFechar={() => setModalRej(null)}
        titulo="Rejeitar Vaga"
        acoes={
          <>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setModalRej(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`btn btn--danger${enviando ? " btn--loading" : ""}`}
              onClick={confirmarRejeicao}
              disabled={enviando}
            >
              {!enviando && (
                <>
                  <X size={14} /> Rejeitar
                </>
              )}
            </button>
          </>
        }
      >
        {modalRej && (
          <>
            <p
              style={{
                marginBottom: 12,
                color: "var(--txt-2)",
                fontSize: "0.875rem",
              }}
            >
              Vai rejeitar a vaga <strong>"{modalRej.titulo}"</strong> da
              empresa <strong>{modalRej.nome_empresa}</strong>. A empresa será
              notificada com o motivo.
            </p>
            <div className="form-group">
              <label className="form-label">Motivo de rejeição *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Ex: Conteúdo inapropriado, informação incompleta, duplicado..."
                value={motivoRej}
                onChange={(e) => setMotivoRej(e.target.value)}
                style={{ minHeight: 80 }}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export function Ficheiros() {
  const toast = useToast();

  const [ficheiros, setFicheiros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [categoria, setCategoria] = useState("");
  const [proprietario, setProprietario] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [contagens, setContagens] = useState({});
  const pesquisaTimer = useRef(null);

  const LIMITE = 20;

  const carregar = useCallback(
    async (params = {}) => {
      setCarregando(true);
      try {
        const pg = params.page !== undefined ? params.page : pagina;
        const cat =
          params.categoria !== undefined ? params.categoria : categoria;
        const prop =
          params.proprietario !== undefined
            ? params.proprietario
            : proprietario;
        const pes = params.pesquisa !== undefined ? params.pesquisa : pesquisa;

        const { data } = await adminAPI.ficheiros({
          page: pg,
          limit: LIMITE,
          categoria: cat || undefined,
          proprietario: prop || undefined,
          pesquisa: pes || undefined,
        });

        setFicheiros(data.dados?.ficheiros || []);
        setContagens(data.dados?.contagens || {});
        setTotal(data.dados?.total || 0);
        setTotalPaginas(data.dados?.total_paginas || 1);
      } catch (e) {
        toast.erro("Erro ao carregar ficheiros: " + extrairErro(e));
      } finally {
        setCarregando(false);
      }
    },
    [toast, pagina, categoria, proprietario, pesquisa],
  );

  useEffect(() => {
    carregar();
  }, []);

  const mudarCategoria = (v) => {
    setCategoria(v);
    setPagina(1);
    carregar({ categoria: v, page: 1 });
  };

  const mudarProprietario = (v) => {
    setProprietario(v);
    setPagina(1);
    carregar({ proprietario: v, page: 1 });
  };

  const handlePesquisa = (v) => {
    setPesquisa(v);
    clearTimeout(pesquisaTimer.current);
    pesquisaTimer.current = setTimeout(() => {
      setPagina(1);
      carregar({ pesquisa: v, page: 1 });
    }, 400);
  };

  const irPagina = (pg) => {
    setPagina(pg);
    carregar({ page: pg });
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Ficheiros do sistema</h2>
          <p className="section-desc">
            Lista consolidada por categorias com detalhes de proprietários.
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total", valor: total },
          { label: "Pagamentos", valor: contagens.pagamentos || 0 },
          { label: "Docs empresa", valor: contagens.documentos_empresa || 0 },
          { label: "Contratos", valor: contagens.contratos || 0 },
          { label: "Recibos", valor: contagens.recibos || 0 },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.6rem",
                fontWeight: 800,
              }}
            >
              {s.valor}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div className="form-input-wrapper" style={{ flex: 1, minWidth: 240 }}>
          <Search size={16} />
          <input
            className="form-input form-input--icon"
            placeholder="Pesquisar por referência, URL, proprietário..."
            value={pesquisa}
            onChange={(e) => handlePesquisa(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 190 }}
          value={categoria}
          onChange={(e) => mudarCategoria(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          <option value="pagamentos">Pagamentos</option>
          <option value="documentos_empresa">Documentos empresa</option>
          <option value="contratos">Contratos</option>
          <option value="recibos">Recibos</option>
        </select>
        <select
          className="form-select"
          style={{ width: 180 }}
          value={proprietario}
          onChange={(e) => mudarProprietario(e.target.value)}
        >
          <option value="">Todos os proprietários</option>
          <option value="student">Estudante</option>
          <option value="company">Empresa</option>
          <option value="investor">Investidor</option>
          <option value="employee">Funcionário</option>
        </select>
      </div>

      {carregando ? (
        <PageLoader />
      ) : ficheiros.length === 0 ? (
        <EmptyState
          icone={<Folder size={28} />}
          titulo="Sem ficheiros"
          descricao="Nenhum ficheiro encontrado com os filtros aplicados."
        />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Referência</th>
                <th>Proprietário</th>
                <th>E-mail</th>
                <th>Estado</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ficheiros.map((f) => (
                <tr key={`${f.categoria}-${f.id}`}>
                  <td>
                    <span className="badge badge--ciano">{f.categoria}</span>
                  </td>
                  <td style={{ fontSize: "0.84rem" }}>
                    {f.nome_referencia || "Sem referência"}
                  </td>
                  <td>{f.proprietario_nome || "—"}</td>
                  <td style={{ color: "var(--txt-3)", fontSize: "0.82rem" }}>
                    {f.proprietario_email || "—"}
                  </td>
                  <td>
                    <span
                      className={`badge ${f.existe_localmente ? "badge--verde" : "badge--amarelo"}`}
                    >
                      {f.existe_localmente ? "Disponível" : "Remoto"}
                    </span>
                  </td>
                  <td style={{ color: "var(--txt-3)", fontSize: "0.82rem" }}>
                    {formatData(f.criado_em || f.created_at)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => {
                        const url = String(f.url_ficheiro || "");
                        if (!url) return;
                        const absoluta = url.startsWith("http")
                          ? url
                          : `${BACKEND_BASE_URL}/${url.replace(/^\/+/, "")}`;
                        window.open(absoluta, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <Eye size={14} /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginTop: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={pagina === 1}
          onClick={() => irPagina(pagina - 1)}
        >
          ← Anterior
        </button>
        {Array.from({ length: Math.min(totalPaginas, 7) }, (_, i) => {
          const pg = pagina <= 4 ? i + 1 : pagina - 3 + i;
          if (pg < 1 || pg > totalPaginas) return null;
          return (
            <button
              key={pg}
              type="button"
              className={`btn btn--sm ${pagina === pg ? "btn--primary" : "btn--secondary"}`}
              onClick={() => irPagina(pg)}
            >
              {pg}
            </button>
          );
        })}
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={pagina === totalPaginas}
          onClick={() => irPagina(pagina + 1)}
        >
          Próxima →
        </button>
        <span style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
          Página {pagina} de {totalPaginas} · {total} ficheiros
        </span>
      </div>
    </div>
  );
}
export function NotificacoesReal({ setNotifCount }) {
  const toast = useToast();
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data } = await adminAPI.notificacoes();
      const dados = data.dados || {};
      const lista = dados.notificacoes || data.dados || [];
      setNotificacoes(lista);
      setNotifCount?.(
        typeof dados.nao_lidas === "number"
          ? dados.nao_lidas
          : lista.filter((item) => !item.lida).length,
      );
    } catch (e) {
      toast.erro("Erro ao carregar notificaes: " + extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [setNotifCount, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const marcarLida = async (id) => {
    try {
      await adminAPI.marcarLida(id);
      const atualizadas = notificacoes.map((item) =>
        item.id === id
          ? { ...item, lida: 1, lida_at: new Date().toISOString() }
          : item,
      );
      setNotificacoes(atualizadas);
      setNotifCount?.(atualizadas.filter((item) => !item.lida).length);
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  };

  const marcarTodas = async () => {
    try {
      await adminAPI.marcarTodas();
      setNotificacoes((lista) => lista.map((item) => ({ ...item, lida: 1 })));
      setNotifCount?.(0);
      toast.sucesso("Notificaes marcadas como lidas.");
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  };

  return (
    <div>
      <div
        className="admin-toolbar admin-toolbar--end"
        style={{ marginBottom: 16 }}
      >
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={carregar}
        >
          <RefreshCw size={14} /> Actualizar
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={marcarTodas}
          disabled={
            notificacoes.length === 0 || notificacoes.every((item) => item.lida)
          }
        >
          <Check size={14} /> Marcar todas como lidas
        </button>
      </div>

      {carregando ? (
        <PageLoader />
      ) : notificacoes.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>
          <EmptyState
            icone={<Bell size={28} />}
            titulo="Sem notificaes"
            descricao="No h alertas neste momento."
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notificacoes.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: 18,
                borderLeft: item.lida
                  ? "4px solid var(--border)"
                  : "4px solid var(--ciano)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{item.titulo}</span>
                    <span
                      className={`badge ${item.lida ? "badge--cinza" : "badge--ciano"}`}
                    >
                      {item.lida ? "Lida" : "Nova"}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "var(--txt-2)",
                      fontSize: "0.9rem",
                      marginBottom: 8,
                    }}
                  >
                    {item.mensagem}
                  </p>
                  <p style={{ color: "var(--txt-4)", fontSize: "0.75rem" }}>
                    {formatData(item.created_at || item.criado_em)}
                  </p>
                </div>
                {!item.lida && (
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => marcarLida(item.id)}
                  >
                    <Check size={14} /> Marcar lida
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContratosReal() {
  const toast = useToast();
  const [contratos, setContratos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abrindoContratoId, setAbrindoContratoId] = useState(null);
  const [pesquisa, setPesquisa] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 12;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data } = await adminAPI.contratos({
        limite,
        page: pagina,
        pesquisa: pesquisa || undefined,
        status: estado || undefined,
      });
      setContratos(data.dados?.contratos || []);
      setTotal(data.dados?.total || 0);
      setTotalPaginas(data.dados?.total_paginas || 1);
    } catch (e) {
      toast.erro("Erro ao carregar contratos: " + extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [toast, pagina, pesquisa, estado]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const verContrato = useCallback(
    async (contratoId) => {
      try {
        setAbrindoContratoId(contratoId);
        const { data } = await adminAPI.verContrato(contratoId);
        const pdfUrl = URL.createObjectURL(
          new Blob([data], { type: "application/pdf" }),
        );
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
      } catch (e) {
        toast.erro("Erro ao abrir contrato: " + extrairErro(e));
      } finally {
        setAbrindoContratoId(null);
      }
    },
    [toast],
  );

  return (
    <div>
      <div
        className="admin-toolbar"
        style={{ marginBottom: 16, gap: 12, flexWrap: "wrap" }}
      >
        <div
          className="form-input-wrapper"
          style={{ minWidth: 280, flex: "1 1 320px" }}
        >
          <Search size={16} />
          <input
            className="form-input form-input--icon"
            placeholder="Pesquisar por título, empresa ou investidor"
            value={pesquisa}
            onChange={(e) => {
              setPesquisa(e.target.value);
              setPagina(1);
            }}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 220 }}
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos os estados</option>
          <option value="enviado">Enviado</option>
          <option value="assinado_empresa">Assinado pela empresa</option>
          <option value="assinado_investidor">Assinado pelo investidor</option>
          <option value="assinado_ambos">Assinado por ambas as partes</option>
        </select>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={carregar}
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {carregando ? (
        <PageLoader />
      ) : contratos.length === 0 ? (
        <EmptyState
          icone={<FileText size={28} />}
          titulo="Sem contratos"
          descricao="Os contratos gerados aparecero aqui."
        />
      ) : (
        <>
          <div
            style={{
              color: "var(--txt-3)",
              fontSize: "0.82rem",
              marginBottom: 12,
            }}
          >
            {total} contrato(s) encontrado(s)
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ttulo</th>
                  <th>Empresa</th>
                  <th>Investidor</th>
                  <th>Estado</th>
                  <th>Assinaturas</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>
                      {c.titulo ||
                        c.oportunidade_titulo ||
                        "Contrato de investimento"}
                    </td>
                    <td>{c.nome_empresa || "?"}</td>
                    <td>{c.investidor_nome || "?"}</td>
                    <td>
                      <BadgeStatus status={c.status} />
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--txt-3)" }}>
                      Empresa: {c.assinado_empresa ? "Sim" : "No"} | Investidor:{" "}
                      {c.assinado_investidor ? "Sim" : "No"}
                    </td>
                    <td style={{ color: "var(--txt-3)", fontSize: "0.82rem" }}>
                      {formatData(c.criado_em || c.created_at)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn--secondary btn--sm${abrindoContratoId === c.id ? " btn--loading" : ""}`}
                        onClick={() => verContrato(c.id)}
                        disabled={abrindoContratoId === c.id}
                      >
                        {abrindoContratoId !== c.id && (
                          <>
                            <Eye size={14} /> Ver contrato
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="admin-toolbar admin-toolbar--end"
            style={{ marginTop: 16, gap: 12 }}
          >
            <span style={{ color: "var(--txt-3)", fontSize: "0.82rem" }}>
              Página {pagina} de {totalPaginas}
            </span>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
              disabled={pagina <= 1}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() =>
                setPagina((atual) => Math.min(totalPaginas, atual + 1))
              }
              disabled={pagina >= totalPaginas}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Seguranca() {
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const pesquisaTimer = useRef(null);
  const LIMITE = 20;

  /** Carrega logs de auditoria com filtros e paginação */
  const carregar = useCallback(
    async (p = pesquisa, a = filtroAcao, pg = pagina) => {
      setCarregando(true);
      try {
        const { data } = await adminAPI.auditoria({
          pesquisa: p || undefined,
          acao: a || undefined,
          page: pg,
          limit: LIMITE,
        });
        setLogs(data.dados?.registos || []);
        setTotal(data.dados?.total || 0);
        setTotalPaginas(data.dados?.total_paginas || 1);
      } catch (e) {
        toast.erro(extrairErro(e));
      } finally {
        setCarregando(false);
      }
    },
    [toast, pesquisa, filtroAcao, pagina],
  );

  // Carregamento inicial
  useEffect(() => {
    carregar();
  }, []);

  /** Pesquisa com debounce */
  const handlePesquisa = (v) => {
    setPesquisa(v);
    clearTimeout(pesquisaTimer.current);
    pesquisaTimer.current = setTimeout(() => {
      setPagina(1);
      carregar(v, filtroAcao, 1);
    }, 400);
  };

  /** Muda filtro de acção */
  const mudarFiltroAcao = (a) => {
    setFiltroAcao(a);
    setPagina(1);
    carregar(pesquisa, a, 1);
  };

  /** Navegar para página */
  const irPagina = (pg) => {
    setPagina(pg);
    carregar(pesquisa, filtroAcao, pg);
  };

  return (
    <div>
      <p className="admin-toolbar__hint" style={{ marginBottom: 16 }}>
        Últimos eventos registados na plataforma. Total: {total} registos.
      </p>

      {/* Barra de filtros */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div className="form-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} />
          <input
            className="form-input form-input--icon"
            placeholder="Pesquisar por utilizador, e-mail ou acção..."
            value={pesquisa}
            onChange={(e) => handlePesquisa(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 200 }}
          value={filtroAcao}
          onChange={(e) => mudarFiltroAcao(e.target.value)}
        >
          <option value="">Todas as acções</option>
          <option value="LOGIN">Login</option>
          <option value="UPDATE_USER_STATUS">Alteração de estado</option>
          <option value="APPROVE_COMPANY">Aprovação de empresa</option>
          <option value="REJECT_COMPANY">Rejeição de empresa</option>
          <option value="CONFIRM_PAYMENT">Confirmação de pagamento</option>
          <option value="vaga_criada">Vaga criada</option>
          <option value="vaga_aprovada">Vaga aprovada</option>
        </select>
      </div>

      {/* Tabela */}
      {carregando ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Acção</th>
                <th>Utilizador</th>
                <th>IP</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "var(--txt-3)",
                    }}
                  >
                    Sem registos
                  </td>
                </tr>
              ) : (
                logs.map((l, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                      {l.acao}
                    </td>
                    <td style={{ color: "var(--txt-3)", fontSize: "0.85rem" }}>
                      {l.user_nome || l.actor || "?"}
                    </td>
                    <td style={{ color: "var(--txt-4)", fontSize: "0.8rem" }}>
                      {l.ip_address || "?"}
                    </td>
                    <td style={{ color: "var(--txt-3)", fontSize: "0.8rem" }}>
                      {formatData(l.criado_em)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            disabled={pagina === 1}
            onClick={() => irPagina(pagina - 1)}
          >
            ← Anterior
          </button>
          {Array.from({ length: Math.min(totalPaginas, 7) }, (_, i) => {
            const pg = pagina <= 4 ? i + 1 : pagina - 3 + i;
            if (pg < 1 || pg > totalPaginas) return null;
            return (
              <button
                key={pg}
                type="button"
                className={`btn btn--sm ${pagina === pg ? "btn--primary" : "btn--secondary"}`}
                onClick={() => irPagina(pg)}
              >
                {pg}
              </button>
            );
          })}
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            disabled={pagina === totalPaginas}
            onClick={() => irPagina(pagina + 1)}
          >
            Próxima →
          </button>
          <span style={{ fontSize: "0.8rem", color: "var(--txt-3)" }}>
            Página {pagina} de {totalPaginas}
          </span>
        </div>
      )}
    </div>
  );
}

// —
// CONFIGURA—ES
// —
export function Configuracoes() {
  const toast = useToast();
  const { utilizador, ehAdmin } = useAuth();

  // Somente o admin pode aceder a esta página
  if (!ehAdmin) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Shield size={40} style={{ color: "var(--txt-4)", marginBottom: 16 }} />
        <h3 style={{ marginBottom: 8 }}>Acesso restrito</h3>
        <p style={{ color: "var(--txt-3)" }}>
          Esta página é exclusiva do administrador do sistema.
        </p>
      </div>
    );
  }
  const [configs, setConfigs] = useState({
    nomePlataforma: "ULEZI XPB",
    email: "info@ulezi.com",
    telefone: "+244 923 000 000",
    site: "https://ulezi.com",
    notifInscricoes: true,
    notifEmpresas: true,
    notifInvestidores: true,
    notifEmail: false,
    notifWhatsapp: false,
    autenticacao2FA: false,
    bloqueioInstrumentos: true,
    registosAuditoria: true,
  });
  const [senhaActual, setSenhaActual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mudandoSenha, setMudandoSenha] = useState(false);
  const [carregandoConfigs, setCarregandoConfigs] = useState(true);

  useEffect(() => {
    adminAPI
      .configs()
      .then(({ data }) => {
        const recebidas = data.dados?.configuracoes || {};
        if (Object.keys(recebidas).length > 0) {
          setConfigs((actual) => ({
            ...actual,
            ...recebidas,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setCarregandoConfigs(false));
  }, []);

  const guardar = async () => {
    setGuardando(true);
    try {
      await adminAPI.salvarConfigs(configs);
      toast.sucesso("Configuraes guardadas.");
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setGuardando(false);
    }
  };

  const alterarSenha = async () => {
    if (!senhaActual) return toast.aviso("Introduza a palavra-passe actual");
    if (novaSenha.length < 8)
      return toast.aviso("Nova senha deve ter mínimo 8 caracteres");
    if (novaSenha !== confirmarSenha)
      return toast.aviso("As senhas não coincidem");
    setMudandoSenha(true);
    try {
      await authAPI.alterarSenha({
        password_atual: senhaActual,
        nova_password: novaSenha,
      });
      setSenhaActual("");
      setNovaSenha("");
      setConfirmarSenha("");
      toast.sucesso("Palavra-passe alterada com sucesso!");
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setMudandoSenha(false);
    }
  };

  const toggle = (k) => setConfigs((c) => ({ ...c, [k]: !c[k] }));

  if (carregandoConfigs) return <PageLoader />;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Coluna Esquerda - Configurações */}
        <div style={{ maxWidth: 640 }}>
          {/* Informações da plataforma */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--r-full)",
                  background: "var(--ciano-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Settings size={18} color="var(--ciano)" />
              </div>
              <div>
                <p style={{ fontWeight: 700 }}>Informações da Plataforma</p>
                <p style={{ fontSize: "0.78rem", color: "var(--txt-3)" }}>
                  Dados do sistema
                </p>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <div className="form-group">
                <label className="form-label">Nome da Plataforma</label>
                <input
                  className="form-input"
                  value={configs.nomePlataforma}
                  onChange={(e) =>
                    setConfigs((c) => ({
                      ...c,
                      nomePlataforma: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail de contacto</label>
                <input
                  type="email"
                  className="form-input"
                  value={configs.email}
                  onChange={(e) =>
                    setConfigs((c) => ({ ...c, email: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  className="form-input"
                  value={configs.telefone}
                  onChange={(e) =>
                    setConfigs((c) => ({ ...c, telefone: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Site</label>
                <input
                  className="form-input"
                  value={configs.site}
                  onChange={(e) =>
                    setConfigs((c) => ({ ...c, site: e.target.value }))
                  }
                />
              </div>
            </div>
            <button
              type="button"
              className={`btn btn--primary btn--sm${guardando ? " btn--loading" : ""}`}
              style={{ marginTop: 14 }}
              onClick={guardar}
              disabled={guardando}
            >
              {!guardando && (
                <>
                  <Save size={14} /> Guardar Alterações
                </>
              )}
            </button>
          </div>

          {/* Notificações */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--r-full)",
                  background: "var(--amarelo-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={18} color="var(--amarelo)" />
              </div>
              <div>
                <p style={{ fontWeight: 700 }}>Notificações</p>
                <p style={{ fontSize: "0.78rem", color: "var(--txt-3)" }}>
                  Configurar alertas do sistema
                </p>
              </div>
            </div>
            {[
              {
                k: "notifInscricoes",
                l: "Notificar novas inscrições",
                d: "Alerta quando aluno se inscreve",
              },
              {
                k: "notifEmpresas",
                l: "Notificar novas empresas",
                d: "Alerta quando empresa solicita aprovação",
              },
              {
                k: "notifInvestidores",
                l: "Notificar investimentos",
                d: "Alerta quando investidor demonstra interesse",
              },
              {
                k: "notifEmail",
                l: "Notificações por e-mail",
                d: "Enviar também por email",
              },
              {
                k: "notifWhatsapp",
                l: "Notificações por WhatsApp",
                d: "Enviar via WhatsApp",
              },
            ].map(({ k, l, d }) => (
              <ToggleRow
                key={k}
                label={l}
                desc={d}
                activo={configs[k]}
                onChange={() => toggle(k)}
              />
            ))}
          </div>

          {/* Segurança */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--r-full)",
                  background: "var(--verde-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={18} color="var(--verde)" />
              </div>
              <div>
                <p style={{ fontWeight: 700 }}>Segurança</p>
                <p style={{ fontSize: "0.78rem", color: "var(--txt-3)" }}>
                  Configurações de segurança
                </p>
              </div>
            </div>
            {[
              {
                k: "autenticacao2FA",
                l: "Autenticação de dois factores",
                d: "Exigir 2FA para administradores",
              },
              {
                k: "bloqueioInstrumentos",
                l: "Bloqueio de instrumentos",
                d: "Bloquear após 5 tentativas falhadas",
              },
              {
                k: "registosAuditoria",
                l: "Registos de auditoria",
                d: "Registar todas as acções administrativas",
              },
            ].map(({ k, l, d }) => (
              <ToggleRow
                key={k}
                label={l}
                desc={d}
                activo={configs[k]}
                onChange={() => toggle(k)}
              />
            ))}

            {/* Alterar senha */}
            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  marginBottom: 14,
                  fontSize: "0.875rem",
                }}
              >
                Alterar Palavra-passe
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div className="form-group">
                  <label className="form-label">Palavra-passe actual</label>
                  <input
                    type="password"
                    className="form-input"
                    value={senhaActual}
                    onChange={(e) => setSenhaActual(e.target.value)}
                    placeholder="—"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nova palavra-passe</label>
                  <input
                    type="password"
                    className="form-input"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Confirmar nova palavra-passe
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>
              <button
                type="button"
                className={`btn btn--primary btn--sm${mudandoSenha ? " btn--loading" : ""}`}
                onClick={alterarSenha}
                disabled={mudandoSenha}
              >
                {!mudandoSenha && "Actualizar Palavra-passe"}
              </button>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Coordenadas Bancárias */}
        <div>
          <GestaoCoordenadasBancarias />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, activo, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div>
        <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: "0.78rem", color: "var(--txt-3)" }}>{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        onClick={onChange}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          background: activo ? "var(--ciano)" : "var(--border)",
          position: "relative",
          transition: "background 200ms",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: activo ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--bg-card)",
            transition: "left 200ms",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}

function SecaoSimples({ icone, titulo, desc }) {
  return (
    <div className="card" style={{ padding: 28 }}>
      <EmptyState
        icone={React.cloneElement(icone, { size: 28 })}
        titulo={titulo}
        descricao={desc}
      />
    </div>
  );
}
