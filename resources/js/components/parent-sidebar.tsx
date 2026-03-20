import { Link } from '@inertiajs/react';
import { LayoutGrid, Settings, UserPlus } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavGroup } from '@/types';

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { title: 'Dashboard', href: '/parent/dashboard', icon: LayoutGrid },
        ],
    },
    {
        label: 'Children',
        items: [
            { title: 'Add Child', href: '/parent/children/add', icon: UserPlus },
            { title: 'Settings', href: '/parent/settings', icon: Settings },
        ],
    },
];

export function ParentSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/parent/dashboard" prefetch>
                                <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--canopy-400)] to-[var(--canopy-600)]">
                                    <span className="font-display text-[14px] font-[800] leading-none text-white">
                                        S
                                    </span>
                                </div>
                                <div className="ml-1 grid flex-1 text-left">
                                    <span className="truncate font-display text-[16px] font-bold leading-tight tracking-[-0.02em] text-white">
                                        Skoolpad
                                    </span>
                                    <span className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">
                                        Parent
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
