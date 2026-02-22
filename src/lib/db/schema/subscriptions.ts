import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { plans } from './plans'

/**
 * Assinatura ativa de cada tenant.
 * Coração do billing — liga tenant ao plano.
 *
 * gateway_subscription_id é nullable (preparado para gateway futuro).
 */
export const subscriptions = pgTable('subscriptions', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    planId: uuid('plan_id').references(() => plans.id).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),
    gatewaySubscriptionId: varchar('gateway_subscription_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('subscriptions_tenant_idx').on(table.tenantId),
])
