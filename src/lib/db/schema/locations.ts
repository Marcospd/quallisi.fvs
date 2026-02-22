import { pgTable, uuid, varchar, boolean, timestamp, text, index } from 'drizzle-orm/pg-core'
import { projects } from './projects'

/**
 * Pontos físicos de inspeção dentro de uma obra.
 * Ex: Bloco A - Apt 101, Torre B - 3° andar, Área comum.
 * Sempre filtrar por projectId (que já pertence a um tenant).
 */
export const locations = pgTable('locations', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projects.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('locations_project_idx').on(table.projectId),
])
