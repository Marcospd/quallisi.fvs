// src/tests/helpers.ts
// Funções reutilizáveis para Vitest e Playwright
// Importar nos testes para evitar repetição de código

import type { Page } from '@playwright/test'
import { TEST_USERS, TEST_COMPANIES, TEST_IDS } from './fixtures'

// ─── HELPERS PLAYWRIGHT (E2E) ──────────────────────────────────

/**
 * Faz login com um usuário de teste
 * Usar no início de todo teste E2E que precisa de sessão
 */
export async function loginAs(
  page: Page,
  role: keyof typeof TEST_USERS
) {
  const user = TEST_USERS[role]

  await page.goto('/login')
  await page.fill('[name="email"]', user.email)
  await page.fill('[name="password"]', process.env.TEST_PASSWORD ?? 'senha-de-teste-123')
  await page.click('[type="submit"]')

  // Aguardar redirecionamento pós-login
  if (role === 'system') {
    await page.waitForURL('/system')
  } else if (role === 'seller') {
    await page.waitForURL('/seller')
  } else {
    await page.waitForURL(/\/dashboard/)
  }
}

/**
 * Navega para uma rota do tenant correto
 */
export async function gotoTenant(
  page: Page,
  path: string,
  company: keyof typeof TEST_COMPANIES = 'companyA'
) {
  const slug = TEST_COMPANIES[company].slug
  await page.goto(`/${slug}${path}`)
}

/**
 * Verifica que um toast de sucesso apareceu
 */
export async function expectSuccess(page: Page, message: string) {
  await page.waitForSelector(`text=${message}`, { timeout: 5000 })
}

/**
 * Verifica que um toast de erro apareceu
 */
export async function expectError(page: Page, message: string) {
  await page.waitForSelector(`text=${message}`, { timeout: 5000 })
}

/**
 * Confirma um AlertDialog
 */
export async function confirmDialog(page: Page) {
  await page.click('[data-testid="confirm-button"]')
}

/**
 * Cancela um AlertDialog
 */
export async function cancelDialog(page: Page) {
  await page.click('[data-testid="cancel-button"]')
}

/**
 * Verifica isolamento de tenant
 * Garante que usuário de uma empresa não vê dados de outra
 */
export async function expectIsolation(
  page: Page,
  textFromOtherTenant: string
) {
  const element = page.getByText(textFromOtherTenant)
  await expect(element).not.toBeVisible()
}

/**
 * Verifica redirecionamento de tenant suspenso
 */
export async function expectSuspendedRedirect(page: Page) {
  await page.waitForURL('/blocked?status=suspended')
}

// ─── HELPERS VITEST (UNITÁRIO) ─────────────────────────────────

/**
 * Mocka getAuthContext() para retornar um contexto específico
 *
 * Uso:
 *   vi.mock('@/lib/auth/context')
 *   mockGetAuthContext('adminA')
 */
export function mockGetAuthContext(
  role: 'system' | 'seller' | 'adminA' | 'userA' | 'adminB'
) {
  const contexts = {
    system: {
      user:    TEST_USERS.system,
      company: null,
    },
    seller: {
      user:    TEST_USERS.seller,
      company: null,
    },
    adminA: {
      user:    TEST_USERS.adminA,
      company: TEST_COMPANIES.companyA,
    },
    userA: {
      user:    TEST_USERS.userA,
      company: TEST_COMPANIES.companyA,
    },
    adminB: {
      user:    TEST_USERS.adminB,
      company: TEST_COMPANIES.companyB,
    },
  }

  const { getAuthContext } = require('@/lib/auth/context')
  vi.mocked(getAuthContext).mockResolvedValue(contexts[role])
}

/**
 * Mocka checkPermission() para permitir ou negar
 *
 * Uso:
 *   vi.mock('@/lib/casl/ability')
 *   allowPermission()   // permite tudo
 *   denyPermission()    // nega tudo
 */
export function allowPermission() {
  const { checkPermission } = require('@/lib/casl/ability')
  vi.mocked(checkPermission).mockResolvedValue(true)
}

export function denyPermission() {
  const { checkPermission } = require('@/lib/casl/ability')
  vi.mocked(checkPermission).mockResolvedValue(false)
}

/**
 * Verifica que uma action retornou erro
 */
export function expectActionError(
  result: { data?: unknown; error?: unknown }
) {
  expect(result.error).toBeDefined()
  expect(result.data).toBeUndefined()
}

/**
 * Verifica que uma action retornou sucesso
 */
export function expectActionSuccess(
  result: { data?: unknown; error?: unknown }
) {
  expect(result.data).toBeDefined()
  expect(result.error).toBeUndefined()
}

/**
 * Verifica que o companyId inserido no banco
 * veio do contexto, nunca do input
 *
 * Uso:
 *   const insertSpy = vi.spyOn(db, 'insert')
 *   await createEntidade({ name: 'Teste', companyId: 'outro-id' })
 *   expectCompanyIsolation(insertSpy, TEST_IDS.companyA)
 */
export function expectCompanyIsolation(
  insertSpy: ReturnType<typeof vi.spyOn>,
  expectedCompanyId: string
) {
  expect(insertSpy).toHaveBeenCalledWith(
    expect.objectContaining({ companyId: expectedCompanyId })
  )
  expect(insertSpy).not.toHaveBeenCalledWith(
    expect.objectContaining({ companyId: expect.not.stringContaining(expectedCompanyId) })
  )
}

// ─── TEMPLATE DE TESTE DE ACTION ───────────────────────────────
// Copiar e adaptar para cada nova action

/*
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

  it('deve criar com dados válidos', async () => {
    mockGetAuthContext('adminA')
    allowPermission()

    const result = await createEntidade({ name: 'Item Teste' })
    expectActionSuccess(result)
  })

  it('deve rejeitar sem permissão', async () => {
    mockGetAuthContext('userA')
    denyPermission()

    const result = await createEntidade({ name: 'Item Teste' })
    expectActionError(result)
  })

  it('deve rejeitar dados inválidos', async () => {
    mockGetAuthContext('adminA')
    allowPermission()

    const result = await createEntidade({ name: 'AB' })
    expectActionError(result)
  })

  it('companyId sempre vem do contexto', async () => {
    mockGetAuthContext('adminA')
    allowPermission()
    const insertSpy = vi.spyOn(db, 'insert')

    await createEntidade({ name: 'Item Teste' })
    expectCompanyIsolation(insertSpy, TEST_IDS.companyA)
  })
})
*/
