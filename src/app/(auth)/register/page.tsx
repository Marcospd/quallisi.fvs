import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { plans } from '@/lib/db/schema'
import { RegisterForm } from '@/features/auth/components/register-form'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Cadastrar Empresa — Quallisy FVS',
    description: 'Cadastre sua construtora na plataforma Quallisy FVS',
}

/**
 * Pagina de cadastro publico de empresa.
 * Rota: /register
 */
export default async function RegisterPage() {
    const activePlans = await db
        .select({
            id: plans.id,
            name: plans.name,
            priceBrl: plans.priceBrl,
            maxProjects: plans.maxProjects,
            maxUsers: plans.maxUsers,
            maxFvsMonth: plans.maxFvsMonth,
        })
        .from(plans)
        .where(eq(plans.active, true))

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Quallisy FVS</CardTitle>
                    <CardDescription>
                        Cadastre sua construtora para comecar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm plans={activePlans} />
                </CardContent>
            </Card>
        </div>
    )
}
