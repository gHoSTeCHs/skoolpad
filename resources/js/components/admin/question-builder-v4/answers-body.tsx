import { useState } from 'react';
import { DepthSlot } from './depth-slot';
import { DEPTH_ORDER, DepthsBar } from './depths-bar';
import type { AnswerDepthLevel, QuestionNode } from '@/types/questions';

interface AnswersBodyProps {
    question: QuestionNode;
}

export function AnswersBody({ question }: AnswersBodyProps) {
    const [activeDepth, setActiveDepth] = useState<AnswerDepthLevel>('quick');
    const isGroup = question.question_type === 'group';

    return (
        <section
            id="sec-answers"
            aria-labelledby="sec-answers-heading"
            className="mt-2 mb-8 rounded-lg border border-border bg-card p-6"
        >
            <header className="mb-4">
                <div className="font-mono text-[10px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                    Section 3
                </div>
                <h2
                    id="sec-answers-heading"
                    className="mt-0.5 font-display text-[16px] font-semibold tracking-tight text-foreground"
                >
                    Answer keys
                </h2>
                {!isGroup && (
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                        Each depth serves a different reveal level. All three are checked by graders.
                    </p>
                )}
            </header>

            {isGroup ? (
                <GroupAnswersMessage />
            ) : (
                <>
                    <DepthsBar
                        question={question}
                        activeDepth={activeDepth}
                        onSelect={setActiveDepth}
                    />
                    {DEPTH_ORDER.map((depth) => (
                        <DepthSlot
                            key={depth}
                            question={question}
                            depth={depth}
                            active={activeDepth === depth}
                        />
                    ))}
                </>
            )}
        </section>
    );
}

function GroupAnswersMessage() {
    return (
        <div className="rounded-md border border-dashed border-border bg-[var(--bg-raised)]/40 px-5 py-6 text-center">
            <p className="text-[13px] text-muted-foreground">
                A group question doesn&rsquo;t carry its own answer keys — each sub-question does.
            </p>
            <p className="mt-1.5 text-[12px] text-[var(--fg-subtle)]">
                Drill into a sub-question from the questions column to author its answers. Aggregate fill state shows on the parent in the tree.
            </p>
        </div>
    );
}
