// ============================================================
// ULEZI XPB — Página Inicial
// Landing page profissional com hero, módulos e CTA
// ============================================================

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

// ── Card de módulo da plataforma ────────────────────────────
function ModuloCard({ icone, corIcone, titulo, desc, features, link }) {
  return (
    <Link
      to={link}
      className="modulo-card brand-module-card"
      style={{ display: 'block' }}
      aria-label={`Saber mais sobre ${titulo}`}
    >
      <div className="modulo-card__icon" style={{ background: corIcone }}>
        {icone}
      </div>
      <div className="modulo-card__titulo">
        {titulo}
        <ArrowRight size={14} className="modulo-card__arrow" />
      </div>
      <p className="modulo-card__desc">{desc}</p>
      <div className="modulo-card__features">
        {features.map((feature) => (
          <span key={feature} className="modulo-card__feature">{feature}</span>
        ))}
      </div>
    </Link>
  );
}

// ── Página Principal ────────────────────────────────────────
export default function Home() {
  return (
    <div className="publico-layout">
      <Navbar />
      <main className="brand-page">

        {/* ── Hero ───────────────────────────────────── */}
        <section className="brand-hero">
          <div className="brand-hero__layout">
            <div className="brand-hero__copy">
              <div className="brand-kicker">
                <Zap size={14} />
                Ecossistema digital angolano
              </div>

              <h1 className="brand-title">
                Educação, investimento e comunidade num único{' '}
                <span className="texto-gradiente">ecossistema</span>.
              </h1>

              <p className="brand-copy">
                A ULEZI XPB conecta estudantes, empresas e investidores numa
                plataforma segura com formação certificada, oportunidades
                de negócio verificadas e uma comunidade profissional ativa.
              </p>

              <div className="brand-actions">
                <Link to="/criar-conta" className="btn btn--primary btn--lg">
                  Começar agora
                  <ArrowRight size={18} />
                </Link>
                <Link to="/cursos" className="btn btn--secondary btn--lg">
                  Explorar cursos
                </Link>
              </div>
            </div>

            {/* Painel de estatísticas */}
            <div className="brand-hero__card">
              <div className="brand-orbit brand-orbit--left" />
              <div className="brand-orbit brand-orbit--right" />
              <div className="brand-glow" />

              <div className="brand-hero__stats">
                <div className="brand-stat">
                  <BookOpen size={18} />
                  <strong>Formação</strong>
                  <span>Cursos e centros verificados</span>
                </div>
                <div className="brand-stat">
                  <TrendingUp size={18} />
                  <strong>Negócios</strong>
                  <span>Oportunidades com mediação</span>
                </div>
                <div className="brand-stat">
                  <Users size={18} />
                  <strong>Rede</strong>
                  <span>Empresas, alunos e investidores</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Módulos da plataforma ──────────────────── */}
        <section className="brand-section">
          <div className="brand-section__header">
            <div className="brand-kicker">Três módulos</div>
            <h2 className="brand-section__title">Três frentes, uma plataforma coesa</h2>
            <p className="brand-section__desc">
              Cada módulo foi desenhado para comunicar melhor o papel de cada
              participante e a diferença entre aprender, investir e conectar.
            </p>
          </div>

          <div className="brand-grid brand-grid--modules">
            <ModuloCard
              icone={<BookOpen size={22} color="white" />}
              corIcone="linear-gradient(135deg, #18c8dd 0%, #1978b0 100%)"
              titulo="Cursos"
              desc="Formação técnico-profissional com filtros intuitivos, hierarquia visual clara e inscrição orientada por passos."
              features={['Descoberta por área', 'Centros ativos', 'Recibo PDF automático']}
              link="/cursos"
            />
            <ModuloCard
              icone={<Building2 size={22} color="white" />}
              corIcone="linear-gradient(135deg, #ffd54a 0%, #f39a00 100%)"
              titulo="Negócios"
              desc="Marketplace empresarial com verificação documental, mediação segura e contratos digitais."
              features={['Empresas verificadas', 'Mediação', 'Contratos digitais']}
              link="/negocios"
            />
            <ModuloCard
              icone={<Users size={22} color="white" />}
              corIcone="linear-gradient(135deg, #17c1d8 0%, #f5a200 100%)"
              titulo="Comunidade"
              desc="Rede profissional com perfis públicos, serviços especializados e vagas de emprego ativas."
              features={['Perfis públicos', 'Serviços', 'Vagas ativas']}
              link="/comunidade"
            />
          </div>
        </section>

        {/* ── Como funciona ──────────────────────────── */}
        <section className="brand-section brand-section--compact">
          <div className="brand-section__header">
            <div className="brand-kicker">Como funciona</div>
            <h2 className="brand-section__title">Um fluxo simples e transparente</h2>
          </div>

          <div className="brand-grid brand-grid--steps">
            {[
              {
                num: '1',
                titulo: 'Crie a sua conta',
                desc: 'Escolha o perfil adequado — estudante, empresa ou investidor.',
              },
              {
                num: '2',
                titulo: 'Explore oportunidades',
                desc: 'Descubra cursos, negócios ou conexões profissionais com contexto real.',
              },
              {
                num: '3',
                titulo: 'Inicie o processo',
                desc: 'Inscreva-se, demonstre interesse ou publique com um fluxo orientado.',
              },
              {
                num: '4',
                titulo: 'Receba o desfecho',
                desc: 'Comprovativos, contratos e comunicações ficam centralizados.',
              },
            ].map((passo) => (
              <div key={passo.num} className="brand-step">
                <div className="brand-step__num">{passo.num}</div>
                <p className="brand-step__title">{passo.titulo}</p>
                <p className="brand-step__desc">{passo.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Porquê a ULEZI XPB ─────────────────────── */}
        <section className="brand-section brand-section--compact">
          <div className="brand-section__header">
            <div className="brand-kicker">Porquê a ULEZI XPB</div>
            <h2 className="brand-section__title">Confiança, transparência e resultados</h2>
          </div>

          <div className="brand-grid brand-grid--trust">
            {[
              { texto: 'Verificação documental de todas as empresas' },
              { texto: 'Mediação profissional em investimentos' },
              { texto: 'Pagamentos seguros com comprovativo digital' },
              { texto: 'Suporte humano integrado na plataforma' },
              { texto: 'Dashboard personalizado por papel de utilizador' },
              { texto: 'Conformidade com proteção de dados' },
            ].map((item) => (
              <div key={item.texto} className="brand-trust-item">
                <CheckCircle size={18} color="var(--verde)" />
                <span>{item.texto}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA final ──────────────────────────────── */}
        <section className="brand-cta">
          <div className="brand-cta__inner">
            <div>
              <div className="brand-kicker">Ecossistema ULEZI XPB</div>
              <h2 className="brand-cta__title">Pronto para fazer parte da plataforma?</h2>
              <p className="brand-cta__desc">
                Entre com o perfil certo e acompanhe a sua jornada profissional
                num ecossistema pensado para o mercado angolano.
              </p>
            </div>
            <Link to="/criar-conta" className="btn btn--primary btn--lg">
              Criar conta gratuita
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
