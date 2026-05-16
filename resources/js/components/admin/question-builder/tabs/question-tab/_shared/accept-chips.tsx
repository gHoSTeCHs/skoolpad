import { useState } from 'react';
import { X } from 'lucide-react';

interface AcceptChipsProps {
    values: string[];
    onChange: (next: string[]) => void;
    addLabel?: string;
    placeholder?: string;
}

export function AcceptChips({ values, onChange, addLabel = '+ add', placeholder = 'accepted answer' }: AcceptChipsProps) {
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState('');

    function commit() {
        const trimmed = draft.trim();
        if (trimmed && !values.includes(trimmed)) {
            onChange([...values, trimmed]);
        }
        setDraft('');
        setAdding(false);
    }

    function remove(idx: number) {
        onChange(values.filter((_, i) => i !== idx));
    }

    return (
        <div className="flex flex-wrap items-center gap-1">
            {values.map((v, idx) => (
                <span
                    key={`${v}-${idx}`}
                    className="group inline-flex items-center gap-1 rounded bg-[var(--bg-raised)] px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                    {v}
                    <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Remove ${v}`}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}

            {adding ? (
                <input
                    autoFocus
                    type="text"
                    value={draft}
                    placeholder={placeholder}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commit();
                        } else if (e.key === 'Escape') {
                            setDraft('');
                            setAdding(false);
                        }
                    }}
                    className="rounded border border-dashed border-border bg-transparent px-2 py-0.5 font-mono text-[11px] outline-none focus:border-[var(--fg-subtle)]"
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="cursor-pointer rounded border border-dashed border-border bg-transparent px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:text-foreground"
                >
                    {addLabel}
                </button>
            )}
        </div>
    );
}
