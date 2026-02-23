import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export const metadata = {
    title: 'Esqueci minha senha — Quallisy FVS',
    description: 'Recupere o acesso à sua conta',
}

/**
 * Pagina de recuperacao de senha.
 * Rota: /forgot-password
 */
export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Esqueci minha senha</CardTitle>
                    <CardDescription>
                        Informe seu e-mail para receber o link de recuperação
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ForgotPasswordForm />
                </CardContent>
            </Card>
        </div>
    )
}
