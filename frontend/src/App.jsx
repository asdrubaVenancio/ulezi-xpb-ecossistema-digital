// ============================================================
// ULEZI XPB — App.jsx — Roteamento principal
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }        from './context/AuthContext';
import { ToastProvider }       from './components/ui/Toast';
import { RotaPrivada, RotaPublica } from './routes/Guards';

// Páginas públicas
import Home     from './pages/publico/Home';
import Negocios from './pages/publico/Negocios';
import {
  Cursos, CursoDetalhe, Comunidade, Termos, Privacidade,
  NotFound, EsqueciPassword, NovaPassword,
} from './pages/publico/Paginas';

// Auth
import { Login, Registar } from './pages/auth/Auth';

// Dashboards
import DashboardAdmin from './pages/admin/DashboardAdmin';
import { DashboardAluno, DashboardEmpresa, DashboardInvestidor } from './pages/aluno/Dashboards';
import Perfil          from './pages/perfil/Perfil';
import DashboardLayout from './components/layout/DashboardLayout';

/** Wrapper com layout de dashboard */
function ComLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  const loginRoute = <RotaPublica><Login /></RotaPublica>;
  const registoRoute = <RotaPublica><Registar /></RotaPublica>;
  const recuperarSenhaRoute = <RotaPublica><EsqueciPassword /></RotaPublica>;
  const novaSenhaRoute = <RotaPublica><NovaPassword /></RotaPublica>;
  const alunoRoute = (
    <RotaPrivada papeis={['estudante', 'student']}>
      <ComLayout><DashboardAluno /></ComLayout>
    </RotaPrivada>
  );
  const empresaRoute = (
    <RotaPrivada papeis={['empresa', 'company']}>
      <ComLayout><DashboardEmpresa /></ComLayout>
    </RotaPrivada>
  );
  const investidorRoute = (
    <RotaPrivada papeis={['investidor', 'investor']}>
      <ComLayout><DashboardInvestidor /></ComLayout>
    </RotaPrivada>
  );
  const adminRoute = (
    <RotaPrivada papeis={['admin', 'funcionario', 'employee']}>
      <DashboardAdmin />
    </RotaPrivada>
  );

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Públicas ──────────────────────────────────── */}
            <Route path="/"                   element={<Home />} />
            <Route path="/cursos"             element={<Cursos />} />
            <Route path="/cursos/:id"         element={<CursoDetalhe />} />
            <Route path="/negocios"           element={<Negocios />} />
            <Route path="/comunidade"         element={<Comunidade />} />
            <Route path="/termos"             element={<Termos />} />
            <Route path="/privacidade"        element={<Privacidade />} />

            {/* ── Auth (redireccionam se autenticado) ──────── */}
            <Route path="/entrar"               element={loginRoute} />
            <Route path="/criar-conta"          element={registoRoute} />
            <Route path="/recuperar-senha"      element={recuperarSenhaRoute} />
            <Route path="/nova-senha/:token"    element={novaSenhaRoute} />

            {/* Aliases legados */}
            <Route path="/login"                element={loginRoute} />
            <Route path="/registar"             element={registoRoute} />
            <Route path="/esqueci-password"     element={recuperarSenhaRoute} />
            <Route path="/nova-password/:token" element={novaSenhaRoute} />

            {/* ── Perfil (qualquer autenticado) ─────────────── */}
            <Route path="/perfil" element={
              <RotaPrivada>
                <ComLayout><Perfil /></ComLayout>
              </RotaPrivada>
            } />

            {/* ── Aluno ─────────────────────────────────────── */}
            <Route path="/painel/aluno"       element={alunoRoute} />
            <Route path="/aluno/dashboard"    element={alunoRoute} />

            {/* ── Empresa ──────────────────────────────────── */}
            <Route path="/painel/empresa"     element={empresaRoute} />
            <Route path="/empresa/dashboard"  element={empresaRoute} />

            {/* ── Investidor ───────────────────────────────── */}
            <Route path="/painel/investidor"      element={investidorRoute} />
            <Route path="/investidor/dashboard"   element={investidorRoute} />

            {/* ── Admin / Funcionário ──────────────────────── */}
            <Route path="/painel/admin"       element={adminRoute} />
            <Route path="/admin/dashboard"    element={adminRoute} />

            {/* ── 404 ──────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
