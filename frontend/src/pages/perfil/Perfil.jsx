import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Camera,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  TrendingUp,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  authAPI,
  empresaAPI,
  investidorAPI,
  extrairErro,
  BACKEND_BASE_URL,
} from "../../services/api";
import { useToast } from "../../components/ui/Toast";
import { PageLoader } from "../../components/ui/index.jsx";
import { iniciais, ROLE_DASHBOARD, ROLE_LABELS } from "../../utils/constants";

const schemaPerfilBase = z.object({
  nome: z.string().min(3, "Informe o nome completo."),
  telefone: z.string().max(30).optional().or(z.literal("")),
});

const schemaSenha = z
  .object({
    password_atual: z.string().min(1, "Informe a palavra-passe actual."),
    nova_password: z
      .string()
      .min(8, "A nova palavra-passe deve ter pelo menos 8 caracteres."),
    confirmar: z.string().min(1, "Confirme a nova palavra-passe."),
  })
  .refine((data) => data.nova_password === data.confirmar, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmar"],
  });

const roleColor = {
  student: "var(--ciano)",
  estudante: "var(--ciano)",
  company: "var(--laranja)",
  empresa: "var(--laranja)",
  investor: "var(--verde)",
  investidor: "var(--verde)",
  admin: "var(--vermelho)",
  employee: "var(--roxo)",
  funcionario: "var(--roxo)",
};

