// ============================================================
// ULEZI XPB — Página Inicial (Home)
// Fiel ao protótipo Figma
// ============================================================
// 
// @author AsdrubaDeveloper
// @version 1.0.0

import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Building2, Users, ArrowRight, TrendingUp, FileCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg" aria-hidden />
        <div className="hero__content">
          <div className="hero__tag">
            <Zap size={12} />
            Ecossistema Digital
          </div>

          <h1 className="hero__title">
            Educação, Investimento e{' '}
            <span className="ciano">Comunidade</span>{' '}
            <span className="laranja">num</span> único ecossistema
          </h1>

          <p className="hero__desc">
            A ULEZI XPB conecta estudantes, empresas e investidores — criando
            oportunidades de formação profissional, crescimento empresarial e networking.
          </p>

          <div className="hero__actions">
            <Link to="/criar-conta" className="btn btn--primary btn--lg">
              Começar agora
              <ArrowRight size={18} />
            </Link>
            <Link to="/cursos" className="btn btn--secondary btn--lg">
              Explorar Cursos
            </Link>
          </div>

          {/* Estatísticas */}
          <div className="hero__stats">
            <div className="hero__stat">
              <div className="hero__stat-val">
                <BookOpen size={20} style={{ color: 'var(--ciano)' }} />
                150+
              </div>
              <div className="hero__stat-lbl">Cursos</div>
            </div>
            <div className="hero__stat-div" />
            <div className="hero__stat">
              <div className="hero__stat-val">
                <TrendingUp size={20} style={{ color: 'var(--laranja)' }} />
                Kz 2M+
              </div>
              <div className="hero__stat-lbl">Investimentos</div>
            </div>
            <div className="hero__stat-div" />
            <div className="hero__stat">
              <div className="hero__stat-val">
                <Users size={20} style={{ color: 'var(--verde)' }} />
                5.000+
              </div>
              <div className="hero__stat-lbl">Comunidade</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Três módulos ─────────────────────────────────────── */}
      <section className="secao">
        <div className="secao__header">
          <h2 className="secao__titulo">Três módulos, um ecossistema</h2>
          <p className="secao__desc">
            Cada módulo foi concebido para resolver problemas reais — da formação
            ao investimento, ao networking e à contratação.
          </p>
        </div>

        <div className="modulos-grid">
          <ModuloCard
            icone={<BookOpen size={22} color="white" />}
            corIcone="#00BCD4"
            titulo="Cursos"
            desc="Encontre cursos de formação técnico-profissional e inscreva-se nos melhores centros de formação perto de si."
            features={['Directo e online', 'Filtro por área', 'Recibo PDF automático', 'Histórico de cursos']}
            link="/cursos"
          />
          <ModuloCard
            icone={<Building2 size={22} color="white" />}
            corIcone="#F97316"
            titulo="Negócios"
            desc="Marketplace de investimentos onde empresas publicam oportunidades e investidores encontram projectos com potencial."
            features={['Verificação de empresas', 'Contratos digitais', 'Assinatura digital', 'Análise de oportunidades']}
            link="/negocios"
          />
          <ModuloCard
            icone={<Users size={22} color="white" />}
            corIcone="#8B5CF6"
            titulo="Comunidade"
            desc="Rede profissional colaborativa: networking, contratação de serviços e publicação de vagas de emprego."
            features={['Perfis profissionais', 'Ofertas de serviço', 'Vagas de emprego', 'Sub-contrato']}
            link="/comunidade"
          />
        </div>
      </section>

      {/* ── Como funciona ────────────────────────────────────── */}
      <section className="secao" style={{ paddingTop: 0 }}>
        <div className="secao__header">
          <h2 className="secao__titulo">Como funciona</h2>
          <p className="secao__desc">
            Um processo simples e transparente, do registo à documentação final.
          </p>
        </div>

        <div className="passos-grid">
          {[
            { num: '1', titulo: 'Crie sua conta', desc: 'Cadastre-se como estudante, empresa ou investidor em poucos minutos.', icone: Users },
            { num: '2', titulo: 'Explore as oportunidades', desc: 'Encontre cursos, investimentos ou serviços que atendem às suas necessidades.', icone: TrendingUp },
            { num: '3', titulo: 'Inscreva-se ou invista', desc: 'Realize seguros pagamentos e recebe confirmações automáticas.', icone: FileCheck },
            { num: '4', titulo: 'Documentação automática', desc: 'Recebos e contratos gerados em PDF, enviados por e-mail e WhatsApp.', icone: FileCheck },
          ].map((p) => (
            <div key={p.num} className="passo-card">
              <div className="passo-card__num">{p.num}</div>
              <p className="passo-card__titulo">{p.titulo}</p>
              <p className="passo-card__desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <div style={{ padding: '0 24px' }}>
        <div className="cta-section">
          <h2>Pronto para fazer parte do ecossistema?</h2>
          <p>Junte-se a milhares de estudantes, empresas e investidores que já estão a transformar o futuro.</p>
          <Link to="/criar-conta" className="btn btn--primary btn--lg">
            Criar Conta Gratuita
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </main>
  );
}

/** Card de módulo */
function ModuloCard({ icone, corIcone, titulo, desc, features, link }) {
  return (
    <Link to={link} className="modulo-card" style={{ display: 'block' }}>
      <div className="modulo-card__icon" style={{ background: corIcone }}>
        {icone}
      </div>
      <div className="modulo-card__titulo">
        {titulo}
        <ArrowRight size={14} style={{ color: 'var(--txt-4)' }} />
      </div>
      <p className="modulo-card__desc">{desc}</p>
      <div className="modulo-card__features">
        {features.map((f) => (
          <span key={f} className="modulo-card__feature">{f}</span>
        ))}
      </div>
    </Link>
  );
}
