import type { ContentBlock } from '@/types/content-studio';

interface BlockMetadataPanelProps {
    block: ContentBlock;
    variant?: 'inline-details' | 'inspector';
}

export function BlockMetadataPanel({ block, variant = 'inline-details' }: BlockMetadataPanelProps) {
    const terms = block.key_terms_introduced ?? [];
    const symbols = block.symbols_used ?? [];
    const formulas = block.formulas_used ?? [];
    const hasContent = !!block.summary_sentence || terms.length > 0 || symbols.length > 0 || formulas.length > 0;

    if (variant === 'inline-details') {
        if (!hasContent) return null;
        return (
            <details className="group rounded-md border border-border bg-background">
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Generation metadata
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        <span className="group-open:hidden">↓ expand</span>
                        <span className="hidden group-open:inline">↑ collapse</span>
                    </span>
                </summary>
                <Body block={block} terms={terms} symbols={symbols} formulas={formulas} />
            </details>
        );
    }

    return <Body block={block} terms={terms} symbols={symbols} formulas={formulas} flat />;
}

function Body({
    block,
    terms,
    symbols,
    formulas,
    flat = false,
}: {
    block: ContentBlock;
    terms: NonNullable<ContentBlock['key_terms_introduced']>;
    symbols: NonNullable<ContentBlock['symbols_used']>;
    formulas: NonNullable<ContentBlock['formulas_used']>;
    flat?: boolean;
}) {
    return (
        <div className={flat ? 'space-y-5 text-[13px]' : 'flex flex-col gap-3 border-t border-border px-3 py-3'}>
            {block.summary_sentence && (
                <Section label="Summary" flat={flat}>
                    <p className={flat ? '' : 'pt-1 text-sm text-foreground'}>{block.summary_sentence}</p>
                </Section>
            )}
            {flat && block.difficulty_level && (
                <Section label="Difficulty" flat>
                    <p>{block.difficulty_level}</p>
                </Section>
            )}
            {flat && block.bloom_level && (
                <Section label="Bloom level" flat>
                    <p>{block.bloom_level}</p>
                </Section>
            )}
            {terms.length > 0 && (
                <Section label="Key terms introduced" flat={flat}>
                    <ul className={flat ? 'space-y-1.5' : 'pt-1 space-y-1 text-sm text-foreground'}>
                        {terms.map((t) => (
                            <li key={t.term}>
                                <span className="font-medium">{t.term}</span>
                                <span className="text-muted-foreground"> — {t.definition}</span>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
            {symbols.length > 0 && (
                <Section label="Symbols" flat={flat}>
                    <ul className={flat ? 'space-y-1.5' : 'pt-1 space-y-1 text-sm text-foreground'}>
                        {symbols.map((s) => (
                            <li key={s.symbol}>
                                <span className="font-mono">{s.symbol}</span>
                                <span className="text-muted-foreground">
                                    {' '}
                                    = {s.quantity} ({s.unit})
                                </span>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
            {formulas.length > 0 && (
                <Section label="Formulas" flat={flat}>
                    <ul className={flat ? 'space-y-1 font-mono text-[12px]' : 'pt-1 space-y-1 font-mono text-xs text-foreground'}>
                        {formulas.map((f, i) => (
                            <li key={i}>{f}</li>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
}

function Section({ label, flat, children }: { label: string; flat: boolean; children: React.ReactNode }) {
    if (flat) {
        return (
            <div>
                <div className="section-label mb-1.5">{label}</div>
                {children}
            </div>
        );
    }
    return (
        <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
            {children}
        </div>
    );
}
