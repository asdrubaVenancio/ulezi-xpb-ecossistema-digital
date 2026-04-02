# Sistema de Assinaturas - Documentação

## Visão Geral

O sistema de assinaturas foi implementado para controlar o acesso das empresas às funcionalidades da plataforma ULEZI XPB. Empresas sem assinatura ativa podem apenas atualizar seu perfil.

## Arquitetura

### Backend

#### Middleware de Assinatura
- **Arquivo**: `backend/src/middlewares/subscription.middleware.js`
- **Funções**:
  - `requireActiveSubscription`: Bloqueia acesso se empresa não tem assinatura ativa
  - `requirePrivilege`: Verifica privilégios específicos (oportunidades, vagas, consultorias)
  - `optionalSubscription`: Adiciona dados da assinatura sem bloquear

#### Controllers

1. **Subscription Package Controller** (`backend/src/controllers/subscription-package.controller.js`)
   - `listPackages`: Lista todos os pacotes (admin)
   - `getPackage`: Detalhes de um pacote
   - `createPackage`: Cria novo pacote (funcionário cria como pendente)
   - `updatePackage`: Atualiza pacote
   - `approvePackage`: Aprova/rejeita pacote (apenas admin)
   - `deletePackage`: Remove pacote
   - `listActivePackages`: Lista pacotes ativos (para empresas)

2. **Company Subscription Controller** (`backend/src/controllers/company-subscription.controller.js`)
   - `getMySubscription`: Retorna assinatura atual da empresa
   - `subscribe`: Cria nova assinatura (pendente de pagamento)
   - `renewSubscription`: Renova assinatura existente
   - `getSubscriptionHistory`: Histórico de assinaturas

3. **Subscription Notification Controller** (`backend/src/controllers/subscription-notification.controller.js`)
   - Notificações de vencimento (30, 15, 7, 3, 1 dias e vencida)
   - Renovação automática
   - Estatísticas de notificações

#### Rotas (`backend/src/routes/business.routes.js`)

```javascript
// Rotas protegidas (requerem assinatura ativa)
router.get('/empresa/stats', requireActiveSubscription, ...)
router.get('/empresa/oportunidades', requireActiveSubscription, ...)

// Rotas públicas (funcionam sem assinatura)
router.get('/empresa/perfil', ...)
router.get('/empresa/documentos', ...)
router.post('/empresa/documentos', ...)

// Rotas de assinatura
router.get('/empresa/minha-assinatura', ...)
router.get('/subscription-packages', ...)
router.post('/empresa/assinar', ...)
router.post('/empresa/renovar', ...)

// Admin - Gestão de pacotes
router.get('/admin/subscription-packages', ...)
router.post('/admin/subscription-packages', ...)
router.put('/admin/subscription-packages/:id/approve', authorize('admin'), ...)
```

### Frontend

#### Página de Assinatura
- **Arquivo**: `frontend/src/pages/empresa/Assinatura.jsx`
- **CSS**: `frontend/src/pages/empresa/Assinatura.css`
- **Rota**: `/empresa/assinatura`

Funcionalidades:
- Visualiza planos disponíveis
- Mostra assinatura atual (se existir)
- Solicita nova assinatura
- Renova assinatura (quando próximo do vencimento)
- Mostra uso atual dos privilégios

#### API Service
```javascript
// Adicionado a empresaAPI
minhaAssinatura: () => api.get('/empresa/minha-assinatura')
pacotesAssinatura: () => api.get('/subscription-packages')
assinar: (d) => api.post('/empresa/assinar', d)
renovarAssinatura: () => api.post('/empresa/renovar')
```

## Banco de Dados

### Tabela `subscription_packages`
```sql
- id, slug, nome, descricao, preco, moeda
- duracao_dias, duracao_meses
- consultorias_incluidas
- max_oportunidades_ativas, publicacoes_oportunidades_ilimitadas
- max_vagas_ativas, publicacoes_vagas_ilimitadas
- suporte_prioritario, beneficios (JSON)
- is_active, status (ativo/inativo/pendente/rejeitado)
- created_by, approved_by, approved_at, motivo_rejeicao
```

### Tabela `subscriptions`
```sql
- company_id, user_id, package_id, tipo_plano
- data_inicio, data_fim, status
- valor, valor_pago, moeda
- metodo_pagamento, referencia_pagamento, pagamento_status
- comprovante_url, auto_renovar, is_renewal, renovada_de
```

## Fluxo de Funcionamento

### 1. Criação de Pacotes

**Admin cria pacote:**
```
POST /api/admin/subscription-packages
→ Status: ativo (direto, sem aprovação)
```

**Funcionário cria pacote:**
```
POST /api/admin/subscription-packages
→ Status: pendente
→ Notificação enviada para admins
```

