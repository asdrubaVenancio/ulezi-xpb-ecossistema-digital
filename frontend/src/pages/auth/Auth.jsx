// ============================================================
// ULEZI XPB - Autenticacao: login e registo por perfil
// Formularios separados por tipo de conta com validacao clara
// ============================================================
//
// @author AsdrubaDeveloper
// @version 1.0.0

import React, { useMemo, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  User,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { authAPI, extrairErro, STORAGE_KEYS } from "../../services/api";
import { ROLE_DASHBOARD } from "../../utils/constants";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const schemaLogin = z.object({
  email: z.string().email("E-mail inválido").min(1, "Obrigatório"),
  password: z.string().min(1, "Obrigatório"),
});

const schemaRegistar = z
  .object({
    nome: z
      .string()
      .min(3, "Mínimo 3 caracteres")
      .max(120, "Máximo 120 caracteres"),
    email: z.string().email("E-mail inválido"),
    telefone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, "Telefone inválido")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Deve conter letra maiúscula")
      .regex(/[a-z]/, "Deve conter letra minúscula")
      .regex(/[0-9]/, "Deve conter número"),
    confirmar_password: z.string().min(1, "Confirme a palavra-passe"),
    role: z.enum(["student", "company", "investor"], {
      errorMap: () => ({ message: "Seleccione o tipo de conta" }),
    }),
    nome_empresa: z.string().optional().or(z.literal("")),
    tipo_empresa: z.enum(["empresa", "consultoria"]).default("empresa"),
    provincia: z.string().optional().or(z.literal("")),
    municipio: z.string().optional().or(z.literal("")),
    sector_custom: z.string().optional().or(z.literal("")),
    nif: z.string().optional().or(z.literal("")),
    perfil_publico: z.boolean().default(false),
  })
  .superRefine((dados, ctx) => {
    if (dados.password !== dados.confirmar_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmar_password"],
        message: "As palavras-passe não coincidem",
      });
    }

    if (dados.role === "company" && !dados.nome_empresa?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nome_empresa"],
        message: "O nome da empresa é obrigatório para contas empresariais",
      });
    }
  });

const SECTORES_EMPRESA = [
  "Tecnologia",
  "Educacao",
  "Saude",
  "Construcao Civil",
  "Contabilidade e Financas",
  "Marketing e Publicidade",
  "Logistica e Transportes",
  "Consultoria Empresarial",
  "Jurídico e Legal",
  "Alimentacao e Restauracao",
];

const TIPOS_CONTA = [
  {
    valor: "student",
    Icone: BookOpen,
    titulo: "Estudante",
    desc: "Cursos, inscricoes e historico",
  },
  {
    valor: "company",
    Icone: Building2,
    titulo: "Empresa",
    desc: "Perfil empresarial e oportunidades",
  },
  {
    valor: "investor",
    Icone: TrendingUp,
    titulo: "Investidor",
    desc: "Interesses, contratos e analise",
  },
];

