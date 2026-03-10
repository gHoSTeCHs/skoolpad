import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, BookOpen, Calendar, GraduationCap, PlayCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { index as examTimetableIndex, startStudying } from '@/actions/App/Http/Controllers/Student/ExamTimetableController';
import LevelProgressionController from '@/actions/App/Http/Controllers/Student/LevelProgressionController';
import ParentInvitationController from '@/actions/App/Http/Controllers/Student/ParentInvitationController';
import { configure as practiceConfigureRoute } from '@/actions/App/Http/Controllers/Student/PracticeController';
import ReviewQueueController from '@/actions/App/Http/Controllers/Student/ReviewQueueController';
import { show as subjectShow } from '@/actions/App/Http/Controllers/Student/SubjectController';
import { dismiss as studyPlanDismiss } from '@/actions/App/Http/Controllers/Student/StudyPlanController';
import CourseCard from '@/components/skoolpad/course-card';
import GuidedStudyCard from '@/components/skoolpad/guided-study-card';
import LevelProgressionModal from '@/components/skoolpad/level-progression-modal';
import ParentInvitationBanner from '@/components/skoolpad/parent-invitation-banner';
import StatCard from '@/components/skoolpad/stat-card';
import StreakWidget from '@/components/skoolpad/streak-widget';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { StudentType } from '@/types/enums';
import type { GuidedStudyPlan } from '@/types/guided-study';
import type { ExamSummary } from '@/types/study-planner';

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
        questions_practiced: number;
        overall_accuracy: number;
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
    review_queue_count?: number;
    continue_studying?: {
        type: 'practice' | 'topic';
        label: string;
        url: string;
    } | null;
    exam_timetable_card?: ExamSummary | null;
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

