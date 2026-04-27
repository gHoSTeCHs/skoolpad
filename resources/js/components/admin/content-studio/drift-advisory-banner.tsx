import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DriftAdvisory } from '@/types/content-studio';

interface DriftAdvisoryBannerProps {
    advisory: DriftAdvisory;
    onDismiss: () => void;
    onRegenerate: () => void;
    isBusy?: boolean;
}

export function DriftAdvisoryBanner({ advisory, onDismiss, onRegenerate, isBusy = false }: DriftAdvisoryBannerProps) {
    const termsRemoved = advisory.terms_removed ?? [];
    const termsChanged = advisory.terms_changed ?? [];
    const symbolsRemoved = advisory.symbols_removed ?? [];
    const hasSummary = advisory.reason.includes('summary');

    return (
        <div
            role="status"
            className="relative border-l-4 border-[color:var(--color-warning)] bg-[color:var(--color-warning)]/5 px-4 py-3"
        >
            <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-[color:var(--color-warning)]" aria-hidden />

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-warning)]">
                            Upstream change
                        </span>
                        <span className="text-sm text-foreground">
                            Block{' '}
                            <span className="font-medium">{advisory.source_block_title}</span>{' '}
                            was regenerated. Review for consistency.
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {termsRemoved.map((term) => (
                            <span
                                key={`rem-${term}`}
                                className="font-mono text-[10px] uppercase tracking-[0.14em] rounded-sm border border-[color:var(--color-warning)]/40 bg-background/60 px-1.5 py-0.5 text-muted-foreground"
                                title="Term removed"
                            >
                                − {term}
                            </span>
                        ))}
                        {termsChanged.map((term) => (
                            <span
                                key={`chg-${term}`}
                                className="font-mono text-[10px] uppercase tracking-[0.14em] rounded-sm border border-[color:var(--color-warning)]/40 bg-background/60 px-1.5 py-0.5 text-muted-foreground"
                                title="Definition changed"
                            >
                                Δ {term}
                            </span>
                        ))}
                        {symbolsRemoved.map((sym) => (
                            <span
                                key={`sym-${sym}`}
                                className="font-mono text-[10px] uppercase tracking-[0.14em] rounded-sm border border-[color:var(--color-warning)]/40 bg-background/60 px-1.5 py-0.5 text-muted-foreground"
                                title="Symbol removed"
                            >
                                − {sym}
                            </span>
                        ))}
                        {hasSummary && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] rounded-sm border border-[color:var(--color-warning)]/40 bg-background/60 px-1.5 py-0.5 text-muted-foreground">
                                summary changed
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={onDismiss} disabled={isBusy}>
                            Dismiss
                        </Button>
                        <Button variant="default" size="sm" onClick={onRegenerate} disabled={isBusy}>
                            Regenerate
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