function CampoErro({ erro }) {
  if (!erro) return null;
  return (
    <span className="form-error">
      <AlertCircle size={12} /> {erro.message}
    </span>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const destino = location.state?.from?.pathname;
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schemaLogin) });

  const onSubmit = useCallback(
    async ({ email, password }) => {
      try {
        const utilizador = await login(email, password);
        toast.sucesso(
          `Bem-vindo, ${utilizador.nome?.split(" ")[0] || "utilizador"}!`,
        );

        // Redireccionamento por cenário: alteração de senha obrigatória ou destino original
        if (utilizador.password_change_required) {
          toast.aviso(
            "Altere a senha temporária para continuar a usar a plataforma.",
          );
          navigate("/perfil", { replace: true });
          return;
        }
        navigate(destino || ROLE_DASHBOARD[utilizador.role] || "/", {
          replace: true,
        });
      } catch (e) {
        toast.erro(extrairErro(e));
      }
    },
    [destino, login, navigate, toast],
  );

  return (
    <div className="publico-layout">
      <Navbar />
      <main className="auth-page-wrapper">
        <div className="auth-card">
          {/* Logótipo */}
          <div className="auth-logo-area">
            <div
              className="auth-logo-badge auth-logo-badge--brand"
              aria-hidden="true"
            >
              U
            </div>
            <h1 className="auth-card__title">Entrar</h1>
            <p className="auth-card__sub">Aceda à sua conta ULEZI XPB</p>
          </div>

          {/* Formulário de login */}
          <form
            className="auth-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                E-mail
              </label>
              <div className="form-input-wrapper">
                <Mail size={16} />
                <input
                  id="login-email"
                  type="email"
                  className={`form-input form-input--icon${errors.email ? " form-input--error" : ""}`}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  autoFocus
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </div>
              <CampoErro erro={errors.email} />
            </div>

            <div className="form-group">
              <div className="auth-password-header">
                <label className="form-label" htmlFor="login-password">
                  Palavra-passe
                </label>
                <Link to="/recuperar-senha" className="auth-forgot-link">
                  Esqueceu?
                </Link>
              </div>
              <div className="form-input-wrapper">
                <Lock size={16} />
                <input
                  id="login-password"
                  type={mostrarSenha ? "text" : "password"}
                  className={`form-input form-input--icon form-input--right-action${errors.password ? " form-input--error" : ""}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="form-input-toggle"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <CampoErro erro={errors.password} />
            </div>

            <button
              type="submit"
              className={`btn btn--primary btn--full btn--lg${isSubmitting ? " btn--loading" : ""}`}
              disabled={isSubmitting}
            >
              {!isSubmitting && (
                <>
                  Entrar <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="auth-divider">
            <span>Não tem conta?</span>
          </div>

          {/* CTA de registo */}
          <Link to="/criar-conta" className="btn btn--secondary btn--full">
            Criar conta gratuita
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function Registar() {
  const toast = useToast();
  const navigate = useNavigate();
  const { loginComDados } = useAuth();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [sectoresSelecionados, setSectoresSelecionados] = useState([]);
  const [documentosEmpresa, setDocumentosEmpresa] = useState({
    documento_alvara: null,
    documento_nif: null,
    documento_certidao: null,
    documento_identificacao: null,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemaRegistar),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      role: "student",
      telefone: "",
      nome_empresa: "",
      tipo_empresa: "empresa",
      provincia: "",
      municipio: "",
      sector_custom: "",
      nif: "",
      perfil_publico: false,
    },
  });

  const roleAtual = watch("role");
  const tipoEmpresaAtual = watch("tipo_empresa");
  const ehConsultoria =
    roleAtual === "company" && tipoEmpresaAtual === "consultoria";
  const senhaAtual = watch("password");
  const tituloNome = useMemo(() => {
    if (roleAtual === "company") return "Nome do responsável";
    return "Nome completo";
  }, [roleAtual]);
  const senhaChecks = useMemo(
    () => [
      { label: "Pelo menos 8 caracteres", ok: (senhaAtual || "").length >= 8 },
      { label: "Uma letra maiúscula", ok: /[A-Z]/.test(senhaAtual || "") },
      { label: "Uma letra minúscula", ok: /[a-z]/.test(senhaAtual || "") },
      { label: "Um número", ok: /[0-9]/.test(senhaAtual || "") },
    ],
    [senhaAtual],
  );

  const onSubmit = useCallback(
    async (dados) => {
      try {
        const payload = new FormData();
        payload.append("nome", dados.nome);
        payload.append("email", dados.email);
        payload.append("password", dados.password);
        payload.append("role", dados.role);
        if (dados.telefone) payload.append("telefone", dados.telefone);

        if (dados.role === "student") {
          if (dados.provincia) payload.append("provincia", dados.provincia);
          if (dados.municipio) payload.append("municipio", dados.municipio);
          payload.append("is_public", dados.perfil_publico ? "true" : "false");
        }

        if (dados.role === "investor") {
          if (dados.provincia) payload.append("provincia", dados.provincia);
          if (dados.municipio) payload.append("municipio", dados.municipio);
          payload.append("is_public", dados.perfil_publico ? "true" : "false");
        }

        if (dados.role === "company") {
          const sectorFinal = ehConsultoria
            ? ""
            : [
                ...sectoresSelecionados,
                ...(dados.sector_custom ? [dados.sector_custom.trim()] : []),
              ]
                .filter(Boolean)
                .join(", ");

          if (
            !documentosEmpresa.documento_alvara ||
            !documentosEmpresa.documento_nif ||
            !documentosEmpresa.documento_certidao ||
            !documentosEmpresa.documento_identificacao
          ) {
            toast.erro(
              "Anexe todos os documentos obrigatórios da empresa antes de concluir o registo.",
            );
            return;
          }

          payload.append("nome_empresa", dados.nome_empresa || "");
          payload.append("tipo_empresa", dados.tipo_empresa || "empresa");
          if (dados.provincia) payload.append("provincia", dados.provincia);
          if (dados.municipio) payload.append("municipio", dados.municipio);
          if (sectorFinal) payload.append("sector", sectorFinal);
          if (dados.nif) payload.append("nif", dados.nif);

          payload.append(
            "documento_alvara",
            documentosEmpresa.documento_alvara,
          );
          payload.append("documento_nif", documentosEmpresa.documento_nif);
          payload.append(
            "documento_certidao",
            documentosEmpresa.documento_certidao,
          );
          payload.append(
            "documento_identificacao",
            documentosEmpresa.documento_identificacao,
          );
        }

        const { data } = await authAPI.registar(payload);
        
        // Login automático após registro bem-sucedido
        const dados = data.dados || data.data || {};
        const token = dados.token;
        const refreshToken = dados.refresh_token;
        const user = dados.utilizador || dados.user;
        
        if (token && user) {
          loginComDados(token, refreshToken, user);
          toast.sucesso("Conta criada com sucesso! Entrando...");
          
          // Redirecionar para a dashboard adequada
          const dashboard = ROLE_DASHBOARD[user.role] || "/";
          navigate(dashboard, { replace: true });
        } else {
          // Se não recebeu token, mostrar tela de sucesso normal
          setSucesso(true);
        }
      } catch (e) {
        toast.erro(extrairErro(e));
      }
    },
    [documentosEmpresa, ehConsultoria, sectoresSelecionados, toast, loginComDados, navigate],
  );

  const atualizarDocumentoEmpresa = (campo, ficheiro) => {
    setDocumentosEmpresa((anterior) => ({
      ...anterior,
      [campo]: ficheiro || null,
    }));
  };

  const alternarSector = (sector) => {
    setSectoresSelecionados((anteriores) =>
      anteriores.includes(sector)
        ? anteriores.filter((item) => item !== sector)
        : [...anteriores, sector],
    );
  };

  const totalSetoresSelecionados = ehConsultoria
    ? 0
    : sectoresSelecionados.length + (watch("sector_custom")?.trim() ? 1 : 0);

  if (sucesso) {
    return (
      <div className="publico-layout">
        <Navbar />
        <main className="auth-page-wrapper">
          <div className="auth-card auth-recover-success">
            <div className="auth-sucesso-icone" aria-hidden="true">
              <CheckCircle2 size={34} strokeWidth={2} color="var(--verde)" />
            </div>
            <h1 className="auth-card__title">Conta criada</h1>
            <p className="auth-card__sub" style={{ marginBottom: 24 }}>
              O registo foi concluído com sucesso. Já pode entrar na plataforma.
            </p>
            <Link to="/entrar" className="btn btn--primary btn--full">
              Ir para o login
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="publico-layout">
      <Navbar />
      <div className="publico-main auth-body auth-body--register">
        <div
          className={`auth-card ${roleAtual === "company" ? "auth-card--wide" : "auth-card--register"}`}
        >
          <div className="auth-register__hero">
            <span className="auth-register__eyebrow">Onboarding ULEZI XPB</span>
            <h1 className="auth-card__title" style={{ marginBottom: 10 }}>
              Criar conta
            </h1>
            <p className="auth-card__sub" style={{ marginBottom: 0 }}>
              Escolha o perfil correto, preencha apenas o essencial e conclua o
              registo com validação imediata.
            </p>
          </div>

          <div className="auth-register__scroll">
            <form
              className="auth-form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <section className="auth-section">
                <div className="auth-section__header">
                  <div>
                    <h2 className="auth-section__title">Tipo de conta</h2>
                    <p className="auth-section__desc">
                      Cada perfil activa apenas os campos de que realmente
                      precisa neste momento.
                    </p>
                  </div>
                </div>

                <div className="auth-role-grid">
                  {TIPOS_CONTA.map(({ valor, Icone, titulo, desc }) => {
                    const ativo = roleAtual === valor;
                    return (
                      <button
                        key={valor}
                        type="button"
                        onClick={() =>
                          setValue("role", valor, { shouldValidate: true })
                        }
                        className={`auth-role-option${ativo ? " auth-role-option--active" : ""}`}
                      >
                        <div className="auth-role-option__icon">
                          <Icone size={18} />
                        </div>
                        <div>
                          <p className="auth-role-option__title">{titulo}</p>
                          <p className="auth-role-option__desc">{desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" {...register("role")} />
                <CampoErro erro={errors.role} />
              </section>

              <section className="auth-section">
                <div className="auth-section__header">
                  <div>
                    <h2 className="auth-section__title">Dados principais</h2>
                    <p className="auth-section__desc">
                      Informações básicas para criar o acesso e identificar o
                      perfil.
                    </p>
                  </div>
                </div>

                <div className="auth-grid auth-grid--2">
                  <div className="form-group">
                    <label className="form-label">{tituloNome}</label>
                    <div className="form-input-wrapper">
                      <User size={16} />
                      <input
                        type="text"
                        className={`form-input form-input--icon${errors.nome ? " form-input--error" : ""}`}
                        placeholder={
                          roleAtual === "company"
                            ? "Nome do gestor ou representante"
                            : "Nome completo"
                        }
                        autoComplete="name"
                        {...register("nome")}
                      />
                    </div>
                    <CampoErro erro={errors.nome} />
                  </div>

                  {roleAtual === "company" && (
                    <div className="form-group">
                      <label className="form-label">Nome da empresa</label>
                      <div className="form-input-wrapper">
                        <Building2 size={16} />
                        <input
                          type="text"
                          className={`form-input form-input--icon${errors.nome_empresa ? " form-input--error" : ""}`}
                          placeholder="Ex.: Ulezi Business Angola"
                          {...register("nome_empresa")}
                        />
                      </div>
                      <CampoErro erro={errors.nome_empresa} />
                    </div>
                  )}

                  {roleAtual === "company" && (
                    <div className="form-group">
                      <label className="form-label">
                        Tipo de conta empresarial
                      </label>
                      <select
                        className="form-input"
                        {...register("tipo_empresa")}
                      >
                        <option value="empresa">Empresa</option>
                        <option value="consultoria">
                          Empresa de consultoria
                        </option>
                      </select>
                      <span className="form-hint">
                        Seleccione consultoria para activar o fluxo de
                        validação, assinatura e agenda próprios deste módulo.
                      </span>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <div className="form-input-wrapper">
                      <Mail size={16} />
                      <input
                        type="email"
                        className={`form-input form-input--icon${errors.email ? " form-input--error" : ""}`}
                        placeholder="seu@email.com"
                        autoComplete="email"
                        {...register("email")}
                      />
                    </div>
                    <CampoErro erro={errors.email} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <div className="form-input-wrapper">
                      <Phone size={16} />
                      <input
                        type="tel"
                        className={`form-input form-input--icon${errors.telefone ? " form-input--error" : ""}`}
                        placeholder="+244 9XX XXX XXX"
                        autoComplete="tel"
                        {...register("telefone")}
                      />
                    </div>
                    <CampoErro erro={errors.telefone} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Província</label>
                    <div className="form-input-wrapper">
                      <MapPin size={16} />
                      <input
                        type="text"
                        className={`form-input form-input--icon${errors.provincia ? " form-input--error" : ""}`}
                        placeholder="Ex.: Luanda"
                        {...register("provincia")}
                      />
                    </div>
                    <CampoErro erro={errors.provincia} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Município</label>
                    <div className="form-input-wrapper">
                      <MapPin size={16} />
                      <input
                        type="text"
                        className={`form-input form-input--icon${errors.municipio ? " form-input--error" : ""}`}
                        placeholder="Ex.: Viana"
                        {...register("municipio")}
                      />
                    </div>
                    <CampoErro erro={errors.municipio} />
                  </div>
                </div>
              </section>

              {roleAtual === "company" && (
                <section className="auth-section auth-section--company">
                  <div className="auth-section__header auth-section__header--split">
                    <div>
                      <h2 className="auth-section__title">
                        Perfil empresarial
                      </h2>
                      <p className="auth-section__desc">
                        {ehConsultoria
                          ? "As empresas de consultoria não precisam preencher sectores. Envie a documentação obrigatória para validação administrativa."
                          : "Defina os sectores da empresa e envie já a documentação para avaliação administrativa."}
                      </p>
                    </div>
                    <div className="auth-section__meta">
                      {!ehConsultoria && (
                        <span className="badge badge--ciano">
                          {totalSetoresSelecionados} setor(es)
                        </span>
                      )}
                      <span className="badge badge--amarelo">
                        4 documentos obrigatórios
                      </span>
                    </div>
                  </div>

                  <div
                    className="auth-grid auth-grid--2"
                    style={{ marginBottom: 18 }}
                  >
                    <div className="form-group">
                      <label className="form-label">NIF da empresa</label>
                      <div className="form-input-wrapper">
                        <Building2 size={16} />
                        <input
                          type="text"
                          className={`form-input form-input--icon${errors.nif ? " form-input--error" : ""}`}
                          placeholder="Número de identificação fiscal"
                          {...register("nif")}
                        />
                      </div>
                      <CampoErro erro={errors.nif} />
                    </div>

                    {!ehConsultoria && (
                      <div className="form-group">
                        <label className="form-label">Outro setor</label>
                        <div className="form-input-wrapper">
                          <Building2 size={16} />
                          <input
                            type="text"
                            className={`form-input form-input--icon${errors.sector_custom ? " form-input--error" : ""}`}
                            placeholder="Escreva um setor adicional se nao existir"
                            {...register("sector_custom")}
                          />
                        </div>
                        <CampoErro erro={errors.sector_custom} />
                      </div>
                    )}
                  </div>

                  {!ehConsultoria ? (
                    <div className="form-group">
                      <label className="form-label">Setores de atividade</label>
                      <div className="sector-picker">
                        {SECTORES_EMPRESA.map((sector) => {
                          const ativo = sectoresSelecionados.includes(sector);
                          return (
                            <button
                              key={sector}
                              type="button"
                              className={`sector-chip${ativo ? " sector-chip--active" : ""}`}
                              onClick={() => alternarSector(sector)}
                            >
                              <span>{sector}</span>
                              {ativo && <Check size={14} />}
                            </button>
                          );
                        })}
                      </div>
                      <span className="form-hint">
                        Pode seleccionar varios setores. Caso precise, use
                        tambem o campo "Outro setor".
                      </span>
                      {totalSetoresSelecionados > 0 && (
                        <div className="sector-selection-summary">
                          {sectoresSelecionados.map((sector) => (
                            <span key={sector} className="badge badge--ciano">
                              {sector}
                            </span>
                          ))}
                          {watch("sector_custom")?.trim() && (
                            <span className="badge badge--laranja">
                              {watch("sector_custom").trim()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Setores de atividade</label>
                      <div className="form-hint">
                        Este campo não é obrigatório para empresas do tipo
                        consultoria.
                      </div>
                    </div>
                  )}

                  <div className="auth-upload-grid">
                    {[
                      [
                        "documento_alvara",
                        "Alvará comercial",
                        "Comprovativo legal da actividade da empresa.",
                      ],
                      [
                        "documento_nif",
                        "Documento do NIF",
                        "Documento fiscal usado para validação da empresa.",
                      ],
                      [
                        "documento_certidao",
                        "Certidão comercial",
                        "Certidão ou registo comercial actualizado.",
                      ],
                      [
                        "documento_identificacao",
                        "Identificação do responsável",
                        "BI, passaporte ou outro documento oficial.",
                      ],
                    ].map(([campo, label, descricao]) => (
                      <div key={campo} className="upload-card">
                        <div className="upload-card__top">
                          <div className="upload-card__icon">
                            <Upload size={16} />
                          </div>
                          <div>
                            <p className="upload-card__title">{label}</p>
                            <p className="upload-card__desc">{descricao}</p>
                          </div>
                        </div>

                        <label className="upload-card__action">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            onChange={(e) =>
                              atualizarDocumentoEmpresa(
                                campo,
                                e.target.files?.[0],
                              )
                            }
                          />
                          <span className="btn btn--secondary btn--sm">
                            Escolher ficheiro
                          </span>
                        </label>

                        <div className="upload-card__file">
                          {documentosEmpresa[campo] ? (
                            <>
                              <span className="truncate">
                                {documentosEmpresa[campo].name}
                              </span>
                              <button
                                type="button"
                                className="upload-card__remove"
                                onClick={() =>
                                  atualizarDocumentoEmpresa(campo, null)
                                }
                                aria-label={`Remover ${label}`}
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <span>Nenhum ficheiro seleccionado</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(roleAtual === "student" || roleAtual === "investor") && (
                <section className="auth-section">
                  <label className="auth-check-card">
                    <input type="checkbox" {...register("perfil_publico")} />
                    <div>
                      <p className="auth-check-card__title">
                        Tornar perfil publico
                      </p>
                      <p className="auth-check-card__desc">
                        {roleAtual === "student"
                          ? "Permite que outros membros vejam o seu perfil na comunidade."
                          : "Define logo no registo se o investidor quer aparecer publicamente na comunidade."}
                      </p>
                    </div>
                  </label>
                </section>
              )}

              <section className="auth-section">
                <div className="auth-section__header">
                  <div>
                    <h2 className="auth-section__title">Segurança de acesso</h2>
                    <p className="auth-section__desc">
                      A palavra-passe é validada em tempo real para evitar
                      registos fracos.
                    </p>
                  </div>
                </div>

                <div className="auth-grid auth-grid--2">
                  <div className="form-group">
                    <label className="form-label">Palavra-passe</label>
                    <div className="form-input-wrapper">
                      <Lock size={16} />
                      <input
                        type={mostrarSenha ? "text" : "password"}
                        className={`form-input form-input--icon${errors.password ? " form-input--error" : ""}`}
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        style={{ paddingRight: 44 }}
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((v) => !v)}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--txt-4)",
                        }}
                        aria-label="Ver senha"
                      >
                        {mostrarSenha ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    <CampoErro erro={errors.password} />
                    <div className="password-checklist">
                      {senhaChecks.map((item) => (
                        <div
                          key={item.label}
                          className={`password-check${item.ok ? " password-check--ok" : ""}`}
                        >
                          <Check size={13} />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Confirmar palavra-passe
                    </label>
                    <div className="form-input-wrapper">
                      <Lock size={16} />
                      <input
                        type="password"
                        className={`form-input form-input--icon${errors.confirmar_password ? " form-input--error" : ""}`}
                        placeholder="Repita a palavra-passe"
                        autoComplete="new-password"
                        {...register("confirmar_password")}
                      />
                    </div>
                    <CampoErro erro={errors.confirmar_password} />
                  </div>
                </div>
              </section>

              <button
                type="submit"
                className={`btn btn--primary btn--full${isSubmitting ? " btn--loading" : ""}`}
                disabled={isSubmitting}
              >
                {!isSubmitting && (
                  <>
                    Criar conta <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider" style={{ margin: "20px 0" }}>
              <span>Já tem conta?</span>
            </div>
            <Link to="/entrar" className="btn btn--secondary btn--full">
              Entrar
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
