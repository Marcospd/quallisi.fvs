import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

/**
 * Configuração do Drizzle Kit para geração e aplicação de migrations.
 * 
 * Comandos:
 *   npx drizzle-kit generate  — gerar migration
 *   npx drizzle-kit migrate   — aplicar migration
 *   npx drizzle-kit studio    — abrir Drizzle Studio (visualizar banco)
 */
export default defineConfig({
    out: './drizzle',
    schema: './src/lib/db/schema/*.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
})
