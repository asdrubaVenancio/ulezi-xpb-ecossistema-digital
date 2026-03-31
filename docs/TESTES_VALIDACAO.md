# Testes e Validação do Sistema ULEZI XPB

## Objectivo

Este documento descreve os testes actualmente disponíveis e o procedimento recomendado para validação funcional do sistema.

## Testes automatizados disponíveis

### Backend

Comando:

```bash
cd backend
npm test
```

Cobertura actual:

- resposta do endpoint `/health`
- resposta `404` em rota inexistente
- geração de access token
- geração de refresh token
- rejeição de refresh token como access token

## Build do frontend

Comando:

```bash
cd frontend
npm run build
```

Este processo valida:

- integridade do código React
- importações
- bundling de produção
- erros de sintaxe e acoplamento visível na interface

## Validação manual recomendada

### Fluxo do estudante

1. Criar conta como estudante
2. Fazer login
3. Inscrever-se num curso
4. Confirmar criação da inscrição
5. Enviar comprovativo
6. Validar o pagamento no painel admin
7. Confirmar actualização do estado da inscrição

### Fluxo da empresa

1. Criar conta como empresa
2. Preencher perfil empresarial
3. Enviar documentos
4. Aprovar empresa no painel admin
5. Criar assinatura
6. Publicar oportunidade
7. Publicar vaga

### Fluxo do investidor

1. Criar conta como investidor
2. Fazer login
3. Consultar oportunidades
4. Demonstrar interesse
5. Validar visualização no dashboard do investidor
6. Gerar contrato no painel admin

### Fluxo da comunidade

1. Abrir comunidade pública
2. Filtrar perfis
3. Filtrar serviços
4. Consultar vagas públicas
5. Testar redireccionamento para contacto externo

## Critérios mínimos de aceite

O sistema é considerado funcional quando:

- o backend inicia sem erro
- o frontend compila sem erro
- o login funciona por papel
- o painel admin responde
- o estudante consegue concluir o fluxo de inscrição e comprovativo
- a empresa consegue submeter documentos e oportunidades
- o investidor consegue demonstrar interesse
- as rotas protegidas respeitam papéis e permissões

## Próximos testes recomendados

Para elevar a maturidade técnica, recomenda-se acrescentar:

- testes de autenticação por rota protegida
- testes de inscrição e pagamento
- testes de aprovação de empresa
- testes de criação de oportunidade
- testes de validação de uploads
- testes de contratos

## Observação final

Os testes actuais já criam uma base útil de segurança para evolução contínua, mas não substituem homologação funcional com dados reais e supervisão operacional antes de produção.
