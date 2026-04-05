/**
 * Corrige texto UTF-8 lido/guardado como Latin-1 (mojibake tipo â€", Ã§).
 * Uso: node scripts/fix-mojibake.cjs [ficheiros...]
 */
const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      path.join(__dirname, '../src/pages/aluno/Dashboards.jsx'),
      path.join(__dirname, '../src/pages/admin/DashboardAdmin.jsx'),
    ];

for (const filePath of files) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error('Missing:', abs);
    continue;
  }
  const s = fs.readFileSync(abs, 'utf8');
  const buf = Buffer.allocUnsafe(s.length);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    buf[i] = c <= 255 ? c : 0x3f;
  }
  const fixed = buf.toString('utf8');
  if (fixed === s) {
    console.log('No change:', abs);
    continue;
  }
  fs.writeFileSync(abs, fixed, 'utf8');
  console.log('Fixed:', abs);
}
