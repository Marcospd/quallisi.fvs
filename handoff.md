# 🔄 HANDOFF — Quallisy FVS

> **INSTRUÇÃO PARA A IA QUE ESTÁ LENDO ESTE ARQUIVO:**
> 1. Leia este documento inteiro antes de começar qualquer trabalho.
> 2. Leia também `CONTEXT.md` e `task.md` na raiz do projeto.
> 3. Ao terminar sua sessão, **ATUALIZE ESTE ARQUIVO** com o que você fez — outra IA vai continuar de onde você parou.

---

## O que é este projeto

**Quallisy FVS** é um SaaS de controle de qualidade para engenharia civil. FVS = Ficha de Verificação de Serviço — inspetores vão a campo, avaliam critérios de qualidade (Conforme, Não Conforme, Não Aplicável) e geram relatórios.

**Stack:** Next.js 16 (App Router) · Supabase (Auth + Postgres) · Drizzle ORM · Tailwind CSS · Shadcn/UI · TanStack Query · Vitest · Sonner (toasts) · Pino (logger) · Zod (validação)

**Estrutura de pastas (padrão feature-based):**
```
src/
├── app/                          # Rotas Next.js (App Router)
│   ├── (auth)/login/             # Login do tenant
│   ├── (system)/system/          # Painel do administrador da plataforma
│   │   ├── (protected)/          # Rotas protegidas do sistema
│   │   │   ├── page.tsx          # Dashboard com KPIs
│   │   │   ├── tenants/          # Gestão de construtoras
│   │   │   └── billing/          # Faturas e pagamentos
│   │   └── login/                # Login do system admin
│   └── (tenant)/[slug]/          # Painel da construtora (multi-tenant)
│       ├── inspections/          # Inspeções FVS
│       ├── planning/             # Planejamento mensal
│       ├── projects/             # Obras
│       ├── locations/            # Locais de inspeção
│       ├── services/             # Serviços e critérios
│       ├── issues/               # Pendências
│       ├── stats/                # Estatísticas
│       ├── notifications/        # Notificações
│       └── team/                 # Equipe
├── features/                     # Lógica de negócio por feature
│   ├── auth/                     # actions, schemas, types, components
│   ├── tenant/                   # actions, components (provider, sidebar, guards)
│   ├── system/                   # actions, schemas, components (dashboard, tenants, billing)
│   ├── projects/                 # actions, schemas, components
│   ├── locations/                # actions, schemas, components
│   ├── services/                 # actions (listServices, createService, addCriterion, listCriteria)
│   ├── planning/                 # actions (listPlanningItems, createPlanningItem, deletePlanningItem)
│   ├── inspections/              # actions + ExportPdfButton (PDF via jspdf)
│   ├── issues/                   # actions (listIssues, createIssue, updateIssueStatus)
│   ├── stats/                    # actions (getTenantStats), StatsCards
│   ├── notifications/            # actions, create-notification (triggers), NotificationsList
│   └── team/                     # actions (listTeamMembers, inviteTeamMember, updateMemberRole, toggleMemberActive)
├── lib/
│   ├── db/
│   │   ├── index.ts              # Instância do Drizzle
│   │   └── schema/               # 14 schemas Drizzle (ver abaixo)
│   ├── supabase/                 # Clients (browser, server, middleware, admin)
│   ├── email/                    # resend.ts (lazy init), templates.ts (4 templates)
│   └── logger.ts                 # Pino logger
├── components/
│   ├── ui/                       # Shadcn/UI (19 componentes)
│   ├── empty-state.tsx           # Componente reutilizável de estado vazio
│   └── error-state.tsx           # Componente reutilizável de erro
└── providers/                    # React Query provider, Theme provider
```

---

## Schemas Drizzle (14 tabelas — `src/lib/db/schema/`)

| Arquivo | Tabela(s) | FKs |
|---|---|---|
| `tenants.ts` | tenants | — |
| `users.ts` | users | → tenants |
| `system-users.ts` | system_users | — |
| `plans.ts` | plans | — |
| `subscriptions.ts` | subscriptions | → tenants, plans |
| `invoices.ts` | invoices | → subscriptions |
| `projects.ts` | projects | → tenants |
| `locations.ts` | locations | → projects |
| `services.ts` | services, criteria | services→tenants, criteria→services (cascade) |
| `planning.ts` | planning_items | → projects, services, locations |
| `inspections.ts` | inspections, inspection_items | inspections→projects/services/locations/users, items→inspections (cascade)/criteria |
| `issues.ts` | issues | → inspections, users |
| `notifications.ts` | notifications | → users |

---

## Multi-tenancy e segurança

- **Rotas tenant:** `/[slug]/*` — layout verifica auth → tenant existe → tenant ativo → user pertence ao tenant
- **Isolamento obrigatório:** TODA query de dados do tenant DEVE filtrar por `tenantId`. Nunca confiar apenas no ID do recurso.
- **Roles:** `admin`, `supervisor`, `inspetor` (dentro do tenant) / `SYSTEM` (system user)
- **Guards:** `requireRole()`, `requireAdmin()` para server actions / `RoleGuard` para UI
- **Auth:** Supabase Auth via cookies, middleware faz refresh de sessão

---

## O que está REALMENTE pronto vs o que falta

