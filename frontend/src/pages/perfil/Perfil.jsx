import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  TrendingUp,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, empresaAPI, investidorAPI, extrairErro } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { iniciais, ROLE_LABELS } from '../../utils/constants';

const schemaPerfilBase = z.object({
  nome: z.string().min(3, 'Informe o nome completo.'),
  telefone: z.string().max(30).optional().or(z.literal('')),
});

const schemaSenha = z.object({
  password_atual: z.string().min(1, 'Informe a palavra-passe actual.'),
  nova_password: z.string().min(8, 'A nova palavra-passe deve ter pelo menos 8 caracteres.'),
  confirmar: z.string().min(1, 'Confirme a nova palavra-passe.'),
}).refine((data) => data.nova_password === data.confirmar, {
  message: 'As palavras-passe não coincidem.',
  path: ['confirmar'],
});

const secaoCard = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-xl)',
  padding: 24,
  boxShadow: 'var(--shadow-sm)',
};

const roleColor = {
  student: 'var(--ciano)',
  estudante: 'var(--ciano)',
  company: 'var(--laranja)',
  empresa: 'var(--laranja)',
  investor: 'var(--verde)',
  investidor: 'var(--verde)',
  admin: 'var(--vermelho)',
  employee: 'var(--roxo)',
  funcionario: 'var(--roxo)',
};

