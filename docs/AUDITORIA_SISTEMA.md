# ULEZI XPB - Auditoria Técnica do Sistema

## 1. Objectivo

Este documento resume a auditoria técnica realizada sobre o repositório actual do ULEZI XPB, comparando:

- o código realmente existente;
- os requisitos funcionais descritos pelo cliente;
- o contrato de desenvolvimento;
- a documentação e o histórico funcional do projecto.

## 2. Conclusão Executiva

O sistema não estava 100% alinhado com o escopo ambicioso descrito nos prompts e documentos de visão. Contudo, existe uma base funcional real e aproveitável.

O produto actual é melhor descrito como:

- plataforma web em monólito modular;
- backend em `Node.js + Express`;
- frontend em `React + Vite`;
- base de dados `MySQL`;
- cobertura funcional principal para Cursos, Negócios e Comunidade;
- painel administrativo operacional;
- mecanismos básicos e intermédios de segurança já implementados.

## 3. O Que Foi Confirmado Como Existente

### 3.1 Arquitectura

- Backend modular por domínio.
- Frontend separado do backend.
- API REST centralizada.
- Banco relacional com entidades principais do negócio.

### 3.2 Módulo de Cursos

- cadastro de cursos;
- cadastro de centros de formação;
- inscrição de estudantes;
- atribuição posterior de centro;
- registo de pagamentos;
- geração de recibo PDF;
- histórico do estudante;
- avaliação de cursos.

### 3.3 Módulo de Negócios

- perfil empresarial;
- upload de documentos;
- aprovação administrativa;
- assinatura empresarial;
- publicação de oportunidades;
- manifestação de interesse por investidores;
- geração de contrato PDF;
- assinatura digital básica no contrato.

### 3.4 Módulo de Comunidade

- listagem de perfis públicos;
- filtragem de serviços empresariais;
- contacto por email/WhatsApp;
- vagas de emprego com aprovação administrativa.

## 4. Principais Problemas Encontrados na Auditoria

### 4.1 Divergência entre documentação e realidade

- o repositório actual não é microserviços;
- não existem 80+ tabelas;
- não existe infraestrutura Kubernetes pronta;
- não há Redis nem NestJS implementados;
- parte da documentação vendia um escopo superior ao código entregue.

### 4.2 Inconsistências backend/frontend

- rotas de autenticação faltantes no backend;
- divergência de nomes de campos entre frontend e backend;
- papéis em inglês no backend e em português no frontend;
- conflito na ordem das rotas de vagas;
- fluxo de pagamentos e comprovativos desalinhado.

### 4.3 Problemas funcionais

- o painel do aluno assumia `pagamento_id` antes do backend prepará-lo correctamente;
- o upload de comprovativo usava um fluxo incompatível com a estrutura real de pagamentos;
- o modo escuro ainda mantinha alguns elementos com fundo branco fixo;
- partes do perfil de empresa e investidor não persistiam de forma coerente.

## 5. Correcções Aplicadas Nesta Fase

### 5.1 Autenticação

Foram implementados ou corrigidos:

- `logout`;
- `refresh token`;
- recuperação de palavra-passe;
- redefinição de palavra-passe;
- compatibilidade dos campos de alteração de senha;
- melhoria da coerência entre resposta do backend e consumo do frontend.

### 5.2 Vagas de emprego

Foram corrigidos:

- conflito entre rotas públicas, privadas e administrativas;
- validação defensiva de identificadores;
- paginação mais segura;
- estabilidade do endpoint público de vagas.

### 5.3 Perfis e papéis

Foram alinhados:

- papéis `student/company/investor/employee` com os aliases em português;
- navegação por papel;
- tabs de perfil;
- labels e destinos de dashboard;
- contagens administrativas por papel.

### 5.4 Pagamentos

O fluxo foi reorganizado para ficar coerente:

- a inscrição cria automaticamente um pagamento pendente;
- o dashboard do aluno passa a receber `pagamento_id`;
- o envio de comprovativo actualiza o pagamento existente;
- a validação administrativa actua sobre o mesmo registo;
- as listagens de inscrição ficaram mais compatíveis com o frontend.

### 5.5 Modo escuro

Foram removidos os principais pontos de fundo branco hardcoded em componentes interactivos, melhorando a consistência visual do dark mode.

## 6. Estado Actual dos Requisitos

### 6.1 Requisitos atendidos parcialmente

- ecossistema digital com 3 módulos;
- perfis de estudante, empresa, investidor, administrador e funcionário;
- site público e painel administrativo;
- React no frontend;
- Node.js + Express no backend;
- MySQL como base de dados;
- autenticação JWT;
- validação de inputs;
- Helmet, CORS e rate limiting;
- PDFs de recibo e contrato;
- documentação técnica base.

### 6.2 Requisitos ainda não atendidos

- microserviços reais;
- API Gateway real;
- Event Driven Architecture real;
- Redis;
- NestJS para serviços críticos;
- Next.js;
- 80+ tabelas;
- diagrama ER completo entregue no repositório;
- wireframes completos de todas as páginas;
- diagrama UML completo;
- Kubernetes pronto para produção;
- pipeline CI/CD completo e funcional;
- plano real de deploy AWS/VPS documentado ao nível esperado;
- cobertura de testes automatizados robusta.

## 7. Recomendação Técnica

Mantendo a arquitectura actual de monólito modular, o caminho mais saudável é:

1. consolidar todos os fluxos críticos dentro do monólito;
2. estabilizar banco de dados, contratos de API e documentação;
3. expandir o schema e a cobertura funcional que ainda falta;
4. só depois avaliar extração gradual de módulos para serviços independentes, se o crescimento do negócio justificar.

## 8. Próximas Fases Recomendadas

- consolidar o schema e corrigir colunas inconsistentes entre código e banco;
- ampliar a documentação funcional e técnica por módulo;
- introduzir testes automatizados para fluxos críticos;
- reforçar observabilidade e logging;
- preparar deploy profissional do monólito modular;
- expandir o modelo de dados para cobrir requisitos ainda não implementados.
