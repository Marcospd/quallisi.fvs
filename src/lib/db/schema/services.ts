import { pgTable, uuid, varchar, boolean, timestamp, text, integer, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

/**
 * Serviços de engenharia disponíveis para FVS.
 * Ex: Alvenaria, Revestimento, Impermeabilização.
 * Vinculado ao tenant — cada construtora tem seus serviços.
 */
export const services = pgTable('services', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    unit: varchar('unit', { length: 50 }),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('services_tenant_idx').on(table.tenantId),
])

/**
 * Critérios de verificação de um serviço.
 * Cada serviço tem N critérios que o inspetor avalia no campo.
 * Ex: "Prumo dentro da tolerância", "Argamassa aplicada uniformemente".
 */
export const criteria = pgTable('criteria', {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
    description: text('description').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('criteria_service_idx').on(table.serviceId),
])
