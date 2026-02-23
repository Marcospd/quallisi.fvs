import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export const metadata = {
    title: 'Redefinir senha — Quallisy FVS',
    description: 'Crie uma nova senha para sua conta',
}

/**
 * Pagina de redefinicao de senha.
 * Rota: /reset-password
 * Acessada apos clicar no link de recuperacao enviado por email.
 */
export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
                    <CardDescription>
                        Digite sua nova senha abaixo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResetPasswordForm />
                </CardContent>
            </Card>
        </div>
    )
}
