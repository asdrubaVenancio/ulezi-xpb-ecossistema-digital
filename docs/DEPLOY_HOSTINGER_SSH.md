# Deploy na Hostinger via SSH

Este guia assume:

- domínio final: `https://ulezixpi.com`
- deploy por Git via acesso SSH
- backend Node.js + Express
- frontend React/Vite
- base MySQL

## 1. Estratégia recomendada

Para este projecto, o caminho mais seguro é:

1. subir o código por `git clone` no servidor
2. configurar variáveis de produção
3. restaurar a base de dados a partir de `database/bd.sql` quando quiser levar exactamente o estado local actual
4. manter o admin vindo da seed/base de dados, sem criação manual pela aplicação

Observação importante:

- `database/seed.sql` continua útil para uma instalação inicial controlada
- `database/bd.sql` é o dump mais fiel do ambiente local actual e é o mais indicado para este deploy específico

## 2. Clonar o projecto via SSH

No servidor:

```bash
git clone <URL_SSH_DO_REPOSITORIO> ulezi-xpb
cd ulezi-xpb
```

Para actualizar depois:

```bash
git pull origin main
```

## 3. Variáveis de ambiente

### Backend

Crie:

```bash
cp backend/.env.production.example backend/.env
```

Ajuste pelo menos:

- `NODE_ENV=production`
- `PORT=5000`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL=https://ulezixpi.com`
- `SMTP_*`
- `EMAIL_FROM`

### Frontend

Se for fazer build directo no servidor:

```bash
cp frontend/.env.production.example frontend/.env.production
```

Use:

```env
VITE_API_URL=https://ulezixpi.com/api
```

## 4. Base de dados

### Opção recomendada para este deploy

Importar o dump actual:

```bash
mysql -u SEU_USER -p SEU_BANCO < database/bd.sql
```

Isto leva:

- estrutura real usada localmente
- dados actuais
- admin já existente na base

### Opção alternativa

Se quiser um arranque limpo:

```bash
mysql -u SEU_USER -p SEU_BANCO < database/schema.sql
mysql -u SEU_USER -p SEU_BANCO < database/seed.sql
```

Mas, no estado actual do projecto, `bd.sql` está mais alinhado com o código do que `schema.sql`.

## 5. Build manual sem Docker

### Backend

```bash
cd backend
npm install --production
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

Depois sirva o conteúdo de `frontend/build`.

## 6. Execução do backend

Pode correr com PM2:

```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name ulezixpi-backend
pm2 save
pm2 startup
```

## 7. Reverse proxy

Recomendação:

- frontend em `https://ulezixpi.com`
- backend exposto apenas internamente na porta `5000`
- proxy de `/api` e `/uploads` para o backend

Exemplo de ideia de proxy:

- `/api/*` -> `http://127.0.0.1:5000/api/*`
- `/uploads/*` -> `http://127.0.0.1:5000/uploads/*`

Assim o frontend pode usar:

```env
VITE_API_URL=https://ulezixpi.com/api
```

## 8. Deploy com Docker

Foi adicionado:

- `frontend/Dockerfile`
- `docker-compose.production.yml`
- `.env.production.example`

Exemplo:

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

## 9. Checklist final

- `FRONTEND_URL` aponta para `https://ulezixpi.com`
- `VITE_API_URL` aponta para `https://ulezixpi.com/api`
- o proxy do domínio encaminha `/api` e `/uploads`
- a base foi importada
- o backend inicia sem erro
- o frontend compila
- login do admin funciona com o utilizador vindo da base/seed
- envio de emails foi configurado com credenciais reais

## 10. Após o primeiro deploy

Valide no navegador:

1. homepage
2. login
3. dashboard admin
4. abertura de documentos/upload
5. geração e download de contratos
6. envio de email de funcionário

