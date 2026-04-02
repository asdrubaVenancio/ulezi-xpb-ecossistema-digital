// ============================================================
// ULEZI XPB - Autenticacao: login e registo por perfil
// Formularios separados por tipo de conta com validacao clara
// ============================================================
// 
// @author AsdrubaDeveloper
// @version 1.0.0

import React, { useMemo, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authAPI, extrairErro } from '../../services/api';
import { ROLE_DASHBOARD } from '../../utils/constants';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const schemaLogin = z.object({
  email: z.string().email('E-mail invalido').min(1, 'Obrigatorio'),
  password: z.string().min(1, 'Obrigatorio'),
});

const schemaRegistar = z.object({
  nome: z.string().min(3, 'Minimo 3 caracteres').max(120, 'Maximo 120 caracteres'),
  email: z.string().email('E-mail invalido'),
  telefone: z.string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Telefone invalido')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(8, 'Minimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiuscula')
    .regex(/[a-z]/, 'Deve conter letra minuscula')
    .regex(/[0-9]/, 'Deve conter numero'),
  confirmar_password: z.string().min(1, 'Confirme a palavra-passe'),
  role: z.enum(['student', 'company', 'investor'], {
    errorMap: () => ({ message: 'Selecione o tipo de conta' }),
  }),
  nome_empresa: z.string().optional().or(z.literal('')),
  provincia: z.string().optional().or(z.literal('')),
  municipio: z.string().optional().or(z.literal('')),
  sector_custom: z.string().optional().or(z.literal('')),
  nif: z.string().optional().or(z.literal('')),
  perfil_publico: z.boolean().default(false),
}).superRefine((dados, ctx) => {
  if (dados.password !== dados.confirmar_password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmar_password'],
      message: 'As palavras-passe nao coincidem',
    });
  }

  if (dados.role === 'company' && !dados.nome_empresa?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['nome_empresa'],
      message: 'O nome da empresa e obrigatorio para contas empresariais',
    });
  }

});

const SECTORES_EMPRESA = [
  'Tecnologia',
  'Educacao',
  'Saude',
  'Construcao Civil',
  'Contabilidade e Financas',
  'Marketing e Publicidade',
  'Logistica e Transportes',
  'Consultoria Empresarial',
  'Jurídico e Legal',
  'Alimentacao e Restauracao',
];

const TIPOS_CONTA = [
  {
    valor: 'student',
    Icone: BookOpen,
    titulo: 'Estudante',
    desc: 'Cursos, inscricoes e historico',
  },
  {
    valor: 'company',
    Icone: Building2,
    titulo: 'Empresa',
    desc: 'Perfil empresarial e oportunidades',
  },
  {
    valor: 'investor',
    Icone: TrendingUp,
    titulo: 'Investidor',
    desc: 'Interesses, contratos e analise',
  },
];

