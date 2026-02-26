import { redirect } from 'next/navigation'
import { getAuthContext } from '@/features/auth/actions'
import { TenantProvider } from '@/features/tenant/components/tenant-provider'
import { TenantSidebar } from '@/features/tenant/components/tenant-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { TopNav } from '@/components/layout/top-nav'

/**
 * Layout das rotas do tenant.
 * Usa getAuthContext() com cache() — mesma execução é reaproveitada
 * pelas pages e server actions do mesmo request, eliminando queries duplicadas.
 *
 * Rota: /[slug]/*
 */
export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    // getAuthContext() retorna user + tenant (1 query JOIN, cacheada por request)
    const { user: dbUser, tenant } = await getAuthContext()

    // Verificar que o slug da URL corresponde ao tenant do usuário
    if (tenant.slug !== slug) {
        redirect('/login')
    }

    // Verificar se usuário está ativo
    if (!dbUser.active) {
        redirect('/login')
    }

    return (
        <TenantProvider tenant={tenant} user={dbUser}>
            <SidebarProvider>
                <TenantSidebar />
                <SidebarInset>
                    <div className="flex flex-1 flex-col">
                        <TopNav />
                        <main className="flex flex-1 flex-col bg-muted/20">
                            {children}
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TenantProvider>
    )
}
