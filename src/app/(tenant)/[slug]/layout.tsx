import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { tenants, users } from '@/lib/db/schema'
import { TenantProvider } from '@/features/tenant/components/tenant-provider'
import { TenantSidebar } from '@/features/tenant/components/tenant-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

/**
 * Layout das rotas do tenant.
 * Verifica: auth → tenant existe → tenant ativo → usuário pertence ao tenant.
 * Injeta TenantProvider + Sidebar.
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

    // 1. Verificar autenticação
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/login')
    }

    // 2. Buscar tenant pelo slug
    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1)

    if (!tenant) {
        redirect('/login')
    }

    // 3. Verificar se tenant está ativo
    if (tenant.status !== 'ACTIVE') {
        redirect('/login')
    }

    // 4. Buscar usuário vinculado ao tenant
    const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.authId, authUser.id))
        .limit(1)

    if (!dbUser || dbUser.tenantId !== tenant.id) {
        redirect('/login')
    }

    // 5. Verificar se usuário está ativo
    if (!dbUser.active) {
        redirect('/login')
    }

    return (
        <TenantProvider tenant={tenant} user={dbUser}>
            <SidebarProvider>
                <TenantSidebar />
                <SidebarInset>
                    <div className="flex flex-1 flex-col">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TenantProvider>
    )
}
