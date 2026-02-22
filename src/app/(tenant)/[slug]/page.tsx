/**
 * Dashboard do tenant — página inicial após login.
 * Rota: /[slug]
 */
export const metadata = {
    title: 'Dashboard — Quallisy FVS',
}

export default function TenantDashboardPage() {
    return (
        <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
                Bem-vindo ao painel da obra. As funcionalidades serão adicionadas em breve.
            </p>
        </div>
    )
}
