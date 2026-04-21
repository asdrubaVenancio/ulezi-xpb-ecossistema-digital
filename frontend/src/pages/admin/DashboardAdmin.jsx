// ============================================================
// ULEZI XPB — Dashboard Administrativo
// Dados 100% do backend real — toast integrado — validações
// ============================================================
//
// @author AsdrubaDeveloper
// @version 1.0.0

import { Bell, Globe, Menu, Moon, Sun } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar.jsx";
import { pathParaSecaoAdmin } from "../../config/adminNav";
import { useAuth } from "../../context/AuthContext";
import { adminAPI } from "../../services/api";
import Assinaturas from "./Assinaturas.jsx";
import CentrosFormacao from "./CentrosFormacao.jsx";
import Consultoria from "./Consultoria.jsx";
import GestaoEmpresas from "./GestaoEmpresas.jsx";
import GestaoFuncionarios from "./GestaoFuncionarios.jsx";
import GestaoMediacao from "./GestaoMediacaoV2.jsx";
import GestaoVisitas from './GestaoVisitas.jsx';
import InscricoesAdmin from "./InscricoesAdmin.jsx";
import InteressesInvestidores from "./InteressesInvestidores.jsx";
import NotificacoesAssinatura from './NotificacoesAssinatura.jsx';
import OfertasCursos from "./OfertasCursos.jsx";
import OportunidadesInvestimento from "./OportunidadesInvestimento.jsx";
import SuporteTickets from "./SuporteTickets.jsx";
import {
  Configuracoes,
  ContratosReal,
  Cursos,
  Empresas,
  Ficheiros,
  Investimentos,
  NotificacoesReal,
  Pagamentos,
  PainelGeral,
  Seguranca,
  Utilizadores,
  VagasEmpresa,
} from "./sections/DashboardAdminSections.jsx";

// Wrappers para páginas do Módulo 7 (não aceitam props do DashboardAdmin)
const GestaoEmpresasWrapper = () => <GestaoEmpresas />;
const GestaoFuncionariosWrapper = () => <GestaoFuncionarios />;
const GestaoMediacaoWrapper = () => <GestaoMediacao />;
const ConsultoriaWrapper = () => <Consultoria />;
const AssinaturasWrapper = () => <Assinaturas />;
const GestaoVisitasWrapper = () => <GestaoVisitas />;
const SuporteTicketsWrapper = () => <SuporteTickets />;
const InteressesInvestidoresWrapper = () => <InteressesInvestidores />;
const NotificacoesAssinaturaWrapper = () => <NotificacoesAssinatura />;
const OportunidadesInvestimentoWrapper = () => <OportunidadesInvestimento />;

// —— Secções disponíveis —
const SECOES = {
  painel: PainelGeral,
  notificacoes: NotificacoesReal,
  utilizadores: Utilizadores,
  cursos: Cursos,
  centros: CentrosFormacao,
  ofertas: OfertasCursos,
  inscricoes: InscricoesAdmin,
  empresas: GestaoEmpresasWrapper,
  investimentos: Investimentos,
  funcionarios: GestaoFuncionariosWrapper,
  mediacao: GestaoMediacaoWrapper,
  consultoria: ConsultoriaWrapper,
  assinaturas: AssinaturasWrapper,
  visitas:      GestaoVisitasWrapper,
  suporte:      SuporteTicketsWrapper,
  interesses:   InteressesInvestidoresWrapper,
  'notificacoes-assinatura': NotificacoesAssinaturaWrapper,
  pagamentos:    Pagamentos,
  contratos:     ContratosReal,
  vagas:         VagasEmpresa,
  oportunidades: OportunidadesInvestimentoWrapper,
  ficheiros: Ficheiros,
  seguranca: Seguranca,
  configuracoes: Configuracoes,
};

