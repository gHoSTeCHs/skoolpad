import { MessageSquare } from 'lucide-react';

interface VerificationExplainSectionProps {
    explainPrompt: string;
    keyConcepts: string[];
    checkedConcepts: boolean[];
    onToggleConcept: (index: number) => void;
}

export function VerificationExplainSection({
    explainPrompt,
    keyConcepts,
    checkedConcepts,
    onToggleConcept,
}: VerificationExplainSectionProps) {
    return (
        <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <MessageSquare className="size-3.5" />
                Ask them to explain
            </h2>
            <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium leading-relaxed text-foreground">
                    &ldquo;{explainPrompt}&rdquo;
                </p>
                {keyConcepts.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-2 text-xs text-muted-foreground">
                            Tap concepts mentioned:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {keyConcepts.map((concept, i) => (
                                <button
                                    key={concept}
                                    type="button"
                                    aria-pressed={checkedConcepts[i]}
                                    onClick={() => onToggleConcept(i)}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                        checkedConcepts[i]
                                            ? 'border-[var(--canopy-600)] bg-[var(--canopy-600)] text-white'
                                            : 'border-border bg-card text-foreground hover:bg-muted'
                                    }`}
                                >
                                    {checkedConcepts[i] && <span className="mr-1">✓</span>}
                                    {concept}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
