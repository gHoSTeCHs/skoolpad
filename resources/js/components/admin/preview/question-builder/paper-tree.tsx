import { useState } from 'react';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import type { QuestionPaper, QuestionSection, QuestionNode, QuestionContextData } from '@/types/questions';

export type SelectedNode =
    | { type: 'section'; id: string }
    | { type: 'question'; id: string }
    | { type: 'context'; id: string };

interface PaperTreeProps {
    paper: QuestionPaper;
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode | null) => void;
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

interface QuestionTreeNodeProps {
    question: QuestionNode;
    depth: number;
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode) => void;
}

function QuestionTreeNode({ question, depth, selectedNode, onSelectNode }: QuestionTreeNodeProps) {
    const [expanded, setExpanded] = useState(true);
    const isSelected = selectedNode?.type === 'question' && selectedNode.id === question.id;
    const hasChildren = question.children.length > 0;

    return (
        <div style={{ paddingLeft: depth > 0 ? 12 : 0 }}>
            <div
                data-selected={isSelected || undefined}
                className={
                    'group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent'
                    + (isSelected ? ' border-l-2 border-foreground bg-background shadow-[inset_0_0_0_1px_var(--border)]' : '')
                }
                onClick={() => onSelectNode({ type: 'question', id: question.id })}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="shrink-0 border-none bg-transparent p-0 text-[10px] text-muted-foreground transition-transform duration-150"
                        style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
                        aria-label={expanded ? 'Collapse' : 'Expand'}
                    >
                        {'▶'}
                    </button>
                ) : (
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                )}

                <span className={'min-w-0 flex-1 truncate' + (isSelected ? ' font-medium' : '')}>
                    {question.question_number || question.display_label || 'Q'}
                </span>

                <QuestionTypeBadge type={question.question_type} className="shrink-0 text-[8px] px-1 py-0" />

                <AnswerStatusDots question={question} />
            </div>

            {hasChildren && expanded && (
                <div>
                    {question.children.map((child) => (
                        <QuestionTreeNode
                            key={child.id}
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

interface SectionNodeProps {
    section: QuestionSection;
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode) => void;
}

function SectionNode({ section, selectedNode, onSelectNode }: SectionNodeProps) {
    const [expanded, setExpanded] = useState(true);
    const isSelected = selectedNode?.type === 'section' && selectedNode.id === section.id;
    const questionCount = countQuestionsRecursive(section.questions);

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
                    aria-label={expanded ? 'Collapse section' : 'Expand section'}
                >
                    {'▶'}
                </button>

                <span className="min-w-0 flex-1 truncate">{section.label}</span>

                <span className="shrink-0 text-[10px] text-muted-foreground">{questionCount}q</span>
            </div>

            {expanded && (
                <div className="ml-1">
                    {section.questions.map((question) => (
                        <QuestionTreeNode
                            key={question.id}
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

function ContextTreeNode({
    context,
    selectedNode,
    onSelectNode,
}: {
    context: QuestionContextData;
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode) => void;
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

export default function PaperTree({ paper, selectedNode, onSelectNode }: PaperTreeProps) {
    const [contextsExpanded, setContextsExpanded] = useState(true);

    return (
        <div className="flex h-full flex-col border-r border-border bg-card">
            <div className="border-b border-border-2 bg-gradient-to-b from-card to-[var(--bg-raised)] px-4 py-3">
                <h3 className="font-display text-[15px] font-semibold leading-tight tracking-tight text-foreground">
                    {paper.title}
                </h3>
                <p className="mt-0.5 font-mono text-[11.5px] text-[var(--fg-subtle)]">
                    {paper.sections.length} section{paper.sections.length === 1 ? '' : 's'}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {paper.sections.map((section) => (
                    <SectionNode
                        key={section.id}
                        section={section}
                        selectedNode={selectedNode}
                        onSelectNode={onSelectNode}
                    />
                ))}

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
                                {'▶'}
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
            </div>
        </div>
    );
}
