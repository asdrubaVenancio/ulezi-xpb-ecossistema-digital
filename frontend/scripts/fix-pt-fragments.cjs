/**
 * Corrige fragmentos PT perdidos após limpeza de mojibake (carácter único removido).
 */
const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  [/estatsticas/g, 'estatísticas'],
  [/inscries/g, 'inscrições'],
  [/validao/g, 'validação'],
  [/aprovao/g, 'aprovação'],
  [/Documentao/g, 'Documentação'],
  [/obrigatrio/g, 'obrigatório'],
  [/indisponvel/g, 'indisponível'],
  [/visvel/g, 'visível'],
  [/Catlogo/g, 'Catálogo'],
  [/primario/g, 'primário'],
  [/O utilizador no conseguir/g, 'O utilizador não conseguir'],
  [/voltar a ter acesso  plataforma/g, 'voltar a ter acesso à plataforma'],
  [/acesso  plataforma/g, 'acesso à plataforma'],
  [/j foi/g, 'já foi'],
  [/Aprovaes/g, 'Aprovações'],
  [/actualizado/g, 'atualizado'],
  [/actualizada/g, 'atualizada'],
  [/Estado actual/g, 'Estado atual'],
  [/estado actual/g, 'estado atual'],
  [/actual do/g, 'atual do'],
  [/Ecossistema/g, 'Ecossistema'],
  [/ecossistema/g, 'ecossistema'],
];

const files = [
  path.join(__dirname, '../src/pages/admin/DashboardAdmin.jsx'),
  path.join(__dirname, '../src/pages/aluno/Dashboards.jsx'),
];

for (const abs of files) {
  let s = fs.readFileSync(abs, 'utf8');
  for (const [re, rep] of REPLACEMENTS) s = s.replace(re, rep);
  fs.writeFileSync(abs, s, 'utf8');
  console.log('PT fragments:', abs);
}
