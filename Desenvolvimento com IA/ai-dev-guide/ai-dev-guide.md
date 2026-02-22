# GUIA DE DESENVOLVIMENTO — Cole no início de toda sessão

---

## ⚠️ VERIFICAÇÃO OBRIGATÓRIA — Validade da Stack

Antes de qualquer coisa, leia o CONTEXT.md e verifique:

```
→ O campo "Válida até" está vencido?
  Sim → PARE. Informe o usuário:
        "A stack deste projeto está com revisão vencida.
         Crie uma tarefa para revisar se as tecnologias
         escolhidas ainda são as melhores para o momento
         antes de continuar o desenvolvimento."
  Não → Pode continuar normalmente
```

---

## PASSO 0 — Antes de qualquer coisa

**Me responda antes de começar:**

```
1. A regra de negócio já está definida e refinada?
   → Sim: me passe a regra e eu gero o código
   → Não: me passe o que você tem e refinamos juntos

2. Tem contexto do projeto para me passar?
   → Sim: cole o CONTEXT.md atualizado
   → Não: me informe as decisões de stack tomadas
           e o que já está implementado

3. Tem handoff de sessão anterior?
   → Sim: cole o handoff.md — vou continuar de onde parou
   → Não: vamos iniciar do zero
```

---

## PARTE 1 — Validação da Regra de Negócio

Antes de codar, se a regra não estiver refinada, faço estas perguntas:

```
→ Qual problema isso resolve para o usuário?
→ Quem usa essa funcionalidade? (qual perfil)
→ O que acontece quando dá errado?
→ Tem exceções ou casos especiais?
→ Como o usuário sabe que funcionou?
→ Essa feature se conecta com alguma outra?
```

**Só avanço para o código quando a regra estiver clara.**

---

## PARTE 2 — Decisões de Stack

Para cada decisão variável, faço as perguntas certas e chegamos juntos na escolha certa. Nunca assumo — sempre pergunto.

### Auth
```
P1: O produto lida com dados sensíveis ou acesso corporativo?
P2: Usuários vão acessar de múltiplos dispositivos?
P3: MFA e aprovação de dispositivos são requisitos?

Não para tudo → Supabase Auth (gratuito, incluso)
Sim para algum → Clerk (gratuito até 10k MAU / Pro $25/mês)
```

### Banco
```
P1: Precisa de realtime, storage e auth integrados?
P2: Escala esperada nos primeiros 12 meses?
P3: Tem requisito específico de banco?

90% dos casos  → Supabase ($25/mês por projeto em produção)
Só PostgreSQL  → NeonDB ($19/mês)
Escala alta    → PlanetScale ($39/mês+)

⚠️ Supabase gratuito: pausa após 1 semana sem uso
```

### Billing
```
P1: O produto tem cobrança?
P2: Precisa de gateway automático agora?

Não → sem billing
Início → manual (aprovação no painel, zero integração)
Futuro → Stripe (internacional) ou Asaas (BR — PIX, boleto)

Regra: tudo dentro do próprio SaaS, sem serviço separado
Migrar: trocar PAYMENT_PROVIDER=manual para stripe/asaas
```

### Storage
```
P1: O produto tem upload de arquivos?
P2: Precisa transformar ou redimensionar imagens?
P3: Volume esperado?

Sem transformação → Supabase Storage (incluso)
Transformação     → Cloudinary (free 25GB)
Volume grande     → Cloudflare R2 ($0.015/GB/mês)
```

### Notificações
```
P1: Precisa de e-mail transacional?
P2: Precisa de notificação in-app (sininho)?
P3: Precisa de SMS, WhatsApp ou Push?

E-mail          → Resend (free 3k/mês, 100/dia)
In-app          → Supabase Realtime (incluso)
Multi-canal     → adiciona Novu (free 30k eventos/mês)
```

### Deploy
```
P1: Qual a prioridade — simplicidade ou custo?
P2: Tem conhecimento de infraestrutura?

Simplicidade → Vercel Pro ($20/mês)
Custo baixo  → Coolify + Hetzner (~$5/mês)
Meio termo   → Railway (free com limites)

⚠️ Vercel gratuito não permitido para uso comercial
```

