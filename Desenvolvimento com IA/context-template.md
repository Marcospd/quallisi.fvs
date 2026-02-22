# CONTEXT.md — Template

> **Instrução para a IA:** Sempre leia este arquivo antes de qualquer ação.
> Se a data de validade da stack estiver vencida, avise o usuário antes de continuar.

---

## ⚠️ Validade da Stack

```
Última revisão:   [DD/MM/AAAA]
Válida até:       [DD/MM/AAAA + 3 meses]
```

**Se a data "Válida até" estiver vencida:**

```
Antes de continuar, crie uma tarefa de revisão:

  TAREFA: Revisão de Stack — [nome do projeto]
  
  Verificar:
  □ Alguma tecnologia foi descontinuada?
  □ Surgiu algo melhor para o caso de uso?
  □ Os custos mudaram significativamente?
  □ Há vulnerabilidades conhecidas nas versões usadas?
  □ As limitações conhecidas ainda se aplicam?
  
  Após revisão:
  → Atualizar "Última revisão" e "Válida até"
  → Registrar o que mudou em "Histórico de revisões"
```

---

## Projeto

```
Nome:        [nome do projeto]
Descrição:   [o que o produto faz em 1-2 frases]
Iniciado em: [DD/MM/AAAA]
Repositório: [URL do repositório]
Ambiente:
  Local:     http://localhost:3000
  Staging:   [URL de staging]
  Produção:  [URL de produção]
```

---

## Stack Escolhida

```
Framework:     Next.js 16 (App Router, React 19)
Linguagem:     TypeScript strict
UI:            Tailwind CSS + Shadcn/UI
Ícones:        Lucide React
i18n:          next-intl (PT-BR + EN)
Formulários:   React Hook Form + Zod
Estado:        TanStack Query v5
ORM:           Drizzle ORM
Logs:          Pino

Auth:          [ ] Supabase Auth  [ ] Clerk
Banco:         [ ] Supabase  [ ] NeonDB  [ ] PlanetScale
Billing:       [ ] Manual  [ ] Stripe  [ ] Asaas
Storage:       [ ] Supabase Storage  [ ] Cloudinary  [ ] S3/R2
Notificações:  [ ] Resend + Realtime  [ ] + Novu
Deploy:        [ ] Vercel  [ ] Coolify  [ ] Railway
Logs destino:  [ ] Vercel Logs  [ ] Axiom
Erros:         [ ] Sentry  [ ] GlitchTip
Blog/CMS:      [ ] Não tem  [ ] MDX  [ ] Sanity  [ ] Contentful
```

---

## Perfis do Sistema

```
Plataforma (fixo):
  system  → superadmin da plataforma
  seller  → vendedor da plataforma

Tenant (dinâmico — empresa define):
  Template padrão aplicado em toda empresa nova:
  → Grupo "Administrador" — todas as permissões
  → Grupo "Usuário" — permissões básicas
```

---

## Decisões Tomadas

> Não reabrir sem razão técnica concreta.

| Decisão | Escolha | Motivo | Data |
|---|---|---|---|
| [decisão] | [escolha] | [motivo] | [data] |

---

## O que já está implementado

```
[ ] Auth e sessão
[ ] Multi-tenancy e isolamento
[ ] Permissões dinâmicas
[ ] Template de grupos
[ ] Billing manual
[ ] [feature 1]
[ ] [feature 2]
```

---

## Permissões cadastradas

| Permissão | Descrição |
|---|---|
| [entidade.acao] | [o que permite fazer] |

---

## Testes

```
Stack:    Vitest (unitário) + Playwright (E2E)
Fixtures: src/tests/fixtures.ts
Helpers:  src/tests/helpers.ts

Rodar unitários: npx vitest run
Rodar E2E:       npx playwright test
Rodar tudo:      npx vitest run && npx playwright test
```

### Usuários de teste

| E-mail | Senha | Perfil | Empresa |
|---|---|---|---|
| system@plataforma.com | [senha] | system | plataforma |
| seller@plataforma.com | [senha] | seller | plataforma |
| admin@empresa-a.com | [senha] | admin | Empresa A |
| user@empresa-a.com | [senha] | user | Empresa A |
| admin@empresa-b.com | [senha] | admin | Empresa B |

### Features testadas

| Feature | Unitário | E2E | Observação |
|---|---|---|---|
| Auth | [ ] | [ ] | — |
| [feature] | [ ] | [ ] | — |

---

## Armadilhas conhecidas

```
→ Nunca query sem .where(eq(tabela.companyId, company.id))
→ Nunca companyId vindo do input do usuário
→ Nunca dado sensível em log
→ Sempre AlertDialog em ação destrutiva
→ [armadilhas específicas do projeto]
```

---

## Histórico de revisões de stack

| Data | O que foi revisado | O que mudou |
|---|---|---|
| [DD/MM/AAAA] | Revisão inicial | — |

---

*Atualizar ao final de cada sessão de desenvolvimento.*
*Revisar a stack a cada 3 meses.*
*O progresso do projeto é acompanhado em tempo real no task.md na raiz do projeto.*
*A continuidade entre IAs é garantida pelo handoff.md na raiz do projeto.*
