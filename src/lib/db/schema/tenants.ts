import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

/**
 * Tabela de tenants (construtoras) — base do multi-tenancy.
 * Cada construtora é um tenant isolado no sistema.
 *
 * Status:
 * - ACTIVE: acesso normal
 * - SUSPENDED: login bloqueado, dados preservados
 * - CANCELLED: acesso encerrado, dados mantidos por 90 dias
 */
export const tenants = pgTable('tenants', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
})
