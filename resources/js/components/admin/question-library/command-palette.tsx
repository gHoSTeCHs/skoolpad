import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, FileText, Layers, Database, HelpCircle } from 'lucide-react';
import QuestionLibraryController from '@/actions/App/Http/Controllers/Admin/QuestionLibraryController';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import type { LibrarySearchResults } from '@/types/question-library';

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMPTY_RESULTS: LibrarySearchResults = {
    papers: [],
    course_pools: [],
    exam_pools: [],
    questions: [],
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LibrarySearchResults>(EMPTY_RESULTS);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults(EMPTY_RESULTS);
            return;
        }
        setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) {
            setResults(EMPTY_RESULTS);
            return;
        }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const url = QuestionLibraryController.search.url() + '?q=' + encodeURIComponent(query);
                const response = await fetch(url, { headers: { Accept: 'application/json' } });
                if (response.ok) {
                    const data = await response.json();
                    setResults(data.results ?? EMPTY_RESULTS);
                }
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const total =
        results.papers.length + results.course_pools.length + results.exam_pools.length + results.questions.length;

    function navigateToPaper(paperId: string) {
        onOpenChange(false);
        router.visit(QuestionPaperController.build.url({ questionPaper: paperId }));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl gap-0 overflow-hidden border-border bg-card p-0"
                style={{ borderRadius: 'var(--card-radius)' }}
            >
                <div className="flex items-center gap-3 border-b border-[var(--border-2)] px-5 py-4">
                    <Search className="size-4 text-[var(--fg-subtle)]" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search papers, course pools, questions, topics…"
                        className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--fg-subtle)]"
                        style={{ fontFamily: 'var(--font-body)' }}
                    />
                    <kbd
                        className="rounded border border-border bg-[var(--bg-raised)] px-1.5 py-[1px] text-[10.5px] text-[var(--fg-subtle)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                    >
                        ESC
                    </kbd>
                </div>

                <div className="max-h-[440px] overflow-y-auto">
                    {!query.trim() && (
                        <div
                            className="px-5 py-12 text-center text-[13px] text-muted-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Type to search across papers, pools, and individual questions.
                        </div>
                    )}

                    {query.trim() && total === 0 && !loading && (
                        <div
                            className="px-5 py-12 text-center text-[13px] text-muted-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            No matches for "{query}"
                        </div>
                    )}

                    {loading && (
                        <div
                            className="px-5 py-12 text-center text-[12px] text-[var(--fg-subtle)]"
                            style={{ fontFamily: 'var(--font-mono)' }}
                        >
                            searching…
                        </div>
                    )}

                    {!loading && results.papers.length > 0 && (
                        <ResultGroup label="Papers" icon={FileText}>
                            {results.papers.map((p) => (
                                <ResultRow
                                    key={p.id}
                                    primary={p.title}
                                    secondary={`${p.course_code ?? '—'} · ${p.year ?? ''}`}
                                    onSelect={() => navigateToPaper(p.id)}
                                />
                            ))}
                        </ResultGroup>
                    )}

                    {!loading && results.course_pools.length > 0 && (
                        <ResultGroup label="Course pools" icon={Layers}>
                            {results.course_pools.map((c) => (
                                <ResultRow
                                    key={c.id}
                                    primary={c.course_code}
                                    secondary={c.course_title}
                                    onSelect={() => onOpenChange(false)}
                                />
                            ))}
                        </ResultGroup>
                    )}

                    {!loading && results.exam_pools.length > 0 && (
                        <ResultGroup label="Exam-subject pools" icon={Database}>
                            {results.exam_pools.map((s) => (
                                <ResultRow
                                    key={s.id}
                                    primary={s.name}
                                    secondary="exam-subject pool"
                                    onSelect={() => onOpenChange(false)}
                                />
                            ))}
                        </ResultGroup>
                    )}

                    {!loading && results.questions.length > 0 && (
                        <ResultGroup label="Questions" icon={HelpCircle}>
                            {results.questions.map((q) => (
                                <ResultRow
                                    key={q.id}
                                    primary={q.stem_preview || '(no stem)'}
                                    secondary={q.question_type}
                                    onSelect={() => onOpenChange(false)}
                                />
                            ))}
                        </ResultGroup>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface ResultGroupProps {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}

function ResultGroup({ label, icon: Icon, children }: ResultGroupProps) {
    return (
        <div className="pt-3 pb-1">
            <div
                className="flex items-center gap-1.5 px-5 pb-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--fg-subtle)]"
                style={{ fontFamily: 'var(--font-display)' }}
            >
                <Icon className="size-3" />
                {label}
            </div>
            {children}
        </div>
    );
}

interface ResultRowProps {
    primary: string;
    secondary: string;
    onSelect: () => void;
}

function ResultRow({ primary, secondary, onSelect }: ResultRowProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-[var(--bg-raised)]"
        >
            <div className="min-w-0 flex-1">
                <div
                    className="truncate text-[13px] text-foreground"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    {primary}
                </div>
                <div
                    className="truncate text-[11px] text-muted-foreground"
                    style={{ fontFamily: 'var(--font-mono)' }}
                >
                    {secondary}
                </div>
            </div>
        </button>
    );
}
