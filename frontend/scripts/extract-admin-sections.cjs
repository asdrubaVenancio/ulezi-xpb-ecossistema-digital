const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../src/pages/admin/DashboardAdmin.jsx');
const dest = path.join(__dirname, '../src/pages/admin/sections/DashboardAdminSections.jsx');

const lines = fs.readFileSync(src, 'utf8').split(/\r?\n/);
// Linhas 254–2125 (1-based) → índice 253–2124
const sectionLines = lines.slice(253, 2125).join('\n');

const header = `// ============================================================
// Secções do painel administrativo (extraídas de DashboardAdmin)
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  CheckCircle,
  CreditCard,
  Eye,
  FileText,
  Folder,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Sun,
  Users,
  X,
} from 'lucide-react';
import GestaoCoordenadasBancarias from '../../components/admin/GestaoCoordenadasBancarias.jsx';
import { useToast } from '../../components/ui/Toast';
import {
  BadgeStatus,
  EmptyState,
  Modal,
  PageLoader,
  StatCard,
} from '../../components/ui/index.jsx';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, authAPI, extrairErro, pagamentosAPI } from '../../services/api';
import { formatAOA, formatData, iniciais } from '../../utils/constants';

`;

const footer = `
export {
  PainelGeral,
  Utilizadores,
  Cursos,
  Empresas,
  Investimentos,
  Pagamentos,
  Contratos,
  VagasEmpresa,
  Ficheiros,
  NotificacoesReal,
  ContratosReal,
  Seguranca,
  Configuracoes,
};
`;

// Converter function X → export function X para as secções exportadas
let body = sectionLines.replace(/^function (PainelGeral|Utilizadores|Cursos|Empresas|Investimentos|Pagamentos|Contratos|VagasEmpresa|Ficheiros|NotificacoesReal|ContratosReal|Seguranca|Configuracoes)\(/gm, 'export function $1(');
// Helpers internos permanecem sem export
body = body.replace(/^export function (ToggleRow|SecaoSimples)\(/gm, 'function $1(');

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, header + body + footer, 'utf8');
console.log('Wrote', dest, 'lines', body.split('\n').length);
