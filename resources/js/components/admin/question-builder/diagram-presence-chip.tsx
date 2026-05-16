import { PenSquare } from 'lucide-react';
import type { QuestionNode } from '@/types/questions';

/**
 * Small chip rendered next to AnswerStatusDots in the question tree.
 * Shows a pen-square glyph + count when the question owns ≥1 diagram asset.
 *
 * Recursively aggregates over children for group questions so the parent
 * row tells you at a glance "this group has diagrams somewhere inside."
 */
export function DiagramPresenceChip({ question }: { question: QuestionNode }) {
    const ownCount = question.diagram_assets_count ?? 0;
    const childCount = sumChildren(question.children ?? []);
    const total = ownCount + childCount;

    if (total === 0) return null;

    const tooltip =
        ownCount > 0 && childCount > 0
            ? `${ownCount} diagram${ownCount === 1 ? '' : 's'} here · ${childCount} in sub-questions`
            : ownCount > 0
                ? `${ownCount} diagram${ownCount === 1 ? '' : 's'}`
                : `${childCount} in sub-questions`;

    return (
        <span
            className="inline-flex shrink-0 items-center gap-[3px] rounded-full border border-[var(--primary-line,var(--border))] bg-[var(--primary-soft,var(--bg-raised))] px-1.5 py-[3px] text-[var(--primary)]"
            title={tooltip}
            aria-label={tooltip}
            data-testid="diagram-presence-chip"
        >
            <PenSquare className="size-2.5" aria-hidden />
            <span className="font-mono text-[9px] font-medium tabular-nums leading-none">
                {total}
            </span>
        </span>
    );
}

function sumChildren(children: QuestionNode[]): number {
    let total = 0;
    for (const c of children) {
        total += c.diagram_assets_count ?? 0;
        if (c.children?.length) total += sumChildren(c.children);
    }
    return total;
}
