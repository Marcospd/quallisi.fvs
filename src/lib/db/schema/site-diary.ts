import { pgTable, uuid, varchar, boolean, timestamp, text, integer, date, numeric, index, unique } from 'drizzle-orm/pg-core'
import { projects } from './projects'
import { services } from './services'
import { users } from './users'

/**
 * Diário de Obra — registro diário obrigatório do canteiro.
 * Documenta mão de obra, equipamentos, serviços executados, clima e observações.
 * Uma entrada por projeto por dia (UNIQUE constraint).
 *
 * Status: DRAFT → SUBMITTED → CONTRACTOR_SIGNED → INSPECTION_SIGNED
 */
export const siteDiaries = pgTable('site_diaries', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projects.id).notNull(),
    entryDate: date('entry_date').notNull(),
    orderNumber: varchar('order_number', { length: 50 }),
    contractorName: varchar('contractor_name', { length: 255 }),
    networkDiagramRef: varchar('network_diagram_ref', { length: 100 }),
    engineerName: varchar('engineer_name', { length: 255 }),
    foremanName: varchar('foreman_name', { length: 255 }),
    weatherCondition: varchar('weather_condition', { length: 20 }).notNull().default('NONE'),
    workSuspended: boolean('work_suspended').notNull().default(false),
    totalHours: numeric('total_hours', { precision: 5, scale: 2 }),
    status: varchar('status', { length: 30 }).notNull().default('DRAFT'),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('site_diaries_project_idx').on(table.projectId),
    index('site_diaries_date_idx').on(table.entryDate),
    index('site_diaries_status_idx').on(table.status),
    unique('site_diaries_project_date_uniq').on(table.projectId, table.entryDate),
])

/**
 * Mão de obra registrada no diário.
 * Cada linha representa uma função/cargo com quantidade e horas.
 */
export const diaryLaborEntries = pgTable('diary_labor_entries', {
    id: uuid('id').primaryKey().defaultRandom(),
    diaryId: uuid('diary_id').references(() => siteDiaries.id, { onDelete: 'cascade' }).notNull(),
    role: varchar('role', { length: 100 }).notNull(),
    quantity: integer('quantity').notNull(),
    hours: numeric('hours', { precision: 5, scale: 2 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('diary_labor_diary_idx').on(table.diaryId),
])

/**
 * Equipamentos utilizados no dia.
 */
export const diaryEquipmentEntries = pgTable('diary_equipment_entries', {
    id: uuid('id').primaryKey().defaultRandom(),
    diaryId: uuid('diary_id').references(() => siteDiaries.id, { onDelete: 'cascade' }).notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    quantity: integer('quantity').notNull(),
    notes: text('notes'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('diary_equipment_diary_idx').on(table.diaryId),
])

/**
 * Serviços executados no dia.
 * Vínculo opcional com o catálogo de serviços do sistema.
 */
export const diaryServicesExecuted = pgTable('diary_services_executed', {
    id: uuid('id').primaryKey().defaultRandom(),
    diaryId: uuid('diary_id').references(() => siteDiaries.id, { onDelete: 'cascade' }).notNull(),
    description: text('description').notNull(),
    serviceId: uuid('service_id').references(() => services.id),
    quantity: numeric('quantity', { precision: 14, scale: 4 }),
    unit: varchar('unit', { length: 50 }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('diary_services_diary_idx').on(table.diaryId),
])

/**
 * Observações e recomendações do diário.
 * Cada observação tem uma origem: Contratada, Fiscalização ou DMUA.
 */
export const diaryObservations = pgTable('diary_observations', {
    id: uuid('id').primaryKey().defaultRandom(),
    diaryId: uuid('diary_id').references(() => siteDiaries.id, { onDelete: 'cascade' }).notNull(),
    origin: varchar('origin', { length: 20 }).notNull(),
    text: text('text').notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('diary_observations_diary_idx').on(table.diaryId),
])

/**
 * Liberações/assinaturas do diário.
 * Cada diário tem no máximo 2 assinaturas: Prestadora e Fiscalização.
 */
export const diaryServiceReleases = pgTable('diary_service_releases', {
    id: uuid('id').primaryKey().defaultRandom(),
    diaryId: uuid('diary_id').references(() => siteDiaries.id, { onDelete: 'cascade' }).notNull(),
    stage: varchar('stage', { length: 20 }).notNull(),
    signedBy: uuid('signed_by').references(() => users.id),
    notes: text('notes'),
    signedAt: timestamp('signed_at'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('diary_releases_diary_idx').on(table.diaryId),
    unique('diary_releases_diary_stage_uniq').on(table.diaryId, table.stage),
])
