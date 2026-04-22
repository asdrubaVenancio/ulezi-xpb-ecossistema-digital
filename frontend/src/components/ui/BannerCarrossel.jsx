// ============================================================
// ULEZI XPB — BannerCarrossel
// Carrossel de banner com transição automática, navegação
// manual (setas + indicadores), efeitos hover/touch e
// comportamento totalmente responsivo.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ── Importação das imagens do banner ────────────────────────
import bannerCurso01 from '../../assets/banner/banner_curso_01.jpeg';
import bannerCurso02 from '../../assets/banner/banner_curso_02.jpeg';
import bannerNetwork01 from '../../assets/banner/banner_network_01.jpeg';
import bannerNetwork02 from '../../assets/banner/banner_network_02.jpeg';
import bannerOportunidade01 from '../../assets/banner/banner_oportunidade_01.jpeg';
import bannerOportunidade02 from '../../assets/banner/banner_oportunidade_02.jpeg';

// ── Dados dos slides do carrossel ───────────────────────────
const SLIDES = [
  {
    id: 'curso-01',
    imagem: bannerCurso01,
    alt: 'Invista no seu futuro — Encontre cursos profissionais',
  },
  {
    id: 'network-01',
    imagem: bannerNetwork01,
    alt: 'Conecte-se com oportunidades — Rede profissional ULEZI',
  },
  {
    id: 'oportunidade-01',
    imagem: bannerOportunidade01,
    alt: 'Invista em oportunidades reais — Empresas verificadas',
  },
  {
    id: 'curso-02',
    imagem: bannerCurso02,
    alt: 'Invista no seu futuro — Centros de formação',
  },
  {
    id: 'network-02',
    imagem: bannerNetwork02,
    alt: 'Conecte-se com oportunidades — Profissionais e investidores',
  },
  {
    id: 'oportunidade-02',
    imagem: bannerOportunidade02,
    alt: 'Invista em oportunidades reais — Crescimento garantido',
  },
];

/** Intervalo de auto-play em milissegundos */
const INTERVALO_AUTOPLAY = 5000;

/** Limiar de swipe em píxeis (para dispositivos móveis) */
const LIMIAR_SWIPE = 50;

// ── Componente Principal ────────────────────────────────────
export default function BannerCarrossel() {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [emTransicao, setEmTransicao] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [direcao, setDirecao] = useState('direita');

  // Referências para controlar o swipe
  const toqueInicioRef = useRef(0);
  const toqueFimRef = useRef(0);
  const timerRef = useRef(null);

  const totalSlides = SLIDES.length;

  // ── Navegação para um slide específico ────────────────────
  const irParaSlide = useCallback(
    (novoIndice, direcaoNavegacao = 'direita') => {
      if (emTransicao) return;

      setEmTransicao(true);
      setDirecao(direcaoNavegacao);
      setIndiceAtual(novoIndice);

      // Fim da transição após a duração da animação CSS
      setTimeout(() => setEmTransicao(false), 600);
    },
    [emTransicao]
  );

  // ── Avançar para o próximo slide ──────────────────────────
  const proximoSlide = useCallback(() => {
    const proximo = (indiceAtual + 1) % totalSlides;
    irParaSlide(proximo, 'direita');
  }, [indiceAtual, totalSlides, irParaSlide]);

  // ── Recuar para o slide anterior ──────────────────────────
  const slideAnterior = useCallback(() => {
    const anterior = (indiceAtual - 1 + totalSlides) % totalSlides;
    irParaSlide(anterior, 'esquerda');
  }, [indiceAtual, totalSlides, irParaSlide]);

  // ── Auto-play: avança automaticamente ─────────────────────
  useEffect(() => {
    if (pausado) return;

    timerRef.current = setInterval(proximoSlide, INTERVALO_AUTOPLAY);

    return () => clearInterval(timerRef.current);
  }, [pausado, proximoSlide]);

  // ── Gestão de eventos de toque (swipe móvel) ──────────────
  const handleTouchStart = useCallback((e) => {
    toqueInicioRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    toqueFimRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const distancia = toqueInicioRef.current - toqueFimRef.current;

    if (Math.abs(distancia) > LIMIAR_SWIPE) {
      if (distancia > 0) {
        proximoSlide();
      } else {
        slideAnterior();
      }
    }

    // Reiniciar referências
    toqueInicioRef.current = 0;
    toqueFimRef.current = 0;
  }, [proximoSlide, slideAnterior]);

  // ── Navegação com teclado (acessibilidade) ────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowRight') proximoSlide();
      if (e.key === 'ArrowLeft') slideAnterior();
    },
    [proximoSlide, slideAnterior]
  );

  return (
    <section
      className="banner-carrossel"
      id="banner-carrossel"
      role="region"
      aria-label="Banner carrossel de destaques"
      aria-roledescription="carrossel"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* ── Contentor dos slides ──────────────────────────── */}
      <div className="banner-carrossel__pista">
        {SLIDES.map((slide, indice) => (
          <div
            key={slide.id}
            className={`banner-carrossel__slide ${
              indice === indiceAtual ? 'banner-carrossel__slide--ativo' : ''
            } ${
              indice === indiceAtual
                ? `banner-carrossel__slide--${direcao}`
                : ''
            }`}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${indice + 1} de ${totalSlides}`}
            aria-hidden={indice !== indiceAtual}
          >
            <img
              src={slide.imagem}
              alt={slide.alt}
              className="banner-carrossel__imagem"
              loading={indice === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />

            {/* Overlay com gradiente para legibilidade */}
            <div className="banner-carrossel__overlay" />
          </div>
        ))}
      </div>

      {/* ── Seta de navegação — anterior ──────────────────── */}
      <button
        type="button"
        className="banner-carrossel__seta banner-carrossel__seta--esquerda"
        onClick={slideAnterior}
        aria-label="Slide anterior"
        disabled={emTransicao}
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
      </button>

      {/* ── Seta de navegação — próximo ───────────────────── */}
      <button
        type="button"
        className="banner-carrossel__seta banner-carrossel__seta--direita"
        onClick={proximoSlide}
        aria-label="Próximo slide"
        disabled={emTransicao}
      >
        <ChevronRight size={22} strokeWidth={2.5} />
      </button>

      {/* ── Indicadores (dots) ────────────────────────────── */}
      <div className="banner-carrossel__indicadores" role="tablist" aria-label="Slides do banner">
        {SLIDES.map((slide, indice) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            className={`banner-carrossel__dot ${
              indice === indiceAtual ? 'banner-carrossel__dot--ativo' : ''
            }`}
            onClick={() => irParaSlide(indice, indice > indiceAtual ? 'direita' : 'esquerda')}
            aria-label={`Ir para slide ${indice + 1}`}
            aria-selected={indice === indiceAtual}
            tabIndex={indice === indiceAtual ? 0 : -1}
          />
        ))}
      </div>

      {/* ── Barra de progresso do auto-play ───────────────── */}
      <div className="banner-carrossel__progresso">
        <div
          className={`banner-carrossel__progresso-barra ${
            pausado ? 'banner-carrossel__progresso-barra--pausado' : ''
          }`}
          key={indiceAtual}
          style={{ animationDuration: `${INTERVALO_AUTOPLAY}ms` }}
        />
      </div>
    </section>
  );
}
