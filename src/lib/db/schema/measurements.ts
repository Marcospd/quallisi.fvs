import { pgTable, uuid, varchar, boolean, timestamp, text, integer, numeric, date, index, unique } from 'drizzle-orm/pg-core'
import { contracts } from './contracts'
import { contractItems } from './contracts'
import { users } from './users'

/**
 * Boletim de Medição (BM) — medição periódica de serviços para pagamento.
 * Vinculado a um contrato. Cada BM cobre um período (quinzenal/mensal).
 *
 * Status: DRAFT → SUBMITTED → PLANNING_APPROVED → MANAGEMENT_APPROVED → CONTRACTOR_AGREED / REJECTED
 */
export const measurementBulletins = pgTable('measurement_bulletins', {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id').references(() => contracts.id).notNull(),
    bmNumber: integer('bm_number').notNull(),
    sheetNumber: integer('sheet_number').notNull().default(1),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    dueDate: date('due_date'),
    discountValue: numeric('discount_value', { precision: 14, scale: 2 }).notNull().default('0'),
    observations: text('observations'),
    status: varchar('status', { length: 30 }).notNull().default('DRAFT'),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('bulletins_contract_idx').on(table.contractId),
    index('bulletins_status_idx').on(table.status),
])

/**
 * Itens de medição — um por item de contrato por BM.
 * O único campo de input é quantity_this_period (qtd executada no período).
 * Todos os demais valores (acumulados, financeiros) são calculados no client.
 */
export const measurementItems = pgTable('measurement_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    bulletinId: uuid('bulletin_id').references(() => measurementBulletins.id, { onDelete: 'cascade' }).notNull(),
    contractItemId: uuid('contract_item_id').references(() => contractItems.id).notNull(),
    quantityThisPeriod: numeric('quantity_this_period', { precision: 14, scale: 4 }).notNull().default('0'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('measurement_items_bulletin_idx').on(table.bulletinId),
    unique('measurement_items_bulletin_item_uniq').on(table.bulletinId, table.contractItemId),
])

/**
 * Aditivos — itens fora do contrato original, adicionados a um BM específico.
 * Mesma estrutura dos itens contratuais, mas sem vínculo com contract_items.
 */
export const measurementAdditives = pgTable('measurement_additives', {
    id: uuid('id').primaryKey().defaultRandom(),
    bulletinId: uuid('bulletin_id').references(() => measurementBulletins.id, { onDelete: 'cascade' }).notNull(),
    itemNumber: varchar('item_number', { length: 20 }).notNull(),
    serviceName: varchar('service_name', { length: 255 }).notNull(),
    unit: varchar('unit', { length: 10 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 14, scale: 4 }).notNull(),
    contractedQuantity: numeric('contracted_quantity', { precision: 14, scale: 4 }).notNull(),
    quantityThisPeriod: numeric('quantity_this_period', { precision: 14, scale: 4 }).notNull().default('0'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('measurement_additives_bulletin_idx').on(table.bulletinId),
])

/**
 * Aprovações do BM — histórico de quem aprovou/rejeitou em cada etapa.
 */
export const measurementApprovals = pgTable('measurement_approvals', {
    id: uuid('id').primaryKey().defaultRandom(),
    bulletinId: uuid('bulletin_id').references(() => measurementBulletins.id, { onDelete: 'cascade' }).notNull(),
    stage: varchar('stage', { length: 20 }).notNull(),
    action: varchar('action', { length: 20 }).notNull(),
    userId: uuid('user_id').references(() => users.id),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('measurement_approvals_bulletin_idx').on(table.bulletinId),
])
