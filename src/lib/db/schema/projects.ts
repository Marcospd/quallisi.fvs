import { pgTable, uuid, varchar, boolean, timestamp, text, index, date } from 'drizzle-orm/pg-core'
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
    // Campos novos — dados do contrato e responsáveis
    clientName: varchar('client_name', { length: 255 }),
    contractNumber: varchar('contract_number', { length: 100 }),
    startDate: date('start_date'),
    endDate: date('end_date'),
    engineerName: varchar('engineer_name', { length: 255 }),
    supervision: varchar('supervision', { length: 255 }),
    characteristics: text('characteristics'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('projects_tenant_idx').on(table.tenantId),
])
