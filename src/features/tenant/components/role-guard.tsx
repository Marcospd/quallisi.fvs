'use client'

import { useTenant } from '@/features/tenant/components/tenant-provider'
import type { TenantRole } from '@/features/auth/types'

/**
 * Componente de proteção por role.
 * Renderiza children apenas se o usuário tiver um dos roles permitidos.
 *
 * Uso:
 *   <RoleGuard allowed={['admin']}>
 *     <AdminContent />
 *   </RoleGuard>
 *
 *   <RoleGuard allowed={['admin', 'supervisor']}>
 *     <SupervisorContent />
 *   </RoleGuard>
 */
export function RoleGuard({
    allowed,
    children,
    fallback = null,
}: {
    allowed: TenantRole[]
    children: React.ReactNode
    fallback?: React.ReactNode
}) {
    const { user } = useTenant()

    if (!allowed.includes(user.role as TenantRole)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
