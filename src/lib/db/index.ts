import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

/**
 * Conexão com o banco de dados via Drizzle ORM.
 * Usa a variável DATABASE_URL (nunca exposta ao cliente).
 *
 * Configuração otimizada para Vercel Serverless + Supabase Pooler:
 * - ssl: 'require' — Supabase exige SSL em todas as conexões
 * - prepare: false — PgBouncer (Supavisor) não suporta prepared statements
 * - max: 1 — Serverless: uma conexão por invocação
 * - idle_timeout: 20 — Limpa conexões ociosas rápido
 * - connect_timeout: 15 — Evita travar em cold starts
 */
const connectionString = process.env.DATABASE_URL!

const isProduction = process.env.NODE_ENV === 'production'

// Em desenvolvimento, reutiliza a conexão para evitar múltiplas conexões
const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined
}

const conn = globalForDb.conn ?? postgres(connectionString, {
    prepare: false,
    ssl: 'require',
    max: isProduction ? 1 : 3,
    idle_timeout: 20,
    connect_timeout: 15,
    max_lifetime: 60 * 5,
})

if (!isProduction) {
    globalForDb.conn = conn
}

export const db = drizzle(conn)
