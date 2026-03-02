import { Head, Link } from '@inertiajs/react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import LevelProgressionController from '@/actions/App/Http/Controllers/Student/LevelProgressionController';
import ParentInvitationController from '@/actions/App/Http/Controllers/Student/ParentInvitationController';
import { show as subjectShow } from '@/actions/App/Http/Controllers/Student/SubjectController';
import { dismiss as studyPlanDismiss } from '@/actions/App/Http/Controllers/Student/StudyPlanController';
import CourseCard from '@/components/skoolpad/course-card';
import GuidedStudyCard from '@/components/skoolpad/guided-study-card';
import LevelProgressionModal from '@/components/skoolpad/level-progression-modal';
import ParentInvitationBanner from '@/components/skoolpad/parent-invitation-banner';
import StatCard from '@/components/skoolpad/stat-card';
import StreakWidget from '@/components/skoolpad/streak-widget';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { StudentType } from '@/types/enums';
import type { GuidedStudyPlan } from '@/types/guided-study';

interface DashboardCourse {
    id: string;
    course_code: string;
    course_title: string;
    topic_count: number;
    question_count: number;
}

interface DashboardSubject {
    id: string;
    name: string;
    is_compulsory: boolean;
}

interface SuggestedTopic {
    id: string;
    title: string;
    slug: string;
}

