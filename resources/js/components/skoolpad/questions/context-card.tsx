import SpBadge from '@/components/skoolpad/sp-badge';

export interface ContextCardData {
    id: string;
    contextType: string;
    title?: string;
    content?: string;
    mediaUrl?: string;
    tableData?: { headers: string[]; rows: string[][] };
    wordBank?: string[];
}

const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
    passage: { bg: 'var(--primary)/5', border: 'var(--primary)/20', icon: '\uD83D\uDCC4' },
    diagram: { bg: 'var(--warning)/5', border: 'var(--warning)/20', icon: '\uD83D\uDDBC\uFE0F' },
    table: { bg: 'var(--destructive)/5', border: 'var(--destructive)/20', icon: '\uD83D\uDCCA' },
    case_study: { bg: 'var(--primary)/5', border: 'var(--primary)/20', icon: '\uD83D\uDCCB' },
    code_snippet: { bg: 'var(--primary)/5', border: 'var(--primary)/20', icon: '\uD83D\uDCBB' },
    word_bank: { bg: 'var(--warning)/5', border: 'var(--warning)/20', icon: '\uD83D\uDCD6' },
    equation_set: { bg: 'var(--destructive)/5', border: 'var(--destructive)/20', icon: '\uD83E\uDDEE' },
    map: { bg: 'var(--warning)/5', border: 'var(--warning)/20', icon: '\uD83D\uDDFA\uFE0F' },
    graph: { bg: 'var(--primary)/5', border: 'var(--primary)/20', icon: '\uD83D\uDCC8' },
};

export default function ContextCard({ context }: { context: ContextCardData }) {
    const style = typeStyles[context.contextType] ?? typeStyles.passage;

    return (
        <div className="rounded-lg border bg-card p-4" style={{ borderColor: style.border }}>
            <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">{style.icon}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {context.contextType.replace('_', ' ')} context
                </span>
                <SpBadge variant="neutral" className="ml-auto text-[9px]">id: {context.id}</SpBadge>
            </div>
            {context.title && (
                <p className="mb-2 text-[12px] font-medium italic text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{context.title}</p>
            )}
            {context.content && (
                <div className="rounded-md bg-[var(--bg-raised)] p-3">
                    <p className="text-[12px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>{context.content}</p>
                </div>
            )}
            {context.contextType === 'diagram' && context.mediaUrl && (
                <div className="flex h-[120px] items-center justify-center rounded-md border-2 border-dashed border-border bg-[var(--bg-raised)]">
                    <div className="text-center">
                        <div className="text-2xl">{'\uD83D\uDDBC\uFE0F'}</div>
                        <p className="mt-1 text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Diagram: {context.mediaUrl}</p>
                    </div>
                </div>
            )}
            {context.tableData && (
                <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                        <thead>
                            <tr className="bg-[var(--bg-raised)]">
                                {context.tableData.headers.map((h) => (
                                    <th key={h} className="border-b border-border px-3 py-2 text-left font-bold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {context.tableData.rows.map((row, ri) => (
                                <tr key={ri} className="border-b border-border/30 last:border-b-0">
                                    {row.map((cell, ci) => (
                                        <td key={ci} className={'px-3 py-1.5' + (ci === 0 ? ' font-medium' : '')}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {context.wordBank && (
                <div className="flex flex-wrap gap-1.5">
                    {context.wordBank.map((w) => (
                        <span key={w} className="rounded border border-border bg-[var(--bg-raised)] px-2 py-0.5 text-[11px]">{w}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