export default function Dashboard({ student, courses, subjects, stats, suggested_topics, guided_study, study_plan_dismissed, parent_invitation, level_progression, review_queue_count, continue_studying, exam_timetable_card }: Props) {
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

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                        change={stats.practice_sessions === 0 ? 'Start practising' : `${stats.practice_sessions} session${stats.practice_sessions !== 1 ? 's' : ''}`}
                        trend={stats.practice_sessions > 0 ? 'up' : 'neutral'}
                    />
                    <StatCard
                        label="Questions"
                        value={String(stats.questions_practiced)}
                        change={stats.questions_practiced === 0 ? 'Start practising' : `${stats.questions_practiced} answered`}
                        trend={stats.questions_practiced > 0 ? 'up' : 'neutral'}
                    />
                    <StatCard
                        label="Accuracy"
                        value={`${stats.overall_accuracy}%`}
                        change={stats.overall_accuracy === 0 ? 'No graded answers' : `${stats.overall_accuracy}% correct`}
                        trend={stats.overall_accuracy >= 70 ? 'up' : stats.overall_accuracy > 0 ? 'neutral' : 'neutral'}
                    />
                    <StatCard
                        label="Hours"
                        value={String(stats.study_hours)}
                        change={stats.study_hours === 0 ? 'Start studying' : `${stats.study_hours}h total`}
                        trend={stats.study_hours > 0 ? 'up' : 'neutral'}
                    />
                    <StreakWidget count={stats.streak_days} days={streakDays} />
                </div>

                {(review_queue_count !== undefined || continue_studying) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {review_queue_count !== undefined && (
                            <Link
                                href={ReviewQueueController.index.url()}
                                className={cn(
                                    'flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-accent/50',
                                    review_queue_count === 0
                                        ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10 reader:border-emerald-800/30 reader:bg-emerald-950/10'
                                        : review_queue_count <= 10
                                          ? 'border-amber-200 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10 reader:border-amber-800/30 reader:bg-amber-950/10'
                                          : 'border-red-200 bg-red-50/30 dark:border-red-800/30 dark:bg-red-950/10 reader:border-red-800/30 reader:bg-red-950/10',
                                )}
                            >
                                <div className={cn(
                                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                                    review_queue_count === 0
                                        ? 'bg-emerald-100 dark:bg-emerald-900/40 reader:bg-emerald-900/40'
                                        : review_queue_count <= 10
                                          ? 'bg-amber-100 dark:bg-amber-900/40 reader:bg-amber-900/40'
                                          : 'bg-red-100 dark:bg-red-900/40 reader:bg-red-900/40',
                                )}>
                                    <RotateCcw className={cn(
                                        'size-5',
                                        review_queue_count === 0
                                            ? 'text-emerald-600 dark:text-emerald-400 reader:text-emerald-400'
                                            : review_queue_count <= 10
                                              ? 'text-amber-600 dark:text-amber-400 reader:text-amber-400'
                                              : 'text-red-600 dark:text-red-400 reader:text-red-400',
                                    )} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">Review Queue</p>
                                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        {review_queue_count === 0 ? 'All caught up!' : `${review_queue_count} item${review_queue_count !== 1 ? 's' : ''} due for review`}
                                    </p>
                                </div>
                                {review_queue_count > 0 ? (
                                    <Button
                                        size="sm"
                                        className="shrink-0"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            router.post(ReviewQueueController.start.url());
                                        }}
                                    >
                                        Start Review
                                    </Button>
                                ) : (
                                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                                )}
                            </Link>
                        )}

                        {continue_studying && (
                            <Link
                                href={continue_studying.url}
                                className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
                            >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <PlayCircle className="size-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">
                                        {continue_studying.type === 'practice' ? 'Continue Practice' : 'Continue Reading'}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        {continue_studying.label}
                                    </p>
                                </div>
                                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                            </Link>
                        )}
                    </div>
                )}

                {!exam_timetable_card && (
                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <GraduationCap className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Exam Timetable</p>
                                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    Add your exam dates to get a personalised daily study plan.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button size="sm" variant="outline" asChild>
                                <Link href={examTimetableIndex.url()}>
                                    Set Up Timetable
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}

                {exam_timetable_card && (
                    <div className={cn(
                        'rounded-xl border bg-card p-5',
                        exam_timetable_card.next_exam && exam_timetable_card.next_exam.days_remaining <= 3
                            ? 'border-l-4 border-l-red-500 dark:border-l-red-400 reader:border-l-red-400'
                            : exam_timetable_card.next_exam && exam_timetable_card.next_exam.days_remaining <= 7
                              ? 'border-l-4 border-l-amber-500 dark:border-l-amber-400 reader:border-l-amber-400'
                              : '',
                    )}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <GraduationCap className="size-5 text-primary" />
                                </div>
                                <div>
                                    {exam_timetable_card.next_exam ? (
                                        <>
                                            <p className="text-sm font-semibold">{exam_timetable_card.next_exam.label}</p>
                                            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                                {exam_timetable_card.total_active} active exam{exam_timetable_card.total_active !== 1 ? 's' : ''}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm font-semibold">Exam Timetable</p>
                                    )}
                                </div>
                            </div>
                            {exam_timetable_card.next_exam && (
                                <div className="flex items-center gap-2 text-right">
                                    <Calendar className="size-4 text-muted-foreground" />
                                    <span className={cn(
                                        'text-sm font-semibold',
                                        exam_timetable_card.next_exam.days_remaining <= 7
                                            ? 'text-red-600 dark:text-red-400 reader:text-red-400'
                                            : exam_timetable_card.next_exam.days_remaining <= 30
                                              ? 'text-amber-600 dark:text-amber-400 reader:text-amber-400'
                                              : 'text-muted-foreground',
                                    )}>
                                        {exam_timetable_card.next_exam.days_remaining}d left
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {exam_timetable_card.recommended_minutes > 0 && (
                                <span>{exam_timetable_card.recommended_minutes} min recommended today</span>
                            )}
                            {exam_timetable_card.total_weak_topics > 0 && (
                                <span>{exam_timetable_card.total_weak_topics} weak topic{exam_timetable_card.total_weak_topics !== 1 ? 's' : ''}</span>
                            )}
                        </div>

                        {exam_timetable_card.focus_topics.length > 0 && (
                            <div className="mt-3 rounded-lg bg-muted/50 p-3">
                                <p className="text-xs font-medium text-muted-foreground">Focus topics</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {exam_timetable_card.focus_topics.map((topic) => (
                                        <Badge key={topic} variant="secondary" className="text-xs">
                                            {topic}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-3">
                            <Button
                                size="sm"
                                onClick={() => router.post(startStudying.url())}
                            >
                                Start Studying
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <Link href={examTimetableIndex.url()}>
                                    View Timetable
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}

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
