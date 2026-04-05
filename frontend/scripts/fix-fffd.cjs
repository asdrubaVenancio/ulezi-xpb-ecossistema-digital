/**
 * Corrige U+FFFD e pares U+FFFD+? após conversão mojibake.
 */
const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../src/pages/aluno/Dashboards.jsx'),
  path.join(__dirname, '../src/pages/admin/DashboardAdmin.jsx'),
];

function clean(s) {
  if (s.startsWith('?//')) s = '//' + s.slice(2);

  s = s.replace(/inv\uFFFDlido/g, 'inválido');
  s = s.replace(/at\uFFFD um/g, 'até um');

  // Separadores visuais: sequências? repetidas
  s = s.replace(/(?:\uFFFD\?)+/g, '—');

  // Linhas que ficaram só com trancos em comentário
  s = s.replace(/^\/\/(?:\s*—\s*)+$/gm, '// ---');

  // Qualquer FFFD restante (carácter multibyte mal convertido)
  s = s.replace(/\uFFFD/g, '');

  s = s.replace(/—{4,}/g, '—');

  return s;
}

for (const abs of files) {
  const s = fs.readFileSync(abs, 'utf8');
  fs.writeFileSync(abs, clean(s), 'utf8');
  console.log('Cleaned:', abs);
}
