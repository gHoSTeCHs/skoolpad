import { Head } from '@inertiajs/react';
import { BookOpen } from 'lucide-react';

import ExamPrepController from '@/actions/App/Http/Controllers/Student/ExamPrepController';
import PracticeController from '@/actions/App/Http/Controllers/Student/PracticeController';
import AppLayout from '@/layouts/app-layout';
import type { ExamPrepPageProps } from '@/types/practice';

import { ExamGoalCard } from './partials/exam-goal-card';
import { MockPaperCard } from './partials/mock-paper-card';

const breadcrumbs = [
    { title: 'Practice', href: PracticeController.configure.url() },
    { title: 'Exam Prep', href: ExamPrepController.index.url() },
];

export default function ExamPrep({ goals, papers }: ExamPrepPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam Prep" />

            <div className="flex flex-col gap-8 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Exam Prep</h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Track your exam goals, practice with past papers, and build daily study habits.
                    </p>
                </div>

                <section>
                    <h2 className="font-display text-lg font-semibold tracking-tight">Your Exam Goals</h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {goals.map((goal) => (
                            <ExamGoalCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                </section>

                {goals.map((goal) => {
                    const goalPapers = papers[goal.id] ?? [];
                    if (goalPapers.length === 0) return null;

                    return (
                        <section key={goal.id}>
                            <h2 className="font-display text-lg font-semibold tracking-tight">
                                Mock Exams — {goal.assessment_type.name}
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Full-length past papers under timed conditions
                            </p>
                            <div className="mt-3 space-y-2">
                                {goalPapers.map((paper) => (
                                    <MockPaperCard key={paper.id} paper={paper} />
                                ))}
                            </div>
                        </section>
                    );
                })}

                {goals.every((g) => (papers[g.id] ?? []).length === 0) && (
                    <div className="rounded-xl border border-dashed py-12 text-center">
                        <BookOpen className="mx-auto size-8 text-muted-foreground/50" />
                        <p className="mt-3 text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            No mock papers available yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70" style={{ fontFamily: 'var(--font-body)' }}>
                            Past papers for your exam types will appear here once they're added.
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
