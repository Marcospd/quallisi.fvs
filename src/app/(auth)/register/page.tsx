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

type Props = {
    searchParams: Promise<{ plano?: string }>
}

/**
 * Pagina de cadastro publico de empresa.
 * Rota: /register?plano=starter|pro|enterprise
 */
export default async function RegisterPage({ searchParams }: Props) {
    const { plano } = await searchParams

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

    // Match plan by slug (name lowercased, spaces replaced with dashes)
    const preselectedPlan = plano
        ? activePlans.find(
              (p) => p.name.toLowerCase().replace(/\s+/g, '-') === plano.toLowerCase()
          )
        : undefined

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
                    <RegisterForm
                        plans={activePlans}
                        preselectedPlanId={preselectedPlan?.id}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
