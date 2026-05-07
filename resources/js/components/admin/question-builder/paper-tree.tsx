import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import QuestionSectionController from '@/actions/App/Http/Controllers/Admin/QuestionSectionController';
import QuestionContextController from '@/actions/App/Http/Controllers/Admin/QuestionContextController';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import type { QuestionPaper, QuestionSection, QuestionNode, QuestionContextData } from '@/types/questions';

export type SelectedNodeType = 'section' | 'question' | 'context';

export interface SelectedNode {
    type: SelectedNodeType;
    id: string;
}

interface PaperTreeProps {
    paper: QuestionPaper;
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode | null) => void;
}

interface SectionNodeProps {
    paper: QuestionPaper;
    section: QuestionSection;
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode | null) => void;
}

interface QuestionTreeNodeProps {
    paper: QuestionPaper;
    question: QuestionNode;
    depth: number;
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode | null) => void;
}

function countQuestionsRecursive(questions: QuestionNode[]): number {
    let count = 0;
    for (const q of questions) {
        count += 1;
        if (q.children.length > 0) {
            count += countQuestionsRecursive(q.children);
        }
    }
    return count;
}

type AnswerFill = 'published' | 'draft' | 'empty';

const ANSWER_DEPTHS = ['quick', 'standard', 'deep_dive'] as const;
const ANSWER_DEPTH_LABELS: Record<typeof ANSWER_DEPTHS[number], string> = {
    quick: 'Quick',
    standard: 'Standard',
    deep_dive: 'Deep dive',
};

function getAnswerFill(answers: QuestionNode['answers'], depth: typeof ANSWER_DEPTHS[number]): AnswerFill {
    const answer = answers?.find((a) => a.depth_level === depth);
    if (!answer) return 'empty';
    return answer.is_published ? 'published' : 'draft';
}

function AnswerStatusDots({ question }: { question: QuestionNode }) {
    const isGroup = question.question_type === 'group';
    const fills = ANSWER_DEPTHS.map((d) => getAnswerFill(question.answers, d));
    const filledCount = fills.filter((f) => f !== 'empty').length;
    const dimmed = isGroup || filledCount === 0;

    const tooltip = isGroup
        ? 'Group — children carry answers'
        : ANSWER_DEPTHS
            .map((d, i) => `${ANSWER_DEPTH_LABELS[d]}: ${fills[i]}`)
            .join(' · ');

    return (
        <span
            className={
                'inline-flex shrink-0 items-center gap-[3px] rounded-full border border-border bg-[var(--bg-raised)] px-2 py-[5px]'
                + (dimmed ? ' opacity-[0.55]' : '')
            }
            title={tooltip}
            aria-label={tooltip}
        >
            {fills.map((fill, i) => (
                <span
                    key={i}
                    className={
                        'h-1.5 w-1.5 rounded-full'
                        + (fill === 'published'
                            ? ' bg-[var(--success)]'
                            : fill === 'draft'
                                ? ' bg-[var(--warning)]'
                                : ' bg-border/85')
                    }
                />
            ))}
        </span>
    );
}

