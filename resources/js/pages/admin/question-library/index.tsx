import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, Layers, Database, Inbox, Plus } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import { LibraryHeader } from '@/components/admin/question-library/library-header';
import { SearchBar } from '@/components/admin/question-library/search-bar';
import { CommandPalette } from '@/components/admin/question-library/command-palette';
import { PapersTab } from '@/components/admin/question-library/tabs/papers-tab';
import { CoursePoolsTab } from '@/components/admin/question-library/tabs/course-pools-tab';
import { ExamPoolsTab } from '@/components/admin/question-library/tabs/exam-pools-tab';
import { UnattachedTab } from '@/components/admin/question-library/tabs/unattached-tab';
import type {
    BulkAssignTargets,
    LibraryCounts,
    LibraryPaper,
    CoursePool,
    ExamSubjectPool,
    UnattachedQuestion,
    LibraryStatusFilter,
    LibraryTab,
} from '@/types/question-library';

interface QuestionLibraryIndexProps {
    counts: LibraryCounts;
    papers: LibraryPaper[];
    course_pools: CoursePool[];
    exam_subject_pools: ExamSubjectPool[];
    unattached_questions: UnattachedQuestion[];
    bulk_assign_targets: BulkAssignTargets;
    filters: { search?: string; status?: string };
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/admin' },
    { title: 'Question Library', href: '/admin/question-library' },
];

export default function QuestionLibraryIndex({
    counts,
    papers,
    course_pools,
    exam_subject_pools,
    unattached_questions,
    bulk_assign_targets,
    filters,
}: QuestionLibraryIndexProps) {
    const [activeTab, setActiveTab] = useState<LibraryTab>('papers');
    const [statusFilter, setStatusFilter] = useState<LibraryStatusFilter>(
        (filters.status as LibraryStatusFilter) ?? 'all',
    );
    const [paletteOpen, setPaletteOpen] = useState(false);

    function applyStatusFilter(next: LibraryStatusFilter) {
        setStatusFilter(next);
        router.get(
            '/admin/question-library',
            next === 'all' ? {} : { status: next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Question Library" />

            <div className="px-6 pb-12 pt-6">
                <div
                    className="overflow-hidden bg-card"
                    style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--card-radius)',
                        boxShadow: 'var(--shadow-md)',
                    }}
                >
                    <LibraryHeader counts={counts} />

                    <SearchBar
                        statusFilter={statusFilter}
                        onStatusFilterChange={applyStatusFilter}
                        onOpenCommandPalette={() => setPaletteOpen(true)}
                    />

                    <div
                        className="flex items-center gap-1.5 px-[30px]"
                        style={{ borderBottom: '1px solid var(--border-2)' }}
                    >
                        <TabButton
                            active={activeTab === 'papers'}
                            onClick={() => setActiveTab('papers')}
                            icon={FileText}
                            label="Papers"
                            count={counts.papers}
                        />
                        <TabButton
                            active={activeTab === 'course_pools'}
                            onClick={() => setActiveTab('course_pools')}
                            icon={Layers}
                            label="Course pools"
                            count={counts.course_pools}
                        />
                        <TabButton
                            active={activeTab === 'exam_pools'}
                            onClick={() => setActiveTab('exam_pools')}
                            icon={Database}
                            label="Exam-subject pools"
                            count={counts.exam_subject_pools}
                        />
                        <TabButton
                            active={activeTab === 'unattached'}
                            onClick={() => setActiveTab('unattached')}
                            icon={Inbox}
                            label="Unattached inbox"
                            count={counts.unattached}
                            tone={counts.unattached > 0 ? 'warn' : undefined}
                            className="ml-auto"
                        />
                        <div className="py-2">
                            <Link
                                href={QuestionPaperController.create.url()}
                                className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-foreground px-2.5 text-[12px] font-medium text-background transition-colors hover:bg-foreground/90"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                <Plus className="size-3.5" />
                                New paper
                            </Link>
                        </div>
                    </div>

                    {activeTab === 'papers' && <PapersTab papers={papers} />}
                    {activeTab === 'course_pools' && <CoursePoolsTab pools={course_pools} />}
                    {activeTab === 'exam_pools' && <ExamPoolsTab pools={exam_subject_pools} />}
                    {activeTab === 'unattached' && (
                        <UnattachedTab questions={unattached_questions} targets={bulk_assign_targets} />
                    )}
                </div>
            </div>

            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </AdminLayout>
    );
}

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    count: number;
    tone?: 'warn';
    className?: string;
}

function TabButton({ active, onClick, icon: Icon, label, count, tone, className }: TabButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                '-mb-px inline-flex items-center gap-2 border-b-2 px-3.5 py-3.5 text-[13px] font-medium transition-colors '
                + (active
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground ')
                + (className ? ' ' + className : '')
            }
            style={{ fontFamily: 'var(--font-body)' }}
        >
            <Icon className="size-[14px]" />
            {label}
            <span
                className="text-[10.5px]"
                style={{
                    fontFamily: 'var(--font-mono)',
                    color: tone === 'warn' ? 'var(--warning)' : active ? 'var(--foreground)' : 'var(--fg-subtle)',
                }}
            >
                {count}
            </span>
        </button>
    );
}
