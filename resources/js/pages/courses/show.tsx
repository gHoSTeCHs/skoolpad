import { Head, router } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { TopicsTab } from '@/pages/courses/partials/topics-tab';
import { PastQuestionsTab } from '@/pages/courses/partials/past-questions-tab';
import { index as coursesIndex, show as courseShow } from '@/actions/App/Http/Controllers/Student/CourseController';
import type { BreadcrumbItem } from '@/types';
import type { CourseShowProps } from '@/types/student-courses';

export default function CourseShow({ course, activeTab, topics, topicsProgress, questions, filterOptions, appliedFilters }: CourseShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Courses', href: coursesIndex.url() },
        { title: course.course_code, href: courseShow.url(course.id) },
    ];

    function handleTabChange(tab: string) {
        router.get(
            courseShow.url(course.id),
            { tab },
            { preserveState: true, preserveScroll: false, replace: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${course.course_code} — ${course.course_title}`} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            {course.course_code}
                        </h1>
                        {course.institution && (
                            <span className="text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {course.institution.abbreviation}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {course.course_title}
                        {course.level && ` \u00B7 ${course.level} Level`}
                        {course.semester && ` \u00B7 ${course.semester === 'first' ? '1st' : '2nd'} Semester`}
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList variant="line">
                        <TabsTrigger value="topics">Topics</TabsTrigger>
                        <TabsTrigger value="past_questions">Past Questions</TabsTrigger>
                        <TabsTrigger value="practice">Practice</TabsTrigger>
                        <TabsTrigger value="progress">Progress</TabsTrigger>
                    </TabsList>

                    <TabsContent value="topics">
                        {topics && topicsProgress && (
                            <TopicsTab
                                topics={topics}
                                progress={topicsProgress}
                                courseId={course.id}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="past_questions">
                        {questions && filterOptions && appliedFilters && (
                            <PastQuestionsTab
                                courseId={course.id}
                                questions={questions}
                                filterOptions={filterOptions}
                                appliedFilters={appliedFilters}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="practice">
                        <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center" style={{ borderRadius: 'var(--card-radius)' }}>
                            <div className="mb-2 text-2xl">{'\uD83C\uDFAF'}</div>
                            <h3 className="font-display text-lg font-semibold">Practice Mode</h3>
                            <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Coming in Phase 1.9
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="progress">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border border-border bg-card p-4" style={{ borderRadius: 'var(--card-radius)' }}>
                                <p className="text-[12px] font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Topics completed</p>
                                <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                                    {topicsProgress ? `${topicsProgress.completed}/${topicsProgress.total}` : '\u2014'}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-4" style={{ borderRadius: 'var(--card-radius)' }}>
                                <p className="text-[12px] font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Questions attempted</p>
                                <p className="mt-1 font-display text-2xl font-bold tracking-tight">0</p>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-4" style={{ borderRadius: 'var(--card-radius)' }}>
                                <p className="text-[12px] font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Average accuracy</p>
                                <p className="mt-1 font-display text-2xl font-bold tracking-tight">{'\u2014'}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-4" style={{ borderRadius: 'var(--card-radius)' }}>
                                <p className="text-[12px] font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Study time</p>
                                <p className="mt-1 font-display text-2xl font-bold tracking-tight">{'\u2014'}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-center text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Detailed progress tracking coming in Phase 1.10
                        </p>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