function QuestionTreeNode({ paper, question, depth, selectedNode, onSelectNode }: QuestionTreeNodeProps) {
    const [expanded, setExpanded] = useState(true);
    const isSelected = selectedNode?.type === 'question' && selectedNode.id === question.id;
    const hasChildren = question.children.length > 0;

    function handleAddSubQuestion() {
        router.post(QuestionController.store.url(), {
            question_paper_id: paper.id,
            question_section_id: question.question_type === 'group' ? null : undefined,
            parent_question_id: question.id,
            institution_course_id: paper.institution_course_id,
            question_type: 'short_answer',
            content: 'New sub-question',
            source: 'manual',
            status: 'draft',
        }, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['paper'] }),
        });
    }

    return (
        <div style={{ paddingLeft: depth > 0 ? 12 : 0 }}>
            <div
                className={
                    'group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent'
                    + (isSelected ? ' border-l-2 border-primary bg-accent' : '')
                }
                onClick={() => onSelectNode({ type: 'question', id: question.id })}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="shrink-0 border-none bg-transparent p-0 text-[10px] text-muted-foreground transition-transform duration-150"
                        style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
                    >
                        {'\u25B6'}
                    </button>
                ) : (
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                )}

                <span className="min-w-0 flex-1 truncate">
                    {question.question_number || question.display_label || 'Q'}
                </span>

                <QuestionTypeBadge type={question.question_type} className="shrink-0 text-[8px] px-1 py-0" />

                {question.marks !== null && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">{question.marks}m</span>
                )}

                <AnswerStatusDots question={question} />

                {question.question_type === 'group' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAddSubQuestion(); }}
                        className="hidden shrink-0 rounded border-none bg-transparent p-0 text-muted-foreground transition-colors hover:text-primary group-hover:inline-block"
                        title="Add sub-question"
                    >
                        +
                    </button>
                )}
            </div>

            {hasChildren && expanded && (
                <div>
                    {question.children.map((child) => (
                        <QuestionTreeNode
                            key={child.id}
                            paper={paper}
                            question={child}
                            depth={depth + 1}
                            selectedNode={selectedNode}
                            onSelectNode={onSelectNode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function SectionNode({ paper, section, selectedNode, onSelectNode }: SectionNodeProps) {
    const [expanded, setExpanded] = useState(true);
    const isSelected = selectedNode?.type === 'section' && selectedNode.id === section.id;
    const questionCount = countQuestionsRecursive(section.questions);

    function handleAddQuestion() {
        router.post(QuestionController.store.url(), {
            question_paper_id: paper.id,
            question_section_id: section.id,
            institution_course_id: paper.institution_course_id,
            question_type: 'mcq',
            content: 'New question',
            source: 'manual',
            status: 'draft',
        }, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['paper'] }),
        });
    }

    return (
        <div className="mb-1">
            <div
                className={
                    'group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent'
                    + (isSelected ? ' border-l-2 border-primary bg-accent' : '')
                }
                onClick={() => onSelectNode({ type: 'section', id: section.id })}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="shrink-0 border-none bg-transparent p-0 text-[10px] text-muted-foreground transition-transform duration-150"
                    style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
                >
                    {'\u25B6'}
                </button>

                <span className="min-w-0 flex-1 truncate">{section.label}</span>

                <span className="shrink-0 text-[10px] text-muted-foreground">{questionCount}q</span>

                <button
                    onClick={(e) => { e.stopPropagation(); handleAddQuestion(); }}
                    className="hidden shrink-0 rounded-md border-none bg-transparent px-1 py-0 text-sm text-muted-foreground transition-colors hover:text-primary group-hover:inline-block"
                    title="Add question to section"
                >
                    +
                </button>
            </div>

            {expanded && (
                <div className="ml-1">
                    {section.questions.map((question) => (
                        <QuestionTreeNode
                            key={question.id}
                            paper={paper}
                            question={question}
                            depth={0}
                            selectedNode={selectedNode}
                            onSelectNode={onSelectNode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PaperTree({ paper, selectedNode, onSelectNode }: PaperTreeProps) {
    const [contextsExpanded, setContextsExpanded] = useState(true);

    function handleAddSection() {
        router.post(QuestionSectionController.store.url(paper.id), {
            label: `Section ${String.fromCharCode(65 + paper.sections.length)}`,
        }, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['paper'] }),
        });
    }

    function handleAddContext() {
        router.post(QuestionContextController.store.url(paper.id), {
            context_type: 'passage',
            title: 'New context',
        }, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['paper'] }),
        });
    }

    return (
        <div className="flex h-full flex-col border-r border-border bg-card">
            <div className="border-b border-border px-3 py-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paper Structure</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {paper.sections.map((section) => (
                    <SectionNode
                        key={section.id}
                        paper={paper}
                        section={section}
                        selectedNode={selectedNode}
                        onSelectNode={onSelectNode}
                    />
                ))}

                <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={handleAddSection}>
                    + Add Section
                </Button>

                {paper.contexts.length > 0 && (
                    <div className="mt-4">
                        <div
                            className="flex cursor-pointer items-center gap-1.5 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            onClick={() => setContextsExpanded(!contextsExpanded)}
                        >
                            <span
                                className="text-[10px] transition-transform duration-150"
                                style={{ transform: contextsExpanded ? 'rotate(90deg)' : 'none' }}
                            >
                                {'\u25B6'}
                            </span>
                            Contexts ({paper.contexts.length})
                        </div>

                        {contextsExpanded && (
                            <div className="space-y-0.5">
                                {paper.contexts.map((ctx) => (
                                    <ContextTreeNode
                                        key={ctx.id}
                                        context={ctx}
                                        selectedNode={selectedNode}
                                        onSelectNode={onSelectNode}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={handleAddContext}>
                    + Add Context
                </Button>
            </div>
        </div>
    );
}

function ContextTreeNode({
    context,
    selectedNode,
    onSelectNode,
}: {
    context: QuestionContextData;
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode | null) => void;
}) {
    const isSelected = selectedNode?.type === 'context' && selectedNode.id === context.id;

    return (
        <div
            className={
                'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent'
                + (isSelected ? ' border-l-2 border-primary bg-accent' : '')
            }
            onClick={() => onSelectNode({ type: 'context', id: context.id })}
        >
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warning)]" />
            <span className="min-w-0 flex-1 truncate">
                {context.title || context.context_type.replace('_', ' ')}
            </span>
            <span className="shrink-0 text-[9px] uppercase text-muted-foreground">
                {context.context_type.replace('_', ' ')}
            </span>
        </div>
    );
}
