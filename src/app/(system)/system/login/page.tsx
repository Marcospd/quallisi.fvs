import { SystemLoginForm } from '@/features/auth/components/system-login-form'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export const metadata = {
    title: 'Painel SISTEMA — Login',
    description: 'Acesso restrito ao administrador da plataforma',
}

/**
 * Página de login do Painel SISTEMA.
 * Rota: /system/login
 * Isolada do login de tenant.
 */
export default function SystemLoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
            <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-white">
                        Painel SISTEMA
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Acesso restrito — administração da plataforma
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SystemLoginForm />
                </CardContent>
            </Card>
        </div>
    )
}
