import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    CalendarDays,
    FileText,
    Globe,
    GraduationCap,
    Landmark,
    LayoutGrid,
    Library,
    ListChecks,
    Network,
    Ruler,
    Settings,
    Shapes,
    Sparkles,
    Upload,
    Users,
    Bot,
} from 'lucide-react';
import AIModelController from '@/actions/App/Http/Controllers/Admin/AIModelController';
import BulkImportController from '@/actions/App/Http/Controllers/Admin/BulkImportController';
import ContentStudioController from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import CanonicalTopicController from '@/actions/App/Http/Controllers/Admin/CanonicalTopicController';
import CourseController from '@/actions/App/Http/Controllers/Admin/CourseController';
import CurriculumMappingController from '@/actions/App/Http/Controllers/Admin/CurriculumMappingController';
import DisciplineController from '@/actions/App/Http/Controllers/Admin/DisciplineController';
import EducationSystemController from '@/actions/App/Http/Controllers/Admin/EducationSystemController';
import GradingScaleController from '@/actions/App/Http/Controllers/Admin/GradingScaleController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import InstitutionTypeController from '@/actions/App/Http/Controllers/Admin/InstitutionTypeController';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import QuestionLibraryController from '@/actions/App/Http/Controllers/Admin/QuestionLibraryController';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import ReviewQueueController from '@/actions/App/Http/Controllers/Admin/ReviewQueueController';
import SchemeOfWorkController from '@/actions/App/Http/Controllers/Admin/SchemeOfWorkController';
import SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
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
        label: 'Content Studio',
        items: [
            { title: 'Content Studio', href: ContentStudioController.index.url(), icon: Sparkles },
            { title: 'AI Models', href: AIModelController.index.url(), icon: Bot },
        ],
    },
    {
        label: 'Content Management',
        items: [
            { title: 'Disciplines', href: DisciplineController.index.url(), icon: Shapes },
            { title: 'Canonical Topics', href: CanonicalTopicController.index.url(), icon: BookOpen },
            { title: 'Question Papers', href: QuestionPaperController.index.url(), icon: FileText },
            { title: 'Question Library', href: QuestionController.index.url(), icon: Library },
            { title: 'Question Library · preview', href: QuestionLibraryController.index.url(), icon: Library },
            { title: 'Courses', href: CourseController.index.url(), icon: GraduationCap },
            { title: 'Curriculum Mappings', href: CurriculumMappingController.index.url(), icon: Network },
            { title: 'Scheme of Work', href: SchemeOfWorkController.index.url(), icon: CalendarDays },
            { title: 'Review Queue', href: ReviewQueueController.index.url(), icon: ListChecks },
            { title: 'Bulk Import', href: BulkImportController.index.url(), icon: Upload },
        ],
    },
    {
        label: 'Institutions',
        items: [
            { title: 'All Institutions', href: InstitutionController.index.url(), icon: Building2 },
            { title: 'Education Systems', href: EducationSystemController.index.url(), icon: Globe },
            { title: 'Institution Types', href: InstitutionTypeController.index.url(), icon: Landmark },
            { title: 'Grading Scales', href: GradingScaleController.index.url(), icon: Ruler },
        ],
    },
    {
        label: 'Platform',
        items: [
            { title: 'Users', href: UserController.index.url(), icon: Users },
            { title: 'Settings', href: SettingsController.index.url(), icon: Settings },
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
