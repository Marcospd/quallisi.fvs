# CONTEXT.md — Quallisy FVS

> **Instrução para a IA:** Sempre leia este arquivo antes de qualquer ação.
> Se a data de validade da stack estiver vencida, avise o usuário antes de continuar.

---

## ⚠️ Validade da Stack

```
Última revisão:   21/02/2026
Válida até:       21/05/2026
```

---

## Projeto

```
Nome:        Quallisy FVS
Descrição:   Plataforma SaaS multitenancy de controle de qualidade para obras civis, 
             baseada na metodologia de Fichas de Verificação de Serviço (FVS). 
             Digitaliza e automatiza o ciclo completo de inspeções: do planejamento 
             mensal à geração do relatório final assinado digitalmente.
Iniciado em: 21/02/2026
Repositório: git@github.com:Marcospd/quallisi.fvs.git
Ambiente:
  Local:     http://localhost:3000
  Staging:   a definir
  Produção:  a definir
```

---

## Stack Escolhida

```
Framework:     Next.js (App Router, React 19)
Linguagem:     TypeScript strict
UI:            Tailwind CSS + Shadcn/UI
Ícones:        Lucide React
i18n:          next-intl (PT-BR + EN)
Formulários:   React Hook Form + Zod
Estado:        TanStack Query v5
ORM:           Drizzle ORM
Logs:          Pino

Auth:          [x] Supabase Auth  [ ] Clerk
Banco:         [x] Supabase  [ ] NeonDB  [ ] PlanetScale
Billing:       [x] Manual (fase inicial)  [ ] Stripe  [ ] Asaas
Storage:       [x] Supabase Storage  [ ] Cloudinary  [ ] S3/R2
Notificações:  [x] Resend + Supabase Realtime  [ ] + Novu
Deploy:        [x] Vercel  [ ] Coolify  [ ] Railway
Logs destino:  [x] Vercel Logs  [ ] Axiom
Erros:         [x] Sentry  [ ] GlitchTip
Blog/CMS:      [x] Não tem  [ ] MDX  [ ] Sanity  [ ] Contentful
Landing:       Separada (não incluída neste projeto)
```

---

## Perfis do Sistema

```
Plataforma (fixo):
  system     → superadmin da plataforma (dono do SaaS)
               Rota: /system/* — autenticação isolada dos tenants
               Acesso total: todos os tenants, billing, métricas globais

Tenant (por construtora):
  admin      → gestor da obra
               Acesso total dentro da construtora: cadastros, relatórios, usuários, obras
  supervisor → aprovação e controle de qualidade
               Aprovar/reprovar FVS, estatísticas, retrabalhos, notificações
  inspetor   → execução de inspeções em campo
               Criar/editar próprias inspeções, anexar fotos, assinar FVS
```

---

## Decisões Tomadas

> Não reabrir sem razão técnica concreta.

| Decisão | Escolha | Motivo | Data |
|---|---|---|---|
| Auth | Supabase Auth | Incluso no Supabase, sem custo extra | 21/02/2026 |
| Banco | Supabase | Realtime, storage e auth integrados | 21/02/2026 |
| Storage | Supabase Storage | Upload de fotos de inspeção sem transformação complexa | 21/02/2026 |
| Billing | Manual | Fase inicial — cobrança PIX/boleto fora do sistema | 21/02/2026 |
| E-mail | Resend | Notificações de alerta e FVS aprovada | 21/02/2026 |
| Deploy | Vercel | Simplicidade, integração com Next.js | 21/02/2026 |
| Erros | Sentry | Padrão de mercado para monitoramento | 21/02/2026 |
| i18n | PT-BR + EN | next-intl com dois idiomas | 21/02/2026 |
| Landing | Separada | Não faz parte deste projeto | 21/02/2026 |

---

## Estrutura de Planos

| Plano | Obras (máx) | Usuários (máx) | FVS/mês (máx) | Observação |
|-------|-------------|----------------|---------------|------------|
| Starter | 1 | 5 | 100 | Construtoras pequenas |
| Pro | 5 | 20 | 500 | Construtoras médias |
| Enterprise | Ilimitado | Ilimitado | Ilimitado | Contrato customizado |

---

## O que já está implementado

```
[x] Auth e sessão
[x] Multi-tenancy e isolamento
[x] Painel SISTEMA
[x] Gestão de Clientes (tenants)
[x] Gestão de Assinaturas/Billing manual
[x] Cadastro de Obras (projects) — incluindo campos: cliente, contrato, prazo, engenheiro, fiscalização, características
[x] Cadastro de Locais (locations)
[x] Cadastro de Serviços e Critérios (services, service_criteria) — tela full-page com busca
[x] Planejamento mensal (planning)
[x] FVS — Nova inspeção (inspections, inspection_results)
[x] FVS — Fluxo de status e retrabalho
[x] Pendências e qualidade — com filtro por status
[x] Relatório FVS em PDF
[x] Dashboard com KPIs — com filtro por obra e alerta de prazo vencido
[x] Sistema de Notificações (in-app + e-mail)
[x] Gestão de Inspetores / Usuários
[x] Empreiteiras (contractors)
[x] Contratos (contracts) — com busca no catálogo de serviços
[x] Diário de Obra (site-diary) — com auto-preenchimento de engenheiro e busca no catálogo
[x] Boletim de Medição (measurements) — workflow de aprovação completo
```

