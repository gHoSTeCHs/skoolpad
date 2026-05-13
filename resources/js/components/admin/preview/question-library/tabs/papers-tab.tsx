import { router } from '@inertiajs/react';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import { ContainerCard, toneForIndex } from '../container-card';
import type { LibraryPaper } from '@/types/question-library';

interface PapersTabProps {
    papers: LibraryPaper[];
}

function statusLabel(paper: LibraryPaper): { text: string; color: string } {
    if (paper.is_published) return { text: 'Published', color: 'var(--success)' };
    if (paper.complete_percent > 0) return { text: 'In review', color: 'var(--warning)' };
    return { text: 'Draft', color: 'var(--fg-subtle)' };
}

function formatRelative(iso: string | null): string {
    if (!iso) return 'just created';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.round(diffMs / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
}

export function PapersTab({ papers }: PapersTabProps) {
    if (papers.length === 0) {
        return (
            <div className="px-[30px] py-16 text-center">
                <p
                    className="text-[14px] text-muted-foreground"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    No question papers yet. Create one to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-[18px] px-[30px] pt-6 pb-8 md:grid-cols-2">
            {papers.map((paper, idx) => {
                const status = statusLabel(paper);
                const filledPercent = paper.answers_total_slots > 0
                    ? Math.round((paper.answers_filled / paper.answers_total_slots) * 100)
                    : 0;
                const publishedPercent = paper.answers_total_slots > 0
                    ? Math.round((paper.answers_published / paper.answers_total_slots) * 100)
                    : 0;
                const draftPercent = Math.max(0, filledPercent - publishedPercent);
                const emptyPercent = Math.max(0, 100 - filledPercent);

                return (
                    <ContainerCard
                        key={paper.id}
                        tone={toneForIndex(idx)}
                        code={`${paper.course_code ?? paper.institution_abbreviation ?? 'Paper'} · ${paper.year ?? ''}`}
                        title={paper.title}
                        pills={[
                            'paper',
                            paper.assessment_type_name?.toLowerCase() ?? 'exam',
                        ]}
                        onOpen={() => router.visit(QuestionPaperController.buildPreview.url({ questionPaper: paper.id }))}
                        footerLeft={`edited ${formatRelative(paper.updated_at)}`}
                        footerRight="open builder"
                    >
                        <div className="mb-2.5 flex items-baseline justify-between">
                            <div
                                className="text-[16px] font-semibold text-foreground"
                                style={{ fontFamily: 'var(--font-display)' }}
                            >
                                {paper.answers_filled}
                                <em
                                    className="ml-1.5 text-[12.5px] font-medium not-italic text-muted-foreground"
                                >
                                    / {paper.answers_total_slots} answers filled
                                </em>
                            </div>
                            <div
                                className="text-[10px] uppercase tracking-[0.06em] text-[var(--fg-subtle)]"
                                style={{ fontFamily: 'var(--font-mono)' }}
                            >
                                {paper.complete_percent}% complete
                            </div>
                        </div>

                        <div
                            className="flex h-1.5 w-full overflow-hidden rounded-full"
                            style={{ background: 'var(--border-2)' }}
                        >
                            {publishedPercent > 0 && (
                                <div style={{ flex: `0 0 ${publishedPercent}%`, background: 'var(--success)' }} />
                            )}
                            {draftPercent > 0 && (
                                <div style={{ flex: `0 0 ${draftPercent}%`, background: 'var(--warning)' }} />
                            )}
                            {emptyPercent > 0 && (
                                <div style={{ flex: `0 0 ${emptyPercent}%`, background: 'var(--bg-raised)' }} />
                            )}
                        </div>

                        <div
                            className="mt-3.5 grid grid-cols-2 gap-x-3.5 gap-y-1.5 text-[11px]"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            <Stat label="Questions" value={paper.questions_count} />
                            <Stat label="Sections" value={paper.sections_count} />
                            <Stat label="Contexts" value={paper.contexts_count} />
                            <Stat label="Status" value={status.text} color={status.color} />
                        </div>
                    </ContainerCard>
                );
            })}
        </div>
    );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="flex items-center justify-between text-muted-foreground">
            <span>{label}</span>
            <strong className="font-semibold" style={{ color: color ?? 'var(--foreground)' }}>
                {value}
            </strong>
        </div>
    );
}