interface Props {
    student: {
        name: string;
        student_type: StudentType;
        institution?: string | null;
        faculty?: string | null;
        department?: string | null;
        level?: string | number | null;
        education_system?: string | null;
        education_level?: string | null;
        tier?: string | null;
        stream?: string | null;
        exam_goals?: string[];
    } | null;
    courses: DashboardCourse[];
    subjects: DashboardSubject[];
    stats: {
        courses_count: number;
        practice_sessions: number;
        study_hours: number;
        streak_days: number;
    };
    suggested_topics: SuggestedTopic[];
    parent_invitation?: {
        show: boolean;
        style: 'prominent' | 'subtle';
        is_early_level: boolean;
    } | null;
    guided_study?: GuidedStudyPlan | null;
    study_plan_dismissed?: boolean;
    level_progression?: {
        show: boolean;
        current_level: string;
        next_level: string;
        next_level_id: string;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
];

const variants = ['canopy', 'ember', 'honey'] as const;

const streakDays = [
    { label: 'M', state: 'upcoming' as const },
    { label: 'T', state: 'upcoming' as const },
    { label: 'W', state: 'upcoming' as const },
    { label: 'T', state: 'upcoming' as const },
    { label: 'F', state: 'upcoming' as const },
    { label: 'S', state: 'upcoming' as const },
    { label: 'S', state: 'upcoming' as const },
];

function getSubtitle(student: Props['student']): string {
    if (!student) return "Here's your learning progress";

    if (student.student_type === 'tertiary') {
        return `${student.department} · ${student.level} Level · ${student.institution}`;
    }

    const parts = [student.education_level, student.stream, student.education_system].filter(Boolean);
    return parts.join(' · ') || "Here's your learning progress";
}

export default function Dashboard({ student, courses, subjects, stats, suggested_topics, guided_study, study_plan_dismissed, parent_invitation, level_progression }: Props) {
    const firstName = student?.name.split(' ')[0] ?? 'Student';
    const isTertiary = student?.student_type === 'tertiary';
    const isSecondary = student?.student_type === 'secondary';
    const [levelModalOpen, setLevelModalOpen] = useState(!!level_progression?.show);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-8 p-4 md:p-6">
                {level_progression?.show && (
                    <LevelProgressionModal
                        open={levelModalOpen}
                        onOpenChange={setLevelModalOpen}
                        currentLevel={level_progression.current_level}
                        nextLevel={level_progression.next_level}
                        updateUrl={LevelProgressionController.update.url()}
                        nextLevelId={level_progression.next_level_id}
                    />
                )}

                {parent_invitation?.show && parent_invitation.style === 'prominent' && (
                    <ParentInvitationBanner
                        style="prominent"
                        dismissUrl={ParentInvitationController.dismiss.url()}
                    />
                )}

                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                        Welcome back, {firstName}!
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {getSubtitle(student)}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label={isTertiary ? 'Courses' : 'Subjects'}
                        value={String(isTertiary ? stats.courses_count : subjects.length)}
                        change={
                            isTertiary
                                ? stats.courses_count === 0 ? 'Enrol to start' : `${stats.courses_count} enrolled`
                                : `${subjects.length} subject${subjects.length !== 1 ? 's' : ''}`
                        }
                        trend={isTertiary ? (stats.courses_count > 0 ? 'up' : 'neutral') : (subjects.length > 0 ? 'up' : 'neutral')}
                    />
                    <StatCard
                        label="Practice"
                        value={String(stats.practice_sessions)}
                        change="Coming soon"
                        trend="neutral"
                    />
                    <StatCard
                        label="Hours"
                        value={String(stats.study_hours)}
                        change="Coming soon"
                        trend="neutral"
                    />
                    <StreakWidget count={stats.streak_days} days={streakDays} />
                </div>

                {isTertiary && courses.length > 0 && (
                    <div>
                        <h2 className="font-display text-lg font-semibold tracking-tight">
                            Your Courses
                        </h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {courses.map((course, i) => (
                                <CourseCard
                                    key={course.id}
                                    code={course.course_code}
                                    name={course.course_title}
                                    progress={0}
                                    questionCount={course.question_count}
                                    variant={variants[i % variants.length]}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {isSecondary && subjects.length > 0 && (
                    <div>
                        <h2 className="font-display text-lg font-semibold tracking-tight">
                            My Subjects
                        </h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {subjects.map((subject) => (
                                <Link
                                    key={subject.id}
                                    href={subjectShow.url(subject.id)}
                                    className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                                    prefetch
                                >
                                    <span className="text-sm font-medium">{subject.name}</span>
                                    {subject.is_compulsory && (
                                        <Badge variant="secondary" className="text-[10px]">Compulsory</Badge>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {parent_invitation?.show && parent_invitation.is_early_level && (
                    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                        <ShieldCheck className="size-5 shrink-0 text-primary" />
                        <p className="text-sm text-muted-foreground">
                            Ask your parent or guardian to connect their account so they can see how you're doing.
                        </p>
                    </div>
                )}

                {isSecondary && guided_study && (
                    <GuidedStudyCard plan={guided_study} dismissUrl={studyPlanDismiss.url()} />
                )}

                {isSecondary && !guided_study && !study_plan_dismissed && (
                    <div className="rounded-lg border-2 border-dashed border-border/60 bg-card/50 p-6 text-center">
                        <BookOpen className="mx-auto size-8 text-muted-foreground/50" />
                        <h3 className="font-display mt-3 text-base font-semibold">Guided Study</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Personalised study plans and lesson guides are coming soon.
                        </p>
                    </div>
                )}

                {suggested_topics.length > 0 && (
                    <div>
                        <h2 className="font-display text-lg font-semibold tracking-tight">
                            Suggested Topics
                        </h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {suggested_topics.map((topic) => (
                                <div
                                    key={topic.id}
                                    className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                                >
                                    <span className="text-sm font-medium">{topic.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isTertiary && courses.length === 0 && (
                    <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center">
                        <h3 className="font-display text-lg font-semibold">No courses yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Your enrolled courses will appear here once you complete onboarding.
                        </p>
                    </div>
                )}

                {parent_invitation?.show && parent_invitation.style === 'subtle' && (
                    <ParentInvitationBanner
                        style="subtle"
                        dismissUrl={ParentInvitationController.dismiss.url()}
                    />
                )}
            </div>
        </AppLayout>
    );
}
