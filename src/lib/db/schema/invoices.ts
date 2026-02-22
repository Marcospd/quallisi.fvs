import { pgTable, uuid, varchar, numeric, timestamp, text, index } from 'drizzle-orm/pg-core'
import { subscriptions } from './subscriptions'

/**
 * Histórico de faturas de cada assinatura.
 * Manual por ora — automático com gateway no futuro.
 *
 * Status: PENDING → PAID ou OVERDUE → CANCELLED
 * payment_method: texto livre (PIX, TED, Boleto) — no futuro receberá dados do gateway
 */
export const invoices = pgTable('invoices', {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id).notNull(),
    amountBrl: numeric('amount_brl', { precision: 10, scale: 2 }).notNull(),
    dueDate: timestamp('due_date').notNull(),
    paidAt: timestamp('paid_at'),
    status: varchar('status', { length: 20 }).notNull().default('PENDING'),
    notes: text('notes'),
    paymentMethod: varchar('payment_method', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('invoices_subscription_idx').on(table.subscriptionId),
])
