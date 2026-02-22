# PROCEDIMENTO — Como Desenvolver um Projeto

> Este arquivo descreve o passo a passo completo para desenvolver um projeto SaaS
> do zero até a produção usando os agentes e os documentos deste guia.

---

## Visão Geral do Processo

```
FASE 1 — Preparação
  Criar o CONTEXT.md do projeto

FASE 2 — Decisões de Stack
  Responder as decisões de stack da Parte 2 do ai-dev-guide

FASE 3 — Desenvolvimento
  Usar os 4 agentes em sequência por feature

FASE 4 — Produção
  Deploy e monitoramento

FASE 5 — Iteração
  Evoluir o sistema baseado em uso real
```

---

## FASE 1 — Preparação

### Passo 1.1 — Criar o CONTEXT.md do projeto

Abra uma sessão nova com a IA e faça:

```
1. Cole o ai-dev-guide.md
2. Diga: "Vamos iniciar um novo projeto.
          Me faça as perguntas para criar o CONTEXT.md"
3. Responda as perguntas da IA
4. A IA vai gerar o CONTEXT.md completo
5. Salve o arquivo na raiz do projeto
```

O CONTEXT.md vai conter:

```
→ Nome e descrição do projeto
→ Stack escolhida (auth, banco, billing, storage, etc.)
→ Perfis do sistema (system, seller, admin, user)
→ Decisões tomadas
→ O que já está implementado (vazio no início)
→ Armadilhas conhecidas do projeto
```

### Passo 1.2 — Salvar os arquivos do guia no projeto

Crie uma pasta `/docs` na raiz do projeto e salve:

```
seu-projeto/
├── docs/
│   ├── ai-dev-guide.md          → guia principal
│   ├── agent-1-arquiteto.md     → agente arquiteto
│   ├── agent-2-backend.md       → agente backend
│   ├── agent-3-frontend.md      → agente frontend
│   ├── agent-4-qualidade.md     → agente qualidade
│   ├── security.md              → referência de segurança
│   └── context-template.md      → template do CONTEXT.md
├── CONTEXT.md                   → contexto do projeto (raiz)
├── src/
│   └── tests/
│       ├── fixtures.ts          → dados de teste padronizados
│       └── helpers.ts           → funções reutilizáveis
└── ...
```

---

## FASE 2 — Decisões de Stack

> **Validade:** Ao responder o checklist, registre no CONTEXT.md:
> - Última revisão: [data de hoje]
> - Válida até: [data de hoje + 3 meses]
>
> A IA vai avisar quando a validade vencer e precisar de revisão.

### Passo 2.1 — Responder o checklist de stack

Abra uma sessão nova com a IA e faça:

```
1. Cole o ai-dev-guide.md
2. Cole o CONTEXT.md atual
3. Diga: "Vamos responder as decisões de stack
          da Parte 2 para este projeto"
4. Responda cada pergunta com a IA
5. A IA registra as decisões no CONTEXT.md
6. Salve o CONTEXT.md atualizado
```

Decisões que você vai tomar:

```
→ Auth: Supabase Auth ou Clerk?
→ Banco: Supabase ou outro?
→ Billing: tem cobrança? qual modelo?
→ Storage: tem upload? precisa transformar imagens?
→ Notificações: só e-mail ou multi-canal?
→ Deploy: Vercel, Coolify ou Railway?
→ Logs: Vercel Logs, Axiom ou GlitchTip?
→ i18n: quais idiomas além de PT-BR e EN?
→ LGPD: dados sensíveis?
→ SEO: tem blog ou conteúdo público?
→ Landing: junto ou separada?
→ Acessibilidade: setor público?
→ MCP: quais liberar para este projeto?
```

---

## FASE 3 — Desenvolvimento de Features

### Como desenvolver cada feature

Para cada nova funcionalidade do sistema, siga esta sequência:

---

### Etapa 3.1 — Agente Arquiteto

**Quando usar:** antes de qualquer código

**O que fazer:**

```
1. Abra uma sessão nova com a IA
2. Cole o agent-1-arquiteto.md
3. Cole o CONTEXT.md atualizado
4. Descreva a regra de negócio da feature
5. Responda as perguntas do Arquiteto
6. Valide o schema e a estrutura propostos
7. Salve o output do Arquiteto
   (copie e salve em um bloco de notas ou arquivo temp)
```

**Resultado esperado:**

```
→ Regra de negócio validada e refinada
→ Schema Drizzle completo
→ Estrutura de pastas definida
→ Decisões documentadas
→ Pontos de atenção identificados
```

---

### Etapa 3.2 — Agente Backend

**Quando usar:** após ter o output do Arquiteto

**O que fazer:**

```
1. Abra uma sessão nova com a IA
2. Cole o agent-2-backend.md
3. Cole o CONTEXT.md atualizado
4. Cole o output do Agente Arquiteto
5. Acompanhe o desenvolvimento
6. Aplique o código gerado no projeto
7. Salve o output do Backend
```

**Resultado esperado:**

```
→ Migration gerada e aplicada
→ types.ts criado
→ schemas.ts com validações em PT-BR
→ actions.ts com segurança completa
→ hooks/ com TanStack Query
```

---

### Etapa 3.3 — Agente Frontend

**Quando usar:** após ter o output do Backend

**O que fazer:**

