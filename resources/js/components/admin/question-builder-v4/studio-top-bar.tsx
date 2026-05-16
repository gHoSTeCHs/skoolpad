import { Link } from '@inertiajs/react';
import { Check, Moon, Sparkles, Sun, Upload } from 'lucide-react';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { useBuilderV4Store } from './store/provider';

export function StudioTopBar() {
    const paperTitle = useBuilderV4Store((s) => s.paper.title);
    const courseCode = useBuilderV4Store((s) => s.paper.institution_course?.course_code);
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    function toggleTheme() {
        updateAppearance(isDark ? 'light' : 'dark');
    }

    return (
        <header className="col-span-full flex h-14 items-center gap-3 border-b border-border bg-card px-4">
            <div className="flex items-center gap-2.5 border-r border-border pr-3">
                <span
                    aria-hidden
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-display text-[12.5px] font-bold tracking-tight text-primary-foreground"
                >
                    qb
                </span>
                <span className="font-display text-[13.5px] font-semibold tracking-tight text-foreground">
                    Question Builder
                </span>
            </div>

            <nav aria-label="Breadcrumb" className="flex min-w-0 items-baseline gap-2">
                <Link
                    href={QuestionPaperController.index.url()}
                    className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
                >
                    Question Papers
                </Link>
                <span className="text-[var(--fg-subtle)]">/</span>
                {courseCode && (
                    <>
                        <span className="font-mono text-[11px] text-[var(--fg-subtle)]">{courseCode}</span>
                        <span className="text-[var(--fg-subtle)]">/</span>
                    </>
                )}
                <h1 className="min-w-0 truncate font-display text-[14px] font-semibold tracking-tight text-foreground">
                    {paperTitle}
                </h1>
            </nav>

            <div className="flex-1" />

            <div className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-wide text-[var(--fg-subtle)] uppercase">
                <Check className="h-3 w-3 text-[var(--success)]" aria-hidden />
                <span>All saved</span>
            </div>

            <button
                type="button"
                disabled
                aria-label="Model: claude-sonnet-4-6 (CP1 placeholder)"
                title="Model picker arrives later"
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-[var(--bg-raised)] px-2 font-mono text-[10.5px] text-muted-foreground opacity-70"
            >
                <Sparkles className="h-3 w-3 text-[var(--honey)]" aria-hidden />
                claude-sonnet-4-6
            </button>

            <button
                type="button"
                disabled
                title="Publish wiring lands in CP2"
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-semibold text-primary-foreground opacity-70"
            >
                <Upload className="h-3 w-3" aria-hidden />
                Publish
            </button>

            <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors',
                    'hover:bg-muted hover:text-foreground',
                )}
            >
                {isDark ? <Sun className="h-3.5 w-3.5" aria-hidden /> : <Moon className="h-3.5 w-3.5" aria-hidden />}
            </button>
        </header>
    );
}