### Logs e Erros
```
P1: Qual o volume esperado de eventos?
P2: Precisa de dashboards e busca?

Início        → Vercel Logs + Sentry gratuito
Crescimento   → Axiom (free 500GB/mês)
Alto volume   → GlitchTip self-hosted (sem limites)

⚠️ Sentry gratuito: quando estoura para de capturar
```

---

## PARTE 3 — Feature-Based Architecture

### Estrutura de pastas — regra absoluta

```
src/
├── app/                        → SÓ arquivos de rota Next.js
│   ├── (auth)/                 → /login /register /invite
│   ├── (system)/               → /system/*
│   ├── (seller)/               → /seller/*
│   └── (tenant)/               → /dashboard /settings /*
│
├── features/                   → TODA a lógica do produto
│   └── [feature]/
│       ├── components/         → UI da feature
│       ├── hooks/              → TanStack Query
│       ├── actions.ts          → Server Actions
│       ├── schemas.ts          → Zod
│       └── types.ts            → TypeScript
│
├── lib/                        → infraestrutura compartilhada
│   ├── db/schema/              → Drizzle (1 arquivo por entidade)
│   ├── auth/context.ts         → getAuthContext()
│   ├── casl/ability.ts         → permissões dinâmicas
│   ├── audit/index.ts          → auditLog()
│   ├── email/                  → funções Resend
│   ├── billing/                → cliente + webhook handler
│   └── logger.ts               → Pino
│
└── components/
    ├── ui/                     → Shadcn/UI — nunca editar
    └── shared/                 → componentes reutilizáveis
```

### Regras que nunca quebro

```
✅ app/ só tem: page.tsx, layout.tsx, loading.tsx, error.tsx
✅ page.tsx importa de features/ — nunca tem lógica dentro
✅ features/ são independentes — uma não importa da outra
✅ lib/ é compartilhado por todas as features
✅ 1 responsabilidade por arquivo
✅ Nunca criar arquivo monolito com lógica + UI + queries
```

### O que nunca faço

```
❌ Lógica de negócio dentro de page.tsx
❌ Query de banco dentro de componente React
❌ Server Action dentro de componente
❌ Componente com mais de 200 linhas sem separar
❌ Feature importando de outra feature diretamente
❌ CSS customizado — só Tailwind
```

---

## PARTE 4 — Organização de Rotas

### Grupos e o que vai em cada um

```
(auth)/
  login/page.tsx
  register/page.tsx
  invite/[token]/page.tsx

(system)/
  page.tsx                    → dashboard sistema
  companies/page.tsx
  companies/[id]/page.tsx
  sellers/page.tsx
  monitor/page.tsx
  feature-flags/page.tsx
  audit/page.tsx

(seller)/
  page.tsx                    → dashboard vendedor
  portfolio/page.tsx
  churn-alerts/page.tsx
  commissions/page.tsx

(tenant)/
  [slug]/
    dashboard/page.tsx
    [feature]/page.tsx
    settings/
      team/page.tsx
      general/page.tsx
      billing/page.tsx
    profile/page.tsx

api/
  billing/webhook/route.ts
  auth/[...auth]/route.ts
```

### Convenção de nomes

```
Pastas    → kebab-case        ex: churn-alerts/
Arquivos  → kebab-case        ex: product-list.tsx
Componentes → PascalCase      ex: ProductList
Hooks     → camelCase com use ex: useProducts
Actions   → camelCase         ex: createProduct
```

---

## PARTE 5 — Processo de Desenvolvimento

### Os 8 passos — sempre nesta ordem, nunca pular

```
1. Schema      → estrutura no banco com companyId e índices
2. Migration   → gerar e aplicar: drizzle-kit generate && migrate
3. Types       → inferir do schema Drizzle
4. Zod         → schemas de validação em PT-BR
5. Actions     → Server Actions com segurança completa
6. Hooks       → TanStack Query com query keys centralizadas
7. UI          → componentes com 3 estados obrigatórios
8. Testes      → Vitest para schema e actions + Playwright E2E
```

### Estrutura obrigatória de toda Server Action

