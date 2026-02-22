/**
 * Layout das rotas de autenticação (login, register).
 * Sem sidebar, sem header — tela limpa para formulários.
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