function CampoErro({ erro }) {
  if (!erro) return null;
  return <span className="form-error"><AlertCircle size={12} /> {erro.message}</span>;
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

  const onSubmit = useCallback(async ({ email, password }) => {
    try {
      const utilizador = await login(email, password);
      toast.sucesso(`Bem-vindo, ${utilizador.nome?.split(' ')[0] || 'utilizador'}!`);
      if (utilizador.password_change_required) {
        toast.aviso('Altere a senha temporária para continuar a usar a plataforma.');
        navigate('/perfil', { replace: true });
        return;
      }
      navigate(destino || ROLE_DASHBOARD[utilizador.role] || '/', { replace: true });
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  }, [destino, login, navigate, toast]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Navbar />
      <div className="auth-body">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--r-md)',
              background: 'var(--ciano)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: '1.4rem',
              color: 'white',
            }}>
              U
            </div>
            <h1 className="auth-card__title">Entrar</h1>
            <p className="auth-card__sub">Aceda a sua conta ULEZI XPB</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div className="form-input-wrapper">
                <Mail size={16} />
                <input
                  type="email"
                  className={`form-input form-input--icon${errors.email ? ' form-input--error' : ''}`}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                />
              </div>
              <CampoErro erro={errors.email} />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Palavra-passe</label>
                <Link to="/recuperar-senha" style={{ fontSize: '0.78rem', color: 'var(--ciano)', fontWeight: 500 }}>
                  Esqueci
                </Link>
              </div>
              <div className="form-input-wrapper">
                <Lock size={16} />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  className={`form-input form-input--icon${errors.password ? ' form-input--error' : ''}`}
                  placeholder="********"
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-4)' }}
                  aria-label="Ver senha"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <CampoErro erro={errors.password} />
            </div>

            <button type="submit" className={`btn btn--primary btn--full${isSubmitting ? ' btn--loading' : ''}`} disabled={isSubmitting}>
              {!isSubmitting && <>Entrar <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-divider" style={{ margin: '20px 0' }}><span>Nao tem conta?</span></div>
          <Link to="/criar-conta" className="btn btn--secondary btn--full">Criar conta gratuita</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function Registar() {
  const toast = useToast();
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
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      role: 'student',
      telefone: '',
      nome_empresa: '',
      provincia: '',
      municipio: '',
      sector_custom: '',
      nif: '',
      perfil_publico: false,
    },
  });

  const roleAtual = watch('role');
  const senhaAtual = watch('password');
  const tituloNome = useMemo(() => {
    if (roleAtual === 'company') return 'Nome do responsavel';
    return 'Nome completo';
  }, [roleAtual]);
  const senhaChecks = useMemo(() => ([
    { label: 'Pelo menos 8 caracteres', ok: (senhaAtual || '').length >= 8 },
    { label: 'Uma letra maiuscula', ok: /[A-Z]/.test(senhaAtual || '') },
    { label: 'Uma letra minuscula', ok: /[a-z]/.test(senhaAtual || '') },
    { label: 'Um numero', ok: /[0-9]/.test(senhaAtual || '') },
  ]), [senhaAtual]);

  const onSubmit = useCallback(async (dados) => {
    try {
      const payload = new FormData();
      payload.append('nome', dados.nome);
      payload.append('email', dados.email);
      payload.append('password', dados.password);
      payload.append('role', dados.role);
      if (dados.telefone) payload.append('telefone', dados.telefone);

      if (dados.role === 'student') {
        if (dados.provincia) payload.append('provincia', dados.provincia);
        if (dados.municipio) payload.append('municipio', dados.municipio);
        payload.append('is_public', dados.perfil_publico ? 'true' : 'false');
      }

      if (dados.role === 'investor') {
        if (dados.provincia) payload.append('provincia', dados.provincia);
        if (dados.municipio) payload.append('municipio', dados.municipio);
        payload.append('is_public', dados.perfil_publico ? 'true' : 'false');
      }

      if (dados.role === 'company') {
        const sectorFinal = [
          ...sectoresSelecionados,
          ...(dados.sector_custom ? [dados.sector_custom.trim()] : []),
        ].filter(Boolean).join(', ');

        if (!documentosEmpresa.documento_alvara || !documentosEmpresa.documento_nif || !documentosEmpresa.documento_certidao || !documentosEmpresa.documento_identificacao) {
          toast.erro('Anexe todos os documentos obrigatorios da empresa antes de concluir o registo.');
          return;
        }

        payload.append('nome_empresa', dados.nome_empresa || '');
        if (dados.provincia) payload.append('provincia', dados.provincia);
        if (dados.municipio) payload.append('municipio', dados.municipio);
        if (sectorFinal) payload.append('sector', sectorFinal);
        if (dados.nif) payload.append('nif', dados.nif);

        payload.append('documento_alvara', documentosEmpresa.documento_alvara);
        payload.append('documento_nif', documentosEmpresa.documento_nif);
        payload.append('documento_certidao', documentosEmpresa.documento_certidao);
        payload.append('documento_identificacao', documentosEmpresa.documento_identificacao);
      }

      await authAPI.registar(payload);
      setSucesso(true);
    } catch (e) {
      toast.erro(extrairErro(e));
    }
  }, [documentosEmpresa, sectoresSelecionados, toast]);

  const atualizarDocumentoEmpresa = (campo, ficheiro) => {
    setDocumentosEmpresa((anterior) => ({
      ...anterior,
      [campo]: ficheiro || null,
    }));
  };

  const alternarSector = (sector) => {
    setSectoresSelecionados((anteriores) => (
      anteriores.includes(sector)
        ? anteriores.filter((item) => item !== sector)
        : [...anteriores, sector]
    ));
  };

  const totalSetoresSelecionados = sectoresSelecionados.length + (watch('sector_custom')?.trim() ? 1 : 0);

  if (sucesso) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <Navbar />
        <div className="auth-body">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>OK</div>
            <h1 className="auth-card__title">Conta criada</h1>
            <p style={{ color: 'var(--txt-3)', marginBottom: 24, lineHeight: 1.6 }}>
              O registo foi concluido com sucesso. Ja pode entrar na plataforma.
            </p>
            <Link to="/entrar" className="btn btn--primary btn--full">Ir para o login</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Navbar />
      <div className="auth-body auth-body--register">
        <div className={`auth-card ${roleAtual === 'company' ? 'auth-card--wide' : 'auth-card--register'}`}>
          <div className="auth-register__hero">
            <span className="auth-register__eyebrow">Onboarding ULEZI XPB</span>
            <h1 className="auth-card__title" style={{ marginBottom: 10 }}>Criar conta</h1>
            <p className="auth-card__sub" style={{ marginBottom: 0 }}>
              Escolha o perfil correcto, preencha apenas o essencial e conclua o registo com validação imediata.
            </p>
          </div>

          <div className="auth-register__scroll">
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <section className="auth-section">
              <div className="auth-section__header">
                <div>
                  <h2 className="auth-section__title">Tipo de conta</h2>
                  <p className="auth-section__desc">Cada perfil activa apenas os campos que realmente precisa neste momento.</p>
                </div>
              </div>

              <div className="auth-role-grid">
                {TIPOS_CONTA.map(({ valor, Icone, titulo, desc }) => {
                  const ativo = roleAtual === valor;
                  return (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setValue('role', valor, { shouldValidate: true })}
                      className={`auth-role-option${ativo ? ' auth-role-option--active' : ''}`}
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
              <input type="hidden" {...register('role')} />
              <CampoErro erro={errors.role} />
            </section>

            <section className="auth-section">
              <div className="auth-section__header">
                <div>
                  <h2 className="auth-section__title">Dados principais</h2>
                  <p className="auth-section__desc">Informações básicas para criar o acesso e identificar o perfil.</p>
                </div>
              </div>

              <div className="auth-grid auth-grid--2">
                <div className="form-group">
                  <label className="form-label">{tituloNome}</label>
                  <div className="form-input-wrapper">
                    <User size={16} />
                    <input
                      type="text"
                      className={`form-input form-input--icon${errors.nome ? ' form-input--error' : ''}`}
                      placeholder={roleAtual === 'company' ? 'Nome do gestor ou representante' : 'Nome completo'}
                      autoComplete="name"
                      {...register('nome')}
                    />
                  </div>
                  <CampoErro erro={errors.nome} />
                </div>

                {roleAtual === 'company' && (
                  <div className="form-group">
                    <label className="form-label">Nome da empresa</label>
                    <div className="form-input-wrapper">
                      <Building2 size={16} />
                      <input
                        type="text"
                        className={`form-input form-input--icon${errors.nome_empresa ? ' form-input--error' : ''}`}
                        placeholder="Ex.: Ulezi Business Angola"
                        {...register('nome_empresa')}
                      />
                    </div>
                    <CampoErro erro={errors.nome_empresa} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <div className="form-input-wrapper">
                    <Mail size={16} />
                    <input
                      type="email"
                      className={`form-input form-input--icon${errors.email ? ' form-input--error' : ''}`}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      {...register('email')}
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
                        className={`form-input form-input--icon${errors.telefone ? ' form-input--error' : ''}`}
                        placeholder="+244 9XX XXX XXX"
                        autoComplete="tel"
                        {...register('telefone')}
                      />
                    </div>
                    <CampoErro erro={errors.telefone} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Provincia</label>
                    <div className="form-input-wrapper">
                      <MapPin size={16} />
                      <input
                        type="text"
                        className={`form-input form-input--icon${errors.provincia ? ' form-input--error' : ''}`}
                        placeholder="Ex.: Luanda"
                        {...register('provincia')}
                      />
                    </div>
                    <CampoErro erro={errors.provincia} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Municipio</label>
                    <div className="form-input-wrapper">
                      <MapPin size={16} />
                      <input
                        type="text"
                        className={`form-input form-input--icon${errors.municipio ? ' form-input--error' : ''}`}
                        placeholder="Ex.: Viana"
                        {...register('municipio')}
                      />
                    </div>
                    <CampoErro erro={errors.municipio} />
                  </div>
              </div>
            </section>

            {roleAtual === 'company' && (
              <section className="auth-section auth-section--company">
                <div className="auth-section__header auth-section__header--split">
                  <div>
                    <h2 className="auth-section__title">Perfil empresarial</h2>
                    <p className="auth-section__desc">Defina os sectores da empresa e envie já a documentação para avaliação administrativa.</p>
                  </div>
                  <div className="auth-section__meta">
                    <span className="badge badge--ciano">{totalSetoresSelecionados} setor(es)</span>
                    <span className="badge badge--amarelo">4 documentos obrigatorios</span>
                  </div>
                </div>

                <div className="auth-grid auth-grid--2" style={{ marginBottom: 18 }}>
                  <div className="form-group">
                    <label className="form-label">NIF da empresa</label>
                    <div className="form-input-wrapper">
                      <Building2 size={16} />
                      <input
                        type="text"
                        className={`form-input form-input--icon${errors.nif ? ' form-input--error' : ''}`}
                        placeholder="Numero de identificacao fiscal"
                        {...register('nif')}
                      />
                    </div>
                    <CampoErro erro={errors.nif} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Outro setor</label>
                    <div className="form-input-wrapper">
                      <Building2 size={16} />
                      <input
                        type="text"
                        className={`form-input form-input--icon${errors.sector_custom ? ' form-input--error' : ''}`}
                        placeholder="Escreva um setor adicional se nao existir"
                        {...register('sector_custom')}
                      />
                    </div>
                    <CampoErro erro={errors.sector_custom} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Setores de atividade</label>
                  <div className="sector-picker">
                    {SECTORES_EMPRESA.map((sector) => {
                      const ativo = sectoresSelecionados.includes(sector);
                      return (
                        <button
                          key={sector}
                          type="button"
                          className={`sector-chip${ativo ? ' sector-chip--active' : ''}`}
                          onClick={() => alternarSector(sector)}
                        >
                          <span>{sector}</span>
                          {ativo && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                  <span className="form-hint">Pode seleccionar varios setores. Caso precise, use tambem o campo "Outro setor".</span>
                  {totalSetoresSelecionados > 0 && (
                    <div className="sector-selection-summary">
                      {sectoresSelecionados.map((sector) => (
                        <span key={sector} className="badge badge--ciano">{sector}</span>
                      ))}
                      {watch('sector_custom')?.trim() && (
                        <span className="badge badge--laranja">{watch('sector_custom').trim()}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="auth-upload-grid">
                  {[
                    ['documento_alvara', 'Alvara comercial', 'Comprovativo legal da actividade da empresa.'],
                    ['documento_nif', 'Documento do NIF', 'Documento fiscal usado para validação da empresa.'],
                    ['documento_certidao', 'Certidao comercial', 'Certidao ou registo comercial actualizado.'],
                    ['documento_identificacao', 'Identificacao do responsavel', 'BI, passaporte ou outro documento oficial.'],
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
                          onChange={(e) => atualizarDocumentoEmpresa(campo, e.target.files?.[0])}
                        />
                        <span className="btn btn--secondary btn--sm">Escolher ficheiro</span>
                      </label>

                      <div className="upload-card__file">
                        {documentosEmpresa[campo] ? (
                          <>
                            <span className="truncate">{documentosEmpresa[campo].name}</span>
                            <button
                              type="button"
                              className="upload-card__remove"
                              onClick={() => atualizarDocumentoEmpresa(campo, null)}
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

            {(roleAtual === 'student' || roleAtual === 'investor') && (
              <section className="auth-section">
                <label className="auth-check-card">
                  <input type="checkbox" {...register('perfil_publico')} />
                  <div>
                    <p className="auth-check-card__title">Tornar perfil publico</p>
                    <p className="auth-check-card__desc">
                      {roleAtual === 'student'
                        ? 'Permite que outros membros vejam o seu perfil na comunidade.'
                        : 'Define logo no registo se o investidor quer aparecer publicamente na comunidade.'}
                    </p>
                  </div>
                </label>
              </section>
            )}

            <section className="auth-section">
              <div className="auth-section__header">
                <div>
                  <h2 className="auth-section__title">Seguranca de acesso</h2>
                  <p className="auth-section__desc">A palavra-passe e validada em tempo real para evitar registos fracos.</p>
                </div>
              </div>

              <div className="auth-grid auth-grid--2">
                <div className="form-group">
                  <label className="form-label">Palavra-passe</label>
                  <div className="form-input-wrapper">
                    <Lock size={16} />
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      className={`form-input form-input--icon${errors.password ? ' form-input--error' : ''}`}
                      placeholder="Minimo 8 caracteres"
                      autoComplete="new-password"
                      style={{ paddingRight: 44 }}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-4)' }}
                      aria-label="Ver senha"
                    >
                      {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <CampoErro erro={errors.password} />
                  <div className="password-checklist">
                    {senhaChecks.map((item) => (
                      <div key={item.label} className={`password-check${item.ok ? ' password-check--ok' : ''}`}>
                        <Check size={13} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar palavra-passe</label>
                  <div className="form-input-wrapper">
                    <Lock size={16} />
                    <input
                      type="password"
                      className={`form-input form-input--icon${errors.confirmar_password ? ' form-input--error' : ''}`}
                      placeholder="Repita a palavra-passe"
                      autoComplete="new-password"
                      {...register('confirmar_password')}
                    />
                  </div>
                  <CampoErro erro={errors.confirmar_password} />
                </div>
              </div>
            </section>

            <button type="submit" className={`btn btn--primary btn--full${isSubmitting ? ' btn--loading' : ''}`} disabled={isSubmitting}>
              {!isSubmitting && <>Criar conta <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-divider" style={{ margin: '20px 0' }}><span>Ja tem conta?</span></div>
          <Link to="/entrar" className="btn btn--secondary btn--full">Entrar</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
