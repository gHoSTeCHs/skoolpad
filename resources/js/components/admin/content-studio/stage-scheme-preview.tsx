import { useState } from 'react';
import {
    CalendarDays,
    Check,
    ChevronDown,
    ChevronUp,
    Loader2,
    RotateCcw,
    SkipForward,
} from 'lucide-react';
import { sileo } from 'sileo';
import { runScheme, approveScheme, skipScheme } from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { CompoundGenerateButton } from '@/components/admin/content-studio/compound-generate-button';
import { GenerationProgress } from '@/components/admin/content-studio/generation-progress';
import { SchemeGrid } from '@/components/admin/content-studio/scheme-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useGenerationStream } from '@/hooks/use-generation-stream';
import { csPost } from '@/lib/content-studio';
import type { AIModelOption, ContentProject, GenerationLogEntry, ResolvedStageModel, SchemeTerm } from '@/types/content-studio';

interface StageSchemePreviewProps {
    project: ContentProject;
    aiModels: AIModelOption[];
    resolvedModel: ResolvedStageModel;
    isActive: boolean;
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}

function PaperShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="paper-surface h-full overflow-y-auto">
            <div className="mx-auto max-w-[840px] px-10 py-8">{children}</div>
        </div>
    );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div className="section-label uppercase tracking-[0.08em]">{children}</div>
    );
}