export default function Perfil() {
  const { utilizador, atualizarUtilizador } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [aba, setAba] = useState("dados");

  useEffect(() => {
    if (utilizador?.password_change_required) {
      setAba("seguranca");
    }
  }, [utilizador?.password_change_required]);

  const cor = roleColor[utilizador?.role] || "var(--ciano)";
  const tabs = useMemo(() => {
    const base = [
      { id: "dados", label: "Dados pessoais", icon: <User size={14} /> },
      { id: "seguranca", label: "Segurança", icon: <Lock size={14} /> },
    ];
    if (["investor", "investidor"].includes(utilizador?.role)) {
      base.push({
        id: "investidor",
        label: "Perfil investidor",
        icon: <TrendingUp size={14} />,
      });
    }
    if (["company", "empresa"].includes(utilizador?.role)) {
      base.push({
        id: "empresa",
        label: "Perfil empresa",
        icon: <Briefcase size={14} />,
      });
    }
    return base;
  }, [utilizador?.role]);

  return (
    <div className="perfil-container">
      {/* Cabeçalho do perfil — com foto ou iniciais + botão de upload */}
      <section className="perfil-cabecalho">
        <FotoPerfilUpload
          utilizador={utilizador}
          onSucesso={(novaFoto) =>
            atualizarUtilizador({ ...utilizador, foto_perfil: novaFoto })
          }
        />
        <div className="perfil-info">
          <div className="perfil-info__header">
            <h1 className="perfil-info__nome">
              {utilizador?.nome || "Perfil"}
            </h1>
            <span className="perfil-tipo-badge" style={{ "--perfil-cor": cor }}>
              {ROLE_LABELS[utilizador?.role] || utilizador?.role}
            </span>
          </div>
          <p className="perfil-info__email">{utilizador?.email}</p>
          <div className="perfil-info__meta">
            <span>
              <Mail size={14} /> Conta autenticada
            </span>
            <span>
              <Shield size={14} /> Dados protegidos por sessão
            </span>
          </div>
        </div>
      </section>

      {/* ── Abas + alerta de senha temporária ───── */}
      <section className="perfil-tabs-section">
        {utilizador?.password_change_required && (
          <div className="alert alert--warning" style={{ marginBottom: 16 }}>
            A sua conta foi criada com uma senha temporária. Para continuar,
            altere a palavra-passe nesta página.
          </div>
        )}
        <div className="tabs" style={{ marginBottom: 0 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-btn${aba === tab.id ? " active" : ""}`}
              onClick={() => setAba(tab.id)}
              role="tab"
              aria-selected={aba === tab.id}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </section>

      {aba === "dados" && (
        <DadosPessoais
          utilizador={utilizador}
          onSucesso={(dados) => {
            atualizarUtilizador({ ...utilizador, ...dados });
            toast.sucesso("Dados pessoais actualizados com sucesso.");
          }}
          onErro={(mensagem) => toast.erro(mensagem)}
        />
      )}

      {aba === "seguranca" && (
        <Seguranca
          onSucesso={() => {
            atualizarUtilizador({ password_change_required: false });
            toast.sucesso("Palavra-passe actualizada com sucesso.");
            navigate(ROLE_DASHBOARD[utilizador?.role] || "/", {
              replace: true,
            });
          }}
          onErro={(mensagem) => toast.erro(mensagem)}
        />
      )}

      {aba === "investidor" &&
        ["investor", "investidor"].includes(utilizador?.role) && (
          <PerfilInvestidor
            onAviso={(mensagem) => toast.erro(mensagem)}
            onSucesso={() => toast.sucesso("Perfil de investidor actualizado.")}
          />
        )}

      {aba === "empresa" &&
        ["company", "empresa"].includes(utilizador?.role) && (
          <PerfilEmpresa
            onAviso={(mensagem) => toast.erro(mensagem)}
            onSucesso={() => toast.sucesso("Perfil empresarial actualizado.")}
          />
        )}
    </div>
  );
}

/**
 * Componente para exibir e actualizar a foto de perfil.
 * Mostra a foto actual (ou iniciais como fallback) com botão de câmara.
 */
function FotoPerfilUpload({ utilizador, onSucesso }) {
  const toast = useToast();
  const [carregando, setCarregando] = useState(false);
  const inputRef = React.useRef(null);

  const urlFoto = utilizador?.foto_perfil
    ? utilizador.foto_perfil.startsWith("http")
      ? utilizador.foto_perfil
      : `${BACKEND_BASE_URL}${utilizador.foto_perfil}?t=${Date.now()}`
    : null;

  const cor = roleColor[utilizador?.role] || "var(--ciano)";

  const selecionarFoto = () => inputRef.current?.click();

  const handleFoto = async (e) => {
    const ficheiro = e.target.files?.[0];
    if (!ficheiro) return;

    const tiposPermitidos = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!tiposPermitidos.includes(ficheiro.type)) {
      return toast.aviso("Formato inválido. Use JPG, PNG ou WEBP.");
    }
    if (ficheiro.size > 2 * 1024 * 1024) {
      return toast.aviso("Imagem muito grande. Máximo 2MB.");
    }

    setCarregando(true);
    try {
      const fd = new FormData();
      fd.append("foto", ficheiro);
      const { data } = await authAPI.uploadFoto(fd);
      const novaFoto = data.dados?.foto_perfil || data.foto_perfil;
      onSucesso(novaFoto);
      toast.sucesso("Foto de perfil actualizada!");
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setCarregando(false);
      // Limpar input para permitir re-seleccionar o mesmo ficheiro
      e.target.value = "";
    }
  };

  return (
    <div
      className="perfil-avatar-box"
      style={{ "--perfil-cor": cor, position: "relative", cursor: "pointer" }}
      onClick={selecionarFoto}
      title="Clique para alterar a foto de perfil"
    >
      {/* Foto ou iniciais */}
      {urlFoto ? (
        <img
          src={urlFoto}
          alt={`Foto de perfil de ${utilizador?.nome || "utilizador"}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "inherit",
          }}
          onError={(e) => {
            console.error("[FOTO_PERFIL] Erro ao carregar:", urlFoto);
            e.target.style.display = "none";
          }}
        />
      ) : (
        iniciais(utilizador?.nome || "?")
      )}

      {/* Overlay de câmara ao hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: carregando ? 1 : 0,
          transition: "opacity 0.2s",
        }}
        className="perfil-avatar-overlay"
      >
        {carregando ? (
          <div
            style={{
              width: 22,
              height: 22,
              border: "3px solid #fff",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        ) : (
          <Camera size={22} color="#fff" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleFoto}
      />

      <style>{`
        .perfil-avatar-box:hover .perfil-avatar-overlay { opacity: 1 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function DadosPessoais({ utilizador, onSucesso, onErro }) {
  const ehEstudante = ["student", "estudante"].includes(utilizador?.role);
  const [perfilPublico, setPerfilPublico] = useState(false);
  const [perfilCarregado, setPerfilCarregado] = useState(!ehEstudante);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemaPerfilBase),
    defaultValues: {
      nome: utilizador?.nome || "",
      telefone: utilizador?.telefone || "",
    },
  });

  useEffect(() => {
    reset({
      nome: utilizador?.nome || "",
      telefone: utilizador?.telefone || "",
    });
  }, [utilizador?.nome, utilizador?.telefone, reset]);

  useEffect(() => {
    if (!ehEstudante) return;
    let cancelado = false;
    authAPI
      .obterPerfilCompleto()
      .then(({ data }) => {
        if (cancelado) return;
        const p = data.dados?.profile || data.data?.profile || {};
        const pub = p.is_public === 1 || p.is_public === true;
        setPerfilPublico(!!pub);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setPerfilCarregado(true);
      });
    return () => {
      cancelado = true;
    };
  }, [ehEstudante, utilizador?.id]);

  const submeter = async (dados) => {
    try {
      const payload = { ...dados };
      if (ehEstudante) payload.is_public = perfilPublico;
      await authAPI.atualizarPerfil(payload);
      onSucesso(dados);
    } catch (e) {
      onErro(extrairErro(e));
    }
  };

  return (
    <form className="perfil-secao" onSubmit={handleSubmit(submeter)}>
      <CabecalhoSecao
        titulo="Dados pessoais"
        subtitulo="Informações principais da sua conta."
        icone={<User size={18} />}
      />
      <div className="perfil-secao__grid">
        <Campo
          label="Nome completo"
          erro={errors.nome?.message}
          icon={<User size={16} />}
        >
          <input
            className="form-input form-input--icon"
            {...register("nome")}
          />
        </Campo>
        <Campo
          label="E-mail"
          ajuda="O e-mail é definido no registo e não pode ser alterado nesta área."
          icon={<Mail size={16} />}
        >
          <input
            className="form-input form-input--icon"
            value={utilizador?.email || ""}
            disabled
          />
        </Campo>
        <Campo
          label="Telefone"
          erro={errors.telefone?.message}
          icon={<Phone size={16} />}
        >
          <input
            className="form-input form-input--icon"
            {...register("telefone")}
            placeholder="+244 9XX XXX XXX"
          />
        </Campo>
        {ehEstudante && perfilCarregado && (
          <TogglePublico
            value={perfilPublico}
            onChange={setPerfilPublico}
            titulo="Perfil público na comunidade"
            descricao="Ao activar, o seu nome e localização podem aparecer na página Comunidade (Membros), conforme as regras da plataforma."
          />
        )}
      </div>
      <AcaoGuardar
        carregando={isSubmitting || (ehEstudante && !perfilCarregado)}
      />
    </form>
  );
}

function Seguranca({ onSucesso, onErro }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemaSenha),
  });

  const submeter = async (dados) => {
    try {
      await authAPI.alterarSenha({
        password_atual: dados.password_atual,
        nova_password: dados.nova_password,
      });
      reset();
      onSucesso();
    } catch (e) {
      onErro(extrairErro(e));
    }
  };

  return (
    <form className="perfil-secao" onSubmit={handleSubmit(submeter)}>
      <CabecalhoSecao
        titulo="Segurança da conta"
        subtitulo="Mantenha uma palavra-passe forte e actualizada."
        icone={<Shield size={18} />}
      />
      <div className="perfil-secao__grid">
        <Campo
          label="Palavra-passe actual"
          erro={errors.password_atual?.message}
          icon={<Lock size={16} />}
        >
          <input
            type="password"
            className="form-input form-input--icon"
            {...register("password_atual")}
          />
        </Campo>
        <Campo
          label="Nova palavra-passe"
          erro={errors.nova_password?.message}
          icon={<Lock size={16} />}
        >
          <input
            type="password"
            className="form-input form-input--icon"
            {...register("nova_password")}
          />
        </Campo>
        <Campo
          label="Confirmar nova palavra-passe"
          erro={errors.confirmar?.message}
          icon={<Lock size={16} />}
        >
          <input
            type="password"
            className="form-input form-input--icon"
            {...register("confirmar")}
          />
        </Campo>
      </div>
      <AcaoGuardar carregando={isSubmitting} />
    </form>
  );
}

function PerfilInvestidor({ onSucesso, onAviso }) {
  const [form, setForm] = useState({
    provincia: "",
    municipio: "",
    capital_disponivel: "",
    experiencia_previa: "",
    perfil_publico: false,
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    investidorAPI
      .perfil()
      .then(({ data }) => {
        const perfil = data.dados?.perfil || data.dados || {};
        setForm({
          provincia: perfil.provincia || "",
          municipio: perfil.municipio || "",
          capital_disponivel: perfil.capital_disponivel || "",
          experiencia_previa:
            perfil.experiencia_previa || perfil.descricao || "",
          perfil_publico: !!(perfil.perfil_publico ?? perfil.is_public),
        });
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.provincia) {
      onAviso("Seleccione ou informe a província do investidor.");
      return;
    }
    setSalvando(true);
    try {
      await investidorAPI.atualizarPerfil({
        provincia: form.provincia,
        municipio: form.municipio || null,
        capital_disponivel: form.capital_disponivel || null,
        experiencia_previa: form.experiencia_previa || null,
        is_public: form.perfil_publico,
      });
      onSucesso();
    } catch (e) {
      onAviso(extrairErro(e));
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="perfil-secao perfil-secao--loading">
        <PageLoader />
      </div>
    );
  }

  return (
    <form className="perfil-secao" onSubmit={guardar}>
      <CabecalhoSecao
        titulo="Perfil de investidor"
        subtitulo="Defina como deseja aparecer na plataforma e quais dados operacionais quer expor."
        icone={<TrendingUp size={18} />}
      />
      <div className="perfil-secao__grid">
        <Campo label="Província" icon={<MapPin size={16} />}>
          <input
            className="form-input form-input--icon"
            value={form.provincia}
            onChange={(e) =>
              setForm((s) => ({ ...s, provincia: e.target.value }))
            }
            placeholder="Ex: Luanda"
          />
        </Campo>
        <Campo label="Município" icon={<MapPin size={16} />}>
          <input
            className="form-input form-input--icon"
            value={form.municipio}
            onChange={(e) =>
              setForm((s) => ({ ...s, municipio: e.target.value }))
            }
            placeholder="Ex: Talatona"
          />
        </Campo>
        <Campo label="Capital disponível" icon={<TrendingUp size={16} />}>
          <input
            className="form-input form-input--icon"
            value={form.capital_disponivel}
            onChange={(e) =>
              setForm((s) => ({ ...s, capital_disponivel: e.target.value }))
            }
            placeholder="Opcional"
          />
        </Campo>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">Resumo do perfil</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={form.experiencia_previa}
            onChange={(e) =>
              setForm((s) => ({ ...s, experiencia_previa: e.target.value }))
            }
            placeholder="Indique experiência, tickets médios ou preferências de investimento."
          />
        </div>
        <TogglePublico
          value={form.perfil_publico}
          onChange={(value) =>
            setForm((s) => ({ ...s, perfil_publico: value }))
          }
          titulo="Perfil público"
          descricao="Quando activo, o seu perfil de investidor pode aparecer na página Comunidade (Membros)."
        />
      </div>
      <AcaoGuardar carregando={salvando} />
    </form>
  );
}

function PerfilEmpresa({ onSucesso, onAviso }) {
  const [form, setForm] = useState({
    nome_empresa: "",
    sector: "",
    descricao: "",
    website: "",
    provincia: "",
    municipio: "",
    endereco: "",
    perfil_publico: false,
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    empresaAPI
      .perfil()
      .then(({ data }) => {
        const perfil = data.dados?.perfil || data.dados || {};
        setForm({
          nome_empresa: perfil.nome_empresa || "",
          sector: perfil.sector || "",
          descricao: perfil.descricao || "",
          website: perfil.website || "",
          provincia: perfil.provincia || "",
          municipio: perfil.municipio || "",
          endereco: perfil.endereco || "",
          perfil_publico: perfil.is_public === 1 || perfil.is_public === true,
        });
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nome_empresa) {
      onAviso("O nome da empresa é obrigatório.");
      return;
    }
    setSalvando(true);
    try {
      await authAPI.atualizarPerfil({
        sector: form.sector || null,
        descricao: form.descricao || null,
        website: form.website || null,
        provincia: form.provincia || null,
        municipio: form.municipio || null,
        endereco: form.endereco || null,
        is_public: form.perfil_publico,
      });
      onSucesso();
    } catch (e) {
      onAviso(extrairErro(e));
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="perfil-secao perfil-secao--loading">
        <PageLoader />
      </div>
    );
  }

  return (
    <form className="perfil-secao" onSubmit={guardar}>
      <CabecalhoSecao
        titulo="Perfil empresarial"
        subtitulo="Organize as informações públicas da empresa para oportunidades, comunidade e validação interna."
        icone={<Briefcase size={18} />}
      />
      <div className="perfil-secao__grid">
        <Campo
          label="Nome da empresa"
          ajuda="Definido no registo inicial."
          icon={<Briefcase size={16} />}
        >
          <input
            className="form-input form-input--icon"
            value={form.nome_empresa}
            disabled
          />
        </Campo>
        <Campo label="Sector principal" icon={<Briefcase size={16} />}>
          <input
            className="form-input form-input--icon"
            value={form.sector}
            onChange={(e) => setForm((s) => ({ ...s, sector: e.target.value }))}
            placeholder="Ex: Tecnologia, Educação, Construção"
          />
        </Campo>
        <Campo label="Website" icon={<Globe size={16} />}>
          <input
            className="form-input form-input--icon"
            value={form.website}
            onChange={(e) =>
              setForm((s) => ({ ...s, website: e.target.value }))
            }
            placeholder="https://empresa.ao"
          />
        </Campo>
        <Campo label="Província" icon={<MapPin size={16} />}>
          <input
            className="form-input form-input--icon"
            value={form.provincia}
            onChange={(e) =>
              setForm((s) => ({ ...s, provincia: e.target.value }))
            }
          />
        </Campo>
        <Campo label="Município" icon={<MapPin size={16} />}>
          <input
            className="form-input form-input--icon"
            value={form.municipio}
            onChange={(e) =>
              setForm((s) => ({ ...s, municipio: e.target.value }))
            }
          />
        </Campo>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">Endereço</label>
          <input
            className="form-input"
            value={form.endereco}
            onChange={(e) =>
              setForm((s) => ({ ...s, endereco: e.target.value }))
            }
            placeholder="Morada comercial completa"
          />
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">Descrição institucional</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={form.descricao}
            onChange={(e) =>
              setForm((s) => ({ ...s, descricao: e.target.value }))
            }
            placeholder="Descreva a actividade, a proposta de valor e o momento actual da empresa."
          />
        </div>
        <TogglePublico
          value={form.perfil_publico}
          onChange={(value) =>
            setForm((s) => ({ ...s, perfil_publico: value }))
          }
          titulo="Empresa visível na comunidade"
          descricao="Quando activo, a empresa aprovada pode aparecer na página Comunidade (Membros), desde que o perfil esteja aprovado pela equipa."
        />
      </div>
      <AcaoGuardar carregando={salvando} />
    </form>
  );
}

function CabecalhoSecao({ titulo, subtitulo, icone }) {
  return (
    <div className="perfil-secao__head">
      <div className="perfil-secao__icon">{icone}</div>
      <div className="perfil-secao__titles">
        <h2>{titulo}</h2>
        <p>{subtitulo}</p>
      </div>
    </div>
  );
}

function Campo({ label, icon, erro, ajuda, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="form-input-wrapper">
        {icon}
        {children}
      </div>
      {erro && <span className="form-error">{erro}</span>}
      {!erro && ajuda && <span className="form-hint">{ajuda}</span>}
    </div>
  );
}

function TogglePublico({
  value,
  onChange,
  titulo = "Perfil público",
  descricao = "Quando activo, o perfil pode aparecer na página Comunidade (Membros) e noutras listagens públicas.",
}) {
  return (
    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
      <div className="perfil-visibilidade-toggle">
        <div>
          <p className="perfil-visibilidade-toggle__titulo">{titulo}</p>
          <p className="perfil-visibilidade-toggle__desc">{descricao}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={value}
          aria-label={value ? `${titulo}: activo` : `${titulo}: inactivo`}
          onClick={() => onChange(!value)}
          className={`perfil-visibilidade-toggle__switch${value ? " perfil-visibilidade-toggle__switch--on" : ""}`}
        >
          <span className="perfil-visibilidade-toggle__thumb" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function AcaoGuardar({ carregando }) {
  return (
    <div className="perfil-secao__actions">
      <button
        type="submit"
        className={`btn btn--primary${carregando ? " btn--loading" : ""}`}
        disabled={carregando}
        aria-busy={carregando}
      >
        {!carregando && (
          <>
            <Save size={15} /> Guardar alterações
          </>
        )}
      </button>
    </div>
  );
}
