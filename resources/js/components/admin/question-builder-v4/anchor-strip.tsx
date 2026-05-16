import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TYPE_META } from './lib/question-meta';
import type { QuestionType } from '@/types/questions';

const ANCHORS = ['stem', 'body', 'answers', 'meta'] as const;
type AnchorKey = (typeof ANCHORS)[number];

interface AnchorStripProps {
    questionType: QuestionType;
}

export function AnchorStrip({ questionType }: AnchorStripProps) {
    const [active, setActive] = useState<AnchorKey>('stem');

    const labels: Record<AnchorKey, string> = {
        stem: 'Stem',
        body: TYPE_META[questionType].bodyAnchorLabel,
        answers: 'Answer keys',
        meta: 'Metadata',
    };

    function jumpTo(key: AnchorKey) {
        setActive(key);
        const target = document.getElementById(`sec-${key}`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    return (
        <nav
            aria-label="Question sections"
            className="sticky top-[120px] z-[9] -mx-12 mt-1 mb-7 flex items-center gap-1 border-b border-[var(--border-2)] bg-background px-12 py-1.5"
        >
            {ANCHORS.map((key) => {
                const isActive = active === key;
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => jumpTo(key)}
                        aria-current={isActive ? 'true' : undefined}
                        className={cn(
                            'rounded-md px-2.5 py-1 font-mono text-[10.5px] tracking-wider transition-colors',
                            isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground',
                        )}
                    >
                        {labels[key]}
                    </button>
                );
            })}
        </nav>
    );
}
