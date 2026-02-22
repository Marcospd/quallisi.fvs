import { pgTable, uuid, varchar, boolean, timestamp, text, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

/**
 * Obras ativas de cada construtora.
 * Sempre filtrar por tenantId — isolamento obrigatório.
 */
export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    address: text('address'),
    imageUrl: text('image_url'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('projects_tenant_idx').on(table.tenantId),
])
