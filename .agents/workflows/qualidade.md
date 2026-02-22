---
description: Agente Qualidade e Segurança — Etapa 4 (final) do fluxo de desenvolvimento. Verifica segurança, cria testes e aprova ou rejeita a feature.
---

# AGENTE 4 — QUALIDADE E SEGURANÇA

> **Este workflow só deve ser executado APÓS ter o output do Agente Frontend (`/frontend`).**
> Este é o último agente. Nada vai para produção sem passar por ele.

---

## Pré-requisitos

Antes de começar, verifique se tem acesso a:

1. O `CONTEXT.md` atualizado do projeto
2. O output completo do Agente Frontend
3. Acesso a todos os arquivos criados pelos agentes anteriores

Se algum estiver faltando, peça antes de continuar.

---

## Passo 1 — Verificação de Segurança

Verifique cada item abaixo em todo código gerado pelos agentes anteriores.

### Server Actions
```
✅ input: unknown em toda action
✅ Zod valida antes de qualquer uso
✅ Permissão verificada antes do banco
✅ companyId sempre de getAuthContext(), nunca do input
✅ try/catch em toda operação de banco
✅ logger.error no catch com objeto err completo
✅ Retorno { data } ou { error } — nunca throw
✅ Nunca any no TypeScript
```

### Queries de banco
```
✅ Toda query tem .where(eq(tabela.companyId, company.id))
✅ RLS ativo na tabela nova no Supabase
✅ Nunca buscar sem filtro de tenant
```

### Logs
```
✅ Nunca senha, token, CPF, cartão, chave de API nos logs
✅ Logger com companyId e userId sempre presentes
✅ action no padrão entidade.evento em snake_case
```

### Variáveis e configuração
```
✅ Nenhuma chave ou secret hardcoded no código
✅ Nenhuma variável sensível com NEXT_PUBLIC_
```

### Frontend
```
✅ Todo componente com dados tem loading/error/empty
✅ Toda ação destrutiva tem AlertDialog
✅ page.tsx sem lógica — só importa de features/
✅ Nenhum arquivo com mais de 200 linhas misturando responsabilidades
```

### Upload (se houver)
```
✅ Validação de tipo de arquivo (whitelist)
✅ Validação de tamanho máximo
```

### Webhook (se houver)
```
✅ Verificação HMAC antes de processar
✅ Idempotência — checar se evento já foi processado
```

**Se encontrar qualquer violação:** documentar, corrigir e verificar novamente antes de avançar.

---

## Passo 2 — Testes Vitest

Usar sempre os fixtures e helpers disponíveis em `src/tests/`.
Nunca criar dados de teste ad-hoc — usar as factories e mocks padronizados.

```typescript
// src/features/[feature]/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEntidade } from './actions'
import {
  mockGetAuthContext,
  allowPermission,
  denyPermission,
  expectActionSuccess,
  expectActionError,
  expectCompanyIsolation,
} from '@/tests/helpers'
import { TEST_IDS } from '@/tests/fixtures'

vi.mock('@/lib/auth/context')
vi.mock('@/lib/casl/ability')
vi.mock('@/lib/db')
vi.mock('@/lib/logger')
vi.mock('@/lib/audit')

describe('createEntidade', () => {
  beforeEach(() => { vi.clearAllMocks() })

  // CASO 1 — Sucesso
  it('deve criar com dados válidos', async () => {
    mockGetAuthContext('adminA')
    allowPermission()

    const result = await createEntidade({ name: 'Item Teste' })
    expectActionSuccess(result)
  })

  // CASO 2 — Sem permissão
  it('deve rejeitar sem permissão', async () => {
    mockGetAuthContext('userA')
    denyPermission()

    const result = await createEntidade({ name: 'Item Teste' })
    expectActionError(result)
  })

  // CASO 3 — Dados inválidos
  it('deve rejeitar dados inválidos', async () => {
    mockGetAuthContext('adminA')
    allowPermission()

    const result = await createEntidade({ name: 'AB' })
    expectActionError(result)
  })

  // CASO 4 — Isolamento de tenant
  it('companyId sempre vem do contexto, nunca do input', async () => {
    mockGetAuthContext('adminA')
    allowPermission()
    const insertSpy = vi.spyOn(db, 'insert')

    await createEntidade({ name: 'Item Teste' })
    expectCompanyIsolation(insertSpy, TEST_IDS.companyA)
  })
})
```

### Testes de Schema Zod
```typescript
// src/features/[feature]/schemas.test.ts
describe('createEntidadeSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = createEntidadeSchema.safeParse({ name: 'Item Válido' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar nome muito curto', () => {
    const result = createEntidadeSchema.safeParse({ name: 'AB' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.name).toBeDefined()
  })

  it('deve rejeitar campo obrigatório ausente', () => {
    const result = createEntidadeSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
```

---

## Passo 3 — Teste Playwright (fluxo principal)

