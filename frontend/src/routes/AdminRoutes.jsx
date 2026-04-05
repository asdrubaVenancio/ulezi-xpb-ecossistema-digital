// ============================================================
// Rotas do painel administrativo — URL ↔ secção sincronizadas
// ============================================================

import React, { lazy } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ADMIN_PAINEL_ROOT, secaoDesdeSlug } from '../config/adminNav';
import { RotaPrivada } from './Guards';

const DashboardAdmin = lazy(() => import('../pages/admin/DashboardAdmin'));

const PAPEIS_ADMIN = ['admin', 'funcionario', 'employee'];

/** Entrada principal /painel/admin → secção painel */
export function AdminPainelRota() {
  return (
    <RotaPrivada papeis={PAPEIS_ADMIN}>
      <DashboardAdmin secaoInicial="painel" />
    </RotaPrivada>
  );
}

/** Deep links /admin/:secaoSlug — slug inválido redireciona para o painel */
export function AdminSecaoRota() {
  const { secaoSlug } = useParams();
  const secao = secaoDesdeSlug(secaoSlug);
  if (!secao) {
    return <Navigate to={ADMIN_PAINEL_ROOT} replace />;
  }
  return (
    <RotaPrivada papeis={PAPEIS_ADMIN}>
      <DashboardAdmin secaoInicial={secao} />
    </RotaPrivada>
  );
}
