import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { systemUsers, tenants, users, plans, services, criteria, projects, locations } from '../src/lib/db/schema'

/**
 * Script de seed para inicializar o banco com dados necessários.
 *
 * Uso: npx tsx scripts/seed.ts
 *
 * IMPORTANTE: Antes de rodar, crie o system user no Supabase Auth
 * e copie o auth_id para a variável SYSTEM_USER_AUTH_ID.
 */

const SYSTEM_USER_AUTH_ID = process.env.SYSTEM_USER_AUTH_ID ?? ''
const SYSTEM_USER_EMAIL = process.env.SYSTEM_USER_EMAIL ?? 'admin@quallisy.com'
const SYSTEM_USER_NAME = process.env.SYSTEM_USER_NAME ?? 'Admin Quallisy'

async function seed() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
        console.error('❌ DATABASE_URL não configurada')
        process.exit(1)
    }

    const client = postgres(connectionString)
    const db = drizzle(client)

    console.log('🌱 Iniciando seed...\n')

    // 1. System User
    if (SYSTEM_USER_AUTH_ID) {
        console.log('👤 Criando system user...')
        await db.insert(systemUsers).values({
            authId: SYSTEM_USER_AUTH_ID,
            name: SYSTEM_USER_NAME,
            email: SYSTEM_USER_EMAIL,
            role: 'SYSTEM',
        }).onConflictDoNothing()
        console.log('   ✅ System user criado\n')
    } else {
        console.log('⚠️  SYSTEM_USER_AUTH_ID não definido — pulando system user\n')
    }

    // 2. Planos padrão
    console.log('📦 Criando planos padrão...')
    await db.insert(plans).values([
        {
            name: 'Starter',
            maxProjects: 1,
            maxUsers: 5,
            maxFvsMonth: 50,
            priceBrl: '99.00',
        },
        {
            name: 'Pro',
            maxProjects: 5,
            maxUsers: 20,
            maxFvsMonth: 500,
            priceBrl: '299.00',
        },
        {
            name: 'Enterprise',
            maxProjects: -1,
            maxUsers: -1,
            maxFvsMonth: -1,
            priceBrl: '799.00',
        },
    ]).onConflictDoNothing()
    console.log('   ✅ Planos criados\n')

    // 3. Tenant de demonstração
    console.log('🏢 Criando tenant de demonstração...')
    const [demoTenant] = await db.insert(tenants).values({
        name: 'Construtora Demo',
        slug: 'demo',
        status: 'ACTIVE',
    }).onConflictDoNothing().returning()

    if (demoTenant) {
        // 4. Serviços padrão
        console.log('🔧 Criando serviços padrão...')
        const [alvenaria] = await db.insert(services).values([
            { tenantId: demoTenant.id, name: 'Alvenaria', description: 'Levantamento de paredes e muros' },
            { tenantId: demoTenant.id, name: 'Revestimento Interno', description: 'Emboço e reboco' },
            { tenantId: demoTenant.id, name: 'Impermeabilização', description: 'Tratamento contra umidade' },
            { tenantId: demoTenant.id, name: 'Instalações Elétricas', description: 'Eletrodutos e fiação' },
            { tenantId: demoTenant.id, name: 'Instalações Hidráulicas', description: 'Tubulações e conexões' },
        ]).returning()

        if (alvenaria) {
            console.log('📋 Criando critérios para Alvenaria...')
            await db.insert(criteria).values([
                { serviceId: alvenaria.id, description: 'Prumo dentro da tolerância (±5mm)', sortOrder: 1 },
                { serviceId: alvenaria.id, description: 'Argamassa aplicada na espessura correta', sortOrder: 2 },
                { serviceId: alvenaria.id, description: 'Amarração entre blocos conforme projeto', sortOrder: 3 },
                { serviceId: alvenaria.id, description: 'Esquadro verificado nos cantos', sortOrder: 4 },
                { serviceId: alvenaria.id, description: 'Nivelamento da fiada superior', sortOrder: 5 },
            ])
        }

        // 5. Obra de demonstração
        console.log('🏗️ Criando obra de demonstração...')
        const [demoProject] = await db.insert(projects).values({
            tenantId: demoTenant.id,
            name: 'Residencial Vila Nova',
            address: 'Rua das Flores, 123 - Centro',
        }).returning()

        if (demoProject) {
            console.log('📍 Criando locais de demonstração...')
            await db.insert(locations).values([
                { projectId: demoProject.id, name: 'Bloco A - Apt 101' },
                { projectId: demoProject.id, name: 'Bloco A - Apt 102' },
                { projectId: demoProject.id, name: 'Bloco B - Apt 201' },
                { projectId: demoProject.id, name: 'Área Comum - Térreo' },
            ])
        }

        console.log('   ✅ Dados de demonstração criados\n')
    }

    console.log('✅ Seed concluído!')
    await client.end()
    process.exit(0)
}

seed().catch((err) => {
    console.error('❌ Erro no seed:', err)
    process.exit(1)
})