function ApprovedSummary({ project }: { project: ContentProject }) {
    const [expanded, setExpanded] = useState(false);
    const scheme = project.ai_context?.scheme_approved;
    const totalTopics = scheme?.reduce((sum, term) => sum + term.topics.length, 0) ?? 0;
    const termCount = scheme?.length ?? 0;

    return (
        <PaperShell>
            <SectionEyebrow>Stage 02 · Scheme</SectionEyebrow>
            <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight">
                Scheme approved
            </h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
                {totalTopics} topics across {termCount} {termCount === 1 ? 'term' : 'terms'}.
            </p>

            <div className="mt-6 rounded-md border border-[var(--badge-primary-bg)] bg-[var(--badge-primary-bg)]/30">
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--badge-primary-fg)]">
                        <Check className="size-4" />
                        Schedule locked in
                    </span>
                    {expanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                </button>
                {expanded && scheme && (
                    <div className="space-y-4 border-t border-[var(--badge-primary-bg)] px-4 py-3">
                        {scheme.map((term) => (
                            <div key={term.term_number}>
                                <h5 className="section-label uppercase tracking-[0.08em]">
                                    Term {term.term_number}
                                </h5>
                                <ul className="mt-1.5 space-y-1">
                                    {term.topics.map((topic, i) => (
                                        <li
                                            key={i}
                                            className="flex items-baseline gap-3 text-[13px] text-muted-foreground"
                                        >
                                            <span className="tech min-w-[3.5ch] text-right">
                                                W{topic.week_start}
                                                {topic.week_end !== topic.week_start
                                                    ? `-${topic.week_end}`
                                                    : ''}
                                            </span>
                                            <span className="text-foreground">{topic.title}</span>
                                            <span className="tech">· {topic.periods}p</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PaperShell>
    );
}

function SkippedSummary() {
    return (
        <PaperShell>
            <SectionEyebrow>Stage 02 · Scheme</SectionEyebrow>
            <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight">
                Scheme skipped
            </h2>
            <p className="mt-1 inline-flex items-center gap-2 text-[13.5px] text-muted-foreground">
                <SkipForward className="size-4" />
                Tertiary projects can move directly to block structure without a weekly schedule.
            </p>
        </PaperShell>
    );
}

function SchemeGenerator({
    project,
    aiModels,
    resolvedModel,
    onProjectUpdate,
    onLogAppend,
}: {
    project: ContentProject;
    aiModels: AIModelOption[];
    resolvedModel: ResolvedStageModel;
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}) {
    const [termsCount, setTermsCount] = useState('3');
    const [weeksPerTerm, setWeeksPerTerm] = useState('10');
    const [runOverrideId, setRunOverrideId] = useState<string | null>(null);
    const { status, message, startStream } = useGenerationStream();
    const [isSkipping, setIsSkipping] = useState(false);
    const isTertiary = project.mode === 'tertiary';
    const isGenerating = status === 'processing' || status === 'validating';

    async function handleGenerate() {
        try {
            const { job_id } = await csPost<{ job_id: string }>(
                runScheme.url(project.id),
                {
                    terms_count: parseInt(termsCount),
                    weeks_per_term: parseInt(weeksPerTerm),
                    ...(runOverrideId && { model_id: runOverrideId }),
                },
            );
            startStream(
                project.id,
                job_id,
                (updatedProject, logEntry) => {
                    onProjectUpdate(updatedProject);
                    if (logEntry) onLogAppend(logEntry);
                    setRunOverrideId(null);
                },
                (errorMsg) => sileo.error({ title: errorMsg }),
            );
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Request failed' });
        }
    }

    async function handleSkip() {
        setIsSkipping(true);
        try {
            const { project: updated, message: msg } = await csPost<{ project: ContentProject; message: string }>(
                skipScheme.url(project.id),
            );
            onProjectUpdate(updated);
            sileo.success({ title: msg });
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Request failed' });
        } finally {
            setIsSkipping(false);
        }
    }

    return (
        <PaperShell>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <SectionEyebrow>Stage 02 · Scheme</SectionEyebrow>
                    <h2 className="mt-2 flex items-center gap-3 font-display text-[26px] font-semibold leading-tight tracking-tight">
                        <CalendarDays className="size-5 text-primary" />
                        Scheme of work
                    </h2>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">
                        Allocate approved topics across terms and weeks. The model proposes a schedule
                        based on topic complexity.
                    </p>
                </div>
                {isTertiary && (
                    <Badge variant="outline" className="shrink-0 text-[10.5px] font-normal">
                        Optional
                    </Badge>
                )}
            </div>

            <div className="mt-7 grid grid-cols-1 gap-5 border-t border-dashed border-[var(--border)] pt-5 sm:grid-cols-2">
                <label className="space-y-1.5">
                    <span className="section-label uppercase tracking-[0.08em]">Terms</span>
                    <Select value={termsCount} onValueChange={setTermsCount}>
                        <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n} {n === 1 ? 'term' : 'terms'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </label>
                <label className="space-y-1.5">
                    <span className="section-label uppercase tracking-[0.08em]">Weeks per term</span>
                    <Select value={weeksPerTerm} onValueChange={setWeeksPerTerm}>
                        <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 9 }, (_, i) => i + 8).map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n} weeks
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </label>
            </div>

            <div className="mt-5">
                <GenerationProgress status={status} message={message} />
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                {isTertiary ? (
                    <Button
                        variant="outline"
                        onClick={handleSkip}
                        disabled={isSkipping || isGenerating}
                    >
                        {isSkipping ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <SkipForward className="size-4" />
                        )}
                        Skip scheme
                    </Button>
                ) : (
                    <span className="tech">
                        {parseInt(termsCount) * parseInt(weeksPerTerm)} weeks total
                    </span>
                )}
                <CompoundGenerateButton
                    projectId={project.id}
                    stage="scheme"
                    resolvedModel={resolvedModel}
                    aiModels={aiModels}
                    currentStageOverrideId={project.scheme_model_id}
                    runOverrideId={runOverrideId}
                    onProjectUpdate={onProjectUpdate}
                    onRunOverrideChange={setRunOverrideId}
                    label="Generate scheme of work"
                    busy={isGenerating}
                    busyLabel="Generating scheme"
                    onGenerate={handleGenerate}
                />
            </div>
        </PaperShell>
    );
}

function SchemeReview({
    project,
    scheme,
    onProjectUpdate,
}: {
    project: ContentProject;
    scheme: SchemeTerm[];
    onProjectUpdate: (project: ContentProject) => void;
}) {
    const [editedTerms, setEditedTerms] = useState<SchemeTerm[]>(() =>
        scheme.map((t) => ({ ...t, topics: t.topics.map((tp) => ({ ...tp })) })),
    );
    const [isApproving, setIsApproving] = useState(false);
    const totalTopics = editedTerms.reduce((sum, t) => sum + t.topics.length, 0);
    const totalPeriods = editedTerms.reduce(
        (sum, t) => sum + t.topics.reduce((s, tp) => s + tp.periods, 0),
        0,
    );

    async function handleApprove() {
        setIsApproving(true);
        try {
            const { project: updated, message } = await csPost<{ project: ContentProject; message: string }>(
                approveScheme.url(project.id),
                { terms: editedTerms },
            );
            onProjectUpdate(updated);
            sileo.success({ title: message });
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Request failed' });
        } finally {
            setIsApproving(false);
        }
    }

    function handleReset() {
        setEditedTerms(
            scheme.map((t) => ({ ...t, topics: t.topics.map((tp) => ({ ...tp })) })),
        );
    }

    return (
        <PaperShell>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <SectionEyebrow>Stage 02 · Review schedule</SectionEyebrow>
                    <h2 className="mt-2 flex items-center gap-3 font-display text-[26px] font-semibold leading-tight tracking-tight">
                        <CalendarDays className="size-5 text-primary" />
                        Scheme of work — draft
                    </h2>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">
                        Drag topics to reorder within each term. Click periods to edit.
                    </p>
                </div>
                <div className="shrink-0 text-right">
                    <div className="tech">{totalTopics} topics</div>
                    <div className="tech">{totalPeriods} periods</div>
                </div>
            </div>

            <div className="mt-7">
                <SchemeGrid terms={editedTerms} onChange={setEditedTerms} />
            </div>

            <div className="mt-8 flex items-center justify-end gap-2 border-t border-[var(--border)] pt-5">
                <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="size-4" />
                    Reset
                </Button>
                <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="bg-[var(--success)] text-white hover:bg-[var(--success)]/90"
                >
                    {isApproving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Approve scheme
                </Button>
            </div>
        </PaperShell>
    );
}

export function StageSchemePreview({ project, aiModels, resolvedModel, isActive, onProjectUpdate, onLogAppend }: StageSchemePreviewProps) {
    const aiContext = project.ai_context;
    const isApproved = !!aiContext?.scheme_approved;
    const isSkipped = !!project.progress_data?.scheme_skipped;
    const hasScheme = !!aiContext?.scheme;
    const hasApprovedResearch = !!aiContext?.research_approved;

    if (isSkipped) {
        return <SkippedSummary />;
    }

    if (isApproved && !isActive) {
        return <ApprovedSummary project={project} />;
    }

    if (hasScheme && !isApproved) {
        return (
            <SchemeReview
                project={project}
                scheme={aiContext!.scheme!.terms}
                onProjectUpdate={onProjectUpdate}
            />
        );
    }

    if (hasApprovedResearch) {
        return (
            <SchemeGenerator
                project={project}
                aiModels={aiModels}
                resolvedModel={resolvedModel}
                onProjectUpdate={onProjectUpdate}
                onLogAppend={onLogAppend}
            />
        );
    }

    return (
        <PaperShell>
            <SectionEyebrow>Stage 02 · Scheme</SectionEyebrow>
            <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight">
                Approve research first
            </h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
                The scheme of work is built from approved research topics. Switch back to the Research stage to lock those in.
            </p>
        </PaperShell>
    );
}
