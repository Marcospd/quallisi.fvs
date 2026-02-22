import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { systemUsers } from '../src/lib/db/schema'

/**
 * Cria o system user (admin da plataforma) no Supabase Auth + banco.
 *
 * Uso: npx tsx scripts/create-system-user.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DATABASE_URL = process.env.DATABASE_URL!

const EMAIL = 'marcospd@gmail.com'
const NAME = 'Marcos Duarte'
const TEMP_PASSWORD = 'Quallisy@2026'

async function main() {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DATABASE_URL) {
        console.error('❌ Variáveis de ambiente faltando. Verifique .env.local')
        process.exit(1)
    }

    // 1. Criar auth user no Supabase
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log(`👤 Criando auth user: ${EMAIL}...`)

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: TEMP_PASSWORD,
        email_confirm: true,
    })

    if (authError) {
        if (authError.message?.includes('already been registered')) {
            console.log('ℹ️  Auth user já existe, buscando ID...')
            const { data: listData } = await supabase.auth.admin.listUsers()
            const existing = listData?.users?.find(u => u.email === EMAIL)
            if (!existing) {
                console.error('❌ Não foi possível encontrar o auth user')
                process.exit(1)
            }
            await insertSystemUser(existing.id)
        } else {
            console.error('❌ Erro ao criar auth user:', authError.message)
            process.exit(1)
        }
    } else if (authData.user) {
        await insertSystemUser(authData.user.id)
    }

    console.log('\n✅ System user criado com sucesso!')
    console.log(`   📧 E-mail: ${EMAIL}`)
    console.log(`   🔑 Senha temporária: ${TEMP_PASSWORD}`)
    console.log(`   🔗 Login em: /system/login`)
    process.exit(0)
}

async function insertSystemUser(authId: string) {
    const client = postgres(DATABASE_URL)
    const db = drizzle(client)

    console.log('📝 Inserindo na tabela system_users...')
    await db.insert(systemUsers).values({
        authId,
        name: NAME,
        email: EMAIL,
        role: 'SYSTEM',
        active: true,
    }).onConflictDoNothing()

    await client.end()
    console.log('   ✅ system_users atualizado')
}

main().catch(err => {
    console.error('❌ Erro:', err)
    process.exit(1)
})