---

## Modelagem do Banco

### Camada Plataforma (Painel SISTEMA)

| Tabela | Descrição |
|--------|-----------|
| `system_users` | Usuários com perfil SISTEMA (dono + suporte) |
| `plans` | Planos do SaaS com limites e preços |
| `subscriptions` | Assinatura ativa de cada tenant |
| `invoices` | Histórico de faturas (manual por ora) |
| `tenant_usage` | Snapshot mensal de consumo do tenant |
| `audit_logs` | Log de ações do perfil SISTEMA |

### Camada Tenant (Painel Construtora)

| Tabela | Descrição |
|--------|-----------|
| `tenants` | Cada construtora/cliente do SaaS |
| `users` | Usuários vinculados ao tenant |
| `projects` | Obras ativas da construtora |
| `locations` | Pontos físicos de inspeção dentro de uma obra |
| `services` | Dicionário de serviços (Alvenaria, Piso, etc.) |
| `service_criteria` | Critérios de verificação de cada serviço |
| `planning` | Cronograma mensal de inspeções previstas |
| `inspections` | Cabeçalho da FVS (local + serviço + inspetor) |
| `inspection_results` | Resultado individual de cada critério |
| `notifications` | Notificações internas automáticas |

---

## Permissões cadastradas

| Permissão | Descrição |
|---|---|
| — | *Nenhuma permissão cadastrada ainda* |

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
| system@quallisy.com | a definir | system | plataforma |
| admin@construtora-a.com | a definir | admin | Construtora A |
| supervisor@construtora-a.com | a definir | supervisor | Construtora A |
| inspetor@construtora-a.com | a definir | inspetor | Construtora A |
| admin@construtora-b.com | a definir | admin | Construtora B |

### Features testadas

| Feature | Unitário | E2E | Observação |
|---|---|---|---|
| Auth schemas | ✅ 8 testes | — | login + register |
| System schemas | ✅ 8 testes | — | system login/tenant/plan |
| Projects schemas | ✅ 5 testes | — | create/update project |
| Services schemas | ✅ 6 testes | — | service + criterion |
| Planning schemas | ✅ 4 testes | — | planning items |
| Team schemas | ✅ 8 testes | — | invite + role update |

---

## Status do Tenant

```
ACTIVE     → Acesso normal a todos os módulos
SUSPENDED  → Login bloqueado; dados preservados
CANCELLED  → Acesso encerrado; dados mantidos por 90 dias
```

---

## Status da Inspeção (FVS)

```
PENDENTE_INICIO       → FVS criada, coleta não iniciada
EM_ANDAMENTO          → Inspetor preenchendo critérios
PENDENTE_OCORRENCIA   → Critério NC encontrado, aguardando tratamento
PENDENTE_CONCLUIR     → Inspeção incompleta, critérios obrigatórios em branco
OK                    → Todos os critérios conformes, FVS aprovada
```

---

## Sistema de Notificações

| Gatilho | Canal | Destinatário |
|---------|-------|--------------|
| Critério Não Conforme | In-app + E-mail | Supervisor |
| FVS finalizada OK | In-app + E-mail + PDF | Supervisor + Admin |
| Planejamento em atraso | In-app + E-mail diário | Admin |
| Retrabalho aguardando correção | In-app | Inspetor + Supervisor |
| Fatura vencendo (3 dias) | E-mail | SISTEMA |
| Fatura em atraso (OVERDUE) | E-mail | SISTEMA |

---

## Armadilhas conhecidas

```
→ Nunca query sem .where(eq(tabela.tenantId, tenant.id)) — isolamento obrigatório
→ Nunca tenantId vindo do input do usuário
→ Nunca dado sensível em log (senha, token, CPF)
→ Sempre AlertDialog em ação destrutiva
→ Painel SISTEMA usa rotas e auth separadas (/system/*)
→ Queries do Painel SISTEMA são as ÚNICAS sem filtro de tenant_id
→ inspections.version incrementa a cada retrabalho — nunca sobrescrever
→ gateway_subscription_id e payment_method são nullable (preparados para integração futura)
→ tenant_usage é snapshot mensal — não calcular em tempo real
```

---

## Histórico de revisões de stack

| Data | O que foi revisado | O que mudou |
|---|---|---|
| 21/02/2026 | Revisão inicial | — |
| 22/02/2026 | Fase 4 pré-deploy | Sentry configurado, rate limiting, RLS preparado, env validation |
| 27/02/2026 | Iteração de melhoria | Cadastro de Obra ampliado, busca catálogo de serviços, Dashboard com filtro+prazo, Pendências com filtro de status |

---

*Atualizar ao final de cada sessão de desenvolvimento.*
*Revisar a stack a cada 3 meses.*
