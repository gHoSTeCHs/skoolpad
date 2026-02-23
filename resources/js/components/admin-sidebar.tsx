import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    ClipboardList,
    GraduationCap,
    LayoutGrid,
    ListChecks,
    MessageSquareMore,
    Settings,
    Shapes,
    Upload,
    Users,
} from 'lucide-react';
import BulkImportController from '@/actions/App/Http/Controllers/Admin/BulkImportController';
import CanonicalTopicController from '@/actions/App/Http/Controllers/Admin/CanonicalTopicController';
import CourseController from '@/actions/App/Http/Controllers/Admin/CourseController';
import DisciplineController from '@/actions/App/Http/Controllers/Admin/DisciplineController';
import ExamTypeController from '@/actions/App/Http/Controllers/Admin/ExamTypeController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
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
            { title: 'Dashboard', href: '/admin', icon: LayoutGrid },
        ],
    },
    {
        label: 'Content Management',
        items: [
            { title: 'Disciplines', href: DisciplineController.index.url(), icon: Shapes },
            { title: 'Canonical Topics', href: CanonicalTopicController.index.url(), icon: BookOpen },
            { title: 'Questions', href: QuestionController.index.url(), icon: MessageSquareMore },
            { title: 'Courses', href: CourseController.index.url(), icon: GraduationCap },
            { title: 'Review Queue', href: '/admin/review-queue', icon: ListChecks },
            { title: 'Bulk Import', href: BulkImportController.index.url(), icon: Upload },
        ],
    },
    {
        label: 'Institutions',
        items: [
            { title: 'All Institutions', href: InstitutionController.index.url(), icon: Building2 },
            { title: 'Exam Types', href: ExamTypeController.index.url(), icon: ClipboardList },
        ],
    },
    {
        label: 'Platform',
        items: [
            { title: 'Users', href: '/admin/users', icon: Users },
            { title: 'Settings', href: '/admin/settings', icon: Settings },
        ],
    },
];

export function AdminSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin" prefetch>
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
                                        Admin
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
                <NavUser variant="admin" />
            </SidebarFooter>
        </Sidebar>
    );
}
