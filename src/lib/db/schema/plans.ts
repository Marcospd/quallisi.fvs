import { pgTable, uuid, varchar, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core'

/**
 * Planos disponíveis no SaaS com limites e preços.
 *
 * Planos fixos: Starter, Pro, Enterprise.
 * max_fvs_month = -1 para ilimitado.
 */
export const plans = pgTable('plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    maxProjects: integer('max_projects').notNull().default(1),
    maxUsers: integer('max_users').notNull().default(5),
    maxFvsMonth: integer('max_fvs_month').notNull().default(100),
    priceBrl: numeric('price_brl', { precision: 10, scale: 2 }).notNull().default('0.00'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
})
