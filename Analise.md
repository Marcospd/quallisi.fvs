# Documento de Especificação — Sistema FVS SaaS
**Ficha de Verificação de Serviço — Plataforma Multitenancy**
Versão 2.0 | Fevereiro 2026

---

## 1. Visão Geral do Sistema

O FVS SaaS é uma plataforma de controle de qualidade para obras civis baseada na metodologia de Fichas de Verificação de Serviço. O sistema digitaliza e automatiza todo o ciclo de vida de uma inspeção: do planejamento mensal à geração do relatório final assinado digitalmente.

A plataforma possui dois níveis distintos de acesso:

- **Painel SISTEMA** — exclusivo do dono da plataforma, onde é feita a gestão de todos os clientes (construtoras), assinaturas e saúde geral do SaaS.
- **Painel Tenant** — acessado pelas construtoras contratantes, onde ocorre toda a operação de inspeções e qualidade de obra.

---

### 1.1 Perfis de Acesso

| Perfil | Escopo | Permissões Principais | Equivalente |
|--------|--------|-----------------------|-------------|
| **SISTEMA** | Plataforma global (todos os tenants) | Acesso total ao painel de controle: ver todas as construtoras, status de pagamento, métricas globais, ativar/suspender tenants | Você (dono do SaaS) |
| **Admin** | Tenant (Construtora) | Acesso total dentro da construtora: cadastros, relatórios, usuários, obras | Gestor da Obra |
| **Supervisor** | Projeto (Obra) | Aprovar/reprovar FVS, estatísticas, retrabalhos, notificações | GLU - Gláucio |
| **Inspetor** | Projeto (Obra) | Criar e editar próprias inspeções, anexar fotos, assinar FVS | ARS - Anderson |

> **Importante:** O perfil SISTEMA não está vinculado ao sistema de Organizations dos tenants. Ele usa uma rota protegida separada (`/system/*`) com autenticação própria, isolada completamente do ambiente dos clientes.

---

### 1.2 Estrutura de Planos

| Plano | Obras (máx) | Usuários (máx) | FVS/mês (máx) | Observação |
|-------|-------------|----------------|---------------|------------|
| Starter | 1 | 5 | 100 | Ideal para construtoras pequenas |
| Pro | 5 | 20 | 500 | Construtoras médias com múltiplas obras |
| Enterprise | Ilimitado | Ilimitado | Ilimitado | Grandes construtoras com contrato customizado |

---

## 2. Painel SISTEMA (Super Admin)

O Painel SISTEMA é a central de controle exclusiva do dono do SaaS. Acessado por URL e autenticação distintas (ex: `/system/login`). Nenhum cliente jamais terá acesso a essa área.

> **Regra crítica de isolamento:** Qualquer consulta executada no Painel SISTEMA é feita sem filtro de `tenant_id`, pois o objetivo é visualizar dados de todos os tenants. Fora desse contexto, o filtro `tenant_id` é sempre obrigatório.

---

### 2.1 Telas do Painel SISTEMA

| Tela / Módulo | Funcionalidade | Dados Exibidos |
|---------------|----------------|----------------|
| Dashboard Global | Visão macro de toda a plataforma | Total de tenants ativos, inativos, suspensos; usuários totais; FVS geradas no mês |
| Gestão de Clientes | Lista de todas as construtoras cadastradas | Nome, slug, plano, status, data de cadastro, próximo vencimento |
| Detalhe do Cliente | Perfil completo de uma construtora | Obras, usuários, volume de inspeções, histórico de pagamentos, log de atividade |
| Gestão de Assinaturas | Controle manual de mensalidades | Plano, valor, vencimento, status (Pago/Pendente/Atrasado), observações |
| Ações de Tenant | Administração de acesso | Ativar, Suspender, Cancelar, Alterar plano de um cliente |
| Planos e Preços | Cadastro dos planos do SaaS | Nome, limites (obras, usuários, FVS/mês), valor mensal |
| Logs de Acesso | Auditoria de uso da plataforma | Qual tenant acessou o quê e quando |

---

### 2.2 Gestão Manual de Mensalidades

No estágio inicial, o processo de cobrança é 100% manual. O sistema fornece a estrutura para registrar e acompanhar os pagamentos; a operação financeira (PIX, boleto, etc.) acontece fora do sistema.