### ✅ COMPLETO (schema + actions + UI funcional)
- F1 Setup do projeto
- F2 Auth e Sessão (login tenant + sistema)
- F3 Multi-tenancy (layout, provider, guards)
- F4 Dashboard SISTEMA (KPIs reais do banco)
- F5 Gestão de Clientes/Tenants (CRUD completo com ações de status)
- F6 Billing Manual (faturas, marcar pago/atrasado)
- F7 Cadastro de Obras (CRUD com toggle ativo/inativo)
- F8 Cadastro de Locais (CRUD com select de obras)
- F9 Serviços e Critérios (CreateServiceDialog, ServicesTable com toggle, CriteriaPanel com CRUD)
- F10 Planejamento Mensal (PlanningPageClient com selector obra+mês, PlanningGrid serviço×local)
- F11 FVS Inspeções (InspectionForm C/NC/NA, CreateInspectionDialog, página detalhe /inspections/[id])
- F12 Pendências (listIssues/createIssue/updateIssueStatus, IssuesTable com mudança de status)
- F13 Dashboard Tenant KPIs (getTenantStats com 9 métricas, StatsCards com grid responsiva)

- F14 Notificações (in-app + Resend e-mail, triggers em inspeções e pendências)
- F15 Relatório PDF (ExportPdfButton com jspdf+jspdf-autotable, PDF FVS completo)
- Gestão de Equipe (TeamTable com roles, InviteMemberDialog, Supabase admin client, e-mail de convite)
- Upload de fotos (photoUrl no inspection_items, Supabase Storage helper, UI com capture="environment")
- Migrations Drizzle (migration inicial gerada: 15 tabelas com FKs e indexes)
- Testes unitários (39 testes em 6 arquivos: schemas auth, system, projects, services, planning, team)
- Sentry (client/server/edge configs, global-error.tsx, withSentryConfig no next.config.ts)
- Rate limiting (login 5/min, convites 10/min — in-memory com janela deslizante)
- RLS — Script SQL com políticas para 15 tabelas + Storage bucket (scripts/rls-policies.sql)
- Validação de env vars com Zod (src/lib/env.ts)

### ❌ NÃO IMPLEMENTADO
- **Testes E2E** — Playwright configurado mas sem testes escritos
- **Aplicar migrations** — migration gerada mas não aplicada (precisa de DATABASE_URL)
- **RLS no Supabase** — script pronto em `scripts/rls-policies.sql`, precisa executar no SQL Editor
- **Bucket Supabase Storage** — bucket `inspection-photos` precisa ser criado manualmente no Supabase Dashboard
- **Sentry DSN** — configuração pronta, precisa criar projeto no Sentry e adicionar NEXT_PUBLIC_SENTRY_DSN

---

## Padrões a seguir

### Server Actions
```typescript
'use server'
export async function minhaAction(input: unknown) {
  const { user, tenant } = await getAuthContext()  // SEMPRE verificar auth
  // Validar com Zod
  const parsed = meuSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }
  // Query SEMPRE com filtro de tenantId
  // Log com pino
  // revalidatePath() ao mutar dados
  return { data: resultado }
}
```

### Componentes client
```typescript
'use client'
// React Hook Form + zodResolver para forms
// toast (sonner) para feedback
// useState para loading states
// Shadcn/UI para todos os componentes visuais
```

### Retorno de actions
Sempre retornar `{ data: T }` ou `{ error: string | ZodFlattenedError }`.

---

## Prioridade sugerida para continuar

1. **Upload de fotos** — integrar Supabase Storage nas inspeções
2. **Testes unitários e E2E** — cobertura mínima das server actions
3. **Migrations Drizzle** — gerar e aplicar migrations
4. **Fase 4 — Checklist pré-deploy** (ver task.md)

---

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de produção |
| `npm run db:generate` | Gera migrations Drizzle |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:seed` | Popula dados iniciais (`scripts/seed.ts`) |
| `npm run db:studio` | Abre Drizzle Studio |
| `npm run test` | Roda Vitest |

---

## Regras obrigatórias

1. **Toda comunicação, comentários e documentação em português brasileiro**
2. **Sempre rodar `npm run build` ao final** para validar que não quebrou nada
3. **Isolamento de tenant é crítico** — nunca acessar dados sem filtrar por tenantId
4. **Não criar componentes fora do padrão Shadcn/UI**
5. **Actions sempre em arquivos separados** (`actions.ts` dentro de cada feature)

---

## 📝 Histórico de Handoffs

| Data | IA | O que foi feito |
|---|---|---|
| 2026-02-21 | Antigravity | Setup completo, 15 features scaffolded, F1-F8 totalmente implementadas, F9-F12 parciais, F13-F15 placeholders. Seed, security headers, scripts npm. |
| 2026-02-21 | Claude Code | F9-F13 completadas: UI de Serviços+Critérios, Planejamento com grid, FVS com formulário C/NC/NA + página detalhe, Pendências com CRUD + status, Dashboard KPIs com 9 métricas. Build OK. |
| 2026-02-22 | Claude Code | F14 Notificações completa (Resend + in-app + triggers). F15 PDF completa (jspdf+autotable). Gestão de Equipe completa (invite com auth user + e-mail, roles, toggle ativo). Admin Supabase client criado. Build OK. |
| 2026-02-22 | Claude Code | Upload de fotos, migrations geradas, 39 testes unitários. |
| 2026-02-22 | Antigravity | Fase 4 pré-deploy: Sentry (client/server/edge + global-error), Rate limiting (login 5/min, convite 10/min), RLS SQL (15 tabelas + Storage), Validação de env vars (Zod). Build OK. |
| — | — | *(Próxima IA: preencher esta linha ao terminar)* |

---

> **LEMBRETE FINAL:** Ao terminar sua sessão, atualize a tabela de Histórico de Handoffs acima E o `task.md` na raiz. Assim a próxima IA sabe exatamente de onde continuar.
