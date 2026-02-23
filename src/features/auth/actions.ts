'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, tenants, systemUsers, plans, subscriptions } from '@/lib/db/schema'
import { loginSchema, tenantRegisterSchema } from './schemas'
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
    try {
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
    } catch (err) {
        const e = err as { digest?: string; message?: string }
        if (e?.digest?.startsWith('NEXT_REDIRECT') || e?.message === 'NEXT_REDIRECT') throw err
        logger.error({ err }, '🚨 Fatal server error in login action (Supabase/DB/Limit)')
        return { error: 'Instabilidade de conexão no servidor de banco de dados. Tente novamente em alguns segundos.' }
    }
}

/**
 * Login do Painel SISTEMA.
 * Verifica se o usuário é system_user após autenticação.
 */
export async function systemLogin(input: unknown) {
    try {
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
    } catch (err) {
        const e = err as { digest?: string; message?: string }
        if (e?.digest?.startsWith('NEXT_REDIRECT') || e?.message === 'NEXT_REDIRECT') throw err
        logger.error({ err }, '🚨 Fatal server error in systemLogin action')
        return { error: 'Instabilidade de conexão no servidor.' }
    }
}

/**
 * Cadastro público de empresa (construtora).
 * Cria auth user, tenant, user admin e subscription.
 */
export async function register(input: unknown) {
    try {
        const parsed = tenantRegisterSchema.safeParse(input)
        if (!parsed.success) {
            return { error: parsed.error.flatten() }
        }

        const { companyName, planId, name, email, password } = parsed.data

        // Verificar se o plano existe e está ativo
        const [plan] = await db
            .select()
            .from(plans)
            .where(eq(plans.id, planId))
            .limit(1)

        if (!plan || !plan.active) {
            return { error: 'Plano selecionado não está disponível' }
        }

        // Gerar slug a partir do nome da empresa
        const slug = companyName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()

        // Verificar se slug já existe
        const [existingTenant] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.slug, slug))
            .limit(1)

        if (existingTenant) {
            return { error: 'Já existe uma empresa cadastrada com esse nome' }
        }

        // Criar auth user no Supabase
        const supabase = await createClient()
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError || !authData.user) {
            logger.error({ email, error: authError }, 'Falha ao criar auth user')
            if (authError?.message?.includes('already registered')) {
                return { error: 'Este e-mail já está cadastrado' }
            }
            return { error: 'Erro ao criar conta. Tente novamente.' }
        }

        const authId = authData.user.id

        // Criar tenant
        const [newTenant] = await db
            .insert(tenants)
            .values({ name: companyName, slug })
            .returning()

        // Criar user admin vinculado ao tenant
        await db.insert(users).values({
            authId,
            tenantId: newTenant.id,
            name,
            email,
            role: 'admin',
        })

        // Criar subscription com período de 30 dias
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setDate(periodEnd.getDate() + 30)

        await db.insert(subscriptions).values({
            tenantId: newTenant.id,
            planId,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
        })

        logger.info({ tenantId: newTenant.id, slug, email }, 'Nova empresa cadastrada')

        redirect(`/${slug}`)
    } catch (err) {
        const e = err as { digest?: string; message?: string }
        if (e?.digest?.startsWith('NEXT_REDIRECT') || e?.message === 'NEXT_REDIRECT') throw err
        logger.error({ err }, '🚨 Fatal server error in register action')
        return { error: 'Erro interno ao cadastrar empresa. Tente novamente.' }
    }
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
