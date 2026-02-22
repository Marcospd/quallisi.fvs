import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { projects } from './projects'
import { services } from './services'
import { locations } from './locations'

/**
 * Itens do planejamento mensal de FVS.
 * Define quais serviços serão inspecionados em quais locais de cada obra.
 * Base para geração de inspeções FVS.
 *
 * referenceMonth formato: 'YYYY-MM' (ex: '2026-03')
 * status: PLANNED → INSPECTED
 */
export const planningItems = pgTable('planning_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projects.id).notNull(),
    serviceId: uuid('service_id').references(() => services.id).notNull(),
    locationId: uuid('location_id').references(() => locations.id).notNull(),
    referenceMonth: varchar('reference_month', { length: 7 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('PLANNED'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('planning_project_idx').on(table.projectId),
    index('planning_month_idx').on(table.referenceMonth),
])
