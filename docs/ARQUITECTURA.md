# ULEZI XPI — Documentação Técnica de Arquitectura

## 1. Visão Geral da Arquitectura

O sistema ULEZI XPI segue uma arquitectura **Cliente-Servidor Monolítica Modular** (Monolith Modular), onde o backend é organizado por domínio funcional mas permanece numa única aplicação. Esta escolha garante simplicidade operacional mantendo modularidade e escalabilidade interna.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                    │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │   Website Público │    │   Painel Administrativo  │   │
│  │   React + Vite   │    │     React + Vite         │   │
│  └────────┬─────────┘    └──────────┬───────────────┘   │
└───────────┼──────────────────────────┼───────────────────┘
            │ HTTPS / REST API         │
            ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                     │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth   │  │ Courses │  │ Business │  │Community │  │
│  │ Module  │  │ Module  │  │  Module  │  │  Module  │  │
│  └────┬────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  │
│       │            │            │              │         │
│  ┌────▼────────────▼────────────▼──────────────▼─────┐  │
│  │              Service Layer (comum)                  │  │
│  │  PDF Service | Email Service | Notification Service│  │
│  └────────────────────────────┬───────────────────────┘  │
└───────────────────────────────┼─────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────┐
│                   BASE DE DADOS (MySQL)                  │
│    users | courses | enrollments | companies | ...       │
└─────────────────────────────────────────────────────────┘
```

## 2. Padrão MVC + Service Layer

Cada módulo segue o padrão:

```
Controller (HTTP) → Service (Lógica) → Model (BD) → Response
```

### Responsabilidades

| Camada | Responsabilidade |
|--------|----------------|
| **Controller** | Receber pedido HTTP, validar autenticação, chamar service, retornar resposta |
| **Service** | Lógica de negócio, orquestração, regras complexas |
| **Model** | Queries SQL directas (sem ORM, para máximo controlo e performance) |
| **Middleware** | Auth JWT, Rate Limiting, Upload, Erros |
| **Validation** | Schemas Joi para validação de inputs |

## 3. Fluxo de Autenticação JWT

```
1. POST /api/auth/login
   → Valida email/password
   → Gera access_token (24h) + refresh_token (7d)
   → Retorna ambos ao cliente

2. Pedidos autenticados
   → Authorization: Bearer <access_token>
   → Middleware auth.middleware.js valida e decodifica
   → req.user = { id, role, email }

3. Token expirado (401)
   → Frontend interceptor (Axios) detecta
   → Chama POST /api/auth/refresh com refresh_token
   → Recebe novo access_token
   → Repete pedido original

4. Refresh expirado
   → Limpa localStorage
   → Emite evento 'ulezi:sessao-expirada'
   → Redireciona para login
```

## 4. Estrutura de Resposta API

Todas as respostas seguem o mesmo formato:

```json
// Sucesso
{
  "sucesso": true,
  "mensagem": "Operação realizada com sucesso.",
  "dados": { ... }
}

// Erro
{
  "sucesso": false,
  "mensagem": "Descrição do erro.",
  "erros": ["campo1 inválido", "campo2 obrigatório"]
}
```

## 5. Módulos do Backend

### auth-module
- Registo com validação de email único
- Login com bcrypt comparison
- JWT access + refresh tokens
- Recuperação de password por email
- Alteração de perfil e password

### course-module
- CRUD de cursos (admin)
- Listagem pública com filtros
- CRUD de centros de formação (admin)
- Atribuição de cursos a centros
- Filtragem por proximidade geográfica

### enrollment-module
- Criação de inscrição
- Pagamento por comprovativo (upload)
- Confirmação de pagamento (admin)
- Geração de recibo PDF
- Envio por email/WhatsApp
- Cancelamento de inscrição

### business-module
- Registo de empresa
- Upload de documentos
- Aprovação/rejeição (admin)
- Gestão de assinatura
- Publicação de oportunidades de investimento
- Registo de interesse de investidor
- Geração de contrato PDF
- Assinatura digital

### community-module
- Listagem de perfis públicos
- Filtro por papel (empresa/investidor/estudante)
- Pesquisa de empresas por serviço
- Vagas de emprego públicas (aprovadas)

### jobs-module (NOVO)
- Submissão de vagas por empresas
- Fluxo de aprovação administrativa
- Notificação de empresa após decisão
- Vagas públicas apenas após aprovação

### admin-module
- Dashboard com estatísticas em tempo real
- Gestão completa de utilizadores
- Aprovação de empresas
- Gestão de cursos e centros
- Confirmação de pagamentos
- Gestão de contratos
- Aprovação de vagas de empresas
- Configurações do sistema
- Logs de auditoria

### notification-module
- Notificações em tempo real no painel
- Criação automática em eventos chave
- Marcação como lida

## 6. Segurança — OWASP Top 10

| Vulnerabilidade | Mitigação no ULEZI XPI |
|----------------|------------------------|
| A01 Broken Access Control | RBAC por papel, middleware authorize() |
| A02 Cryptographic Failures | bcrypt rounds=12, HTTPS obrigatório em produção |
| A03 Injection | Prepared statements MySQL2, validação Joi |
| A04 Insecure Design | Rate limiting, audit logs, documentos obrigatórios |
| A05 Security Misconfiguration | Helmet.js, CORS restrito, NODE_ENV |
| A06 Vulnerable Components | npm audit, dependências actualizadas |
| A07 Auth Failures | JWT expiration, rate limit no login, refresh rotation |
| A08 Software Integrity | Sem eval(), sem deserialização insegura |
| A09 Logging & Monitoring | audit_logs em BD, morgan em desenvolvimento |
| A10 SSRF | Sem pedidos HTTP do servidor para URLs externas |

## 7. Base de Dados — Convenções

- Todas as tabelas têm `created_at` com `DEFAULT CURRENT_TIMESTAMP`
- Tabelas com actualizações têm `updated_at` com `ON UPDATE CURRENT_TIMESTAMP`
- IDs são `INT UNSIGNED AUTO_INCREMENT`
- Foreign keys com `ON DELETE CASCADE` ou `ON DELETE SET NULL` conforme regra de negócio
- Índices em campos de pesquisa frequente (email, role, status, etc.)
- Charset `utf8mb4` para suporte completo a caracteres especiais

## 8. Uploads de Ficheiros

```
uploads/
├── documents/          # Documentos de empresa
│   ├── alvara_*.pdf
│   ├── nif_*.pdf
│   └── ...
├── comprovatives/      # Comprovativos de pagamento
├── contracts/          # Contratos PDF gerados
└── receipts/           # Recibos PDF gerados
```

Regras de upload:
- Tamanho máximo: 10MB
- Tipos permitidos: PDF, JPG, PNG
- Nomes sanitizados com UUID + timestamp
- Servidos via rota estática `/uploads/`

## 9. Variáveis de Ambiente — Segurança

**NUNCA** commitar o ficheiro `.env` para o repositório Git.

Adicionar ao `.gitignore`:
```
backend/.env
frontend/.env
backend/uploads/
*.log
```
