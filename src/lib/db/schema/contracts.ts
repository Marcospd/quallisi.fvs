import { pgTable, uuid, varchar, boolean, timestamp, text, integer, numeric, date, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { projects } from './projects'
import { contractors } from './contractors'

/**
 * Contratos entre tenant e empreiteiras, vinculados a uma obra.
 * Base para os Boletins de Medição (fase 3).
 */
export const contracts = pgTable('contracts', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    projectId: uuid('project_id').references(() => projects.id).notNull(),
    contractorId: uuid('contractor_id').references(() => contractors.id).notNull(),
    contractNumber: varchar('contract_number', { length: 50 }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    technicalRetentionPct: numeric('technical_retention_pct', { precision: 5, scale: 2 }).notNull().default('5'),
    notes: text('notes'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('contracts_tenant_idx').on(table.tenantId),
    index('contracts_project_idx').on(table.projectId),
    index('contracts_contractor_idx').on(table.contractorId),
])

/**
 * Itens de um contrato — cada linha representa um serviço contratado
 * com unidade, preço unitário e quantidade contratada.
 */
export const contractItems = pgTable('contract_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id').references(() => contracts.id, { onDelete: 'cascade' }).notNull(),
    itemNumber: varchar('item_number', { length: 20 }).notNull(),
    serviceName: varchar('service_name', { length: 255 }).notNull(),
    unit: varchar('unit', { length: 10 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 14, scale: 4 }).notNull(),
    contractedQuantity: numeric('contracted_quantity', { precision: 14, scale: 4 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('contract_items_contract_idx').on(table.contractId),
])
