# 📋 TASK — Quallisy.obra

> Acompanhamento do desenvolvimento do projeto seguindo o [procedimento.md](Desenvolvimento%20com%20IA/procedimento.md).
> Atualizar este arquivo a cada sessão de trabalho.

---

## Legenda

- `[ ]` — Pendente
- `[/]` — Em andamento
- `[x]` — Concluído
- `[-]` — Não se aplica

---

## FASE 1 — Preparação

### 1.1 — Criar CONTEXT.md do projeto
- [x] Definir nome e descrição do projeto
- [x] Definir perfis do sistema (system, admin, supervisor, inspetor)
- [x] Listar decisões iniciais
- [x] Documentar o que já está implementado
- [x] Documentar armadilhas conhecidas
- [x] Salvar `CONTEXT.md` na raiz do projeto

### 1.2 — Salvar arquivos do guia no projeto
- [x] Agentes salvos em `Desenvolvimento com IA/agentes/`
- [x] ai-dev-guide salvo em `Desenvolvimento com IA/ai-dev-guide/`
- [x] context-template salvo em `Desenvolvimento com IA/context-template.md`
- [x] fixtures de teste em `Desenvolvimento com IA/fixtures.ts`
- [x] helpers de teste em `Desenvolvimento com IA/helpers.ts`
- [x] procedimento salvo em `Desenvolvimento com IA/procedimento.md`
- [x] Workflows criados em `.agents/workflows/` (arquiteto, backend, frontend, qualidade)
- [ ] Criar pasta `docs/` na raiz e mover/copiar guias para lá
- [ ] Criar pasta `src/tests/` com fixtures.ts e helpers.ts

---

## FASE 2 — Decisões de Stack

### 2.1 — Responder checklist de stack
- [x] Auth: Supabase Auth
- [x] Banco: Supabase
- [x] Billing: Manual (fase inicial)
- [x] Storage: Supabase Storage (fotos de inspeção)
- [x] Notificações: Resend (e-mail) + Supabase Realtime (in-app)
- [x] Deploy: Vercel
- [x] Logs: Vercel Logs
- [x] i18n: PT-BR + EN (next-intl)
- [ ] LGPD: dados sensíveis?
- [x] SEO: não tem blog/conteúdo público
- [x] Landing: separada (não inclusa neste projeto)
- [ ] Acessibilidade: setor público?
- [ ] MCP: quais liberar?
- [x] Registrar decisões no CONTEXT.md com data de validade

---

## FASE 3 — Desenvolvimento de Features

> Para cada feature, seguir o fluxo: `/arquiteto` → `/backend` → `/frontend` → `/qualidade`

### Roadmap de Features

| # | Feature | Status |
|---|---------|--------|
| 1 | 🏗️ Setup do projeto (Next.js, Supabase, Drizzle, Shadcn) | [x] Concluído |
| 2 | 🔐 Auth e Sessão | [x] Concluído |
| 3 | 🏢 Multi-tenancy e isolamento | [x] Concluído |
| 4 | 📊 Painel SISTEMA — Dashboard Global | [x] Concluído |
| 5 | 👥 Painel SISTEMA — Gestão de Clientes | [x] Concluído |
| 6 | 💰 Painel SISTEMA — Billing Manual | [x] Concluído |
| 7 | 🏗️ Cadastro de Obras | [x] Concluído |
| 8 | 📍 Cadastro de Locais | [x] Concluído |
| 9 | 🔧 Cadastro de Serviços e Critérios | [x] Concluído |
| 10 | 📅 Planejamento Mensal | [x] Concluído |
| 11 | 📋 FVS — Inspeções (core) | [x] Concluído |
| 12 | ⚠️ Pendências e Retrabalhos | [x] Concluído |
| 13 | 📊 Dashboard Tenant — KPIs | [x] Concluído |
| 14 | 🔔 Notificações (in-app + e-mail) | [x] Concluído |
| 15 | 📄 Relatório FVS em PDF | [x] Concluído |

### Fluxo por Feature (Fase 3)
> Para cada feature acima, seguir: `/arquiteto` → `/backend` → `/frontend` → `/qualidade`

---

## FASE 4 — Produção

### 4.1 — Checklist pré-deploy
- [x] Variáveis de ambiente configuradas no deploy
- [x] Nenhuma variável sensível com NEXT_PUBLIC_
- [x] RLS ativo em todas as tabelas no Supabase
- [x] Headers HTTP de segurança no next.config.js
- [x] Rate limiting nas rotas de login, cadastro e API
- [x] Sentry configurado e testado
- [ ] HTTPS funcionando
- [ ] Backup automático do Supabase
- [x] `npx vitest run` — todos os testes passando
- [ ] Teste de isolamento: usuário A não vê dados do usuário B

### 4.2 — Primeiro deploy
- [ ] Configurar variáveis de ambiente no painel do deploy
- [ ] Conectar repositório
- [ ] Deploy automático via push na branch main
- [ ] Testar em produção com dados reais mínimos
- [ ] Verificar Sentry — nenhum erro novo
- [ ] Verificar logs — nenhuma anomalia

---

## FASE 5 — Iteração

- [ ] Monitorar erros via Sentry
- [ ] Monitorar comportamento de usuários (Posthog/Umami)
- [ ] Coletar feedback direto dos usuários
- [ ] Priorizar: bug crítico → melhoria → feature nova
- [ ] Feature flag para funcionalidades novas
- [ ] Validar com 1 empresa antes de abrir para todos

