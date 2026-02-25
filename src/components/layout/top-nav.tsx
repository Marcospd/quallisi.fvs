'use client'

import { Bell, Search, LayoutDashboard } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'

import { getUnreadCount } from '@/features/notifications/actions'

import { useTenant } from '@/features/tenant/components/tenant-provider'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/features/auth/actions'

export function TopNav() {
    const { tenant, user } = useTenant()
    const pathname = usePathname()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        // Busca simples inicial
        getUnreadCount().then((res) => {
            if (res.data) setUnreadCount(res.data)
        })
    }, [])

    // Gerar breadcrumbs rudimentar baseado na rota
    const paths = pathname.split('/').filter(Boolean)
    // Remover o slug do tenant na visualização do path principal
    const displayPaths = paths.slice(1)

    // Mapeamento simpático de slugs para nomes
    const pathNames: Record<string, string> = {
        'projects': 'Obras',
        'locations': 'Locais de Inspeção',
        'services': 'Fichas de Serviço',
        'team': 'Gestão de Acessos',
        'inspections': 'Inspeções FVS',
        'planning': 'Planejamento',
        'issues': 'Pendências',
        'stats': 'Estatísticas',
        'notifications': 'Notificações',
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="w-full h-full flex items-center justify-between">

                {/* Breadcrumb Left */}
                <div className="flex items-center gap-4">
                    <Breadcrumb className="hidden sm:flex">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href={`/${tenant.slug}`}>
                                    <LayoutDashboard className="h-4 w-4" />
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {displayPaths.length > 0 && <BreadcrumbSeparator />}
                            {displayPaths.map((path, idx) => {
                                const isLast = idx === displayPaths.length - 1
                                const href = `/${tenant.slug}/${displayPaths.slice(0, idx + 1).join('/')}`
                                const label = pathNames[path] || path

                                return (
                                    <Fragment key={path}>
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage className="capitalize">{label}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink href={href} className="capitalize">
                                                    {label}
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && <BreadcrumbSeparator />}
                                    </Fragment>
                                )
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* User and Actions Right */}
                <div className="flex items-center gap-4">
                    <form className="hidden sm:block">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Busca global..."
                                className="w-full appearance-none bg-background pl-8 shadow-none md:w-64"
                            />
                        </div>
                    </form>

                    <Link href={`/${tenant.slug}/notifications`}>
                        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                                <span className="absolute right-1 top-1 flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                                </span>
                            )}
                        </Button>
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {user.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email}
                                    </p>
                                    <div className="pt-2">
                                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <form action={logout}>
                                    <button type="submit" className="w-full text-left text-destructive cursor-pointer">
                                        Sair da Conta
                                    </button>
                                </form>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
        </header>
    )
}
