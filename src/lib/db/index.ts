import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

/**
 * Conexão com o banco de dados via Drizzle ORM.
 * Usa a variável DATABASE_URL (nunca exposta ao cliente).
 */
const connectionString = process.env.DATABASE_URL!

// Em desenvolvimento, reutiliza a conexão para evitar múltiplas conexões
const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined
}

const conn = globalForDb.conn ?? postgres(connectionString)

if (process.env.NODE_ENV !== 'production') {
    globalForDb.conn = conn
}

export const db = drizzle(conn)