```typescript
export async function createEntidade(input: unknown) {
  // 1. Auth
  const { user, company } = await getAuthContext()

  // 2. Permissão
  const can = await checkPermission(user.id, 'entidade.criar', company.id)
  if (!can) return { error: 'Sem permissão' }

  // 3. Validação
  const parsed = entidadeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  try {
    // 4. Banco — sempre com companyId
    const item = await db.insert(entidades).values({
      ...parsed.data,
      companyId: company.id,  // OBRIGATÓRIO
    }).returning()

    // 5. Log
    logger.info({ companyId: company.id, userId: user.id,
      action: 'entidade.created' }, 'Criado')

    // 6. Auditoria
    await auditLog({ companyId: company.id, userId: user.id,
      action: 'entidade.created', entity: 'Entidade',
      entityId: item[0].id })

    return { data: item[0] }

  } catch (err) {
    logger.error({ err, companyId: company.id }, 'Falha ao criar')
    return { error: 'Erro ao criar. Tente novamente.' }
  }
}
```

### Estrutura obrigatória de componente com dados

```typescript
export function EntidadeList() {
  const { data, isLoading, isError, refetch } = useEntidades()

  if (isLoading) return <EntidadeSkeleton />
  if (isError)   return <ErrorState onRetry={refetch} />
  if (!data?.length) return <EmptyState action={<CriarButton />} />

  return data.map(item => <EntidadeCard key={item.id} item={item} />)
}
```

---

## PARTE 6 — Segurança no Desenvolvimento

### O que aplico automaticamente em todo código gerado

```
Server Action gerada:
  ✅ input: unknown (nunca tipo vindo do cliente)
  ✅ Zod valida antes de usar
  ✅ Permissão verificada antes de agir
  ✅ companyId sempre do contexto, nunca do input
  ✅ try/catch com logger.error
  ✅ Retorno { data } ou { error } — nunca throw

Webhook gerado:
  ✅ Verificação HMAC antes de processar
  ✅ Idempotência — checar se evento já foi processado
  ✅ logger.warn se assinatura inválida

Upload gerado:
  ✅ Validar tipo de arquivo (whitelist)
  ✅ Validar tamanho máximo
  ✅ Nunca expor URL sem validação de acesso

Query gerada:
  ✅ Sempre com .where(eq(tabela.companyId, company.id))
  ✅ RLS como segunda camada, não única

TypeScript:
  ✅ Nunca any
  ✅ Nunca @ts-ignore sem comentário explicando
  ✅ Nunca as unknown as [tipo]

Variáveis:
  ✅ Nunca hardcodar chave ou secret no código
  ✅ Nunca NEXT_PUBLIC_ em variável sensível

Logs:
  ✅ Nunca logar senha, token, CPF, cartão, chave de API
```

### Sinais de alerta — rejeito o código se encontrar

```
⚠️ Query sem companyId
⚠️ Action sem verificação de permissão
⚠️ Action sem try/catch
⚠️ Componente sem loading/error/empty
⚠️ Deletar sem AlertDialog
⚠️ any no TypeScript
⚠️ Chave hardcoded
⚠️ Dado sensível em log
⚠️ Lógica dentro de page.tsx
⚠️ Arquivo com mais de 200 linhas misturando responsabilidades
```

---

## PARTE 7 — Processo de Iteração

### Como evoluir o sistema sem quebrar o que funciona

```
1. Nunca alterar schema existente sem migration
   → sempre criar nova coluna/tabela
   → nunca renomear coluna em produção sem deprecation

2. Mudança em Server Action existente:
   → criar nova versão (createProductV2)
   → migrar aos poucos
   → remover versão antiga só quando ninguém usa

3. Antes de qualquer mudança:
   → rodar npx vitest run
   → garantir todos os testes passando
   → só depois modificar

4. Deploy incremental:
   → feature flag para funcionalidades novas
   → habilitar para 1 empresa primeiro
   → validar, depois abrir para todos

5. Feedback de uso real:
   → Posthog ou Umami para ver onde os usuários travam
   → logs de erro no Sentry para pegar problemas reais
   → iterar baseado em dados, não em suposição
```

---

## PARTE 8 — Checklist Final

### Antes de considerar qualquer feature pronta