export default function Perfil() {
  const { utilizador, atualizarUtilizador } = useAuth();
  const toast = useToast();
  const [aba, setAba] = useState('dados');

  const cor = roleColor[utilizador?.role] || 'var(--ciano)';
  const tabs = useMemo(() => {
    const base = [
      { id: 'dados', label: 'Dados pessoais', icon: <User size={14} /> },
      { id: 'seguranca', label: 'Segurança', icon: <Lock size={14} /> },
    ];
    if (['investor', 'investidor'].includes(utilizador?.role)) {
      base.push({ id: 'investidor', label: 'Perfil investidor', icon: <TrendingUp size={14} /> });
    }
    if (['company', 'empresa'].includes(utilizador?.role)) {
      base.push({ id: 'empresa', label: 'Perfil empresa', icon: <Briefcase size={14} /> });
    }
    return base;
  }, [utilizador?.role]);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: 20 }}>
      <section style={{ ...secaoCard, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: 28, background: `${cor}18`, border: `1px solid ${cor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cor, fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
          {iniciais(utilizador?.nome || '?')}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>{utilizador?.nome || 'Perfil'}</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '999px', background: `${cor}18`, color: cor, fontWeight: 700, fontSize: '0.75rem' }}>
              {ROLE_LABELS[utilizador?.role] || utilizador?.role}
            </span>
          </div>
          <p style={{ color: 'var(--txt-3)', marginBottom: 10 }}>{utilizador?.email}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', color: 'var(--txt-3)', fontSize: '0.84rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> Conta autenticada</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Shield size={14} /> Dados protegidos por sessão</span>
          </div>
        </div>
      </section>

      <section style={{ ...secaoCard, paddingBottom: 12 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {tabs.map((tab) => (
            <button key={tab.id} className={`tab-btn${aba === tab.id ? ' active' : ''}`} onClick={() => setAba(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </section>

      {aba === 'dados' && (
        <DadosPessoais
          utilizador={utilizador}
          onSucesso={(dados) => {
            atualizarUtilizador({ ...utilizador, ...dados });
            toast.sucesso('Dados pessoais actualizados com sucesso.');
          }}
          onErro={(mensagem) => toast.erro(mensagem)}
        />
      )}

      {aba === 'seguranca' && (
        <Seguranca
          onSucesso={() => toast.sucesso('Palavra-passe actualizada com sucesso.')}
          onErro={(mensagem) => toast.erro(mensagem)}
        />
      )}

      {aba === 'investidor' && ['investor', 'investidor'].includes(utilizador?.role) && (
        <PerfilInvestidor onAviso={(mensagem) => toast.erro(mensagem)} onSucesso={() => toast.sucesso('Perfil de investidor actualizado.')} />
      )}

      {aba === 'empresa' && ['company', 'empresa'].includes(utilizador?.role) && (
        <PerfilEmpresa onAviso={(mensagem) => toast.erro(mensagem)} onSucesso={() => toast.sucesso('Perfil empresarial actualizado.')} />
      )}
    </div>
  );
}

function DadosPessoais({ utilizador, onSucesso, onErro }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schemaPerfilBase),
    defaultValues: {
      nome: utilizador?.nome || '',
      telefone: utilizador?.telefone || '',
    },
  });

  const submeter = async (dados) => {
    try {
      await authAPI.atualizarPerfil(dados);
      onSucesso(dados);
    } catch (e) {
      onErro(extrairErro(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(submeter)} style={secaoCard}>
      <CabecalhoSecao titulo="Dados pessoais" subtitulo="Informações principais da sua conta." icone={<User size={18} />} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <Campo label="Nome completo" erro={errors.nome?.message} icon={<User size={16} />}>
          <input className="form-input form-input--icon" {...register('nome')} />
        </Campo>
        <Campo label="E-mail" ajuda="O e-mail é definido no registo e não pode ser alterado nesta área." icon={<Mail size={16} />}>
          <input className="form-input form-input--icon" value={utilizador?.email || ''} disabled />
        </Campo>
        <Campo label="Telefone" erro={errors.telefone?.message} icon={<Phone size={16} />}>
          <input className="form-input form-input--icon" {...register('telefone')} placeholder="+244 9XX XXX XXX" />
        </Campo>
      </div>
      <AcaoGuardar carregando={isSubmitting} />
    </form>
  );
}

function Seguranca({ onSucesso, onErro }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
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
    <form onSubmit={handleSubmit(submeter)} style={secaoCard}>
      <CabecalhoSecao titulo="Segurança da conta" subtitulo="Mantenha uma palavra-passe forte e actualizada." icone={<Shield size={18} />} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <Campo label="Palavra-passe actual" erro={errors.password_atual?.message} icon={<Lock size={16} />}>
          <input type="password" className="form-input form-input--icon" {...register('password_atual')} />
        </Campo>
        <Campo label="Nova palavra-passe" erro={errors.nova_password?.message} icon={<Lock size={16} />}>
          <input type="password" className="form-input form-input--icon" {...register('nova_password')} />
        </Campo>
        <Campo label="Confirmar nova palavra-passe" erro={errors.confirmar?.message} icon={<Lock size={16} />}>
          <input type="password" className="form-input form-input--icon" {...register('confirmar')} />
        </Campo>
      </div>
      <AcaoGuardar carregando={isSubmitting} />
    </form>
  );
}

function PerfilInvestidor({ onSucesso, onAviso }) {
  const [form, setForm] = useState({
    provincia: '',
    municipio: '',
    capital_disponivel: '',
    experiencia_previa: '',
    perfil_publico: false,
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    investidorAPI.perfil()
      .then(({ data }) => {
        const perfil = data.dados?.perfil || data.dados || {};
        setForm({
          provincia: perfil.provincia || '',
          municipio: perfil.municipio || '',
          capital_disponivel: perfil.capital_disponivel || '',
          experiencia_previa: perfil.experiencia_previa || perfil.descricao || '',
          perfil_publico: !!(perfil.perfil_publico ?? perfil.is_public),
        });
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.provincia) {
      onAviso('Seleccione ou informe a província do investidor.');
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
    return <div style={secaoCard}><div className="skeleton" style={{ height: 220 }} /></div>;
  }

  return (
    <form onSubmit={guardar} style={secaoCard}>
      <CabecalhoSecao titulo="Perfil de investidor" subtitulo="Defina como deseja aparecer na plataforma e quais dados operacionais quer expor." icone={<TrendingUp size={18} />} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <Campo label="Província" icon={<MapPin size={16} />}>
          <input className="form-input form-input--icon" value={form.provincia} onChange={(e) => setForm((s) => ({ ...s, provincia: e.target.value }))} placeholder="Ex: Luanda" />
        </Campo>
        <Campo label="Município" icon={<MapPin size={16} />}>
          <input className="form-input form-input--icon" value={form.municipio} onChange={(e) => setForm((s) => ({ ...s, municipio: e.target.value }))} placeholder="Ex: Talatona" />
        </Campo>
        <Campo label="Capital disponível" icon={<TrendingUp size={16} />}>
          <input className="form-input form-input--icon" value={form.capital_disponivel} onChange={(e) => setForm((s) => ({ ...s, capital_disponivel: e.target.value }))} placeholder="Opcional" />
        </Campo>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Resumo do perfil</label>
          <textarea className="form-textarea" rows={4} value={form.experiencia_previa} onChange={(e) => setForm((s) => ({ ...s, experiencia_previa: e.target.value }))} placeholder="Indique experiência, tickets médios ou preferências de investimento." />
        </div>
        <TogglePublico value={form.perfil_publico} onChange={(value) => setForm((s) => ({ ...s, perfil_publico: value }))} />
      </div>
      <AcaoGuardar carregando={salvando} />
    </form>
  );
}

function PerfilEmpresa({ onSucesso, onAviso }) {
  const [form, setForm] = useState({
    nome_empresa: '',
    sector: '',
    descricao: '',
    website: '',
    provincia: '',
    municipio: '',
    endereco: '',
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    empresaAPI.perfil()
      .then(({ data }) => {
        const perfil = data.dados?.perfil || data.dados || {};
        setForm({
          nome_empresa: perfil.nome_empresa || '',
          sector: perfil.sector || '',
          descricao: perfil.descricao || '',
          website: perfil.website || '',
          provincia: perfil.provincia || '',
          municipio: perfil.municipio || '',
          endereco: perfil.endereco || '',
        });
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nome_empresa) {
      onAviso('O nome da empresa é obrigatório.');
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
      });
      onSucesso();
    } catch (e) {
      onAviso(extrairErro(e));
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return <div style={secaoCard}><div className="skeleton" style={{ height: 260 }} /></div>;
  }

  return (
    <form onSubmit={guardar} style={secaoCard}>
      <CabecalhoSecao titulo="Perfil empresarial" subtitulo="Organize as informações públicas da empresa para oportunidades, comunidade e validação interna." icone={<Briefcase size={18} />} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <Campo label="Nome da empresa" ajuda="Definido no registo inicial." icon={<Briefcase size={16} />}>
          <input className="form-input form-input--icon" value={form.nome_empresa} disabled />
        </Campo>
        <Campo label="Sector principal" icon={<Briefcase size={16} />}>
          <input className="form-input form-input--icon" value={form.sector} onChange={(e) => setForm((s) => ({ ...s, sector: e.target.value }))} placeholder="Ex: Tecnologia, Educação, Construção" />
        </Campo>
        <Campo label="Website" icon={<Globe size={16} />}>
          <input className="form-input form-input--icon" value={form.website} onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))} placeholder="https://empresa.ao" />
        </Campo>
        <Campo label="Província" icon={<MapPin size={16} />}>
          <input className="form-input form-input--icon" value={form.provincia} onChange={(e) => setForm((s) => ({ ...s, provincia: e.target.value }))} />
        </Campo>
        <Campo label="Município" icon={<MapPin size={16} />}>
          <input className="form-input form-input--icon" value={form.municipio} onChange={(e) => setForm((s) => ({ ...s, municipio: e.target.value }))} />
        </Campo>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Endereço</label>
          <input className="form-input" value={form.endereco} onChange={(e) => setForm((s) => ({ ...s, endereco: e.target.value }))} placeholder="Morada comercial completa" />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Descrição institucional</label>
          <textarea className="form-textarea" rows={4} value={form.descricao} onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))} placeholder="Descreva a actividade, a proposta de valor e o momento actual da empresa." />
        </div>
      </div>
      <AcaoGuardar carregando={salvando} />
    </form>
  );
}

function CabecalhoSecao({ titulo, subtitulo, icone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
      <div style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ciano)' }}>
        {icone}
      </div>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, marginBottom: 4 }}>{titulo}</h2>
        <p style={{ color: 'var(--txt-3)', fontSize: '0.88rem', lineHeight: 1.6 }}>{subtitulo}</p>
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

function TogglePublico({ value, onChange }) {
  return (
    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: 16, borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: 'var(--bg-soft)' }}>
        <div>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>Perfil público</p>
          <p style={{ color: 'var(--txt-3)', fontSize: '0.84rem' }}>Quando activo, o perfil pode aparecer na comunidade e em listagens da plataforma.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(!value)}
          style={{
            width: 52,
            height: 30,
            border: 'none',
            borderRadius: 999,
            background: value ? 'var(--ciano)' : 'var(--border)',
            position: 'relative',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span style={{ position: 'absolute', top: 3, left: value ? 25 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left 180ms ease' }} />
        </button>
      </div>
    </div>
  );
}

function AcaoGuardar({ carregando }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
      <button type="submit" className={`btn btn--primary${carregando ? ' btn--loading' : ''}`} disabled={carregando}>
        {!carregando && <><Save size={15} /> Guardar alterações</>}
      </button>
    </div>
  );
}