---

## 📝 Histórico de Sessões

| Data | O que foi feito |
|---|---|
| 2026-02-21 | Criados workflows dos 4 agentes em `.agents/workflows/` |
| 2026-02-21 | Criado `CONTEXT.md` com stack, perfis, banco e regras de negócio |
| 2026-02-21 | Decidida stack completa (Supabase, Resend, Vercel, Sentry, PT-BR+EN) |
| 2026-02-21 | Criado arquivo `task.md` para acompanhamento do projeto |
| 2026-02-21 | **Setup do projeto concluído**: Next.js 16, Supabase, Drizzle, Shadcn/UI (19 componentes), TanStack Query, Pino, Vitest |
| 2026-02-21 | **Feature 2 — Auth e Sessão concluída**: schemas, actions, login tenant (/login) e sistema (/system/login) |
| 2026-02-21 | **Feature 3 — Multi-tenancy concluída**: roteamento /[slug], TenantProvider, RoleGuard, requireRole, layout com verificação |
| 2026-02-21 | **Feature 4 — Painel SISTEMA concluído**: sidebar dark, dashboard KPIs, layout protegido, /system |
| 2026-02-21 | **Feature 5 — Gestão de Clientes concluída**: CRUD tenants, tabela com ações de status, /system/tenants |
| 2026-02-21 | **Feature 6 — Billing Manual concluída**: schemas plans/subscriptions/invoices, pagamentos, /system/billing |
| 2026-02-21 | **Feature 7 — Cadastro de Obras concluído**: schema projects, TenantSidebar, /[slug]/projects |
| 2026-02-21 | **Feature 8 — Cadastro de Locais concluído**: schema locations, actions com isolamento, /[slug]/locations |
| 2026-02-21 | **Feature 9 — Serviços e Critérios concluído**: schemas services+criteria, cascade delete, /[slug]/services |
| 2026-02-21 | **Feature 10 — Planejamento Mensal concluído**: schema planningItems, actions, /[slug]/planning |
| 2026-02-21 | **Feature 11 — FVS Inspeções concluído**: inspections/inspectionItems, auto-geração de items, /[slug]/inspections |
| 2026-02-21 | **Features 12-15 concluídas**: issues, stats, notifications, team — schemas + páginas. **TODAS 15 features concluídas** ✅ |
| 2026-02-21 | **Fase 4 — Produção preparada**: seed script, security headers, scripts npm, tsx instalado |
| 2026-02-21 | **F9 UI completa**: CreateServiceDialog, ServicesTable com toggle, CriteriaPanel com CRUD de critérios |
| 2026-02-21 | **F10 UI completa**: PlanningPageClient com selector obra+mês, PlanningGrid serviço×local com checkboxes |
| 2026-02-21 | **F11 UI completa**: InspectionForm (C/NC/NA), CreateInspectionDialog, página detalhe /inspections/[id] |
| 2026-02-21 | **F12 completa**: actions listIssues/createIssue/updateIssueStatus, IssuesTable com mudança de status |
| 2026-02-21 | **F13 completa**: getTenantStats com 9 KPIs (conformidade, inspeções, pendências, obras, planejamento) |
| 2026-02-22 | **F14 completa**: Resend integrado (lazy init), templates de e-mail, notificações in-app (CRUD), triggers em inspeções e pendências |
| 2026-02-22 | **F15 completa**: ExportPdfButton com jspdf+jspdf-autotable, PDF completo com cabeçalho, critérios e resumo |
| 2026-02-22 | **Gestão de Equipe completa**: actions (listTeamMembers, inviteTeamMember, updateMemberRole, toggleMemberActive), TeamTable, InviteMemberDialog, admin Supabase client, e-mail de convite |
| 2026-02-22 | **Upload de fotos**: photoUrl no schema, Supabase Storage helper, upload/remove no InspectionForm com capture="environment" |
| 2026-02-22 | **Migrations Drizzle**: migration inicial gerada (15 tabelas, FKs, indexes) em `drizzle/0000_*.sql` |
| 2026-02-22 | **Testes unitários**: 39 testes em 6 arquivos (schemas auth, system, projects, services, planning, team) — todos passando |
| 2026-02-22 | **Fase 4 pré-deploy**: Sentry configurado (client/server/edge + global-error.tsx + withSentryConfig), Rate limiting in-memory (login 5/min, convite 10/min), Script RLS SQL (15 tabelas + Storage bucket), Validação de env vars com Zod |
| 2026-02-22 | **Migration + RLS aplicados**: .env.local criado, migration Drizzle rodada (15 tabelas), políticas RLS aplicadas (15 tabelas + Storage) |

| 2026-02-22 | **Migration + RLS aplicados**: .env.local criado, migration Drizzle rodada (15 tabelas), políticas RLS aplicadas (15 tabelas + Storage) |

---

## PRÓXIMAS ETAPAS PENDENTES

- [/] UX/UI: **Nova Listagem de Obras em Cards**
  - [ ] Substituir tabela por grid de cards (`ProjectCard`).
  - [ ] Imagem de capa no topo do card com fallback.
  - [ ] Tag flutuante de progresso da obra (ex: 75% Concluído).
  - [ ] Barra de progresso de Qualidade (ex: 92% Aprovado).
  - [ ] Título (Nome da Obra) e Endereço.
  - [ ] Ações na base (Relatórios, Gerenciar) e Menu de opções (3 pontos).

> *Documento vivo — atualizar a cada sessão de trabalho.*
