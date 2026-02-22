'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, tenants, systemUsers } from '@/lib/db/schema'
import { loginSchema, registerSchema } from './schemas'
import { logger } from '@/lib/logger'
import { loginLimiter } from '@/lib/rate-limit'
import type { AuthContext, SystemAuthContext } from './types'

/**
 * Obtém o contexto de autenticação do tenant.
 * Retorna o usuário e tenant do contexto.
 * Usar em toda server action que precisa de auth.
 *
 * @throws Redireciona para /login se não autenticado
 */
export async function getAuthContext(): Promise<AuthContext> {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/login')
    }

    const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.authId, authUser.id))
        .limit(1)

    if (!dbUser) {
        logger.error({ authId: authUser.id }, 'Usuário autenticado sem registro no banco')
        redirect('/login')
    }

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, dbUser.tenantId))
        .limit(1)

    if (!tenant) {
        logger.error({ userId: dbUser.id, tenantId: dbUser.tenantId }, 'Tenant não encontrado')
        redirect('/login')
    }

    if (tenant.status !== 'ACTIVE') {
        logger.warn({ tenantId: tenant.id, status: tenant.status }, 'Tentativa de acesso a tenant inativo')
        redirect('/login')
    }

    return { user: dbUser, tenant }
}

/**
 * Obtém o contexto de autenticação do Painel SISTEMA.
 * Isolado dos tenants.
 *
 * @throws Redireciona para /system/login se não autenticado
 */
export async function getSystemAuthContext(): Promise<SystemAuthContext> {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/system/login')
    }

    const [systemUser] = await db
        .select()
        .from(systemUsers)
        .where(eq(systemUsers.authId, authUser.id))
        .limit(1)

    if (!systemUser) {
        logger.error({ authId: authUser.id }, 'Usuário autenticado não é system user')
        redirect('/system/login')
    }

    if (!systemUser.active) {
        redirect('/system/login')
    }

    return { user: systemUser }
}

/**
 * Login com e-mail e senha.
 * Valida com Zod antes de enviar ao Supabase.
 */
export async function login(input: unknown) {
    // Rate limiting: 5 tentativas por minuto por IP
    const limit = await loginLimiter.check()
    if (!limit.success) {
        return { error: 'Muitas tentativas. Tente novamente em breve.' }
    }

    const parsed = loginSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten() }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
    })

    if (error) {
        logger.warn({ email: parsed.data.email }, 'Falha no login')
        return { error: 'E-mail ou senha incorretos' }
    }

    // Verificar se é system user ou tenant user para redirecionar
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser) {
        const [systemUser] = await db
            .select()
            .from(systemUsers)
            .where(eq(systemUsers.authId, authUser.id))
            .limit(1)

        if (systemUser) {
            redirect('/system')
        }

        const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.authId, authUser.id))
            .limit(1)

        if (dbUser) {
            const [tenant] = await db
                .select()
                .from(tenants)
                .where(eq(tenants.id, dbUser.tenantId))
                .limit(1)

            if (tenant?.status === 'ACTIVE') {
                redirect(`/${tenant.slug}`)
            } else {
                await supabase.auth.signOut()
                return { error: 'Acesso temporariamente suspenso. Entre em contato com o suporte.' }
            }
        }
    }

    return { error: 'Usuário não encontrado no sistema' }
}

/**
 * Login do Painel SISTEMA.
 * Verifica se o usuário é system_user após autenticação.
 */
export async function systemLogin(input: unknown) {
    // Rate limiting: 5 tentativas por minuto por IP
    const limit = await loginLimiter.check()
    if (!limit.success) {
        return { error: 'Muitas tentativas. Tente novamente em breve.' }
    }

    const parsed = loginSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten() }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
    })

    if (error) {
        logger.warn({ email: parsed.data.email }, 'Falha no login sistema')
        return { error: 'E-mail ou senha incorretos' }
    }

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser) {
        const [systemUser] = await db
            .select()
            .from(systemUsers)
            .where(eq(systemUsers.authId, authUser.id))
            .limit(1)

        if (systemUser && systemUser.active) {
            logger.info({ userId: systemUser.id }, 'Login sistema realizado')
            redirect('/system')
        }
    }

    // Não é system user — fazer logout e retornar erro
    await supabase.auth.signOut()
    return { error: 'Acesso não autorizado' }
}

/**
 * Logout — encerra sessão e redireciona para login.
 */
export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

/**
 * Logout do Painel SISTEMA.
 */
export async function systemLogout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/system/login')
}
