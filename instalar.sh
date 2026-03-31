#!/bin/bash
# ============================================================
# ULEZI XPB — Script de Instalação Automática
# ============================================================
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     ULEZI XPB — Instalação Automática    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Backend ────────────────────────────────────────────────────────────────────
echo "📦 [1/3] Instalando dependências do Backend..."
cd backend
npm install
echo "✅ Backend OK"
cd ..

# ── Frontend ───────────────────────────────────────────────────────────────────
echo ""
echo "📦 [2/3] Instalando dependências do Frontend (Vite)..."
cd frontend
npm install
echo "✅ Frontend OK"
cd ..

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║           Instalação concluída!          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "  1. Configure a base de dados MySQL:"
echo "     mysql -u root -p < database/schema.sql"
echo "     mysql -u root -p ulezi_xpb < database/seed.sql"
echo ""
echo "  2. Configure o backend:"
echo "     cp backend/.env.example backend/.env"
echo "     # Edite backend/.env e defina DB_PASSWORD"
echo ""
echo "  3. Crie os utilizadores demo (com senhas correctas):"
echo "     cd backend && node ../database/create-admin.js"
echo ""
echo "  4. Inicie o backend:"
echo "     cd backend && npm run dev"
echo ""
echo "  5. Inicie o frontend (novo terminal):"
echo "     cd frontend && npm run dev"
echo ""
echo "  🌐 App: http://localhost:3000"
echo "  📡 API: http://localhost:5000"
echo ""
echo "  🔑 Login demo: admin@ulezixpb.com / Admin@123456"
echo ""
