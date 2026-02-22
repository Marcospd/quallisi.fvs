import type { InferSelectModel } from 'drizzle-orm'
import type { users } from '@/lib/db/schema/users'
import type { systemUsers } from '@/lib/db/schema/system-users'
import type { tenants } from '@/lib/db/schema/tenants'

/** Usuário do tenant (construtora) */
export type TenantUser = InferSelectModel<typeof users>

/** Usuário do Painel SISTEMA */
export type SystemUser = InferSelectModel<typeof systemUsers>

/** Tenant (construtora) */
export type Tenant = InferSelectModel<typeof tenants>

/** Contexto de autenticação retornado pelo getAuthContext() */
export type AuthContext = {
    user: TenantUser
    tenant: Tenant
}

/** Contexto de autenticação do Painel SISTEMA */
export type SystemAuthContext = {
    user: SystemUser
}

/** Roles disponíveis no tenant */
export type TenantRole = 'admin' | 'supervisor' | 'inspetor'

/** Status do tenant */
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
