// ============================================================
// ULEZI XPB — Gestão de Tickets de Suporte (Admin)
// Paginação server-side, filtros completos, ordenação por data
// ============================================================

import {
  AlertCircle,
  CheckCircle2,
  Headphones,
  LifeBuoy,
  MessageSquare,
  Send,
  ShieldAlert,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Modal } from "../../components/ui";
import api, { extrairErro } from "../../services/api";
import {
  badgeEstado,
  BadgeModulo,
  BarraFerramentas,
  BotaoAtualizar,
  formatarDataHora,
  GradeResumo,
  lerLista,
  lerObjeto,
  LinhaVazia,
  ModalBloco,
  PaginaModulo,
  Painel,
  ResumoCard,
  TabelaModulo,
} from "./module7-ui.jsx";

/** Opções de prioridade */
const prioridades = [
  { valor: "", etiqueta: "Todas as prioridades" },
  { valor: "baixa", etiqueta: "Baixa" },
  { valor: "media", etiqueta: "Média" },
  { valor: "alta", etiqueta: "Alta" },
  { valor: "urgente", etiqueta: "Urgente" },
];

/** Opções de estado */
const estados = [
  { valor: "", etiqueta: "Todos os estados" },
  { valor: "aberto", etiqueta: "Aberto" },
  { valor: "em_atendimento", etiqueta: "Em atendimento" },
  { valor: "aguardando_resposta", etiqueta: "Aguardando resposta" },
  { valor: "resolvido", etiqueta: "Resolvido" },
  { valor: "fechado", etiqueta: "Fechado" },
];

/** Opções de categoria */
const categorias = [
  { valor: "", etiqueta: "Todas as categorias" },
  { valor: "tecnico", etiqueta: "Técnico" },
  { valor: "financeiro", etiqueta: "Financeiro" },
  { valor: "conta", etiqueta: "Conta" },
  { valor: "assinatura", etiqueta: "Assinatura" },
  { valor: "geral", etiqueta: "Geral" },
];

const LIMITE_POR_PAGINA = 15;

const SuporteTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [funcionarios, setFuncionarios] = useState([]);

  // Filtros (server-side)
  const [pesquisa, setPesquisa] = useState("");
  const [estado, setEstado] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [categoria, setCategoria] = useState("");

  // Paginação
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [detalhe, setDetalhe] = useState(null);
  const [ticketActivo, setTicketActivo] = useState(null);
  const [resposta, setResposta] = useState("");
  const [aProcessar, setAProcessar] = useState(false);

  // Timer para debounce da pesquisa
  const pesquisaTimer = useRef(null);

  /**
   * Carrega os tickets do servidor com todos os filtros activos.
   * Parametros opcionais permitem sobrepor o estado actual para reactividade imediata.
   */
  const carregar = useCallback(
    async (params = {}) => {
      setCarregando(true);
      try {
        const pg = params.page !== undefined ? params.page : pagina;
        const est = params.estado !== undefined ? params.estado : estado;
        const pri =
          params.prioridade !== undefined ? params.prioridade : prioridade;
        const cat =
          params.categoria !== undefined ? params.categoria : categoria;
        const pes = params.pesquisa !== undefined ? params.pesquisa : pesquisa;

        const [resTickets, resStats, resFuncionarios] = await Promise.all([
          api.get("/support/admin/tickets", {
            params: {
              status: est || undefined,
              prioridade: pri || undefined,
              categoria: cat || undefined,
              pesquisa: pes || undefined,
              page: pg,
              limit: LIMITE_POR_PAGINA,
            },
          }),
          api.get("/support/admin/tickets/stats"),
          api.get("/admin/employees", {
            params: { status: "active", limit: 100 },
          }),
        ]);

        setTickets(lerLista(resTickets.data, "tickets"));
        setTotal(resTickets.data?.dados?.total || resTickets.data?.total || 0);
        setTotalPaginas(resTickets.data?.dados?.total_paginas || 1);
        setEstatisticas(lerObjeto(resStats.data, "estatisticas_gerais"));
        setFuncionarios(lerLista(resFuncionarios.data, "funcionarios"));
      } catch (erro) {
        toast.error(`Erro ao carregar tickets: ${extrairErro(erro)}`);
        setTickets([]);
        setEstatisticas({});
        setFuncionarios([]);
      } finally {
        setCarregando(false);
      }
    },
    [pagina, estado, prioridade, categoria, pesquisa],
  );

  // Carregamento inicial
  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Muda filtro de estado e recarrega */
  const mudarEstado = (v) => {
    setEstado(v);
    setPagina(1);
    carregar({ estado: v, page: 1 });
  };

  /** Muda filtro de prioridade e recarrega */
  const mudarPrioridade = (v) => {
    setPrioridade(v);
    setPagina(1);
    carregar({ prioridade: v, page: 1 });
  };

  /** Muda filtro de categoria e recarrega */
  const mudarCategoria = (v) => {
    setCategoria(v);
    setPagina(1);
    carregar({ categoria: v, page: 1 });
  };

  /** Pesquisa com debounce de 400ms */
  const handlePesquisa = (v) => {
    setPesquisa(v);
    clearTimeout(pesquisaTimer.current);
    pesquisaTimer.current = setTimeout(() => {
      setPagina(1);
      carregar({ pesquisa: v, page: 1 });
    }, 400);
  };

  /** Navega para uma página específica */
  const irPagina = (pg) => {
    setPagina(pg);
    carregar({ page: pg });
  };

  /** Abre o detalhe de um ticket */
  const abrirDetalhe = async (ticketId) => {
    try {
      const { data } = await api.get(`/support/tickets/${ticketId}`);
      setDetalhe({
        ticket: lerObjeto(data, "ticket"),
        mensagens: lerLista(data, "messages"),
      });
      setTicketActivo(ticketId);
      setResposta("");
    } catch (erro) {
      toast.error(`Erro ao abrir ticket: ${extrairErro(erro)}`);
    }
  };

  /** Atribui o ticket a um funcionário */
  const atribuir = async (employeeId) => {
    if (!ticketActivo || !employeeId) return;
    setAProcessar(true);
    try {
      await api.put(`/support/admin/tickets/${ticketActivo}/assign`, {
        employee_id: employeeId,
      });
      toast.success("Ticket atribuído com sucesso.");
      await Promise.all([carregar(), abrirDetalhe(ticketActivo)]);
    } catch (erro) {
      toast.error(`Erro ao atribuir ticket: ${extrairErro(erro)}`);
    } finally {
      setAProcessar(false);
    }
  };

  /** Altera o estado do ticket */
  const actualizarEstado = async (novoEstado) => {
    if (!ticketActivo) return;
    setAProcessar(true);
    try {
      await api.put(`/support/admin/tickets/${ticketActivo}/status`, {
        status: novoEstado,
      });
      toast.success("Estado do ticket actualizado.");
      await Promise.all([carregar(), abrirDetalhe(ticketActivo)]);
    } catch (erro) {
      toast.error(`Erro ao actualizar estado: ${extrairErro(erro)}`);
    } finally {
      setAProcessar(false);
    }
  };

  /** Altera a prioridade do ticket */
  const actualizarPrioridade = async (novaPrioridade) => {
    if (!ticketActivo) return;
    setAProcessar(true);
    try {
      await api.put(`/support/admin/tickets/${ticketActivo}/priority`, {
        prioridade: novaPrioridade,
      });
      toast.success("Prioridade actualizada.");
      await Promise.all([carregar(), abrirDetalhe(ticketActivo)]);
    } catch (erro) {
      toast.error(`Erro ao actualizar prioridade: ${extrairErro(erro)}`);
    } finally {
      setAProcessar(false);
    }
  };

  /** Envia resposta ao cliente */
  const enviarResposta = async () => {
    if (!ticketActivo || !resposta.trim()) {
      toast.error("Escreva a resposta antes de enviar.");
      return;
    }
    setAProcessar(true);
    try {
      await api.post(`/support/tickets/${ticketActivo}/messages`, {
        mensagem: resposta.trim(),
        is_internal: false,
      });
      toast.success("Resposta enviada com sucesso.");
      setResposta("");
      await Promise.all([carregar(), abrirDetalhe(ticketActivo)]);
    } catch (erro) {
      toast.error(`Erro ao enviar resposta: ${extrairErro(erro)}`);
    } finally {
      setAProcessar(false);
    }
  };

  return (
    <div>
      <PaginaModulo
        titulo="Suporte"
        subtitulo="Acompanhe todos os pedidos de suporte, do mais recente ao mais antigo. Filtre, atribua responsáveis e acompanhe até à resolução."
        acoes={
          <BotaoAtualizar onClick={() => carregar()} loading={carregando} />
        }
      />

      {/* Cards de resumo */}
      <GradeResumo>
        <ResumoCard
          icone={<LifeBuoy size={18} />}
          titulo="Total de tickets"
          valor={estatisticas.total_tickets || total || 0}
        />
        <ResumoCard
          icone={<AlertCircle size={18} />}
          titulo="Abertos"
          valor={estatisticas.abertos || 0}
          cor="var(--amarelo-100)"
          destaque="var(--amarelo)"
        />
        <ResumoCard
          icone={<Headphones size={18} />}
          titulo="Em atendimento"
          valor={estatisticas.em_atendimento || 0}
          cor="var(--ciano-100)"
          destaque="var(--ciano)"
        />
        <ResumoCard
          icone={<CheckCircle2 size={18} />}
          titulo="Resolvidos"
          valor={estatisticas.resolvidos || 0}
          cor="var(--verde-100)"
          destaque="var(--verde)"
        />
      </GradeResumo>

      {/* Barra de filtros com todos os campos */}
      <BarraFerramentas
        pesquisa={pesquisa}
        onPesquisa={handlePesquisa}
        filtros={
          <>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={estado}
                onChange={(e) => mudarEstado(e.target.value)}
              >
                {estados.map((item) => (
                  <option key={item.valor || "todos"} value={item.valor}>
                    {item.etiqueta}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prioridade</label>
              <select
                className="form-select"
                value={prioridade}
                onChange={(e) => mudarPrioridade(e.target.value)}
              >
                {prioridades.map((item) => (
                  <option key={item.valor || "todas"} value={item.valor}>
                    {item.etiqueta}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Categoria</label>
              <select
                className="form-select"
                value={categoria}
                onChange={(e) => mudarCategoria(e.target.value)}
              >
                {categorias.map((item) => (
                  <option key={item.valor || "todas"} value={item.valor}>
                    {item.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          </>
        }
        compacta
      />

      {/* Tabela de tickets */}
      {!tickets.length && !carregando ? (
        <LinhaVazia
          titulo="Nenhum ticket encontrado"
          descricao="Os pedidos de suporte aparecerão aqui assim que forem criados."
        />
      ) : (
        <TabelaModulo
          colunas={[
            "Ticket",
            "Cliente",
            "Categoria",
            "Responsável",
            "Estado",
            "Prioridade",
            "Data",
            "Acções",
          ]}
        >
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{ticket.assunto}</div>
                <div style={{ color: "var(--txt-3)", fontSize: "0.82rem" }}>
                  {ticket.ticket_number}
                </div>
              </td>
              <td>
                <div>{ticket.usuario_nome || "Sem nome"}</div>
                <div style={{ color: "var(--txt-3)", fontSize: "0.82rem" }}>
                  {ticket.usuario_email || ""}
                </div>
              </td>
              <td>{ticket.categoria || "Geral"}</td>
              <td>{ticket.funcionario_nome || "Não atribuído"}</td>
              <td>
                <BadgeModulo tonalidade={badgeEstado(ticket.status)}>
                  {ticket.status}
                </BadgeModulo>
              </td>
              <td>
                <BadgeModulo tonalidade={badgeEstado(ticket.prioridade)}>
                  {ticket.prioridade}
                </BadgeModulo>
              </td>
              <td style={{ color: "var(--txt-3)", fontSize: "0.8rem" }}>
                {formatarDataHora(ticket.created_at || ticket.criado_em)}
              </td>
              <td>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => abrirDetalhe(ticket.id)}
                >
                  <MessageSquare size={14} /> Abrir
                </button>
              </td>
            </tr>
          ))}
        </TabelaModulo>
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
            Página {pagina} de {totalPaginas} · {total} tickets
          </span>
        </div>
      )}

      {/* Modal de atendimento */}
      <Modal
        isOpen={Boolean(detalhe)}
        onClose={() => setDetalhe(null)}
        title="Atendimento de suporte"
        size="xl"
      >
        {detalhe?.ticket ? (
          <ModalBloco
            titulo={detalhe.ticket.assunto}
            subtitulo="Revise a conversa, atribua o responsável e conduza o ticket até à resolução."
          >
            {/* Info do ticket */}
            <div className="module-grid-3">
              <Painel style={{ padding: 14, background: "var(--bg-2)" }}>
                <div style={{ color: "var(--txt-4)", fontSize: "0.76rem" }}>
                  Cliente
                </div>
                <div style={{ fontWeight: 700 }}>
                  {detalhe.ticket.usuario_nome || "Sem nome"}
                </div>
              </Painel>
              <Painel style={{ padding: 14, background: "var(--bg-2)" }}>
                <div style={{ color: "var(--txt-4)", fontSize: "0.76rem" }}>
                  Estado
                </div>
                <BadgeModulo tonalidade={badgeEstado(detalhe.ticket.status)}>
                  {detalhe.ticket.status}
                </BadgeModulo>
              </Painel>
              <Painel style={{ padding: 14, background: "var(--bg-2)" }}>
                <div style={{ color: "var(--txt-4)", fontSize: "0.76rem" }}>
                  Prioridade
                </div>
                <BadgeModulo
                  tonalidade={badgeEstado(detalhe.ticket.prioridade)}
                >
                  {detalhe.ticket.prioridade}
                </BadgeModulo>
              </Painel>
            </div>

            {/* Acções administrativas */}
            <Painel>
              <div className="module-grid-3">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Atribuir responsável</label>
                  <select
                    className="form-select"
                    value={detalhe.ticket.employee_id || ""}
                    onChange={(e) => atribuir(e.target.value)}
                    disabled={aProcessar}
                  >
                    <option value="">Selecione um funcionário</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} · {f.cargo || "Sem cargo"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Alterar estado</label>
                  <select
                    className="form-select"
                    value={detalhe.ticket.status || ""}
                    onChange={(e) => actualizarEstado(e.target.value)}
                    disabled={aProcessar}
                  >
                    {estados
                      .filter((i) => i.valor)
                      .map((i) => (
                        <option key={i.valor} value={i.valor}>
                          {i.etiqueta}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prioridade</label>
                  <select
                    className="form-select"
                    value={detalhe.ticket.prioridade || ""}
                    onChange={(e) => actualizarPrioridade(e.target.value)}
                    disabled={aProcessar}
                  >
                    {prioridades
                      .filter((i) => i.valor)
                      .map((i) => (
                        <option key={i.valor} value={i.valor}>
                          {i.etiqueta}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </Painel>

            {/* Histórico */}
            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>
                Histórico da conversa
              </div>
              {detalhe.mensagens.length ? (
                <div className="module-stack">
                  {detalhe.mensagens.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: 14,
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--border)",
                        background: "var(--bg-2)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>
                          {msg.sender_nome || "Utilizador"}
                        </div>
                        <div
                          style={{ color: "var(--txt-4)", fontSize: "0.76rem" }}
                        >
                          {formatarDataHora(msg.created_at)}
                        </div>
                      </div>
                      <div style={{ color: "var(--txt-2)", lineHeight: 1.7 }}>
                        {msg.mensagem}
                      </div>
                      {msg.is_internal ? (
                        <div style={{ marginTop: 8 }}>
                          <BadgeModulo tonalidade="amarelo">
                            Nota interna
                          </BadgeModulo>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <LinhaVazia
                  titulo="Sem mensagens"
                  descricao="Ainda não há histórico para este ticket."
                />
              )}
            </Painel>

            {/* Resposta */}
            <Painel>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>
                Responder ao cliente
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mensagem</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  placeholder="Escreva uma resposta clara e profissional."
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <button
                  className={`btn btn--primary btn--sm${aProcessar ? " btn--loading" : ""}`}
                  onClick={enviarResposta}
                  disabled={aProcessar}
                >
                  {!aProcessar && (
                    <>
                      <Send size={14} /> Enviar resposta
                    </>
                  )}
                </button>
              </div>
            </Painel>
          </ModalBloco>
        ) : null}
      </Modal>
    </div>
  );
};

export default SuporteTickets;
