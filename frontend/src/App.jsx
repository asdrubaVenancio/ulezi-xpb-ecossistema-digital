// ============================================================
// ULEZI XPI — App.jsx — Roteamento principal
// Módulos separados por responsabilidade única (SRP)
// ============================================================

import React, { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from './components/ui/index.jsx';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider }  from './context/AuthContext';
import { RotaPrivada, RotaPublica } from './routes/Guards';

// Landing em bundle inicial (LCP)
import Home from './pages/publico/Home';

// ── Code-splitting: restantes carregam sob demanda ───────────
const Negocios = lazy(() => import('./pages/publico/Negocios'));
const Cursos = lazy(() => import('./pages/publico/Cursos'));
const CursoDetalhe = lazy(() => import('./pages/publico/CursoDetalhe'));
const Comunidade = lazy(() => import('./pages/publico/Comunidade'));

const Termos = lazy(() => import('./pages/publico/Paginas').then((m) => ({ default: m.Termos })));
const Privacidade = lazy(() => import('./pages/publico/Paginas').then((m) => ({ default: m.Privacidade })));
const NotFound = lazy(() => import('./pages/publico/Paginas').then((m) => ({ default: m.NotFound })));
const EsqueciPassword = lazy(() => import('./pages/publico/Paginas').then((m) => ({ default: m.EsqueciPassword })));
const NovaPassword = lazy(() => import('./pages/publico/Paginas').then((m) => ({ default: m.NovaPassword })));

const Login = lazy(() => import('./pages/auth/Auth').then((m) => ({ default: m.Login })));
const Registar = lazy(() => import('./pages/auth/Auth').then((m) => ({ default: m.Registar })));

// Página de Notificações (reutilizável para Aluno e Empresa)
const Notificacoes = lazy(() => import('./pages/Notificacoes'));

import DashboardLayout from './components/layout/DashboardLayout';
const DashboardAluno = lazy(() => import('./pages/aluno/Dashboards').then((m) => ({ default: m.DashboardAluno })));
const DashboardEmpresa = lazy(() => import('./pages/aluno/Dashboards').then((m) => ({ default: m.DashboardEmpresa })));
const DashboardInvestidor = lazy(() => import('./pages/aluno/Dashboards').then((m) => ({ default: m.DashboardInvestidor })));
const Perfil = lazy(() => import('./pages/perfil/Perfil'));
const AssinaturaPage = lazy(() => import('./pages/empresa/Assinatura'));

import { AdminPainelRota, AdminSecaoRota } from './routes/AdminRoutes';

// ── Wrapper: aplica layout de dashboard ──────────────────────
function ComLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Páginas Públicas ──────────────────────────── */}
            <Route path="/"              element={<Home />} />
            <Route path="/cursos"        element={<Cursos />} />
            <Route path="/cursos/:id"    element={<CursoDetalhe />} />
            <Route path="/negocios"      element={<Negocios />} />
            <Route path="/comunidade"    element={<Comunidade />} />
            <Route path="/termos"        element={<Termos />} />
            <Route path="/privacidade"   element={<Privacidade />} />

            {/* ── Autenticação (redireccionam se autenticado) ─ */}
            <Route path="/entrar"              element={<RotaPublica><Login /></RotaPublica>} />
            <Route path="/criar-conta"         element={<RotaPublica><Registar /></RotaPublica>} />
            <Route path="/recuperar-senha"     element={<RotaPublica><EsqueciPassword /></RotaPublica>} />
            <Route path="/nova-senha/:token"   element={<RotaPublica><NovaPassword /></RotaPublica>} />

            {/* Aliases legados — mantidos para compatibilidade */}
            <Route path="/login"               element={<RotaPublica><Login /></RotaPublica>} />
            <Route path="/registar"            element={<RotaPublica><Registar /></RotaPublica>} />
            <Route path="/esqueci-password"    element={<RotaPublica><EsqueciPassword /></RotaPublica>} />
            <Route path="/nova-password/:token" element={<RotaPublica><NovaPassword /></RotaPublica>} />

            {/* ── Perfil (qualquer utilizador autenticado) ───── */}
            <Route
              path="/perfil"
              element={
                <RotaPrivada>
                  <ComLayout><Perfil /></ComLayout>
                </RotaPrivada>
              }
            />

            {/* ── Painel do Aluno ───────────────────────────── */}
            <Route
              path="/painel/aluno"
              element={
                <RotaPrivada papeis={['estudante', 'student']}>
                  <ComLayout><DashboardAluno /></ComLayout>
                </RotaPrivada>
              }
            />
            <Route path="/aluno/dashboard" element={<Navigate to="/painel/aluno" replace />} />
            <Route
              path="/painel/aluno/notificacoes"
              element={
                <RotaPrivada papeis={['estudante', 'student']}>
                  <ComLayout><Notificacoes /></ComLayout>
                </RotaPrivada>
              }
            />

            {/* ── Painel da Empresa ─────────────────────────── */}
            <Route
              path="/empresa/dashboard"
              element={
                <RotaPrivada papeis={['empresa', 'company']}>
                  <ComLayout><DashboardEmpresa /></ComLayout>
                </RotaPrivada>
              }
            />
            <Route path="/painel/empresa"    element={<Navigate to="/empresa/dashboard" replace />} />
            <Route path="/empresa/operacoes" element={<Navigate to="/empresa/dashboard" replace />} />
            <Route
              path="/empresa/assinatura"
              element={
                <RotaPrivada papeis={['empresa', 'company']}>
                  <ComLayout><AssinaturaPage /></ComLayout>
                </RotaPrivada>
              }
            />
            <Route
              path="/empresa/notificacoes"
              element={
                <RotaPrivada papeis={['empresa', 'company']}>
                  <ComLayout><Notificacoes /></ComLayout>
                </RotaPrivada>
              }
            />

            {/* ── Painel do Investidor ──────────────────────── */}
            <Route
              path="/painel/investidor"
              element={
                <RotaPrivada papeis={['investidor', 'investor']}>
                  <ComLayout><DashboardInvestidor /></ComLayout>
                </RotaPrivada>
              }
            />
            <Route
              path="/painel/investidor/notificacoes"
              element={
                <RotaPrivada papeis={['investidor', 'investor']}>
                  <ComLayout><Notificacoes /></ComLayout>
                </RotaPrivada>
              }
            />
            <Route path="/investidor/dashboard" element={<Navigate to="/painel/investidor" replace />} />

            {/* ── Painel Admin / Funcionário (URL sincronizada com a secção) ─ */}
            <Route path="/painel/admin"    element={<AdminPainelRota />} />
            <Route path="/admin/dashboard" element={<Navigate to="/painel/admin" replace />} />
            <Route path="/admin/:secaoSlug" element={<AdminSecaoRota />} />

            {/* ── Página 404 ─────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
