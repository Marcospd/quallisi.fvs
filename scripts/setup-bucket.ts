import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(url, key)

async function setup() {
    console.log('Verificando bucket project-covers...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
        console.error('Erro ao listar buckets:', listError)
        return
    }

    const exists = buckets.find(b => b.name === 'project-covers')
    if (exists) {
        console.log('Bucket project-covers já existe.')
    } else {
        console.log('Criando bucket project-covers...')
        const { data, error } = await supabase.storage.createBucket('project-covers', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
        })
        if (error) {
            console.error('Erro ao criar bucket:', error)
        } else {
            console.log('Bucket criado com sucesso:', data)
        }
    }
}

setup()