**Admin aprova pacote:**
```
PUT /api/admin/subscription-packages/:id/approve
{ "aprovado": true }
→ Status: ativo
→ Notificação enviada para criador
```

### 2. Empresa Assina Plano

```
1. GET /api/subscription-packages
   → Lista planos disponíveis

2. POST /api/empresa/assinar
   { "package_id": 1 }
   → Cria assinatura com status "pendente"
   → Gera referência de pagamento
   → Notifica admins

3. Admin confirma pagamento (manual ou integração)
   → Atualiza pagamento_status para "confirmado"
   → Atualiza status da assinatura para "ativa"
```

### 3. Verificação de Acesso

```javascript
// Middleware bloqueia acesso se:
// - Empresa não tem assinatura ativa
// - Assinatura venceu (data_fim < hoje)
// - Status não é "ativa"

// Retorna erro 403 com código SUBSCRIPTION_REQUIRED
// Redireciona para /assinatura/planos
```

### 4. Privilégios Verificados

```javascript
// requirePrivilege('oportunidades')
// - Verifica max_oportunidades_ativas
// - Ou publicacoes_oportunidades_ilimitadas

// requirePrivilege('vagas')
// - Conta vagas atuais aprovadas
// - Compara com max_vagas_ativas

// requirePrivilege('consultoria')
// - Conta consultorias no período da assinatura
// - Compara com consultorias_incluidas
```

## Scripts de Migração

1. **Limpar duplicatas de documentos**:
   ```bash
   mysql -u root -p ulezi_xpb < scripts/limpar-duplicatas-documentos.sql
   ```

2. **Migrar schema de assinaturas**:
   ```bash
   mysql -u root -p ulezi_xpb < scripts/migrate-subscription-system.sql
   ```

## Configuração Inicial

Após executar as migrações, crie pacotes iniciais:

```sql
INSERT INTO subscription_packages 
  (slug, nome, descricao, preco, duracao_dias, duracao_meses, 
   consultorias_incluidas, max_oportunidades_ativas, max_vagas_ativas,
   publicacoes_oportunidades_ilimitadas, publicacoes_vagas_ilimitadas,
   beneficios, status, ordem)
VALUES
  ('basico', 'Básico', 'Plano inicial para empresas', 50000, 30, 1,
   0, 3, 3, 0, 0, 
   '["Perfil público", "Até 3 oportunidades", "Até 3 vagas"]',
   'ativo', 1),
   
  ('profissional', 'Profissional', 'Para empresas em crescimento', 150000, 90, 3,
   2, 10, 10, 0, 0,
   '["Perfil público", "Até 10 oportunidades", "Até 10 vagas", "2 consultorias", "Suporte prioritário"]',
   'ativo', 2),
   
  ('empresarial', 'Empresarial', 'Solução completa', 500000, 365, 12,
   10, NULL, NULL, 1, 1,
   '["Perfil público", "Oportunidades ilimitadas", "Vagas ilimitadas", "10 consultorias", "Suporte prioritário"]',
   'ativo', 3);
```

## Testes

### Verificar sistema:
1. Criar pacote como funcionário → deve ficar pendente
2. Aprovar pacote como admin → deve ficar ativo
3. Empresa sem assinatura tenta acessar stats → deve receber 403
4. Empresa visualiza planos → deve ver apenas ativos
5. Empresa assina plano → cria assinatura pendente
6. Confirmar pagamento → assinatura ativa
7. Empresa acessa stats → deve funcionar
8. Criar mais vagas que o limite → deve receber 403

## Integração Pagamento

O sistema está preparado para integração com gateways de pagamento:

```javascript
// Exemplo de fluxo com Multicaixa Express
1. Empresa solicita assinatura
2. Sistema gera referência
3. Empresa paga via Multicaixa
4. Gateway confirma pagamento
5. Sistema atualiza pagamento_status = 'confirmado'
6. Assinatura ativada automaticamente
```

## Notificações Automáticas

Configure um cron job para verificar vencimentos:

```bash
# Executar diariamente às 9h
0 9 * * * curl -X POST https://api.ulezi.com/api/admin/subscription-notifications/check \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Endpoints disponíveis:
- `POST /api/admin/subscription-notifications/check` - Verifica vencimentos
- `POST /api/admin/subscription-notifications/auto-renew` - Processa renovações automáticas

## Próximos Passos Sugeridos

1. Integrar com gateway de pagamento (Multicaixa, Paypal, etc.)
2. Criar página admin para gerenciar pacotes
3. Adicionar relatórios de receita de assinaturas
4. Implementar trial gratuito (ex: 7 dias)
5. Criar sistema de cupons de desconto
6. Adicionar notificações WhatsApp
