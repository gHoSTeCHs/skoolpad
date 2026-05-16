import { Badge } from '@/components/ui/badge';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import type { QuestionNode } from '@/types/questions';
import type { EditorContainer } from './composite-editor';

interface QuestionHeaderProps {
    container: EditorContainer;
    question: QuestionNode;
    isDraft?: boolean;
}

function statusToTone(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
    switch (status) {
        case 'published':
            return 'default';
        case 'in_review':
            return 'secondary';
        case 'archived':
            return 'destructive';
        default:
            return 'outline';
    }
}

function statusLabel(status: string): string {
    switch (status) {
        case 'in_review':
            return 'In review';
        default:
            return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

function breadcrumbsFor(container: EditorContainer, question: QuestionNode, isDraft: boolean): string[] {
    if (container.kind === 'paper') {
        const crumbs: (string | undefined)[] = [
            container.paper.institution_course?.course_code,
            container.paper.title,
            container.section.label,
        ];
        if (!isDraft) {
            crumbs.push(question.question_number || question.display_label || 'Q');
        }
        return crumbs.filter((s): s is string => Boolean(s));
    }
    const crumbs = [
        `${container.pool.course_code} · pool`,
        container.topic.title,
    ];
    if (!isDraft) {
        crumbs.push(question.question_number || question.display_label || 'Q');
    }
    return crumbs;
}

export function QuestionHeader({ container, question, isDraft = false }: QuestionHeaderProps) {
    const isSubQuestion = question.depth_level > 0;

    const titleText = isDraft
        ? (isSubQuestion ? 'New sub-question' : 'New question')
        : question.content && question.content.trim().length > 0
            ? question.content.split('\n')[0]
            : 'Untitled question';

    const breadcrumbs = breadcrumbsFor(container, question, isDraft);

    return (
        <div className="border-b border-[var(--border-2)] bg-card px-7 py-5">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-[var(--fg-subtle)]">
                {breadcrumbs.join(' / ')}
            </div>
            <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight text-foreground">
                {titleText}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[12.5px] text-muted-foreground">
                <QuestionTypeBadge type={question.question_type} />
                <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--fg-subtle)]" aria-hidden />
                <span>
                    <strong className="font-semibold text-foreground">
                        {question.marks ?? '—'}
                    </strong>{' '}
                    marks
                </span>
                {question.difficulty_level && (
                    <>
                        <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--fg-subtle)]" aria-hidden />
                        <span className="capitalize">{question.difficulty_level}</span>
                    </>
                )}
                {question.bloom_level && (
                    <>
                        <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--fg-subtle)]" aria-hidden />
                        <span className="capitalize">{question.bloom_level.replace(/_/g, ' ')}</span>
                    </>
                )}
                <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--fg-subtle)]" aria-hidden />
                <Badge variant={statusToTone(question.status)}>{statusLabel(question.status)}</Badge>
                {container.kind === 'pool' && (
                    <>
                        <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--fg-subtle)]" aria-hidden />
                        <span className="font-mono text-[11px] text-[var(--fg-subtle)]">
                            course-pool · no paper context
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
