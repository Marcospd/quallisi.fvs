import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core'

/**
 * Tabela de usuários do Painel SISTEMA.
 * Isolada dos tenants — acesso exclusivo do dono do SaaS.
 * Rota protegida separada (/system/*).
 *
 * Roles:
 * - SYSTEM: superadmin da plataforma
 * - SUPPORT: equipe de suporte
 */
export const systemUsers = pgTable('system_users', {
    id: uuid('id').primaryKey().defaultRandom(),
    authId: uuid('auth_id').notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    role: varchar('role', { length: 50 }).notNull().default('SYSTEM'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
})