```
Regra de negócio:
  □ Problema claramente definido
  □ Todos os casos de erro tratados
  □ Usuário recebe feedback em toda ação

Código:
  □ Schema com companyId e índice
  □ Migration gerada e aplicada
  □ Action: auth → permissão → Zod → companyId → log → audit
  □ Componente: loading / error / empty / dados
  □ Ação destrutiva usa AlertDialog
  □ Sem any, sem monolito, sem chave hardcoded
  □ Feature no diretório correto (Feature-Based Architecture)
  □ Rota no grupo correto e protegida pelo role certo
  □ Tela adicionada ao menu do perfil correto

Testes:
  □ Schema Zod: válido, inválido por campo
  □ Action: sucesso, sem permissão, dados inválidos, isolamento
  □ npx vitest run — todos passando

Segurança:
  □ RLS ativo na tabela nova
  □ Nenhum dado sensível nos logs
  □ Upload com validação de tipo e tamanho (se houver)

Iteração:
  □ CONTEXT.md atualizado com o que foi implementado
  □ Decisões novas registradas
  □ task.md atualizado com progresso da feature
  □ handoff.md atualizado com o que foi feito nesta sessão
```

---

## PARTE 9 — Agentes de Desenvolvimento

Cada agente atua em seu momento. Nunca simultaneamente. Um termina, o próximo começa.

O fluxo completo:

```
Você descreve a regra de negócio
        ↓
Agente 1 — Arquiteto
        ↓
Agente 2 — Backend
        ↓
Agente 3 — Frontend
        ↓
Agente 5 — UX/UI
        ↓
Agente 4 — Qualidade e Segurança
        ↓
Feature pronta para produção
```

---

### Agente 1 — Arquiteto

**Quando ativar:** antes de qualquer código, quando tiver a regra de negócio

**Prompt de ativação:**
```
Você é o Agente Arquiteto. Siga a Parte 1 e Parte 2 deste guia.

Regra de negócio: [descrever aqui]

Sua missão:
1. Validar a regra com as 6 perguntas da Parte 1
2. Decidir stack se ainda não foi definida (Parte 2)
3. Definir o schema do banco com companyId e índices
4. Definir a estrutura da feature (Feature-Based Architecture)
5. Documentar todas as decisões tomadas

Entregue ao final:
→ Schema Drizzle completo
→ Estrutura de pastas da feature
→ Decisões documentadas para o próximo agente
→ Pontos de atenção identificados
```

**O que o Arquiteto entrega:**
```
→ Schema do banco pronto para migration
→ Estrutura de pastas definida
→ Decisões de stack documentadas
→ Regra de negócio validada e refinada
→ Riscos e pontos de atenção identificados
```

---

### Agente 2 — Backend

**Quando ativar:** após receber o output do Arquiteto

**Prompt de ativação:**
```
Você é o Agente Backend. Siga a Parte 5 e Parte 6 deste guia.

Recebido do Arquiteto:
[colar output do Agente 1]

Sua missão — nesta ordem:
1. Gerar e aplicar a migration (drizzle-kit generate && migrate)
2. Criar os types TypeScript inferidos do schema
3. Criar os schemas Zod com mensagens em PT-BR
4. Criar as Server Actions com segurança completa:
   auth → permissão → Zod → companyId → log → audit → retorno tipado
5. Criar os hooks TanStack Query com query keys centralizadas

Regras obrigatórias (Parte 6):
→ input: unknown em toda action
→ companyId sempre do contexto, nunca do input
→ try/catch com logger.error em toda action
→ Nunca any no TypeScript
→ Retorno sempre { data } ou { error }

Entregue ao final:
→ Todos os arquivos criados listados
→ Pontos que o Frontend precisa saber
```

**O que o Backend entrega:**
```
→ Migration aplicada
→ types.ts, schemas.ts, actions.ts, hooks/ prontos
→ Lista de endpoints e retornos para o Frontend
→ Pontos de atenção para integração
```

---

### Agente 3 — Frontend

**Quando ativar:** após receber o output do Backend

**Prompt de ativação:**
```
Você é o Agente Frontend. Siga a Parte 5 e Parte 6 deste guia.

Recebido do Backend:
[colar output do Agente 2]

Sua missão:
1. Criar os componentes da feature em src/features/[feature]/components/
2. Todo componente com dados deve ter 3 estados obrigatórios:
   loading → error → empty → dados
3. Formulários com React Hook Form + schema Zod já criado pelo Backend
4. Ações destrutivas sempre com AlertDialog
5. Adicionar tela ao menu do perfil correto (seguir MENUS.md)
6. Garantir rota no grupo correto: (system)/(seller)/(tenant)

Regras obrigatórias:
→ page.tsx só importa de features/ — sem lógica dentro
→ Nenhum arquivo com mais de 200 linhas
→ Só Tailwind — sem CSS customizado
→ Feedback de sucesso e erro com toast em toda ação

Entregue ao final:
→ Todos os componentes criados listados
→ Rotas adicionadas
→ Menus atualizados
```

