const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../src/pages/admin/DashboardAdmin.jsx');
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/<button(?![^>]*\btype=)/g, '<button type="button" ');
fs.writeFileSync(p, s, 'utf8');
console.log('Updated', p);
