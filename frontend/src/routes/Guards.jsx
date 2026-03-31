// ============================================================
// ULEZI XPB — Guards de Rota (Protecção por papel)
// ============================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PageLoader } from '../components/ui/index.jsx';
import { useAuth } from '../context/AuthContext';

/**
 * Rota privada — redireciona para login se não autenticado
 * Aceita roles do backend (student/company/investor/employee)
 * e aliases em português (estudante/empresa/investidor/funcionario)
 * @param {{ papeis?: string[], children: React.ReactNode }} props
 */
export function RotaPrivada({ papeis, children }) {
  const { estaAutenticado, carregando, utilizador } = useAuth();
  const location = useLocation();

  // Mapa de equivalências de roles
  const ROLE_MAP = {
    estudante: 'student', empresa: 'company',
    investidor: 'investor', funcionario: 'employee',
  };

  // Enquanto verifica sessão
  if (carregando) return <PageLoader />;

  // Não autenticado → login
  if (!estaAutenticado) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  // Verificar papel — aceita tanto inglês como português
  if (papeis) {
    const roleActual = utilizador?.role;
    const roleNormalizado = ROLE_MAP[roleActual] || roleActual;
    const papeiNormalizados = papeis.map(p => ROLE_MAP[p] || p);
    const temAcesso = papeiNormalizados.includes(roleActual) || papeiNormalizados.includes(roleNormalizado);
    if (!temAcesso) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

/**
 * Rota pública — redireciona para dashboard se já autenticado
 */
export function RotaPublica({ children }) {
  const { estaAutenticado, carregando, utilizador } = useAuth();
  // Mapeia roles do backend (inglês) e aliases em português
  const DESTINOS = {
    student:    '/painel/aluno',
    estudante:  '/painel/aluno',
    company:    '/painel/empresa',
    empresa:    '/painel/empresa',
    investor:   '/painel/investidor',
    investidor: '/painel/investidor',
    admin:      '/painel/admin',
    employee:   '/painel/admin',
    funcionario:'/painel/admin',
  };

  if (carregando) return <PageLoader />;

  if (estaAutenticado) {
    const destino = DESTINOS[utilizador?.role] || '/';
    return <Navigate to={destino} replace />;
  }

  return children;
}
