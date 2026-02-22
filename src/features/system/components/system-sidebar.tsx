'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    LogOut,
} from 'lucide-react'
import { systemLogout } from '@/features/auth/actions'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

const menuItems = [
    {
        title: 'Dashboard',
        href: '/system',
        icon: LayoutDashboard,
    },
    {
        title: 'Construtoras',
        href: '/system/tenants',
        icon: Building2,
    },
    {
        title: 'Assinaturas',
        href: '/system/billing',
        icon: CreditCard,
    },
]

/**
 * Sidebar do Painel SISTEMA.
 * Menu fixo com navegação para dashboard, construtoras e billing.
 */
export function SystemSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar className="border-r border-zinc-800 bg-zinc-950">
            <SidebarHeader className="border-b border-zinc-800 px-6 py-4">
                <h2 className="text-lg font-bold text-white">Painel SISTEMA</h2>
                <p className="text-xs text-zinc-500">Administração da plataforma</p>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-zinc-500">
                        Menu
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-zinc-800 p-4">
                <form action={systemLogout}>
                    <Button
                        type="submit"
                        variant="ghost"
                        className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                    </Button>
                </form>
            </SidebarFooter>
        </Sidebar>
    )
}