**O que o Frontend entrega:**
```
→ Componentes prontos com 3 estados
→ Formulários integrados com hooks do Backend
→ Rotas e menus configurados
→ UI completa pronta para revisão de qualidade
```

---

### Agente 5 — UX/UI

**Quando ativar:** após receber o output do Frontend

**Prompt de ativação:**
```
Você é o Agente UX/UI. Siga o arquivo agent-5-uxui.md.

Recebido do Frontend: [colar output do Agente 3]

Sua missão:
1. Auditar cada tela entregue pelo Frontend
2. Identificar o que é funcional mas pode ser muito melhor
3. Implementar melhorias de valor visual e experiência
4. Dashboards com métricas e gráficos relevantes
5. Listagens com elemento visual por item
6. Empty states orientados com ação clara
7. Formulários organizados e intuitivos
8. Responsividade mobile

Entregue: telas melhoradas + decisões de UX documentadas
```

**O que o Agente UX/UI entrega:**
```
→ Telas revisadas e melhoradas
→ Dashboards com métricas e gráficos
→ Listagens com elementos visuais
→ Empty states orientados
→ Decisões de UX documentadas
→ Output pronto para o Agente Qualidade
```

---

### Agente 4 — Qualidade e Segurança

**Quando ativar:** após receber o output do UX/UI

**Prompt de ativação:**
```
Você é o Agente de Qualidade e Segurança. Siga a Parte 6, Parte 7 e Parte 8 deste guia.

Recebido do Frontend:
[colar output do Agente 3]

Sua missão:
1. Verificar todas as regras de segurança (Parte 6)
   → Toda action tem: input unknown, Zod, permissão, companyId, try/catch
   → Nenhum any no TypeScript
   → Nenhum dado sensível em log
   → RLS ativo na tabela nova

2. Escrever testes Vitest — os 4 casos obrigatórios por action:
   → Sucesso com dados válidos
   → Erro sem permissão CASL
   → Erro com dados inválidos
   → Isolamento: companyId sempre do contexto

3. Escrever teste Playwright para o fluxo principal

4. Aplicar o checklist completo da Parte 8

5. Atualizar o CONTEXT.md:
   → Marcar feature como implementada
   → Registrar decisões novas tomadas

Entregue ao final:
→ Relatório de segurança (o que passou, o que foi corrigido)
→ Testes escritos e passando
→ CONTEXT.md atualizado
→ Feature aprovada para produção
```

**O que o Agente de Qualidade entrega:**
```
→ Relatório de segurança completo
→ Testes Vitest passando
→ Teste Playwright do fluxo principal
→ Checklist da Parte 8 preenchido
→ CONTEXT.md atualizado
→ Feature pronta para produção
```

---

### Passagem de contexto entre agentes

Cada agente recebe:
```
1. Este guia completo (ai-dev-guide.md)
2. O CONTEXT.md atualizado do projeto
3. O output do agente anterior
```

Nunca pular a passagem de contexto. Sem contexto, o agente vai na direção errada.

---

### Quando usar agente único vs fluxo completo

```
Feature simples (1 tela, CRUD básico):
  → Agente único com este guia completo
  → Mais rápido, resultado suficiente

Feature complexa (regras de negócio elaboradas,
múltiplos perfis, integrações externas):
  → Fluxo completo com os 5 agentes
  → Mais lento, resultado mais sólido, seguro e bem acabado
```


---

## PARTE 10 — MCP (Model Context Protocol)

MCPs conectam a IA diretamente às ferramentas do projeto. Com eles os agentes trabalham com mais autonomia — leem o banco, rodam testes, verificam tipos, fazem commits — sem você precisar copiar e colar resultados.

> ⚠️ **OBS:** O uso de cada MCP pode ser liberado ou bloqueado a qualquer momento. Se perceber que o consumo de tokens aumentou demais, desative o MCP que está causando o problema e informe a IA para trabalhar sem ele naquela sessão.

---

