@echo off
echo.
echo ==========================================
echo   ULEZI XPI -- Instalacao Automatica
echo ==========================================
echo.

echo [1/2] Instalando Backend...
cd backend
call npm install
cd ..

echo.
echo [2/2] Instalando Frontend (Vite)...
cd frontend
call npm install
cd ..

echo.
echo ==========================================
echo   Instalacao concluida!
echo ==========================================
echo.
echo Proximos passos:
echo.
echo 1. Configure a base de dados MySQL:
echo    mysql -u root -p ^< database\schema.sql
echo    mysql -u root -p ulezi_xpI ^< database\seed.sql
echo.
echo 2. Configure o backend:
echo    Copie backend\.env.example para backend\.env
echo    Edite backend\.env e defina DB_PASSWORD
echo.
echo 3. Crie os utilizadores demo:
echo    cd backend
echo    node ..\database\create-admin.js
echo.
echo 4. Inicie o backend:
echo    cd backend ^&^& npm run dev
echo.
echo 5. Inicie o frontend (novo terminal):
echo    cd frontend ^&^& npm run dev
echo.
echo App: http://localhost:3000
echo API: http://localhost:5000
echo Login: admin@ulezixpI.com / Admin@123456
echo.
pause
