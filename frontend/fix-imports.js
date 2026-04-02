const fs = require('fs');
const path = require('path');

const files = [
  'InteressesInvestidores.jsx',
  'GestaoVisitas.jsx',
  'GestaoMediacao.jsx',
  'GestaoFuncionarios.jsx',
  'NotificacoesAssinatura.jsx'
];

files.forEach(file => {
  const fp = path.join('src/pages/admin', file);
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    
    if (content.includes('AdminLayout')) {
      content = content.replace(
        "import AdminLayout from '../../components/layouts/AdminLayout';",
        "import Sidebar from '../../components/layout/Sidebar';"
      );
      
      fs.writeFileSync(fp, content);
      console.log('Fixed:', file);
    }
  }
});

console.log('Done!');
