import { Loader2, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import AnswerGenerationController from '@/actions/App/Http/Controllers/Admin/AnswerGenerationController';
import QuestionTypeBadge from '@/components/skoolpad/questions/question-type-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { csrfFetch } from '@/lib/utils';
import type { AnswerDepthLevel, QuestionNode } from '@/types/questions';
import {
    aggregateGroupCounts,
    fillStateFor,
    type FillState,
} from './_shared/answer-fill-utils';
import { DEPTH_META, DEPTH_ORDER } from './_shared/depth-meta';

interface GroupChildrenMatrixProps {
    parent: QuestionNode;
    onSelectChildDepth: (childId: string, depth: AnswerDepthLevel) => void;
}

const FILL_LABEL: Record<FillState, string> = {
    published: 'published',
    draft: 'draft',
    empty: 'not started',
};

export function GroupChildrenMatrix({ parent, onSelectChildDepth }: GroupChildrenMatrixProps) {
    const children = parent.children ?? [];
    const counts = aggregateGroupCounts(parent);
    const [generatingCount, setGeneratingCount] = useState(0);
    const [totalToGenerate, setTotalToGenerate] = useState(0);

    const handleGenerateMissing = useCallback(async () => {
        const empties: { childId: string; depth: AnswerDepthLevel }[] = [];
        for (const child of children) {
            for (const depth of DEPTH_ORDER) {
                if (fillStateFor(child, depth) === 'empty') {
                    empties.push({ childId: child.id, depth });
                }
            }
        }
        if (empties.length === 0) return;

        setTotalToGenerate(empties.length);
        setGeneratingCount(0);

        for (const { childId, depth } of empties) {
            const url = AnswerGenerationController.generate.url({ question: childId, depth });
            await csrfFetch(url, { method: 'POST' }).catch(() => null);
            setGeneratingCount((n) => n + 1);
        }
    }, [children]);

    if (children.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-border bg-[var(--bg-raised)] px-6 py-10 text-center">
                <p
                    className="text-base font-semibold text-foreground"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    No sub-questions yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    Add sub-questions to this group via the tree, then return to author their answers.
                </p>
            </div>
        );
    }

    return (
        <article className="ed-card">
            <header className="ed-card-head">
                <div className="left">
                    <div className="min-w-0">
                        <p className="title">Children's answer status</p>
                        <p className="sub">
                            {children.length} sub-question{children.length === 1 ? '' : 's'} × 3
                            depths · click any cell to open
                        </p>
                    </div>
                </div>
                <div className="right">
                    <Badge
                        variant="outline"
                        className="border-[rgba(212,149,42,0.40)] bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]"
                    >
                        {counts.filled} / {counts.total} published
                        {counts.drafts > 0 ? ` · ${counts.drafts} draft` : ''}
                    </Badge>
                </div>
            </header>

            <div className="overflow-x-auto">
                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th style={{ width: '42%' }}>Sub-question</th>
                            <th>Type</th>
                            {DEPTH_ORDER.map((depth) => (
                                <th key={depth} style={{ textAlign: 'center' }}>
                                    {DEPTH_META[depth].label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {children.map((child) => (
                            <ChildRow
                                key={child.id}
                                child={child}
                                onSelectChildDepth={onSelectChildDepth}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="ed-card-foot">
                <span>read-only summary · individual children save against AnswerController</span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={generatingCount > 0 && generatingCount < totalToGenerate}
                    onClick={handleGenerateMissing}
                    className="gap-1.5"
                >
                    {generatingCount > 0 && generatingCount < totalToGenerate ? (
                        <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Dispatching {generatingCount}/{totalToGenerate}…
                        </>
                    ) : (
                        <>
                            <Sparkles className="size-3.5" />
                            Generate missing answers
                        </>
                    )}
                </Button>
            </footer>
        </article>
    );
}

interface ChildRowProps {
    child: QuestionNode;
    onSelectChildDepth: (childId: string, depth: AnswerDepthLevel) => void;
}

function ChildRow({ child, onSelectChildDepth }: ChildRowProps) {
    const label = child.display_label || child.question_number || '·';

    return (
        <tr>
            <td>
                <div className="font-medium text-foreground">
                    {label} · {truncate(child.content, 90)}
                </div>
                {child.marks != null && (
                    <div className="row-meta">{child.marks} mks</div>
                )}
            </td>
            <td>
                <QuestionTypeBadge type={child.question_type} />
            </td>
            {DEPTH_ORDER.map((depth) => {
                const state = fillStateFor(child, depth);
                return (
                    <td key={depth} style={{ textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => onSelectChildDepth(child.id, depth)}
                            className="cell-btn"
                            title={`${DEPTH_META[depth].label}: ${FILL_LABEL[state]} — click to open`}
                            aria-label={`${label} ${DEPTH_META[depth].label} answer (${FILL_LABEL[state]})`}
                        >
                            <span className="cdot" data-fill={state === 'empty' ? undefined : state} />
                        </button>
                    </td>
                );
            })}
        </tr>
    );
}

function truncate(s: string, max: number): string {
    if (!s) return '(no stem)';
    if (s.length <= max) return s;
    return s.slice(0, max - 1).trimEnd() + '…';
}
