# ULEZI XPB

Plataforma web que integra tres areas principais:

- cursos e inscricoes
- negocios e investimentos
- comunidade e servicos

O projecto esta organizado como um monolito modular, com backend em Node.js + Express, frontend em React + Vite e base de dados MySQL.

## Estado actual do projecto

O repositorio contem uma base funcional real para:

- autenticacao com JWT e refresh token
- registo e gestao de perfis por papel
- inscricoes em cursos
- pagamentos com comprovativo
- aprovacao administrativa de pagamentos
- perfis empresariais com documentos
- oportunidades de investimento
- interesse de investidores
- contratos
- comunidade com perfis publicos e servicos
- vagas publicas e vagas de empresas com aprovacao
- painel administrativo
- notificacoes internas
- testes automatizados basicos no backend

## Tecnologias

### Backend

- Node.js
- Express.js
- MySQL
- JWT
- bcryptjs
- Joi
- Multer
- PDFKit
- Nodemailer
- Helmet
- CORS
- express-rate-limit

### Frontend

- React 18
- Vite
- React Router
- Axios
- React Hook Form
- Zod
- Lucide React

## Estrutura do projecto

```text
ulezi-xpb/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middlewares/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- validations/
|   |   `-- server.js
|   `-- tests/
|-- frontend/
|   `-- src/
|       |-- components/
|       |-- context/
|       |-- pages/
|       |-- routes/
|       |-- services/
|       |-- styles/
|       `-- utils/
|-- database/
|   |-- schema.sql
|   `-- seed.sql
`-- docs/
```

## Pre-requisitos

- Node.js 18 ou superior
- npm 9 ou superior
- MySQL 8 ou superior

## Instalacao

### 1. Base de dados

Crie a base de dados e execute os scripts:

```bash
mysql -u root -p
source database/schema.sql
source database/seed.sql
```

### 2. Backend

```bash
cd backend
npm install
```

Crie o ficheiro `.env` a partir de `backend/.env.example`.

### 3. Frontend

```bash
cd frontend
npm install
```

Opcionalmente crie `frontend/.env` com:

```env
VITE_API_URL=http://localhost:5000/api
```

## Variaveis de ambiente do backend

As principais variaveis esperadas sao:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=sua_password
DB_NAME=ulezi2_xpb

JWT_SECRET=uma_chave_longa_e_segura
JWT_EXPIRES=24h
JWT_REFRESH_SECRET=outra_chave_longa_e_segura
JWT_REFRESH_EXPIRES=7d

FRONTEND_URL=http://localhost:3000
UPLOAD_DIR=./uploads

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_password_de_aplicacao
EMAIL_FROM=ULEZI XPB <noreply@ulezi.com>

WHATSAPP_API_URL=
WHATSAPP_API_KEY=
```

## Execucao em desenvolvimento

### Backend

```bash
cd backend
npm run dev
```

API local:

- `http://localhost:5000`

### Frontend

```bash
cd frontend
npm run dev
```

O frontend esta configurado em [vite.config.js](C:\projetos\ulezi-xpb-v2\ulezi-xpb\frontend\vite.config.js) para subir em:

- `http://localhost:3000`

## Build e validacao

### Testes do backend

```bash
cd backend
npm test
```

Actualmente os testes cobrem:

- health check
- resposta 404
- geracao de access token
- geracao de refresh token
- rejeicao de refresh token como access token

### Build do frontend

```bash
cd frontend
npm run build
```

## Credenciais demo do seed

Conforme `database/seed.sql`, os utilizadores iniciais incluem:

- Administrador: `admin@ulezixpb.com`
- Funcionario: `funcionario@ulezixpb.com`
- Estudante: `joao@demo.com`
- Investidora: `maria@demo.com`
- Empresa: `techcorp@demo.com`

Senha demo definida no seed para as contas iniciais:

- `Admin@123456`

Antes de usar em ambiente real:

- altere todas as credenciais iniciais
- configure SMTP real
- configure integracao real de WhatsApp, se necessario

## Modulos do sistema

### Cursos

- listagem de cursos
- inscricao em curso
- criacao automatica de pagamento pendente
- envio de comprovativo
- validacao administrativa
- historico do estudante

### Negocios

- registo e actualizacao de perfil empresarial
- upload de documentos
- aprovacao de empresa
- assinatura empresarial
- publicacao de oportunidades
- interesse de investidores
- contratos

