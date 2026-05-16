import { useState } from 'react';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import { AnswerStatusDots } from './answer-status-dots';
import { DiagramPresenceChip } from './diagram-presence-chip';
import type { QuestionNode } from '@/types/questions';
import type { PoolContainer, PoolTopic } from '@/types/question-library';
import type { SelectedNode } from './paper-tree';

interface PoolTreeProps {
    pool: PoolContainer;
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

interface QuestionRowProps {
    question: QuestionNode;
    depth: number;
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode) => void;
}

function QuestionRow({ question, depth, selectedNode, onSelectNode }: QuestionRowProps) {
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

                <QuestionTypeBadge type={question.question_type} className="shrink-0 px-1 py-0 text-[8px]" />

                <DiagramPresenceChip question={question} />
                <AnswerStatusDots question={question} />
            </div>

            {hasChildren && expanded && (
                <div>
                    {question.children.map((child) => (
                        <QuestionRow
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

interface TopicSectionProps {
    topic: PoolTopic;
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode) => void;
}

function TopicSection({ topic, selectedNode, onSelectNode }: TopicSectionProps) {
    const [expanded, setExpanded] = useState(true);
    const questionCount = countQuestionsRecursive(topic.questions);
    const isUntagged = topic.id === 'untagged';

    return (
        <div className="mb-1">
            <div
                className={
                    'group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:bg-accent'
                    + (isUntagged ? ' text-[var(--fg-subtle)]' : '')
                }
                onClick={() => setExpanded(!expanded)}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="shrink-0 border-none bg-transparent p-0 text-[10px] text-muted-foreground transition-transform duration-150"
                    style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
                    aria-label={expanded ? 'Collapse topic' : 'Expand topic'}
                >
                    {'▶'}
                </button>

                <span className="min-w-0 flex-1 truncate">{topic.title}</span>

                <span
                    className="shrink-0 text-[10px] text-[var(--fg-subtle)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                >
                    {questionCount}
                </span>
            </div>

            {expanded && (
                <div className="ml-1">
                    {topic.questions.map((question) => (
                        <QuestionRow
                            key={question.id}
                            question={question}
                            depth={0}
                            selectedNode={selectedNode}
                            onSelectNode={onSelectNode}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={() => onSelectNode({ type: 'draft', topicId: topic.id, defaultType: 'mcq' })}
                        className="ml-1 mt-0.5 flex w-full items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground"
                    >
                        + Add question
                    </button>
                </div>
            )}
        </div>
    );
}

export function PoolTree({ pool, selectedNode, onSelectNode }: PoolTreeProps) {
    return (
        <div className="flex h-full flex-col border-r border-border bg-card">
            <div
                className="border-b border-[var(--border-2)] px-4 py-3"
                style={{ background: 'linear-gradient(180deg, var(--card) 0%, var(--bg-raised) 100%)' }}
            >
                <div
                    className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg-subtle)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {pool.course_code} · practice pool
                </div>
                <h3
                    className="mt-1 text-[15px] font-semibold leading-tight tracking-tight text-foreground"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {pool.course_title}
                </h3>
                <p
                    className="mt-0.5 text-[11.5px] text-[var(--fg-subtle)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                >
                    {pool.questions_total} {pool.questions_total === 1 ? 'question' : 'questions'} ·{' '}
                    {pool.topics.length} {pool.topics.length === 1 ? 'topic' : 'topics'} · no paper
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {pool.topics.length === 0 ? (
                    <div
                        className="rounded-md border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        No questions in this pool yet.
                    </div>
                ) : (
                    pool.topics.map((topic) => (
                        <TopicSection
                            key={topic.id}
                            topic={topic}
                            selectedNode={selectedNode}
                            onSelectNode={onSelectNode}
                        />
                    ))
                )}

                <div className="px-2 pb-1 pt-4">
                    <button
                        type="button"
                        onClick={() => onSelectNode({ type: 'draft', defaultType: 'mcq' })}
                        className="w-full rounded-md border border-dashed border-border bg-transparent px-3 py-2 text-center text-[12px] text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        + Add question to pool
                    </button>
                </div>
            </div>
        </div>
    );
}
