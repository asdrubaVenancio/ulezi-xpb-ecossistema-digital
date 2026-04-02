const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('src/pages/admin').filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const fp = path.join('src/pages/admin', file);
  let content = fs.readFileSync(fp, 'utf8');
  
  if (content.includes('AdminLayout')) {
    content = content
      .replace(/import AdminLayout from ['"]\.\.\/..\/components\/layouts\/AdminLayout['"];/g, "import Sidebar from '../../components/layout/Sidebar';")
      .replace(/<AdminLayout>/g, '<div className="min-h-screen bg-gray-50 flex"><Sidebar userType="admin" /><main className="flex-1 ml-64 p-8">')
      .replace(/<\/AdminLayout>/g, '</main></div>');
    
    fs.writeFileSync(fp, content);
    console.log('Fixed:', file);
  }
});

console.log('Done!');