### Comunidade

- perfis publicos
- filtro por papel
- servicos por categoria
- contacto por email e WhatsApp
- vagas publicas

### Painel administrativo

- dashboard
- utilizadores
- empresas
- cursos
- pagamentos
- contratos
- vagas
- notificacoes
- auditoria
- configuracoes

## Endpoints principais

### Autenticacao

- `POST /api/auth/registar`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/esqueci-password`
- `POST /api/auth/nova-password/:token`
- `PUT /api/auth/perfil`
- `PUT /api/auth/password`

### Cursos e inscricoes

- `GET /api/cursos`
- `GET /api/cursos/:id`
- `GET /api/cursos/:id/centros`
- `POST /api/inscricoes`
- `GET /api/inscricoes/minhas`
- `DELETE /api/inscricoes/:id`
- `POST /api/inscricoes/:id/avaliar`

### Pagamentos

- `GET /api/pagamentos/meus`
- `POST /api/pagamentos/comprovativo`
- `GET /api/pagamentos/:id/comprovativo`
- `GET /api/pagamentos/admin`
- `PUT /api/pagamentos/admin/:id/validar`

### Negocios

- `GET /api/oportunidades`
- `POST /api/oportunidades`
- `POST /api/oportunidades/:id/interesse`
- `POST /api/empresas`
- `GET /api/empresa/perfil`
- `POST /api/empresa/documentos`
- `GET /api/investidor/interesses`
- `GET /api/investidor/contratos`

### Comunidade

- `GET /api/comunidade/perfis`
- `GET /api/comunidade/servicos`
- `GET /api/comunidade/servicos/categorias`
- `GET /api/vagas-empresa`
- `GET /api/vagas-empresa/:id`

### Administracao

- `GET /api/admin/stats`
- `GET /api/admin/utilizadores`
- `PUT /api/admin/utilizadores/:id/status`
- `GET /api/admin/empresas`
- `PUT /api/admin/empresas/:id/aprovar`
- `PUT /api/admin/empresas/:id/rejeitar`
- `POST /api/admin/empresas/:id/assinatura`
- `GET /api/admin/cursos`
- `POST /api/admin/cursos`
- `PUT /api/admin/cursos/:id`
- `GET /api/admin/pagamentos`
- `PUT /api/admin/pagamentos/:id/confirmar`
- `GET /api/admin/contratos`
- `GET /api/admin/notificacoes`
- `PUT /api/admin/notificacoes/:id/lida`
- `PUT /api/admin/notificacoes/marcar-todas`
- `GET /api/admin/auditoria`
- `GET /api/admin/configuracoes`
- `PUT /api/admin/configuracoes`

## Base de dados

O projecto usa uma base MySQL com 26+ tabelas, incluindo:

- `users`
- `student_profiles`
- `company_profiles`
- `investor_profiles`
- `courses`
- `training_centers`
- `center_courses`
- `enrollments`
- `payments`
- `receipts`
- `company_documents`
- `subscriptions`
- `investment_opportunities`
- `investor_interests`
- `contracts`
- `service_categories`
- `company_services`
- `job_postings`
- `company_job_postings`
- `notifications`
- `audit_logs`
- `system_settings`

## Seguranca

O sistema ja aplica:

- JWT com refresh token
- hash de senha com bcrypt
- helmet
- cors
- rate limiting
- validacao com Joi
- RBAC por papel
- uploads com restricoes de extensao e tamanho
- logs de auditoria

## Docker e scripts

O repositorio contem:

- `docker-compose.yml`
- `instalar.sh`
- `instalar.bat`

Esses artefactos existem no projecto, mas devem ser validados no ambiente alvo antes de uso em producao.

## Documentacao complementar

- [docs/AUDITORIA_SISTEMA.md](docs/AUDITORIA_SISTEMA.md)
- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)
- [docs/ENTREGA_FINAL.md](docs/ENTREGA_FINAL.md)
- [docs/TESTES_VALIDACAO.md](docs/TESTES_VALIDACAO.md)

## Observacao importante

Este `README` foi alinhado com o estado actual do codigo no repositorio.

Ele nao descreve microservicos, Kubernetes, Redis, Next.js ou 80+ tabelas porque isso nao corresponde ao projecto actual entregue nesta base.