| # | Etapa | Ação | Responsável |
|---|-------|------|-------------|
| 1 | Cadastro do Cliente | Você cria o tenant no painel SISTEMA, define o plano e a data de vencimento | Você (SISTEMA) |
| 2 | Geração de Fatura | Sistema cria registro na tabela `invoices` com status `PENDING` e data de vencimento | Automático |
| 3 | Cobrança Manual | Você realiza a cobrança por PIX, boleto ou transferência fora do sistema | Você (SISTEMA) |
| 4 | Confirmação de Pagamento | Você marca a fatura como `PAID` no painel e registra a data e forma de pagamento | Você (SISTEMA) |
| 5 | Alerta de Atraso | Se vencimento passar sem pagamento, sistema alerta você e muda status para `OVERDUE` | Automático |
| 6 | Suspensão | Você decide suspender o acesso do tenant; um clique muda `tenant.status` para `SUSPENDED` | Você (SISTEMA) |
| FUTURO | Gateway Automático | Campo `gateway_subscription_id` na tabela `subscriptions` receberá o ID do gateway de pagamento | Integração futura |

> **Preparação para gateway futuro:** A coluna `gateway_subscription_id` na tabela `subscriptions` e a coluna `payment_method` na tabela `invoices` já estão reservadas e são nullable. Quando a integração com gateway de pagamento for feita, esses campos receberão os IDs externos sem necessidade de alterar o schema.

---

### 2.3 Controle de Acesso por Status do Tenant

- **ACTIVE** — Acesso normal a todos os módulos do sistema
- **SUSPENDED** — Login bloqueado para todos os usuários do tenant; dados preservados integralmente
- **CANCELLED** — Acesso encerrado; dados mantidos por período de retenção definido (ex: 90 dias) para eventual reativação
- A mudança de status é feita com um único clique no painel SISTEMA e reflete imediatamente

---

## 3. Painel Tenant — Menus e Telas (FVS)

Todo dado exibido é automaticamente filtrado pelo `tenant_id` da organização autenticada, garantindo isolamento total entre clientes.

| Módulo | Submenu / Tela | Perfil de Acesso |
|--------|----------------|------------------|
| Dashboard | Visão geral da obra ativa com KPIs | Todos |
| Operação > Minhas Inspeções | Lista de FVS do inspetor logado | Inspetor / Supervisor |
| Operação > Nova FVS | Formulário dinâmico de coleta em campo | Inspetor / Supervisor |
| Operação > Planejamento | Calendário mensal de inspeções previstas | Supervisor / Admin |
| Qualidade > Pendências | Central de itens Não Conformes e atrasados | Supervisor / Admin |
| Qualidade > Retrabalhos | Lista de serviços reprovados para correção | Supervisor / Admin |
| Qualidade > Realizados | Histórico de FVS com status OK | Todos |
| Relatórios > FVS PDF | Geração de ficha assinada em PDF | Supervisor / Admin |
| Config > Obras | Cadastro e edição de projetos | Admin |
| Config > Locais | Hierarquia física da obra | Admin |
| Config > Serviços | Critérios e normas técnicas dos serviços | Admin |
| Config > Inspetores | Gestão de usuários e permissões | Admin |
| Notificações | Central de alertas internos e histórico | Todos |

---

### 3.1 Detalhamento das Telas Principais

#### Dashboard (Estatísticas)
Exibe KPIs da obra ativa selecionada no header. Componentes: cards de resumo (total de inspeções, % conformidade, pendências abertas), gráfico de barras por serviço e ranking de produtividade por inspetor.

#### Nova FVS (Formulário de Campo)
O inspetor seleciona Obra > Local > Serviço; o sistema carrega automaticamente os critérios do serviço e renderiza o formulário dinâmico. Para cada critério: Conforme, Não Conforme ou Não Aplicável, com upload de foto e campo de observação. Suporte offline com sincronização automática ao retornar conexão.

#### Pendências
Painel automático alimentado por três regras:
1. **Atraso de Cronograma** — item planejado no mês sem FVS iniciada
2. **Falha Técnica** — qualquer critério Não Conforme
3. **Inspeção Incompleta** — FVS iniciada com critérios obrigatórios em branco

