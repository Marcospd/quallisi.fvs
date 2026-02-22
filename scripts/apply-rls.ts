import 'dotenv/config'
import postgres from 'postgres'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Script para aplicar políticas RLS lendo o arquivo SQL gerado.
 * Usa o driver postgres.js já instalado no projeto.
 */
async function main() {
    const sql = postgres(process.env.DATABASE_URL!)
    const filePath = resolve(__dirname, '../scripts/rls-policies.sql')
    const content = readFileSync(filePath, 'utf-8')

    console.log('📋 Aplicando políticas RLS...')

    try {
        await sql.unsafe(content)
        console.log('✅ Todas as políticas RLS aplicadas com sucesso!')
    } catch (err: unknown) {
        const error = err as Error
        console.error('❌ Erro ao aplicar RLS:', error.message)
        process.exit(1)
    } finally {
        await sql.end()
    }
}

main()
