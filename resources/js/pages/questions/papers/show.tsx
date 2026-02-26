import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Clock, FileText, Layers } from 'lucide-react';
import { ContextCard } from '@/components/skoolpad/questions';
import type { ContextCardData } from '@/components/skoolpad/questions/context-card';
import SpBadge from '@/components/skoolpad/sp-badge';
import AppLayout from '@/layouts/app-layout';
import { PaperQuestionNode } from '@/pages/questions/papers/partials/paper-question-node';
import { index as papersIndex } from '@/actions/App/Http/Controllers/Student/QuestionPaperController';
import type { BreadcrumbItem } from '@/types';
import type { QuestionPaper, QuestionContextData } from '@/types/questions';

interface Props {
    paper: QuestionPaper;
}

function contextToCardData(ctx: QuestionContextData): ContextCardData {
    return {
        id: ctx.id,
        contextType: ctx.context_type,
        title: ctx.title,
        content: ctx.content,
        mediaUrl: ctx.media_url,
        tableData: ctx.table_data,
        wordBank: ctx.word_bank,
    };
}

export default function PaperShow({ paper }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Past Questions', href: papersIndex.url() },
        { title: paper.title, href: '#' },
    ];

    const totalQuestions = paper.sections.reduce((sum, s) => sum + s.questions.length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={paper.title} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Link
                    href={papersIndex.url()}
                    className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to papers
                </Link>

                <div
                    className="rounded-lg border border-border bg-card p-5"
                    style={{ borderRadius: 'var(--card-radius)' }}
                >
                    <h1 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                        {paper.title}
                    </h1>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {paper.institution_course && (
                            <SpBadge variant="reward">{paper.institution_course.course_code}</SpBadge>
                        )}
                        {paper.institution_course?.institution && (
                            <SpBadge variant="neutral">{paper.institution_course.institution.abbreviation}</SpBadge>
                        )}
                        {paper.assessment_type && (
                            <SpBadge variant="primary">{paper.assessment_type.name}</SpBadge>
                        )}
                        {paper.year && (
                            <SpBadge variant="neutral">{paper.year}</SpBadge>
                        )}
                        {paper.semester && (
                            <SpBadge variant="neutral">{paper.semester}</SpBadge>
                        )}
                        {paper.academic_session && (
                            <SpBadge variant="neutral">{paper.academic_session}</SpBadge>
                        )}
                    </div>

                    <div
                        className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        {paper.total_marks && paper.total_marks > 0 && (
                            <span className="flex items-center gap-1.5">
                                <FileText className="size-4" />
                                {paper.total_marks} marks
                            </span>
                        )}
                        {paper.duration_minutes && paper.duration_minutes > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="size-4" />
                                {paper.duration_minutes} minutes
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Layers className="size-4" />
                            {paper.sections.length} section{paper.sections.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <BookOpen className="size-4" />
                            {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {paper.instructions && (
                    <div
                        className="rounded-lg border border-border bg-accent/30 p-4"
                        style={{ borderRadius: 'var(--card-radius)' }}
                    >
                        <h2 className="mb-2 font-display text-sm font-bold">Instructions</h2>
                        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)', whiteSpace: 'pre-line' }}>
                            {paper.instructions}
                        </p>
                    </div>
                )}

                {paper.contexts.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="font-display text-sm font-bold">Contexts</h2>
                        {paper.contexts.map((ctx) => (
                            <ContextCard key={ctx.id} context={contextToCardData(ctx)} />
                        ))}
                    </div>
                )}

                {paper.sections.map((section) => (
                    <div key={section.id} className="space-y-4">
                        <div
                            className="rounded-lg border border-border bg-card p-4"
                            style={{ borderRadius: 'var(--card-radius)' }}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="font-display text-base font-bold">
                                    Section {section.label}
                                </h2>
                                {section.marks !== null && section.marks !== undefined && (
                                    <SpBadge variant="primary">{section.marks} marks</SpBadge>
                                )}
                            </div>
                            {section.instruction && (
                                <p className="mt-1 text-sm italic text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    {section.instruction}
                                </p>
                            )}
                            {section.required_count && (
                                <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    Answer {section.required_count} of {section.questions.length} questions
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 pl-2 md:pl-4">
                            {section.questions.map((question) => (
                                <PaperQuestionNode key={question.id} node={question} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