Exibe contador de dias em aberto para priorização.

#### Relatório FVS em PDF
Gerado automaticamente ao fechar uma FVS ou sob demanda. Inclui: identificação da obra, local, serviço e inspetor; tabela de critérios com resultado e data; fotos de evidência; assinatura digital; histórico de revisões (versão 01 reprovada, versão 02 aprovada).

---

## 4. Modelagem do Banco de Dados

O banco é dividido em duas camadas lógicas:
- **Camada Plataforma** — dados globais (planos, tenants, billing), acessada exclusivamente pelo perfil SISTEMA
- **Camada Tenant** — dados operacionais de cada construtora, sempre filtrada por `tenant_id`

---

### 4.1 Camada Plataforma (Painel SISTEMA)

| Tabela | Camada | Descrição | Colunas Principais |
|--------|--------|-----------|--------------------|
| `system_users` | Plataforma | Usuários com perfil SISTEMA (você e sua equipe de suporte) | `id, name, email, role (SYSTEM/SUPPORT), active, created_at` |
| `plans` | Plataforma | Planos disponíveis no SaaS com seus limites e preços | `id, name, max_projects, max_users, max_fvs_month, price_brl, active` |
| `subscriptions` | Plataforma | Assinatura ativa de cada tenant — coração do billing | `id, tenant_id, plan_id, status, current_period_start, current_period_end, gateway_subscription_id (nullable)` |
| `invoices` | Plataforma | Histórico de faturas (manual por ora, automático no futuro) | `id, subscription_id, amount_brl, due_date, paid_at, status (PENDING/PAID/OVERDUE/CANCELLED), notes, payment_method` |
| `tenant_usage` | Plataforma | Snapshot mensal de consumo do tenant (para billing e limites) | `id, tenant_id, month, year, projects_count, users_count, fvs_count, inspections_count` |
| `audit_logs` | Plataforma | Log de toda ação feita pelo perfil SISTEMA em qualquer tenant | `id, system_user_id, action, target_tenant_id, metadata (JSON), created_at` |

---

### 4.2 Camada Tenant (Painel Construtora)

| Tabela | Origem (Planilha) | Descrição | Colunas Principais |
|--------|-------------------|-----------|--------------------|
| `tenants` | SaaS / Multitenancy | Representa cada construtora/cliente do SaaS | `id, name, slug, plan_id, status (ACTIVE/SUSPENDED/CANCELLED), created_at` |
| `users` | Aba Inspetores | Usuários vinculados ao tenant | `id, tenant_id, name, sigla, role, active` |
| `projects` | Aba Menu (Obra) | Obras ativas de cada construtora | `id, tenant_id, name, address, active, created_at` |
| `locations` | Aba Locais | Pontos físicos de inspeção dentro de uma obra | `id, project_id, name, description, active` |
| `services` | Aba Serviços | Dicionário de serviços disponíveis (ex: Alvenaria, Piso) | `id, tenant_id, name, active` |
| `service_criteria` | Aba Serviços (Critérios) | Itens de verificação de cada serviço com detalhe técnico | `id, service_id, item_name, detail_text, order_index, active` |
| `planning` | Aba Planos | Cronograma mensal de inspeções previstas | `id, project_id, location_id, service_id, month, year, is_done, created_at` |
| `inspections` | Aba Inspeções (FVS) | Cabeçalho da FVS que une local, serviço e inspetor | `id, project_id, location_id, service_id, inspector_id, status, observations, version, created_at, updated_at` |
| `inspection_results` | Aba Inspeções (Critérios) | Resultado individual de cada critério dentro de uma FVS | `id, inspection_id, criterion_id, result, photo_url, collected_at` |
| `notifications` | Sistema de Alertas | Notificações internas geradas automaticamente | `id, tenant_id, user_id, type, title, message, link, is_read, read_at, created_at` |

---

### 4.3 Regras de Negócio nas Tabelas