const SECAO_META = {
  painel: {
    label: "Painel geral",
    descricao: "Indicadores e atalhos para o que precisa de atenção hoje.",
  },
  notificacoes: {
    label: "Notificações",
    descricao: "Alertas operacionais e mensagens por tratar.",
  },
  utilizadores: {
    label: "Utilizadores",
    descricao: "Contas registadas, papéis e estados de acesso.",
  },
  cursos: {
    label: "Cursos",
    descricao: "Catálogo, categorias e disponibilidade para inscrições.",
  },
  centros: {
    label: "Centros",
    descricao: "Centros de formação ligados ao programa.",
  },
  ofertas: {
    label: "Ofertas",
    descricao: "Ofertas por curso e ciclos de inscrição.",
  },
  inscricoes: {
    label: "Inscrições",
    descricao: "Pedidos dos alunos, aprovação e acompanhamento.",
  },
  empresas: {
    label: "Empresas",
    descricao: "Registo, documentação e aprovação de perfis empresariais.",
  },
  oportunidades: {
    label: "Oportunidades",
    descricao: "Oportunidades de negócio publicadas pelas empresas.",
  },
  interesses: {
    label: "Interesses",
    descricao: "Manifestações de interesse dos investidores.",
  },
  investimentos: {
    label: "Investimentos",
    descricao: "Processos de investimento e respetivos estados.",
  },
  mediacao: {
    label: "Mediação",
    descricao: "Processos entre empresas e investidores.",
  },
  contratos: {
    label: "Contratos",
    descricao: "Contratos gerados e histórico documental.",
  },
  assinaturas: {
    label: "Assinaturas",
    descricao: "Planos empresariais e estado de subscrição.",
  },
  funcionarios: {
    label: "Funcionários",
    descricao: "Equipa interna e perfis operacionais.",
  },
  consultoria: {
    label: "Consultoria",
    descricao: "Pedidos de consultoria e acompanhamento.",
  },
  visitas: { label: 'Visitas', descricao: 'Visitas agendadas e confirmadas.' },
  suporte: { label: "Suporte", descricao: "Tickets e pedidos de ajuda." },
  'notificacoes-assinatura': { label: 'Alertas de assinatura', descricao: 'Avisos do ciclo de assinatura e cobrança.' },
  pagamentos: {
    label: "Pagamentos",
    descricao: "Comprovativos e conciliação financeira.",
  },
  vagas: {
    label: "Vagas (empresas)",
    descricao: "Vagas publicadas e estado de aprovação.",
  },
  ficheiros: {
    label: "Ficheiros",
    descricao: "Repositório de anexos e documentos.",
  },
  seguranca: {
    label: "Segurança",
    descricao: "Controlo de acesso e boas práticas.",
  },
  configuracoes: {
    label: "Configurações",
    descricao: "Parâmetros gerais da plataforma.",
  },
};

const HUBS_ADMIN = [
  { id: 'visao-geral', label: 'Visão geral', descricao: 'Painel e alertas centrais.', secoes: ['painel', 'notificacoes'] },
  { id: 'formacao', label: 'Formação', descricao: 'Cursos, centros, ofertas e inscrições.', secoes: ['cursos', 'centros', 'ofertas', 'inscricoes'] },
  { id: 'negocios', label: 'Negócios', descricao: 'Empresas, oportunidades, interesses, investimentos, mediação, contratos e assinaturas.', secoes: ['empresas', 'oportunidades', 'interesses', 'investimentos', 'mediacao', 'contratos', 'assinaturas'] },
  { id: 'operacoes', label: 'Operações', descricao: 'Utilizadores, equipa, consultoria, visitas, suporte e alertas de assinatura.', secoes: ['utilizadores', 'funcionarios', 'consultoria', 'visitas', 'suporte', 'notificacoes-assinatura'] },
  { id: 'sistema', label: 'Sistema', descricao: 'Pagamentos, vagas, ficheiros, segurança e configurações.', secoes: ['pagamentos', 'vagas', 'ficheiros', 'seguranca', 'configuracoes'] },
];

