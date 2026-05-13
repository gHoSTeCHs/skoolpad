import type { LibraryCounts } from '@/types/question-library';

interface LibraryHeaderProps {
    counts: LibraryCounts;
}

export function LibraryHeader({ counts }: LibraryHeaderProps) {
    return (
        <header
            className="px-[30px] pt-[26px] pb-[22px]"
            style={{ background: 'linear-gradient(180deg, var(--card) 0%, var(--bg-raised) 100%)', borderBottom: '1px solid var(--border-2)' }}
        >
            <div
                className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.14em] text-[var(--fg-subtle)]"
                style={{ fontFamily: 'var(--font-display)' }}
            >
                <span
                    className="flex size-6 items-center justify-center rounded-md bg-foreground text-[12px] font-bold text-background"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    Q
                </span>
                <span>Question Library</span>
                <span className="text-[var(--fg-subtle)]">·</span>
                <span
                    className="text-[13px] normal-case tracking-normal text-muted-foreground"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    browse by container, not by question
                </span>
            </div>

            <h2
                className="mt-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.018em]"
                style={{ fontFamily: 'var(--font-display)' }}
            >
                Where do you want to author today?
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-3.5 text-[13px] text-muted-foreground">
                <span>
                    <strong className="font-semibold text-foreground">{counts.total_questions}</strong> questions
                </span>
                <span className="size-[3px] rounded-full bg-[var(--fg-subtle)]" />
                <span>
                    <strong className="font-semibold text-foreground">{counts.papers}</strong> papers ·{' '}
                    <strong className="font-semibold text-foreground">{counts.course_pools}</strong> course-pool ·{' '}
                    <strong className="font-semibold text-foreground">{counts.unattached}</strong> unattached
                </span>
            </div>
        </header>
    );
}