- `tenants.status`: enum `ACTIVE | SUSPENDED | CANCELLED` — controlado exclusivamente pelo perfil SISTEMA
- `subscriptions.gateway_subscription_id`: nullable agora, receberá o ID do gateway de pagamento na integração futura
- `invoices.payment_method`: campo texto livre agora (ex: `'PIX'`, `'TED'`); no futuro receberá dados do gateway
- `inspections.status`: `PENDENTE_INICIO | EM_ANDAMENTO | PENDENTE_OCORRENCIA | PENDENTE_CONCLUIR | OK`
- `inspections.version`: incrementado a cada ciclo de retrabalho; histórico completo preservado
- `tenant_usage`: snapshot mensal gerado automaticamente para controle de limites do plano e billing

---

## 5. Relacionamentos entre Tabelas

| Tabela Origem | Tabela Destino | Tipo | Descrição |
|---------------|----------------|------|-----------|
| `plans` | `subscriptions` | 1:N | Um plano pode ter vários tenants assinantes |
| `tenants` | `subscriptions, invoices` | 1:N | Cada construtora tem uma assinatura ativa e várias faturas |
| `subscriptions` | `invoices` | 1:N | Uma assinatura gera uma fatura por ciclo de cobrança |
| `tenants` | `users, projects, tenant_usage` | 1:N | Uma construtora possui usuários, obras e snapshots de uso |
| `projects` | `locations, planning, inspections` | 1:N | Uma obra possui locais, planos e inspeções |
| `services` | `service_criteria` | 1:N | Um serviço possui vários critérios de verificação |
| `inspections` | `inspection_results` | 1:N | Uma FVS possui N resultados (um por critério do serviço) |
| `users` | `inspections, notifications` | 1:N | Um inspetor executa várias FVS e recebe notificações |
| `system_users` | `audit_logs` | 1:N | Cada ação do perfil SISTEMA gera um log de auditoria |

---

### 5.1 Hierarquia de Dados

```
Plataforma (Painel SISTEMA)
└── Plans (Planos do SaaS)
       └── Tenants (Construtoras)
              ├── Subscriptions (Assinatura ativa)
              │       └── Invoices (Faturas / histórico de pagamento)
              ├── Tenant_Usage (Consumo mensal)
              └── Users + Projects (Operação da obra)
                     └── Locations / Services / Criteria
                            └── Planning > Inspections > Inspection_Results
```

---

## 6. Fluxo de Processos — FVS

| # | Etapa | Ação no Sistema | Tabelas Envolvidas |
|---|-------|-----------------|--------------------|
| 1 | Planejamento | Admin cria cronograma mensal vinculando local e serviço | `planning` |
| 2 | Abertura da FVS | Inspetor seleciona Obra > Local > Serviço; sistema carrega critérios automaticamente | `inspections, service_criteria` |
| 3 | Coleta em Campo | Inspetor preenche Conforme/NC para cada critério e anexa fotos | `inspection_results` |
| 4 | Validação Automática | Se qualquer resultado for NC, status da FVS vira `PENDENTE_OCORRENCIA` | `inspections.status` |
| 5 | Notificação | Alerta disparado in-app e e-mail para o Supervisor | `notifications` |
| 6 | Retrabalho | Supervisor registra ação corretiva; inspetor realiza nova inspeção no mesmo local | `inspections (versão 2+)` |
| 7 | Aprovação Final | Todos os critérios Conformes: FVS recebe status OK; `planning.is_done = true` | `inspections, planning` |
| 8 | Relatório | Sistema gera PDF da FVS com histórico de revisões e assinatura digital | `inspection_results` |
| 9 | Estatísticas | Dashboard recalcula KPIs de conformidade | `inspections, inspection_results` |

---

## 7. Sistema de Notificações

| Gatilho | Canal | Destinatário |
|---------|-------|--------------|
| Critério marcado como Não Conforme | In-app + E-mail imediato | Supervisor da obra |
| FVS finalizada com status OK | In-app + E-mail com PDF | Supervisor + Admin |
| Item do planejamento em atraso | In-app + E-mail diário | Admin da obra |
| Retrabalho registrado aguardando correção | In-app | Inspetor responsável + Supervisor |
| Fatura com vencimento próximo (3 dias) | E-mail interno | Você (perfil SISTEMA) |
| Fatura em atraso (OVERDUE) | E-mail interno | Você (perfil SISTEMA) |

---

*Documento de Especificação — FVS SaaS v2.0 — Fevereiro 2026*
