import { LoginForm } from '@/features/auth/components/login-form'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export const metadata = {
    title: 'Login — Quallisy FVS',
    description: 'Entre na sua conta para acessar o sistema',
}

/**
 * Página de login para tenants (construtoras).
 * Rota: /login
 */
export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Quallisy FVS</CardTitle>
                    <CardDescription>
                        Entre com seu e-mail e senha para acessar o sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
    )
}
