# 📋 Guia de Acesso - Módulo de Formação Profissional

## 🚀 **Acesso Rápido**

### **Frontend (Interface Administrativa)**
- **URL:** http://localhost:3002/
- **Login:** Use credenciais de administrador
- **Menu:** Painel → GESTÃO → Centros / Ofertas

### **Backend (API)**
- **URL:** http://localhost:5000/
- **Status:** ✅ Online e funcional

---

## 🎯 **Como Acessar as Novas Funcionalidades**

### **1. Acessar o Painel Administrativo**

1. Abra o navegador em: http://localhost:3002/
2. Faça login com credenciais de administrador/funcionário
3. No menu lateral, clique em **"GESTÃO"**

### **2. Gestão de Centros de Formação**

**Rota:** Menu → GESTÃO → **Centros**

**Funcionalidades Disponíveis:**
- ✅ **Listar todos os centros** com filtros avançados
- ✅ **Criar novo centro** (botão "Novo Centro")
- ✅ **Editar centro existente** (ícone de editar)
- ✅ **Associar cursos** (botão "Cursos")
- ✅ **Criar ofertas** (botão "Oferta")
- ✅ **Excluir centro** (ícone de lixeira)

**Filtros Disponíveis:**
- 🔍 Busca textual
- 📍 Província
- 🏙️ Município
- 📊 Status (Ativo/Inativo)

### **3. Gestão de Ofertas de Cursos**

**Rota:** Menu → GESTÃO → **Ofertas**

**Funcionalidades Disponíveis:**
- ✅ **Dashboard com estatísticas** em tempo real
- ✅ **Listar todas as ofertas** com informações detalhadas
- ✅ **Criar nova oferta** (botão "Nova Oferta")
- ✅ **Editar oferta existente** (ícone de editar)
- ✅ **Desativar oferta** (ícone de lixeira)

**Estatísticas do Dashboard:**
- 📊 Total de ofertas
- ✅ Ofertas ativas
- 💰 Preço médio
- 👥 Total de inscrições

**Filtros Avançados:**
- 🔍 Busca textual
- 🏢 Centro específico
- 📚 Curso específico
- 💰 Faixa de preço (mín/máx)
- 📊 Status da oferta

---

## 🔄 **Fluxo de Trabalho Recomendado**

### **Passo 1: Cadastrar Centro**
1. Acesse: GESTÃO → Centros
2. Clique em "Novo Centro"
3. Preencha dados básicos:
   - Nome do centro
   - Província e município
   - Contatos (email, telefone, WhatsApp)
   - Endereço e descrição
4. Salve o centro

### **Passo 2: Associar Cursos**
1. Na lista de centros, clique em "Cursos"
2. Selecione os cursos que este centro oferecerá
3. Clique em "Associar X cursos"

### **Passo 3: Criar Ofertas**
1. Na lista de centros, clique em "Oferta"
2. Ou acesse diretamente: GESTÃO → Ofertas
3. Para cada curso associado:
   - Defina o preço em Kz
   - Informe a carga horária
   - Marque se exige certificado
   - Adicione especificações detalhadas
4. Salve a oferta

### **Passo 4: Gerenciar Ofertas**
1. Acesse: GESTÃO → Ofertas
2. Visualize o dashboard com métricas
3. Use filtros para encontrar ofertas específicas
4. Edite ou desative conforme necessário

---

## 🎨 **Características da Interface**

### **Design Responsivo**
- 📱 **Mobile:** Layout adaptado para telas pequenas
- 💻 **Desktop:** Interface completa com todas as funcionalidades
- 📊 **Tablets:** Layout otimizado para tablets

### **Cores e Identidade**
- 🔵 **Azul ULEZI:** Cor primária da marca
- 🟢 **Verde:** Indicações de sucesso/ativo
- 🔴 **Vermelho:** Alertas e ações de exclusão
- ⚪ **Branco/Cinza:** Fundos e textos

### **Componentes Visuais**
- 🎯 **Cards:** Informações organizadas visualmente
- 📋 **Tabelas:** Dados tabulares responsivos
- 🔄 **Modais:** Diálogos sobrepostos
- 🏷️ **Badges:** Indicadores de status
- 🔔 **Notificações:** Feedback em tempo real

---

## 🛠️ **Recursos Técnicos**

### **Sistema de Notificações**
- ✅ **Toast personalizado** (não usa react-toastify)
- ✅ **Feedback visual** para todas as ações
- ✅ **Mensagens em português**
- ✅ **Duração automática** (4s sucesso, 6s erro)

### **Validações**
- ✅ **Frontend:** Validação em tempo real
- ✅ **Backend:** Validação robusta no servidor
- ✅ **Mensagens claras** de erro
- ✅ **Campos obrigatórios** destacados

### **Performance**
- ⚡ **Debouncing** em filtros (500ms)
- 🔄 **Lazy loading** de dados
- 📊 **Paginação** eficiente
- 🎯 **Memoização** de cálculos

---

## 📱 **Teste Rápido**

### **Teste 1: Criar Centro**
1. Menu → GESTÃO → Centros
2. "Novo Centro"
3. Preencha: "Centro de Teste", Luanda, Talatona
4. Salve ✅

### **Teste 2: Associar Curso**
1. Encontre o centro criado
2. Botão "Cursos"
3. Selecione algum curso disponível
4. "Associar" ✅

### **Teste 3: Criar Oferta**
1. Menu → GESTÃO → Ofertas
2. "Nova Oferta"
3. Selecione centro e curso
4. Preço: 50000, Carga: 120h
5. Salve ✅

---

## 🔧 **Solução de Problemas**

### **Erro Comum: "react-toastify não encontrado"**
✅ **Solução:** Foi removido e substituído pelo sistema próprio da ULEZI XPB

### **Erro Comum: "Porta em uso"**
✅ **Solução:** Sistema usa porta 3002 automaticamente

### **Erro Comum: "API não responde"**
✅ **Solução:** Verifique se backend está rodando em localhost:5000

### **Erro Comum: "Permissão negada"**
✅ **Solução:** Use credenciais de admin/funcionário

---

## 📞 **Suporte**

### **Endpoints API Disponíveis**
```bash
# Centros
GET    /api/admin/training-centers
POST   /api/admin/training-centers
PUT    /api/admin/training-centers/:id
DELETE /api/admin/training-centers/:id

# Ofertas
GET    /api/admin/training-offerings
POST   /api/admin/training-offerings
PUT    /api/admin/training-offerings/:id
DELETE /api/admin/training-offerings/:id
```

### **Logs do Sistema**
- **Frontend:** Console do navegador (F12)
- **Backend:** Terminal onde está rodando o servidor
- **Erros:** Mensagens detalhadas em português

---

**🎉 SISTEMA 100% FUNCIONAL!**

Acesse agora mesmo: http://localhost:3002/
Login → Menu → GESTÃO → Centros/Ofertas
