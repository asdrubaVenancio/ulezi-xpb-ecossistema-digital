// ============================================================
// ULEZI XPB — Páginas utilitárias: termos, privacidade, 404, senha
// Layout legal com índice navegável (acessibilidade e leitura)
// ============================================================

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Home } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar.jsx';
import Footer from '../../components/layout/Footer.jsx';
import { authAPI, extrairErro } from '../../services/api';

/** Shell comum para páginas estáticas */
export function Layout({ children }) {
  return (
    <div className="publico-layout">
      <Navbar />
      <main className="publico-main">{children}</main>
      <Footer />
    </div>
  );
}

/**
 * Documento legal: índice lateral + artigo — TOC com âncoras
 */
function LegalDocument({ titulo, dataActualizacao, indice, seccoes }) {
  return (
    <Layout>
      <div className="legal-page">
        <nav className="legal-toc" aria-label="Índice do documento">
          <p className="legal-toc__title">Neste documento</p>
          <ul className="legal-toc__list">
            {indice.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="legal-body">
          <header className="legal-body__header">
            <h1 className="legal-body__title">{titulo}</h1>
            <p className="legal-body__meta">Última actualização: {dataActualizacao}</p>
          </header>
          <div className="legal-body__content">
            {seccoes.map((sec) => (
              <section key={sec.id} id={sec.id} className="legal-section">
                <h2 className="legal-section__title">{sec.titulo}</h2>
                <div className="legal-section__text">{sec.corpo}</div>
              </section>
            ))}
          </div>
          <footer className="legal-body__footer">
            <Link to="/" className="btn btn--secondary">
              <Home size={16} /> Voltar ao início
            </Link>
          </footer>
        </article>
      </div>
    </Layout>
  );
}

export function Termos() {
  const indice = [
    { id: 'termos-utilizacao', label: 'Utilização da plataforma' },
    { id: 'termos-responsabilidade', label: 'Responsabilidade dos utilizadores' },
    { id: 'termos-intermediacao', label: 'Intermediação' },
    { id: 'termos-pi', label: 'Propriedade intelectual' },
    { id: 'termos-alteracoes', label: 'Modificações' },
  ];
  const seccoes = [
    {
      id: 'termos-utilizacao',
      titulo: '1. Utilização da plataforma',
      corpo: (
        <>
          <p>
            Ao utilizar a plataforma ULEZI XPB, o utilizador concorda com as regras operacionais
            e de segurança definidas pela equipa de gestão. A plataforma destina-se a facilitar
            conexões entre estudantes, empresas e investidores num ambiente seguro e regulado.
          </p>
        </>
      ),
    },
    {
      id: 'termos-responsabilidade',
      titulo: '2. Responsabilidade dos utilizadores',
      corpo: (
        <p>
          Os dados submetidos devem ser verdadeiros, completos e actualizados. O uso indevido
          da plataforma, incluindo submissão de informações falsas ou actividades fraudulentas,
          pode resultar no bloqueio imediato da conta e nas devidas consequências legais.
        </p>
      ),
    },
    {
      id: 'termos-intermediacao',
      titulo: '3. Intermediação',
      corpo: (
        <p>
          A ULEZI XPB regista e organiza processos de negócio, formação e investimento, mas
          as decisões finais — incluindo inscrições, contratos e investimentos — pertencem
          às partes envolvidas. A plataforma não assume responsabilidade pelos resultados das
          negociações entre utilizadores.
        </p>
      ),
    },
    {
      id: 'termos-pi',
      titulo: '4. Propriedade intelectual',
      corpo: (
        <p>
          Todo o conteúdo disponibilizado na plataforma (textos, imagens, cursos, materiais)
          é protegido por direitos de propriedade intelectual. É proibida a reprodução sem
          autorização expressa por escrito.
        </p>
      ),
    },
    {
      id: 'termos-alteracoes',
      titulo: '5. Modificações',
      corpo: (
        <p>
          Reservamo-nos o direito de actualizar estes termos a qualquer momento. O uso
          continuado da plataforma após alterações constitui aceitação dos novos termos.
        </p>
      ),
    },
  ];
  return (
    <LegalDocument
      titulo="Termos de uso"
      dataActualizacao="Março de 2026"
      indice={indice}
      seccoes={seccoes}
    />
  );
}

export function Privacidade() {
  const indice = [
    { id: 'priv-dados', label: 'Dados recolhidos' },
    { id: 'priv-finalidade', label: 'Finalidade' },
    { id: 'priv-direitos', label: 'Direitos do utilizador' },
    { id: 'priv-seguranca', label: 'Segurança' },
  ];
  const seccoes = [
    {
      id: 'priv-dados',
      titulo: 'Dados recolhidos',
      corpo: (
        <p>
          Recolhemos dados de identificação, contacto e actividade necessários para o
          funcionamento da plataforma. Isso inclui nome, e-mail, localização, e documentos
          obrigatórios para validação de contas empresariais.
        </p>
      ),
    },
    {
      id: 'priv-finalidade',
      titulo: 'Finalidade do tratamento',
      corpo: (
        <p>
          Os dados são usados exclusivamente para autenticação, histórico de actividade,
          notificações da plataforma, processamento de pagamentos e segurança operacional.
          Não vendemos nem partilhamos dados pessoais com terceiros para fins comerciais.
        </p>
      ),
    },
    {
      id: 'priv-direitos',
      titulo: 'Direitos do utilizador',
      corpo: (
        <p>
          O utilizador pode actualizar os dados do próprio perfil a qualquer momento.
          Para solicitações de correcção, eliminação ou exportação de dados pessoais,
          contacte-nos através do suporte da plataforma.
        </p>
      ),
    },
    {
      id: 'priv-seguranca',
      titulo: 'Segurança',
      corpo: (
        <p>
          Utilizamos encriptação e protocolos de segurança modernos para proteger os dados
          armazenados. O acesso é restrito a pessoal autorizado e os sistemas são regularmente
          auditados.
        </p>
      ),
    },
  ];
  return (
    <LegalDocument
      titulo="Política de privacidade"
      dataActualizacao="Março de 2026"
      indice={indice}
      seccoes={seccoes}
    />
  );
}

export function NotFound() {
  return (
    <Layout>
      <div className="error-page">
        <div className="nao-encontrado-numero" aria-hidden="true">404</div>
        <h1 className="error-page__title">Página não encontrada</h1>
        <p className="error-page__desc">
          O endereço pode estar incorrecto ou o conteúdo foi movido. Verifique o URL ou regresse ao início.
        </p>
        <div className="error-page__actions">
          <Link to="/" className="btn btn--primary btn--lg">
            <Home size={18} /> Início
          </Link>
          <Link to="/cursos" className="btn btn--secondary btn--lg">
            Explorar cursos
          </Link>
          <Link to="/entrar" className="btn btn--ghost btn--lg">
            Entrar
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export function EsqueciPassword() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!email) return setErro('Introduza o seu e-mail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErro('E-mail inválido');

    setCarregando(true);
    try {
      await authAPI.esqueciSenha(email);
      setEnviado(true);
    } catch {
      // Resposta uniforme: não revelar se o e-mail existe
      setEnviado(true);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Layout>
      <div className="auth-page-wrapper">
        <div className="auth-card auth-card--recover">
          {enviado ? (
            <div className="auth-recover-success">
              <div className="auth-sucesso-icone" aria-hidden="true">
                <CheckCircle2 size={30} color="var(--verde)" strokeWidth={2} />
              </div>
              <h1 className="auth-card__title">Pedido registado</h1>
              <p className="auth-card__sub" style={{ marginBottom: 28 }}>
                Se o e-mail <strong>{email}</strong> estiver associado a uma conta, receberá
                instruções para redefinir a palavra-passe em breve. Verifique também a pasta de spam.
              </p>
              <Link to="/entrar" className="btn btn--primary btn--full">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-logo-area">
                <div className="auth-logo-badge auth-logo-badge--brand" aria-hidden="true">U</div>
                <h1 className="auth-card__title">Recuperar acesso</h1>
                <p className="auth-card__sub">
                  Indique o e-mail da conta. Enviaremos um link seguro para definir uma nova palavra-passe.
                </p>
              </div>

              {erro && (
                <div className="alert alert--error" style={{ marginBottom: 16 }} role="alert">
                  <AlertCircle size={16} /> {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="email-recuperar">E-mail</label>
                  <input
                    id="email-recuperar"
                    type="email"
                    className={`form-input${erro ? ' form-input--error' : ''}`}
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErro('');
                    }}
                    autoComplete="email"
                    autoFocus
                    aria-required="true"
                    aria-invalid={!!erro}
                  />
                </div>
                <button
                  type="submit"
                  className={`btn btn--primary btn--full btn--lg${carregando ? ' btn--loading' : ''}`}
                  disabled={carregando}
                >
                  {!carregando && 'Enviar instruções'}
                </button>
              </form>

              <p className="auth-recover-footer">
                <Link to="/entrar">Lembro-me da palavra-passe — Entrar</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export function NovaPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ password: '', confirmar: '' });
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState({});

  const validar = () => {
    const novosErros = {};
    if (form.password.length < 8) novosErros.password = 'Mínimo 8 caracteres';
    else if (!/[A-Z]/.test(form.password)) novosErros.password = 'Inclua pelo menos uma letra maiúscula';
    else if (!/[a-z]/.test(form.password)) novosErros.password = 'Inclua pelo menos uma letra minúscula';
    else if (!/[0-9]/.test(form.password)) novosErros.password = 'Inclua pelo menos um número';
    if (form.password !== form.confirmar) novosErros.confirmar = 'As palavras-passe não coincidem';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setCarregando(true);
    try {
      await authAPI.novaSenha(token, {
        password: form.password,
        confirmar_password: form.confirmar,
      });
      toast.sucesso('Palavra-passe actualizada. Já pode entrar.');
      navigate('/entrar', { replace: true });
    } catch (err) {
      toast.erro(extrairErro(err));
    } finally {
      setCarregando(false);
    }
  };

  const forca = (() => {
    const p = form.password;
    if (!p) return { label: '', cor: 'transparent', pct: 0 };
    if (p.length < 6) return { label: 'Fraca', cor: 'var(--vermelho)', pct: 25 };
    if (p.length < 8) return { label: 'Curta', cor: 'var(--amarelo)', pct: 45 };
    if (!/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/[0-9]/.test(p)) {
      return { label: 'Quase', cor: 'var(--ciano)', pct: 70 };
    }
    return { label: 'Forte', cor: 'var(--verde)', pct: 100 };
  })();

  if (!token || !String(token).trim()) {
    return (
      <Layout>
        <div className="auth-page-wrapper">
          <div className="auth-card">
            <div className="alert alert--warning" style={{ marginBottom: 20 }}>
              Link inválido ou incompleto. Solicite um novo e-mail de recuperação.
            </div>
            <Link to="/recuperar-senha" className="btn btn--primary btn--full">Pedir novo link</Link>
            <p className="auth-recover-footer">
              <Link to="/entrar">Voltar ao login</Link>
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="auth-page-wrapper">
        <div className="auth-card">
          <div className="auth-logo-area">
            <div className="auth-logo-badge auth-logo-badge--brand" aria-hidden="true">U</div>
            <h1 className="auth-card__title">Nova palavra-passe</h1>
            <p className="auth-card__sub">Escolha uma palavra-passe forte e única para esta conta.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="nova-senha">Nova palavra-passe</label>
              <input
                id="nova-senha"
                type="password"
                className={`form-input${erros.password ? ' form-input--error' : ''}`}
                placeholder="Mínimo 8 caracteres, maiúscula, minúscula e número"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={!!erros.password}
              />
              {form.password ? (
                <div className="password-strength" aria-live="polite">
                  <div className="password-strength__track">
                    <div
                      className="password-strength__fill"
                      style={{ width: `${forca.pct}%`, background: forca.cor }}
                    />
                  </div>
                  <span className="password-strength__label" style={{ color: forca.cor }}>{forca.label}</span>
                </div>
              ) : null}
              {erros.password ? (
                <span className="form-error"><AlertCircle size={12} /> {erros.password}</span>
              ) : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmar-senha">Confirmar</label>
              <input
                id="confirmar-senha"
                type="password"
                className={`form-input${erros.confirmar ? ' form-input--error' : ''}`}
                placeholder="Repita a nova palavra-passe"
                value={form.confirmar}
                onChange={(e) => setForm((f) => ({ ...f, confirmar: e.target.value }))}
                autoComplete="new-password"
                aria-required="true"
              />
              {erros.confirmar ? (
                <span className="form-error"><AlertCircle size={12} /> {erros.confirmar}</span>
              ) : null}
            </div>

            <button
              type="submit"
              className={`btn btn--primary btn--full btn--lg${carregando ? ' btn--loading' : ''}`}
              disabled={carregando}
            >
              {!carregando && 'Guardar palavra-passe'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
