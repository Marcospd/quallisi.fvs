import { pgTable, uuid, varchar, boolean, timestamp, text, integer, index } from 'drizzle-orm/pg-core'
import { projects } from './projects'
import { services } from './services'
import { locations } from './locations'
import { users } from './users'
import { criteria } from './services'

/**
 * Inspeções FVS — ficha de verificação de serviço.
 * Cada inspeção registra a avaliação de um serviço em um local.
 *
 * Status: DRAFT → IN_PROGRESS → COMPLETED
 * result: APPROVED | APPROVED_WITH_RESTRICTIONS (com pendências geradas automaticamente)
 */
export const inspections = pgTable('inspections', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projects.id).notNull(),
    serviceId: uuid('service_id').references(() => services.id).notNull(),
    locationId: uuid('location_id').references(() => locations.id).notNull(),
    inspectorId: uuid('inspector_id').references(() => users.id).notNull(),
    supervisorId: uuid('supervisor_id').references(() => users.id),
    referenceMonth: varchar('reference_month', { length: 7 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('DRAFT'),
    result: varchar('result', { length: 30 }),
    notes: text('notes'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('inspections_project_idx').on(table.projectId),
    index('inspections_inspector_idx').on(table.inspectorId),
    index('inspections_month_idx').on(table.referenceMonth),
    index('inspections_status_idx').on(table.status),
    index('inspections_result_idx').on(table.result),
])

/**
 * Avaliação de cada critério dentro de uma inspeção.
 * O inspetor avalia C (conforme), NC (não conforme), NA (não aplicável).
 */
export const inspectionItems = pgTable('inspection_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    inspectionId: uuid('inspection_id').references(() => inspections.id, { onDelete: 'cascade' }).notNull(),
    criterionId: uuid('criterion_id').references(() => criteria.id).notNull(),
    evaluation: varchar('evaluation', { length: 5 }),
    notes: text('notes'),
    photoUrl: text('photo_url'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('inspection_items_inspection_idx').on(table.inspectionId),
    index('inspection_items_evaluation_idx').on(table.evaluation),
])
