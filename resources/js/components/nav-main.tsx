import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { toUrl } from '@/lib/utils';
import type { NavGroup } from '@/types';

interface NavMainProps {
    groups: NavGroup[];
}

export function NavMain({ groups = [] }: NavMainProps) {
    const { currentUrl } = useCurrentUrl();

    return (
        <>
            {groups.map((group) => (
                <SidebarGroup key={group.label} className="px-2 py-0">
                    <SidebarGroupLabel className="text-[9px] font-[var(--font-body)] uppercase tracking-[0.12em] text-white/25">
                        {group.label}
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {group.items.map((item) => {
                            const hrefString = toUrl(item.href);
                            const active = !item.onClick && (currentUrl === hrefString ||
                                (hrefString !== '/admin' && currentUrl.startsWith(hrefString + '/')));

                            const iconEl = item.icon && (
                                <span
                                    className={[
                                        'flex size-4 shrink-0 items-center justify-center rounded-[4px] bg-white/10',
                                        'reader:size-[6px] reader:rounded-full',
                                        active && 'bg-[var(--nav-active-icon-bg)]',
                                        active && 'reader:bg-[#3EBD93] reader:shadow-[0_0_8px_rgba(62,189,147,0.4)]',
                                    ].filter(Boolean).join(' ')}
                                >
                                    <item.icon className="size-3 reader:hidden" />
                                </span>
                            );

                            const buttonClasses = [
                                'border-l-2 border-transparent text-[13px] text-white/45 hover:text-white/85',
                                active && 'border-[var(--nav-active-border)] bg-[var(--sidebar-accent)] font-medium text-white',
                                active && 'reader:border-l-0 reader:font-bold reader:text-[#3EBD93]',
                            ].filter(Boolean).join(' ');

                            if (item.onClick) {
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            tooltip={{ children: item.title }}
                                            className={buttonClasses}
                                            onClick={item.onClick}
                                        >
                                            {iconEl}
                                            <span className="flex-1">{item.title}</span>
                                            {item.badge && (
                                                <kbd className="ml-auto hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40 lg:inline-block">
                                                    {item.badge}
                                                </kbd>
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            }

                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active}
                                        tooltip={{ children: item.title }}
                                        className={buttonClasses}
                                    >
                                        <Link href={item.href} prefetch>
                                            {iconEl}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
