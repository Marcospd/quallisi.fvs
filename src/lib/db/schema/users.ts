import { pgTable, uuid, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

/**
 * Tabela de usuários vinculados a um tenant (construtora).
 * Cada usuário tem um authId que referencia o auth.users do Supabase.
 *
 * Roles do tenant:
 * - admin: acesso total dentro da construtora
 * - supervisor: aprovar/reprovar FVS, estatísticas
 * - inspetor: criar/editar próprias inspeções
 */
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    authId: uuid('auth_id').notNull().unique(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    sigla: varchar('sigla', { length: 10 }),
    role: varchar('role', { length: 50 }).notNull().default('inspetor'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('users_tenant_idx').on(table.tenantId),
    index('users_auth_idx').on(table.authId),
])