```
1. Abra uma sessão nova com a IA
2. Cole o agent-3-frontend.md
3. Cole o CONTEXT.md atualizado
4. Cole o output do Agente Backend
5. Acompanhe o desenvolvimento
6. Aplique o código gerado no projeto
7. Salve o output do Frontend
```

**Resultado esperado:**

```
→ Componentes com 3 estados criados
→ Formulários integrados
→ Rota configurada no grupo correto
→ Menu atualizado
→ Feedback visual em toda ação
```

---

### Etapa 3.4 — Agente Qualidade e Segurança

**Quando usar:** após ter o output do Frontend

**O que fazer:**

```
1. Abra uma sessão nova com a IA
2. Cole o agent-4-qualidade.md
3. Cole o CONTEXT.md atualizado
4. Cole o output do Agente Frontend
5. Aguarde o relatório de segurança
6. Aplique as correções indicadas (se houver)
7. Confirme que todos os testes passam:
   npx vitest run
8. Pegue a seção atualizada do CONTEXT.md
9. Atualize o CONTEXT.md do projeto
```

**Resultado esperado:**

```
→ Relatório de segurança completo
→ Testes Vitest passando
→ Teste Playwright do fluxo principal
→ Checklist completo aprovado
→ CONTEXT.md atualizado
→ Feature aprovada para produção
```

---

### Quando usar agente único vs fluxo completo

```
Feature simples (CRUD básico, 1 tela):
  → Agente único com ai-dev-guide.md
  → Mais rápido, resultado suficiente

Feature complexa (múltiplos perfis,
integrações, regras elaboradas):
  → 4 agentes em sequência
  → Mais sólido e seguro
```

---

## FASE 4 — Produção

### Passo 4.1 — Checklist antes do primeiro deploy

```
□ Todas as variáveis de ambiente configuradas no Vercel/deploy
□ Nenhuma variável sensível com NEXT_PUBLIC_
□ RLS ativo em todas as tabelas no Supabase
□ Headers HTTP de segurança no next.config.js
□ Rate limiting nas rotas de login, cadastro e API
□ Sentry configurado e testado
□ HTTPS funcionando
□ Backup automático do Supabase (plano Pro)
□ npx vitest run — todos os testes passando
□ Teste de isolamento: usuário A não vê dados do usuário B
```

### Passo 4.2 — Primeiro deploy

```
1. Configurar variáveis de ambiente no painel do Vercel
2. Conectar repositório
3. Deploy automático via push na branch main
4. Testar em produção com dados reais mínimos
5. Verificar Sentry — nenhum erro novo
6. Verificar logs no Vercel — nenhuma anomalia
```

---

## FASE 5 — Iteração

### Como evoluir o sistema sem quebrar o que funciona

```
1. Identificar o que mudar
   → Sentry: onde o sistema quebra
   → Posthog/Umami: onde os usuários travam
   → Feedback direto dos usuários

2. Priorizar
   → Bug crítico → corrigir imediatamente
   → Melhoria → avaliar impacto vs esforço
   → Feature nova → validar se resolve problema real

3. Desenvolver
   → Seguir o mesmo fluxo de agentes
   → Feature flag para funcionalidades novas
   → Habilitar para 1 empresa primeiro

4. Validar
   → Testar com 1 empresa real antes de abrir para todos
   → Verificar Sentry após deploy
   → Confirmar que testes antigos continuam passando:
      npx vitest run

5. Abrir para todos
   → Remover feature flag quando validado
   → Atualizar CONTEXT.md
```

### Regras para não quebrar o que funciona

```
→ Nunca alterar coluna existente no banco sem migration
→ Nunca renomear coluna em produção sem deprecation
→ Sempre rodar npx vitest run antes de qualquer mudança
→ Sempre testar em staging antes de produção
→ Nunca fazer deploy de mudança grande sem feature flag
```

---

## Resumo do Fluxo Completo

```
PROJETO NOVO
    ↓
Fase 1 — Criar CONTEXT.md
    ↓
Fase 2 — Responder checklist de stack
    ↓
Para cada feature:
    ↓
  Agente 1 — Arquiteto
  (valida regra + define schema + estrutura)
    ↓
  Agente 2 — Backend
  (migration + types + schemas + actions + hooks)
    ↓
  Agente 3 — Frontend
  (componentes + rotas + menus)
    ↓
  Agente 4 — Qualidade
  (segurança + testes + checklist + CONTEXT.md)
    ↓
  Feature pronta
    ↓
(próxima feature)
    ↓
Fase 4 — Deploy em produção
    ↓
Fase 5 — Iterar baseado em uso real
```

---

## Dicas para manter a qualidade ao longo do tempo

```
→ Sempre atualizar o CONTEXT.md ao final de cada sessão
   Sem isso, a próxima sessão começa sem contexto

→ Nunca pular o Agente 4
   É ele que garante que nada inseguro vai para produção

→ Quanto mais clara a regra de negócio, melhor o código
   Invista tempo no Agente 1 — economiza no resto

→ Revisar o código gerado antes de aplicar
   A IA pode errar — você é o tech lead do projeto

→ Feature flag para tudo que é novo em produção
   Habilitar para 1 empresa, validar, depois abrir para todos
```

---

*Procedimento — Documento vivo. Atualizar conforme o processo evolui.*
