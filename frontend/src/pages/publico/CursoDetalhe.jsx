// ============================================================
// ULEZI XPB — Detalhe de Curso
// Inscrição com pagamento, centros de formação e coordenadas bancárias
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Check, Clock, MapPin, Star } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar   from '../../components/layout/Navbar.jsx';
import Footer   from '../../components/layout/Footer.jsx';
import CoordenadasBancarias from '../../components/banco/CoordenadasBancarias.jsx';
import { useToast }             from '../../components/ui/Toast';
import { BadgeStatus, Modal, PageLoader } from '../../components/ui/index.jsx';
import { useAuth }              from '../../context/AuthContext';
import { cursosAPI, extrairErro } from '../../services/api';
import { formatAOA }            from '../../utils/constants';

export default function CursoDetalhe() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const toast        = useToast();
  const { utilizador } = useAuth() || {};

  // Estados de dados
  const [curso,    setCurso]    = useState(null);
  const [centros,  setCentros]  = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,     setErro]     = useState(null);

  // Estados de inscrição
  const [modalInscricao,    setModalInscricao]    = useState(null);
  const [mostrarCoordenadas, setMostrarCoordenadas] = useState(true);
  const [submetendo,        setSubmetendo]        = useState(false);
  const [comprovativo,      setComprovativo]      = useState(null);
  const [documentoRequisito, setDocumentoRequisito] = useState(null);

  // Formulário de inscrição
  const [formInscricao, setFormInscricao] = useState({
    provincia_aluno:     '',
    municipio_aluno:     '',
    endereco_centro:     '',
    observacoes:         '',
    valor_pago:          '',
    data_pagamento:      new Date().toISOString().split('T')[0],
    banco_origem:        '',
    referencia_bancaria: '',
  });

  // ── Carregamento de dados ──────────────────────────────────
  const carregar = useCallback(async () => {
    if (!id) {
      setErro('ID do curso não fornecido');
      setCarregando(false);
      return;
    }
    try {
      setCarregando(true);
      setErro(null);

      const [{ data: cursoData }, { data: centrosData }] = await Promise.all([
        cursosAPI.obter(id),
        cursosAPI.centros(id),
      ]);

      const cursoRecebido =
        cursoData?.dados?.course ||
        cursoData?.dados?.curso  ||
        cursoData?.dados         ||
        null;
      setCurso(cursoRecebido);

      const dadosCentros  = centrosData?.dados || {};
      const listaCentros  =
        dadosCentros.centers || [
          ...(dadosCentros.local      || []),
          ...(dadosCentros.provincial || []),
          ...(dadosCentros.outros     || []),
        ];
      setCentros(Array.isArray(listaCentros) ? listaCentros : []);

      if (!cursoRecebido) setErro('Curso não encontrado');
    } catch (e) {
      setErro(extrairErro(e) || 'Erro ao carregar o curso');
      setCurso(null);
      setCentros([]);
      toast.erro('Erro ao carregar o curso: ' + extrairErro(e));
    } finally {
      setCarregando(false);
    }
  }, [id, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  // ── Abre o modal de inscrição para uma oferta/centro ──────
  const abrirInscricao = (oferta = null) => {
    const ofertaActual = oferta || { id: null, certificado_exigido: false, preco: curso?.preco || '' };
    setModalInscricao(ofertaActual);
    setMostrarCoordenadas(true);

    const centro = ofertaActual?.centro || {};
    setFormInscricao((ant) => ({
      ...ant,
      valor_pago:          ofertaActual?.preco || curso?.preco || '',
      provincia_aluno:     centro.provincia  || '',
      municipio_aluno:     centro.municipio  || '',
      endereco_centro:     centro.endereco   || '',
    }));
    setComprovativo(null);
    setDocumentoRequisito(null);
  };

  // ── Submissão da inscrição ─────────────────────────────────
  const submeterInscricao = async () => {
    // Validação de autenticação e papel
    if (!utilizador) {
      navigate('/criar-conta');
      return;
    }
    if (!['student', 'estudante'].includes(utilizador.role)) {
      toast.aviso('A inscrição em cursos está disponível apenas para estudantes.');
      return;
    }

    // Validação de ficheiros obrigatórios
    if (!(comprovativo instanceof File)) {
      toast.aviso('Anexe o comprovativo de pagamento.');
      return;
    }
    if (modalInscricao?.certificado_exigido && !(documentoRequisito instanceof File)) {
      toast.aviso('Este curso exige certificado ou documento obrigatório.');
      return;
    }

    setSubmetendo(true);
    try {
      const fd = new FormData();
      if (modalInscricao?.id) fd.append('offering_id', modalInscricao.id);
      else                    fd.append('course_id',   id);

      fd.append('provincia_aluno',     formInscricao.provincia_aluno);
      fd.append('municipio_aluno',     formInscricao.municipio_aluno);
      fd.append('observacoes',         formInscricao.observacoes);
      fd.append('valor_pago',          formInscricao.valor_pago);
      fd.append('data_pagamento',      formInscricao.data_pagamento);
      fd.append('banco_origem',        formInscricao.banco_origem);
      fd.append('referencia_bancaria', formInscricao.referencia_bancaria);
      fd.append('comprovativo_pagamento', comprovativo);

      if (documentoRequisito instanceof File) {
        fd.append('documento_requisito', documentoRequisito);
      }

      await cursosAPI.inscrever(fd);
      toast.sucesso('Inscrição submetida! Aguarde a validação administrativa.');
      setModalInscricao(null);
      navigate('/cursos');
    } catch (e) {
      toast.erro(extrairErro(e));
    } finally {
      setSubmetendo(false);
    }
  };

  // ── Guarda valor no formulário ─────────────────────────────
  const setForm = (campo, valor) =>
    setFormInscricao((ant) => ({ ...ant, [campo]: valor }));

  // ── Estados de carregamento / erro ────────────────────────
  if (carregando) {
    return (
      <PaginaPublica>
        <PageLoader />
      </PaginaPublica>
    );
  }

  if (!curso) {
    return (
      <PaginaPublica>
        <div className="brand-page" style={{ paddingTop: 48 }}>
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>
              Curso não encontrado
            </h1>
            <p style={{ color: 'var(--txt-3)', marginBottom: 24 }}>
              {erro || 'O curso solicitado não existe ou não está disponível.'}
            </p>
            <Link to="/cursos" className="btn btn--primary">Voltar aos cursos</Link>
          </div>
        </div>
      </PaginaPublica>
    );
  }

  // ── Render principal ───────────────────────────────────────
  return (
    <PaginaPublica>
      <div className="brand-page" style={{ paddingTop: 32 }}>
        {/* Breadcrumb */}
        <nav className="detalhe-breadcrumb" aria-label="Navegação">
          <Link to="/">Início</Link>
          <span>/</span>
          <Link to="/cursos">Cursos</Link>
          <span>/</span>
          <span aria-current="page">{curso.nome}</span>
        </nav>

        {/* Layout 2 colunas */}
        <div className="detalhe-layout">

          {/* ── Coluna principal ─────────────────────── */}
          <div className="detalhe-main">

            {/* Hero do curso */}
            <div className="card detalhe-hero-card">
              <div className="detalhe-hero-cabecalho">
                <BadgeStatus status={curso.nivel || 'ativo'} />
                {curso.categoria && (
                  <span className="detalhe-categoria">{curso.categoria}</span>
                )}
              </div>

              <h1 className="detalhe-titulo">{curso.nome}</h1>

              <p className="detalhe-descricao">
                {curso.descricao || 'Sem descrição detalhada disponível.'}
              </p>

              {/* Métricas */}
              <div className="detalhe-metricas">
                {curso.duracao_horas && (
                  <span className="detalhe-metrica">
                    <Clock size={15} />
                    {curso.duracao_horas}h de duração
                  </span>
                )}
                {curso.total_avaliacoes > 0 && (
                  <span className="detalhe-metrica">
                    <Star size={15} fill="var(--amarelo)" color="var(--amarelo)" />
                    {Number(curso.media_avaliacoes || 0).toFixed(1)} ({curso.total_avaliacoes})
                  </span>
                )}
                {centros.length > 0 && (
                  <span className="detalhe-metrica">
                    <MapPin size={15} />
                    {centros.length} centro{centros.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Centros de Formação */}
            <div className="card" style={{ padding: 28 }}>
              <h2 className="detalhe-secao-titulo">Centros de Formação</h2>
              <p style={{ color: 'var(--txt-3)', marginBottom: 20, fontSize: '0.9rem' }}>
                Cada centro define o preço, a carga horária e as exigências específicas.
              </p>

              {centros.length === 0 ? (
                <div className="detalhe-aviso">
                  Ainda não existem centros listados. Pode submeter a inscrição e a equipa associará um centro posteriormente.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {centros.map((oferta) => (
                    <CartaoCentro
                      key={oferta.id}
                      oferta={oferta}
                      onInscrever={() => abrirInscricao(oferta)}
                    />
                  ))}
                </div>
              )}

              {centros.length === 0 && (
                <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {utilizador ? (
                    <button type="button" className="btn btn--primary" onClick={() => abrirInscricao(null)}>
                      Inscrever sem centro definido
                    </button>
                  ) : (
                    <Link to="/criar-conta" className="btn btn--primary">
                      Criar conta para inscrever
                    </Link>
                  )}
                  <Link to="/cursos" className="btn btn--secondary">Voltar à lista</Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar sticky ───────────────────────── */}
          <aside className="detalhe-sidebar">
            <div className="card detalhe-sidebar-card">
              {/* Preço */}
              <div className="detalhe-preco">
                {curso.preco_minimo ? (
                  <>
                    <span className="detalhe-preco__label">A partir de</span>
                    <span className="detalhe-preco__valor">
                      {formatAOA(curso.preco_minimo)}
                    </span>
                    {curso.preco_maximo && curso.preco_maximo !== curso.preco_minimo && (
                      <span className="detalhe-preco__range">
                        até {formatAOA(curso.preco_maximo)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="detalhe-preco__valor">A definir</span>
                )}
              </div>

              {/* CTA principal */}
              {utilizador?.role === 'estudante' || utilizador?.role === 'student' ? (
                <button
                  type="button"
                  className="btn btn--primary btn--full btn--lg"
                  onClick={() => abrirInscricao(centros[0] || null)}
                >
                  Inscrever agora
                </button>
              ) : (
                <Link to="/criar-conta" className="btn btn--primary btn--full btn--lg">
                  Criar conta de estudante
                </Link>
              )}

              <Link to="/cursos" className="btn btn--secondary btn--full" style={{ marginTop: 10 }}>
                Ver todos os cursos
              </Link>

              {/* Info rápida */}
              <div className="detalhe-info-rapida">
                {curso.categoria && (
                  <div className="detalhe-info-item">
                    <span>Área</span>
                    <strong>{curso.categoria}</strong>
                  </div>
                )}
                {curso.nivel && (
                  <div className="detalhe-info-item">
                    <span>Nível</span>
                    <strong style={{ textTransform: 'capitalize' }}>{curso.nivel}</strong>
                  </div>
                )}
                {curso.duracao_horas && (
                  <div className="detalhe-info-item">
                    <span>Duração</span>
                    <strong>{curso.duracao_horas}h</strong>
                  </div>
                )}
                <div className="detalhe-info-item">
                  <span>Centros</span>
                  <strong>{centros.length || curso.total_centros || '—'}</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Modal de Inscrição ─────────────────────────── */}
      <Modal
        aberto={!!modalInscricao}
        onFechar={() => { setModalInscricao(null); setMostrarCoordenadas(true); }}
        titulo={mostrarCoordenadas ? 'Passo 1 — Dados para pagamento' : 'Passo 2 — Comprovativo e envio'}
        largura={720}
        acoes={
          mostrarCoordenadas ? (
            <button type="button" className="btn btn--secondary" onClick={() => { setModalInscricao(null); setMostrarCoordenadas(true); }}>
              Fechar
            </button>
          ) : (
            <>
              <button type="button" className="btn btn--secondary" onClick={() => setMostrarCoordenadas(true)}>
                ← Voltar
              </button>
              <button
                type="button"
                className={`btn btn--primary${submetendo ? ' btn--loading' : ''}`}
                onClick={submeterInscricao}
                disabled={submetendo}
              >
                {!submetendo && 'Submeter Inscrição'}
              </button>
            </>
          )
        }
      >
        <InscricaoFlowStepper passo={mostrarCoordenadas ? 1 : 2} />
        {mostrarCoordenadas ? (
          <CoordenadasBancarias onContinuar={() => setMostrarCoordenadas(false)} />
        ) : (
          <FormularioInscricao
            curso={curso}
            modalInscricao={modalInscricao}
            form={formInscricao}
            setForm={setForm}
            comprovativo={comprovativo}
            setComprovativo={setComprovativo}
            documentoRequisito={documentoRequisito}
            setDocumentoRequisito={setDocumentoRequisito}
          />
        )}
      </Modal>
    </PaginaPublica>
  );
}

function InscricaoFlowStepper({ passo }) {
  const umFeito = passo >= 2;
  return (
    <div className="flow-stepper" role="list" aria-label="Etapas da inscrição">
      <div
        role="listitem"
        className={`flow-stepper__step${passo === 1 ? ' flow-stepper__step--current' : ''}${umFeito ? ' flow-stepper__step--done' : ''}`}
      >
        <span className="flow-stepper__num" aria-hidden>
          {umFeito ? <Check size={14} strokeWidth={3} /> : '1'}
        </span>
        <span className="flow-stepper__label">Coordenadas e pagamento</span>
      </div>
      <div className="flow-stepper__connector" aria-hidden />
      <div
        role="listitem"
        className={`flow-stepper__step${passo === 2 ? ' flow-stepper__step--current' : ''}`}
      >
        <span className="flow-stepper__num" aria-hidden>2</span>
        <span className="flow-stepper__label">Comprovativo e submissão</span>
      </div>
    </div>
  );
}

// ── Layout de página pública ────────────────────────────────
function PaginaPublica({ children }) {
  return (
    <div className="publico-layout">
      <Navbar />
      <main className="publico-main">{children}</main>
      <Footer />
    </div>
  );
}

// ── Cartão de centro de formação ────────────────────────────
function CartaoCentro({ oferta, onInscrever }) {
  const centro = oferta.centro || {};
  return (
    <div className="centro-card">
      <div className="centro-card__header">
        <div>
          <p className="centro-card__nome">{centro.nome || 'Centro não nomeado'}</p>
          {(centro.municipio || centro.provincia) && (
            <p className="centro-card__local">
              <MapPin size={13} />
              {[centro.municipio, centro.provincia].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <BadgeStatus status={oferta.proximidade || 'ativo'} />
      </div>

      <div className="centro-card__metricas">
        <div className="centro-card__metrica">
          <span>Preço</span>
          <strong>{formatAOA(oferta.preco)}</strong>
        </div>
        <div className="centro-card__metrica">
          <span>Modalidade</span>
          <strong>{oferta.modalidade === 'online' ? 'Online' : 'Presencial'}</strong>
        </div>
        <div className="centro-card__metrica">
          <span>Carga horária</span>
          <strong>{oferta.carga_horaria ? `${oferta.carga_horaria}h` : 'A definir'}</strong>
        </div>
        <div className="centro-card__metrica">
          <span>Documento exigido</span>
          <strong>{oferta.certificado_exigido ? 'Sim' : 'Não'}</strong>
        </div>
      </div>

      {oferta.especificacoes && (
        <p style={{ color: 'var(--txt-2)', lineHeight: 1.6, marginBottom: 16, fontSize: '0.875rem' }}>
          {oferta.especificacoes}
        </p>
      )}

      <button type="button" className="btn btn--primary btn--sm" onClick={onInscrever}>
        Inscrever neste centro
      </button>
    </div>
  );
}

// ── Formulário de inscrição (passo 2 do modal) ──────────────
function FormularioInscricao({
  curso, modalInscricao, form, setForm,
  comprovativo, setComprovativo,
  documentoRequisito, setDocumentoRequisito,
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Resumo seleção */}
      <div className="inscricao-resumo">
        <p className="inscricao-resumo__curso">{curso.nome}</p>
        <p className="inscricao-resumo__centro">
          {modalInscricao?.centro?.nome
            ? `${modalInscricao.centro.nome} · ${formatAOA(modalInscricao.preco)}`
            : 'Sem centro definido no momento'}
        </p>
      </div>

      {/* Localização (preenchida automaticamente, read-only) */}
      <fieldset className="inscricao-fieldset">
        <legend className="inscricao-fieldset__legend">
          <MapPin size={14} /> Localização do Centro
        </legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Província</label>
            <input className="form-input" value={form.provincia_aluno} readOnly disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Município</label>
            <input className="form-input" value={form.municipio_aluno} readOnly disabled />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 8 }}>
          <label className="form-label">Endereço do Centro</label>
          <input className="form-input" value={form.endereco_centro} readOnly disabled />
        </div>
      </fieldset>

      {/* Pagamento */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Banco de origem *</label>
          <input
            className="form-input"
            value={form.banco_origem}
            onChange={(e) => setForm('banco_origem', e.target.value)}
            placeholder="Ex: BFA, BAI, BCGTA"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Referência bancária *</label>
          <input
            className="form-input"
            value={form.referencia_bancaria}
            onChange={(e) => setForm('referencia_bancaria', e.target.value)}
            placeholder="Ex: TRX123456"
          />
        </div>
      </div>

      {/* Observações */}
      <div className="form-group">
        <label className="form-label">Observações</label>
        <textarea
          className="form-textarea"
          rows={3}
          value={form.observacoes}
          onChange={(e) => setForm('observacoes', e.target.value)}
          placeholder="Informações adicionais para a equipa."
        />
      </div>

      {/* Comprovativo */}
      <div className="form-group">
        <label className="form-label">Comprovativo de pagamento *</label>
        <label className="file-upload-label">
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setComprovativo(e.target.files?.[0] || null)}
          />
          <span className={`file-upload-btn${comprovativo ? ' file-upload-btn--ok' : ''}`}>
            {comprovativo ? `✓ ${comprovativo.name}` : 'Escolher ficheiro (PDF/Imagem)'}
          </span>
        </label>
      </div>

      {/* Documento adicional (se exigido) */}
      {modalInscricao?.certificado_exigido && (
        <div className="form-group">
          <label className="form-label">Certificado ou documento obrigatório *</label>
          <label className="file-upload-label">
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDocumentoRequisito(e.target.files?.[0] || null)}
            />
            <span className={`file-upload-btn${documentoRequisito ? ' file-upload-btn--ok' : ''}`}>
              {documentoRequisito ? `✓ ${documentoRequisito.name}` : 'Escolher certificado/documento'}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