// —
// LAYOUT PRINCIPAL
// —
export default function DashboardAdmin({ secaoInicial = "painel" }) {
  const navigate = useNavigate();
  const { tema, alternarTema } = useAuth();
  const [secaoActiva, setSecaoActiva] = useState(secaoInicial);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const SecaoActual = SECOES[secaoActiva] || PainelGeral;
  const hubActivo =
    HUBS_ADMIN.find((hub) => hub.secoes.includes(secaoActiva)) || HUBS_ADMIN[0];
  const metaSecao = SECAO_META[secaoActiva] || SECAO_META.painel;

  const irParaSecao = useCallback(
    (id) => navigate(pathParaSecaoAdmin(id)),
    [navigate],
  );

  useEffect(() => {
    setSecaoActiva(secaoInicial);
  }, [secaoInicial]);

  useEffect(() => {
    adminAPI
      .notificacoes()
      .then(({ data }) => {
        const dados = data.dados || {};
        const lista = dados.notificacoes || dados || [];
        const naoLidas =
          typeof dados.nao_lidas === "number"
            ? dados.nao_lidas
            : lista.filter((item) => !item.lida).length;
        setNotifCount(naoLidas);
      })
      .catch(() => setNotifCount(0));
  }, [secaoActiva]);

  return (
    <div className="admin-layout">
      <Sidebar
        secaoActiva={secaoActiva}
        notifCount={notifCount}
        aberta={sidebarAberta}
        onFechar={() => setSidebarAberta(false)}
      />

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            id="sidebar-toggle"
            className="admin-topbar__icon-btn"
            onClick={() => setSidebarAberta((a) => !a)}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>

          <p className="admin-topbar__context" aria-live="polite">
            {metaSecao.label}
          </p>

          <div className="admin-topbar__right">
            <Link
              to="/"
              className="btn btn--secondary btn--sm dashboard-topbar__site-btn"
              aria-label="Ir para o site público"
              title="Site público"
            >
              <Globe size={15} />
              Ir para o site
            </Link>
            <button
              type="button"
              className="admin-topbar__icon-btn"
              onClick={alternarTema}
              aria-label="Tema"
            >
              {tema === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              type="button"
              className="admin-topbar__icon-btn"
              onClick={() => irParaSecao("notificacoes")}
              aria-label="Notificações"
            >
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="admin-topbar__notif-count">{notifCount}</span>
              )}
            </button>
          </div>
        </header>

        <div className="admin-page">
          <div className="admin-shell">
            <section className="admin-shell__hero">
              <div>
                <span className="admin-shell__eyebrow">{hubActivo.label}</span>
                <h1 className="admin-shell__title">{metaSecao.label}</h1>
                <p className="admin-shell__copy">{metaSecao.descricao}</p>
              </div>
              <div className="admin-shell__summary">
                <span className="admin-shell__summary-label">Área ativa</span>
                <strong>{hubActivo.descricao}</strong>
              </div>
            </section>

            <div
              className="admin-hub-tabs"
              role="tablist"
              aria-label={`Secções em ${hubActivo.label}`}
            >
              {hubActivo.secoes.map((secaoId) => {
                const item = SECAO_META[secaoId] || {
                  label: secaoId,
                  descricao: "",
                };
                const activa = secaoActiva === secaoId;
                return (
                  <button
                    key={secaoId}
                    type="button"
                    className={`admin-hub-tabs__item${activa ? " active" : ""}`}
                    onClick={() => irParaSecao(secaoId)}
                    aria-pressed={activa}
                    title={item.descricao || item.label}
                  >
                    <span className="admin-hub-tabs__label">{item.label}</span>
                    <span className="admin-hub-tabs__copy">
                      {item.descricao}
                    </span>
                  </button>
                );
              })}
            </div>

            <SecaoActual
              navegarSecao={irParaSecao}
              setNotifCount={setNotifCount}
            />
          </div>
        </div>
      </main>

      <style>{`@media(max-width:768px){#sidebar-toggle{display:flex!important}}`}</style>
    </div>
  );
}
