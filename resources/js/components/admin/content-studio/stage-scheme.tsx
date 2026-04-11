import { useState } from 'react';
import {
    CalendarDays,
    Check,
    ChevronDown,
    ChevronUp,
    Loader2,
    RotateCcw,
    SkipForward,
    Sparkles,
} from 'lucide-react';
import { sileo } from 'sileo';
import { runScheme, approveScheme, skipScheme } from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { GenerationProgress } from '@/components/admin/content-studio/generation-progress';
import { SchemeGrid } from '@/components/admin/content-studio/scheme-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGenerationStream } from '@/hooks/use-generation-stream';
import { csPost, streamUrl } from '@/lib/content-studio';
import type { ContentProject, GenerationLogEntry, SchemeTerm } from '@/types/content-studio';

interface StageSchemeProps {
    project: ContentProject;
    isActive: boolean;
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}

function ApprovedSummary({ project }: { project: ContentProject }) {
    const [expanded, setExpanded] = useState(false);
    const scheme = project.ai_context?.scheme_approved;
    const totalTopics = scheme?.reduce((sum, term) => sum + term.topics.length, 0) ?? 0;
    const termCount = scheme?.length ?? 0;

    return (
        <div
            className="rounded-lg border border-[var(--badge-primary-bg)] bg-[var(--badge-primary-bg)]/30 dark:border-emerald-800/40 dark:bg-emerald-900/10 reader:border-emerald-800/40 reader:bg-emerald-900/10"
            style={{ animation: 'slide-in-from-top 0.3s ease-out' }}
        >
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between px-4 py-3"
            >
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--badge-primary-fg)] dark:text-emerald-400 reader:text-emerald-400">
                    <Check className="size-4" />
                    Scheme approved — {totalTopics} topics across {termCount} {termCount === 1 ? 'term' : 'terms'}
                </div>
                {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>
            {expanded && scheme && (
                <div className="border-t border-[var(--badge-primary-bg)] px-4 py-3 dark:border-emerald-800/40 reader:border-emerald-800/40">
                    <div className="space-y-3">
                        {scheme.map((term) => (
                            <div key={term.term_number}>
                                <h5 className="text-xs font-semibold text-muted-foreground">Term {term.term_number}</h5>
                                <div className="mt-1 space-y-0.5">
                                    {term.topics.map((topic, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="font-mono text-xs text-muted-foreground/60">
                                                W{topic.week_start}{topic.week_end !== topic.week_start ? `-${topic.week_end}` : ''}
                                            </span>
                                            <span>{topic.title}</span>
                                            <Badge variant="outline" className="text-xs">{topic.periods}p</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SkippedSummary() {
    return (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <SkipForward className="size-4" />
            Scheme of work skipped (tertiary project)
        </div>
    );
}

function SchemeGenerator({
    project,
    onProjectUpdate,
    onLogAppend,
}: {
    project: ContentProject;
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}) {
    const [termsCount, setTermsCount] = useState('3');
    const [weeksPerTerm, setWeeksPerTerm] = useState('10');
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
                },
            );
            startStream(
                streamUrl(project.id, job_id),
                (updatedProject, logEntry) => {
                    onProjectUpdate(updatedProject);
                    if (logEntry) onLogAppend(logEntry);
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                    <CalendarDays className="size-4 text-primary" />
                    Scheme of Work
                    {isTertiary && (
                        <Badge variant="outline" className="text-xs font-normal">Optional</Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Allocate approved topics across terms and weeks. The AI will propose a schedule based on topic complexity.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <GenerationProgress status={status} message={message} />
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Terms</label>
                        <Select value={termsCount} onValueChange={setTermsCount}>
                            <SelectTrigger className="w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4].map((n) => (
                                    <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'term' : 'terms'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Weeks per term</label>
                        <Select value={weeksPerTerm} onValueChange={setWeeksPerTerm}>
                            <SelectTrigger className="w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 9 }, (_, i) => i + 8).map((n) => (
                                    <SelectItem key={n} value={String(n)}>{n} weeks</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="size-4" />
                                    Generate Scheme
                                </>
                            )}
                        </Button>
                        {isTertiary && (
                            <Button variant="outline" onClick={handleSkip} disabled={isSkipping}>
                                {isSkipping ? <Loader2 className="size-4 animate-spin" /> : <SkipForward className="size-4" />}
                                Skip
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
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
    const totalPeriods = editedTerms.reduce((sum, t) => sum + t.topics.reduce((s, tp) => s + tp.periods, 0), 0);

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
        setEditedTerms(scheme.map((t) => ({ ...t, topics: t.topics.map((tp) => ({ ...tp })) })));
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 font-display text-base">
                            <CalendarDays className="size-4 text-primary" />
                            Scheme of Work — Review
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Drag topics to reorder within each term. Click periods to edit.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{totalTopics} topics</span>
                        <span>{totalPeriods} periods</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <SchemeGrid terms={editedTerms} onChange={setEditedTerms} />

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={handleReset} size="sm">
                        <RotateCcw className="size-3.5" />
                        Reset
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="bg-[var(--success)] text-white hover:bg-[var(--success)]/90"
                    >
                        {isApproving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        Approve Scheme
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function StageScheme({ project, isActive, onProjectUpdate, onLogAppend }: StageSchemeProps) {
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
        return <SchemeReview project={project} scheme={aiContext!.scheme!.terms} onProjectUpdate={onProjectUpdate} />;
    }

    if (hasApprovedResearch) {
        return <SchemeGenerator project={project} onProjectUpdate={onProjectUpdate} onLogAppend={onLogAppend} />;
    }

    return null;
}
