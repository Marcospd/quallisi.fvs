'use client'

import { createContext, useContext } from 'react'
import type { Tenant, TenantUser } from '@/features/auth/types'

/**
 * Contexto do tenant para componentes client-side.
 * Disponibiliza os dados do tenant e do usuário logado
 * para toda a árvore de componentes dentro da rota do tenant.
 */

interface TenantContextValue {
    tenant: Tenant
    user: TenantUser
}

const TenantContext = createContext<TenantContextValue | null>(null)

/**
 * Provider do contexto de tenant.
 * Usado no layout da rota (tenant)/[slug].
 */
export function TenantProvider({
    tenant,
    user,
    children,
}: TenantContextValue & { children: React.ReactNode }) {
    return (
        <TenantContext.Provider value={{ tenant, user }}>
            {children}
        </TenantContext.Provider>
    )
}

/**
 * Hook para acessar o contexto do tenant.
 * Deve ser usado apenas dentro de rotas do tenant.
 *
 * @throws Erro se usado fora do TenantProvider
 */
export function useTenant() {
    const context = useContext(TenantContext)
    if (!context) {
        throw new Error('useTenant deve ser usado dentro de uma rota de tenant')
    }
    return context
}