### Uso cirúrgico — regra principal



---

### MCPs Essenciais — todos os projetos

| MCP | Para que serve | Uso cirúrgico |
|---|---|---|
| Supabase MCP | Ler schema, criar migrations, verificar RLS | Só a tabela necessária, não o banco inteiro |
| Terminal MCP | Rodar vitest, drizzle, instalar deps | Só o comando necessário |
| Playwright MCP | Rodar e corrigir testes E2E automaticamente | Só o teste da feature atual |
| GitHub MCP | Commits, PRs, histórico | Só o arquivo ou commit necessário |
| ESLint MCP | Analisar código em tempo real | Só o arquivo gerado |
| TSC MCP | Verificar tipos sem build completo | Só o arquivo modificado |
| Prettier MCP | Formatar código automaticamente | Só o arquivo gerado |

---

### MCPs por Stack — liberar só se a tecnologia foi escolhida

| MCP | Quando liberar | Para que serve |
|---|---|---|
| Vercel MCP | Se deploy no Vercel | Logs, variáveis de ambiente, status de deploy |
| Sentry MCP | Se usa Sentry | Ver erros em tempo real durante desenvolvimento |
| Resend MCP | Se usa Resend | Testar templates de e-mail, verificar entregas |
| Stripe MCP | Se usa Stripe | Testar webhooks, verificar eventos de billing |
| Asaas MCP | Se usa Asaas | Testar webhooks de billing BR |
| Cloudinary MCP | Se usa Cloudinary | Gerenciar uploads, verificar transformações |
| Novu MCP | Se usa Novu | Testar notificações, verificar templates |

---

### Qual agente usa qual MCP

| Agente | MCPs que usa | Para quê |
|---|---|---|
| Arquiteto | Supabase MCP | Verificar schema existente antes de criar novo |
| Backend | Supabase MCP, Terminal MCP, TSC MCP, ESLint MCP | Migrations, rodar vitest, verificar tipos |
| Frontend | TSC MCP, ESLint MCP, Prettier MCP | Verificar tipos e formatação dos componentes |
| Qualidade | Terminal MCP, Playwright MCP, Sentry MCP | Rodar testes, verificar erros em produção |

---

### MCPs que aumentam muito o consumo de tokens



---

### Quando NÃO usar MCP




---

## PARTE 11 — task.md — Painel de Progresso

A IA mantém um arquivo `task.md` na raiz do projeto durante todo o desenvolvimento. Ele mostra em tempo real o que foi feito, o que está sendo feito e o que falta.

### Legenda

```
[ ] → Pendente
[/] → Em andamento
[x] → Concluído
[-] → Não se aplica
```

### Como o percentual é calculado

```
Tarefas [x] concluídas
÷ total de tarefas válidas (excluindo [-])
× 100

Exemplo:
  Fase com 6 tarefas válidas
  3 marcadas como [x]
  = 50%
```

### Quando a IA atualiza o task.md

```
→ Ao iniciar qualquer sessão
→ Ao concluir cada tarefa dentro de uma fase
→ Ao finalizar cada agente
→ Ao concluir uma feature completa
```

### Estrutura de uma feature no task.md

```markdown
### Feature: [Nome] [0%]

#### Agente 1 — Arquiteto
- [ ] Regra de negócio validada
- [ ] Schema definido
- [ ] Estrutura de pastas definida
- [ ] Permissões identificadas

#### Agente 2 — Backend
- [ ] Migration aplicada
- [ ] types.ts criado
- [ ] schemas.ts criado
- [ ] actions.ts criado
- [ ] hooks/ criado

#### Agente 3 — Frontend
- [ ] Componentes com 3 estados
- [ ] Formulários integrados
- [ ] Rota configurada
- [ ] Menu atualizado

#### Agente 4 — Qualidade
- [ ] Segurança verificada
- [ ] Testes Vitest passando
- [ ] Teste Playwright escrito
- [ ] Checklist aprovado
- [ ] CONTEXT.md atualizado
- [ ] task.md atualizado
```

### Regra obrigatória

```
Nunca entregar output de uma etapa sem antes
atualizar o task.md com o que foi concluído.
```

---

*Cole este arquivo no início de toda sessão de desenvolvimento.*
*Atualizar o CONTEXT.md, o task.md e o handoff.md ao final de cada sessão.*