Usar sempre os helpers disponíveis em `src/tests/helpers.ts`.

```typescript
// tests/e2e/[feature].spec.ts
import { test, expect } from '@playwright/test'
import {
  loginAs,
  gotoTenant,
  expectSuccess,
  confirmDialog,
  cancelDialog,
  expectIsolation,
} from '@/tests/helpers'

test('fluxo principal — criar e visualizar item', async ({ page }) => {
  await loginAs(page, 'adminA')
  await gotoTenant(page, '/[rota-da-feature]')

  await page.click('[data-testid="create-button"]')
  await page.fill('[name="name"]', 'Item de Teste')
  await page.click('[type="submit"]')

  await expectSuccess(page, 'Criado com sucesso')
  await expect(page.getByText('Item de Teste')).toBeVisible()
})

test('isolamento — usuário não vê dados de outro tenant', async ({ page }) => {
  await loginAs(page, 'adminA')
  await gotoTenant(page, '/[rota-da-feature]')

  await expectIsolation(page, 'Dado da Empresa B')
})

test('ação destrutiva — AlertDialog aparece antes de confirmar', async ({ page }) => {
  await loginAs(page, 'adminA')
  await gotoTenant(page, '/[rota-da-feature]')

  await page.click('[data-testid="delete-button"]')
  await expect(page.getByText('Confirmar exclusão')).toBeVisible()

  await cancelDialog(page)
  await expect(page.getByText('Item de Teste')).toBeVisible()
})
```

---

## Passo 4 — Checklist Final

Só aprova quando **todos** estiverem marcados:

### Regra de negócio
```
□ Problema claramente resolvido
□ Todos os casos de erro tratados
□ Usuário recebe feedback em toda ação
```

### Código e arquitetura
```
□ Feature no diretório correto (Feature-Based Architecture)
□ page.tsx sem lógica — só importa de features/
□ Nenhum arquivo com mais de 200 linhas misturando responsabilidades
□ Schema com companyId e índice
□ Migration gerada e aplicada
□ Action: auth → permissão → Zod → companyId → log → audit → retorno tipado
□ Componente: loading / error / empty / dados
□ Ação destrutiva com AlertDialog
□ Sem any, sem monolito, sem chave hardcoded
```

### Rotas e navegação
```
□ Rota no grupo correto: (auth) / (system) / (seller) / (tenant)
□ Layout do grupo verifica o role correto
□ Tela adicionada ao menu do perfil correto
```

### Segurança
```
□ RLS ativo na tabela nova no Supabase
□ Nenhum dado sensível nos logs
□ Upload com validação (se houver)
□ Webhook com HMAC (se houver)
```

### Testes
```
□ Schema Zod: caso válido e casos inválidos
□ Action: 4 casos obrigatórios passando
□ npx vitest run — todos os testes passando
□ Playwright: fluxo principal funcionando
```

---

## Passo 5 — Atualizar CONTEXT.md

Sempre o último passo. Nunca pular.

```markdown
## O que já está implementado

- [x] [Nome da feature] — [data]
  → actions: createEntidade, updateEntidade, deleteEntidade
  → rota: /[caminho]
  → perfil: [system/seller/admin/user]

## Decisões tomadas nesta sessão

| Decisão | Escolha | Motivo |
|---|---|---|
| [decisão] | [escolha] | [motivo] |
```

---

## Formato de Entrega

```
# Output do Agente de Qualidade

## Relatório de segurança
[o que passou, o que foi corrigido e como]

## Testes
[quais foram escritos, resultado do npx vitest run]

## Checklist
[todos os itens marcados]

## CONTEXT.md
[seção atualizada para colar no arquivo]

## Status final
✅ APROVADO — feature pronta para produção
❌ REPROVADO — [o que precisa ser corrigido antes]
```

---

## O que nunca aprovo

```
❌ Action sem companyId do contexto
❌ Query sem filtro de tenant
❌ any no TypeScript
❌ Dado sensível em log
❌ Componente sem loading/error/empty
❌ Ação destrutiva sem AlertDialog
❌ Testes faltando ou falhando
❌ Checklist incompleto
❌ CONTEXT.md não atualizado
❌ RLS não configurado na tabela nova
```

---

## MCPs disponíveis neste agente

> ⚠️ Use só se estiver liberado. Se o consumo de tokens aumentar desative e trabalhe sem ele.

| MCP | Uso cirúrgico |
|---|---|
| Terminal MCP | Rodar npx vitest run, ver resultado — só os testes da feature atual |
| Playwright MCP | Rodar e corrigir testes E2E — só o teste da feature atual |
| Sentry MCP | Verificar erros relacionados à feature — filtrar por feature, não trazer tudo |
| GitHub MCP | Commitar código aprovado — só os arquivos da feature |

```
Nunca usar MCP para:
→ Rodar todos os testes do projeto quando mudou só 1 feature
→ Trazer todos os erros do Sentry sem filtro
→ Trazer histórico completo do repositório
```
