import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { systemUsers } from '@/lib/db/schema'
import { SystemSidebar } from '@/features/system/components/system-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

/**
 * Layout do Painel SISTEMA com sidebar.
 * Protege todas as rotas /system/* (exceto /system/login).
 * Verifica se o usuário é system_user antes de renderizar.
 */
export default async function SystemProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/system/login')
    }

    // Verificar se é system user
    const [systemUser] = await db
        .select()
        .from(systemUsers)
        .where(eq(systemUsers.authId, authUser.id))
        .limit(1)

    if (!systemUser || !systemUser.active) {
        redirect('/system/login')
    }

    return (
        <SidebarProvider>
            <SystemSidebar />
            <SidebarInset>
                <div className="flex flex-1 flex-col">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
