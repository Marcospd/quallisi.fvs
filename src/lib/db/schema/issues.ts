import { pgTable, uuid, varchar, boolean, timestamp, text, index } from 'drizzle-orm/pg-core'
import { inspections } from './inspections'
import { users } from './users'

/**
 * Pendências geradas a partir de não-conformidades (NC) nas inspeções.
 * Quando um critério recebe NC, gera uma pendência que precisa ser resolvida.
 *
 * Status: OPEN → IN_PROGRESS → RESOLVED / CANCELLED
 */
export const issues = pgTable('issues', {
    id: uuid('id').primaryKey().defaultRandom(),
    inspectionId: uuid('inspection_id').references(() => inspections.id).notNull(),
    description: text('description').notNull(),
    assignedTo: uuid('assigned_to').references(() => users.id),
    status: varchar('status', { length: 20 }).notNull().default('OPEN'),
    resolvedAt: timestamp('resolved_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('issues_inspection_idx').on(table.inspectionId),
    index('issues_assigned_idx').on(table.assignedTo),
    index('issues_status_idx').on(table.status),
])
