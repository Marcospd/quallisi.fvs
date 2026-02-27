import { pgTable, uuid, varchar, boolean, timestamp, text, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

/**
 * Empreiteiras (subcontratadas) cadastradas pelo tenant.
 * Usadas em Diário de Obra, Contratos e Boletins de Medição.
 * Sempre filtrar por tenantId — isolamento obrigatório.
 */
export const contractors = pgTable('contractors', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    cnpj: varchar('cnpj', { length: 18 }),
    contactName: varchar('contact_name', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    bankInfo: text('bank_info'),
    nfAddress: text('nf_address'),
    ceiMatricula: varchar('cei_matricula', { length: 30 }),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('contractors_tenant_idx').on(table.tenantId),
])
