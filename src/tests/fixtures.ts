// src/tests/fixtures.ts
// Dados de teste padronizados para Vitest e Playwright
// Usar sempre estes dados nos testes — nunca criar dados ad-hoc

import { v4 as uuid } from 'uuid'

// ─── IDs FIXOS DE TESTE ────────────────────────────────────────
// IDs fixos garantem reprodutibilidade dos testes

export const TEST_IDS = {
  // Empresas
  companyA: 'aaaaaaaa-0000-0000-0000-000000000001',
  companyB: 'bbbbbbbb-0000-0000-0000-000000000002',

  // Usuários
  systemUser:  'cccccccc-0000-0000-0000-000000000001',
  sellerUser:  'cccccccc-0000-0000-0000-000000000002',
  adminUserA:  'cccccccc-0000-0000-0000-000000000003',
  userUserA:   'cccccccc-0000-0000-0000-000000000004',
  adminUserB:  'cccccccc-0000-0000-0000-000000000005',

  // Grupos de permissão
  groupAdminA: 'dddddddd-0000-0000-0000-000000000001',
  groupUserA:  'dddddddd-0000-0000-0000-000000000002',
} as const

// ─── USUÁRIOS DE TESTE ─────────────────────────────────────────

export const TEST_USERS = {
  system: {
    id:        TEST_IDS.systemUser,
    email:     'system@plataforma.com',
    name:      'Sistema Admin',
    role:      'system' as const,
    companyId: null,
  },
  seller: {
    id:        TEST_IDS.sellerUser,
    email:     'seller@plataforma.com',
    name:      'Vendedor Teste',
    role:      'seller' as const,
    companyId: null,
  },
  adminA: {
    id:        TEST_IDS.adminUserA,
    email:     'admin@empresa-a.com',
    name:      'Admin Empresa A',
    role:      'admin' as const,
    companyId: TEST_IDS.companyA,
  },
  userA: {
    id:        TEST_IDS.userUserA,
    email:     'user@empresa-a.com',
    name:      'Usuário Empresa A',
    role:      'user' as const,
    companyId: TEST_IDS.companyA,
  },
  adminB: {
    id:        TEST_IDS.adminUserB,
    email:     'admin@empresa-b.com',
    name:      'Admin Empresa B',
    role:      'admin' as const,
    companyId: TEST_IDS.companyB,
  },
} as const

// ─── EMPRESAS DE TESTE ─────────────────────────────────────────

export const TEST_COMPANIES = {
  companyA: {
    id:     TEST_IDS.companyA,
    name:   'Empresa A Teste',
    slug:   'empresa-a',
    status: 'active' as const,
    plan:   'pro' as const,
  },
  companyB: {
    id:     TEST_IDS.companyB,
    name:   'Empresa B Teste',
    slug:   'empresa-b',
    status: 'active' as const,
    plan:   'starter' as const,
  },
  companySuspended: {
    id:     uuid(),
    name:   'Empresa Suspensa',
    slug:   'empresa-suspensa',
    status: 'suspended' as const,
    plan:   'starter' as const,
  },
} as const

// ─── CONTEXTOS DE AUTH ─────────────────────────────────────────
// Usar para mockar getAuthContext() nos testes de actions

export const AUTH_CONTEXTS = {
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
} as const

// ─── FACTORIES ─────────────────────────────────────────────────
// Criar dados de teste com valores padrão + override

export function makeUser(overrides: Partial<typeof TEST_USERS.adminA> = {}) {
  return {
    id:        uuid(),
    email:     `user-${Date.now()}@teste.com`,
    name:      'Usuário Teste',
    role:      'user' as const,
    companyId: TEST_IDS.companyA,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeCompany(overrides: Partial<typeof TEST_COMPANIES.companyA> = {}) {
  const slug = `empresa-${Date.now()}`
  return {
    id:        uuid(),
    name:      'Empresa Teste',
    slug,
    status:    'active' as const,
    plan:      'starter' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// ─── MOCKS PADRÃO ──────────────────────────────────────────────
// Usar com vi.mock() nos testes de actions

export function mockAuthAs(context: keyof typeof AUTH_CONTEXTS) {
  const ctx = AUTH_CONTEXTS[context]
  return {
    user:    ctx.user,
    company: ctx.company,
  }
}

export function mockPermission(allowed: boolean) {
  return vi.fn().mockResolvedValue(allowed)
}

export function mockDbInsert(returnValue: Record<string, unknown>) {
  return vi.fn().mockResolvedValue([returnValue])
}

export function mockDbSelect(returnValue: unknown[]) {
  return vi.fn().mockResolvedValue(returnValue)
}
