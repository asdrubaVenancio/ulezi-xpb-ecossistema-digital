import fs from 'fs';
import path from 'path';

const files = [
  'Contratos.jsx',
  'GestaoEmpresas.jsx', 
  'OportunidadesInvestimento.jsx',
  'SuporteTickets.jsx',
  'NotificacoesAssinatura.jsx'
];

files.forEach(file => {
  const fp = path.join('src/pages/admin', file);
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    
    // Procura pelo padrão: </div>\n      </div>\n      </main>\n    </div>
    // E substitui por: </div>\n      </main>\n    </div>
    const pattern = /\n        <\/div>\n      <\/div>\n      <\/main>/;
    if (pattern.test(content)) {
      content = content.replace(pattern, '\n        </div>\n      </main>');
      fs.writeFileSync(fp, content);
      console.log('Fixed:', file);
    } else {
      console.log('Pattern not found in:', file);
    }
  }
});

console.log('Done!');
