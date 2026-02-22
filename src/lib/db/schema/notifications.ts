import { pgTable, uuid, varchar, timestamp, text, boolean, index } from 'drizzle-orm/pg-core'
import { users } from './users'

/**
 * Notificações in-app dos usuários.
 * Geradas automaticamente por eventos do sistema.
 */
export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    read: boolean('read').notNull().default(false),
    link: varchar('link', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('notifications_user_idx').on(table.userId),
])
