import { cn } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { TYPE_META } from './lib/question-meta';
import type { QuestionNode, QuestionPaper, QuestionStatus } from '@/types/questions';

interface QuestionHeaderProps {
    paper: QuestionPaper;
    question: QuestionNode;
    sectionLabel: string | null;
}

function stripHtml(html: string | undefined | null): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function stemSnippet(question: QuestionNode, max = 80): string {
    const text = stripHtml(question.content);
    if (!text) return 'Untitled question';
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + '…';
}

export function QuestionHeader({ paper, question, sectionLabel }: QuestionHeaderProps) {
    const meta = TYPE_META[question.question_type];
    const qNumber = question.question_number || question.display_label || 'Q?';
    const courseCode = paper.institution_course?.course_code;

    return (
        <header className="px-12 pt-8 pb-4">
            <nav
                aria-label="Question breadcrumb"
                className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-[var(--fg-subtle)] uppercase"
            >
                {courseCode && (
                    <>
                        <span>{courseCode}</span>
                        <span aria-hidden className="opacity-50">›</span>
                    </>
                )}
                {sectionLabel && (
                    <>
                        <span>{sectionLabel}</span>
                        <span aria-hidden className="opacity-50">›</span>
                    </>
                )}
                <span className="text-foreground">{qNumber}</span>
            </nav>

            <h1 className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-[13px] font-medium tracking-tight text-[var(--fg-subtle)]">
                    {qNumber} ·
                </span>
                <span className="font-display text-[24px] font-semibold leading-tight tracking-tight text-foreground sm:text-[26px]">
                    {stemSnippet(question)}
                </span>
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <TypeBadge label={meta.label} short={meta.short} />
                <MarksBadge marks={question.marks} />
                <StatusBadge questionId={question.id} status={question.status as QuestionStatus} />
                {question.difficulty_level && (
                    <DimBadge>{capitalize(question.difficulty_level)}</DimBadge>
                )}
                {question.bloom_level && (
                    <DimBadge>{capitalize(question.bloom_level)}</DimBadge>
                )}
            </div>
        </header>
    );
}

function TypeBadge({ label, short }: { label: string; short: string }) {
    return (
        <span
            title={`${label} (change-type lands in a later checkpoint)`}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
        >
            <span className="font-mono text-[10px] tracking-wider uppercase">{short}</span>
            <span className="opacity-80">{label}</span>
        </span>
    );
}

function MarksBadge({ marks }: { marks: number | null }) {
    return (
        <span
            title="Marks editor lands in a later checkpoint"
            className="inline-flex items-center rounded-full border border-border bg-[var(--bg-raised)] px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground"
        >
            {marks != null ? `${marks} marks` : '— marks'}
        </span>
    );
}

function DimBadge({ children }: { children: string }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border border-border bg-[var(--bg-raised)] px-2.5 py-0.5 text-[11px]',
                'text-muted-foreground',
            )}
        >
            {children}
        </span>
    );
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}
