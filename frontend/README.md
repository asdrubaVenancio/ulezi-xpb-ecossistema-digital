# ULEZI XPI - Frontend

Aplicacao React do ecossistema ULEZI XPI.

Este frontend atende os fluxos publicos e autenticados para estudantes, empresas, investidores, funcionarios e administradores, consumindo a API do backend monolitico modular do projeto.

## Stack atual

- React 18
- Vite 5
- React Router DOM 6
- Axios
- React Hook Form
- Zod
- Lucide React
- CSS com variaveis globais
- TailwindCSS presente nas dependencias de build, mas a interface atual usa principalmente CSS proprio em [global.css](C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend\src\styles\global.css)

## Estado atual do frontend

O frontend ja cobre as principais areas do sistema:

- paginas publicas de apresentacao
- autenticacao e registo
- dashboards por perfil
- perfil do utilizador
- marketplace de cursos
- marketplace de negocios
- comunidade e servicos
- painel administrativo
- notificacoes administrativas
- temas claro e escuro

## Pre-requisitos

- Node.js 18 ou superior
- npm 9 ou superior
- backend disponivel em `http://localhost:5000`

## Instalacao

```powershell
cd C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend
copy .env.example .env
npm install
```

## Variaveis de ambiente

O ficheiro `.env` pode usar:

```env
VITE_API_URL=http://localhost:5000/api
```

O projeto tambem aceita prefixo legacy `REACT_APP_` porque o Vite esta configurado com ambos os prefixos em [vite.config.js](C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend\vite.config.js).

## Execucao local

```powershell
cd C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend
npm run dev
```

O Vite esta configurado para correr em:

- `http://localhost:3000`

## Build de producao

```powershell
cd C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend
npm run build
```

O output de build e gerado na pasta `frontend/build`.

## Estrutura principal

```text
frontend/
|-- src/
|   |-- App.jsx
|   |-- index.jsx
|   |-- components/
|   |   |-- layout/
|   |   `-- ui/
|   |-- context/
|   |-- hooks/
|   |-- pages/
|   |   |-- admin/
|   |   |-- aluno/
|   |   |-- auth/
|   |   |-- perfil/
|   |   `-- publico/
|   |-- routes/
|   |-- services/
|   |-- styles/
|   `-- utils/
|-- public/
|-- index.html
`-- vite.config.js
```

## Principais ficheiros

- [App.jsx](C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend\src\App.jsx): roteamento principal
- [AuthContext.jsx](C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend\src\context\AuthContext.jsx): sessao do utilizador e autenticacao
- [api.js](C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend\src\services\api.js): cliente Axios e modulos da API
- [DashboardAdmin.jsx](C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend\src\pages\admin\DashboardAdmin.jsx): painel administrativo
- [Dashboards.jsx](C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend\src\pages\aluno\Dashboards.jsx): dashboards por papel
- [Perfil.jsx](C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend\src\pages\perfil\Perfil.jsx): gestao de perfil
- [global.css](C:\projetos\ulezi-xpI-v2\ulezi-xpI\frontend\src\styles\global.css): design system e tema

## Contas demo

As credenciais iniciais sao carregadas por [seed.sql](C:\projetos\ulezi-xpI-v2\ulezi-xpI\database\seed.sql):

- Admin: `admin@ulezixpI.com`
- Funcionario: `funcionario@ulezixpI.com`
- Estudante: `joao@demo.com`
- Investidora: `maria@demo.com`
- Empresa: `techcorp@demo.com`

Senha definida no seed para as contas demo:

- `Admin@123456`

## Notas tecnicas importantes

- O tema claro/escuro fica guardado no `localStorage`
- O token JWT e renovado automaticamente com refresh token
- O comprovativo de pagamento exige ficheiro e dados bancarios basicos
- O frontend foi alinhado para trabalhar com os papeis reais do backend: `student`, `company`, `investor`, `employee` e `admin`

## Observacao importante

Este `README` foi revisto para refletir o estado atual do frontend no repositorio.

Ele substitui a documentacao antiga que estava com texto corrompido e referencias desatualizadas de caminho, portas e credenciais.
