import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    ChevronDown,
    ChevronUp,
    FlaskConical,
    Info,
    Loader2,
    RotateCcw,
} from 'lucide-react';
import { sileo } from 'sileo';
import { runResearch, approveResearch } from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { CompoundGenerateButton } from '@/components/admin/content-studio/compound-generate-button';
import { GenerationProgress } from '@/components/admin/content-studio/generation-progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useGenerationStream } from '@/hooks/use-generation-stream';
import { csPost } from '@/lib/content-studio';
import type { AIModelOption, ContentProject, GenerationLogEntry, ResearchResult, ResearchTopic, ResolvedStageModel } from '@/types/content-studio';

interface StageResearchPreviewProps {
    project: ContentProject;
    aiModels: AIModelOption[];
    resolvedModel: ResolvedStageModel;
    isActive: boolean;
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}

const CONFIDENCE_TONE: Record<string, string> = {
    high: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    medium: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    low: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
};

function PaperShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="paper-surface min-h-full">
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
    const approved = project.ai_context?.research_approved;
    const topicCount = approved?.length ?? 0;
    const termCount = new Set(approved?.map((t) => t.term_number)).size;

    return (
        <PaperShell>
            <SectionEyebrow>Stage 01 · Research</SectionEyebrow>
            <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight">
                Curriculum approved
            </h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
                {topicCount} topics across {termCount} {termCount === 1 ? 'term' : 'terms'}.
            </p>

            <div className="mt-6 rounded-md border border-[var(--badge-primary-bg)] bg-[var(--badge-primary-bg)]/30">
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--badge-primary-fg)]">
                        <Check className="size-4" />
                        Research locked in
                    </span>
                    {expanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                </button>
                {expanded && approved && (
                    <ol className="border-t border-[var(--badge-primary-bg)] px-4 py-3 space-y-1.5">
                        {approved.map((topic, i) => (
                            <li key={i} className="flex items-baseline gap-3 text-[13px] text-muted-foreground">
                                <span className="tech min-w-[2ch] text-right">{String(i + 1).padStart(2, '0')}</span>
                                <span className="text-foreground">{topic.title}</span>
                                {topic.sub_topics.length > 0 && (
                                    <span className="tech">· {topic.sub_topics.length} sub</span>
                                )}
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </PaperShell>
    );
}

function ResearchInput({
    project,
    aiModels,
    resolvedModel,
    onProjectUpdate,
    onLogAppend,
    failed,
}: {
    project: ContentProject;
    aiModels: AIModelOption[];
    resolvedModel: ResolvedStageModel;
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
    failed?: boolean;
}) {
    const [documentText, setDocumentText] = useState('');
    const [runOverrideId, setRunOverrideId] = useState<string | null>(null);
    const { status, message, startStream } = useGenerationStream();
    const isProcessing = status === 'processing' || status === 'validating';
    const tooShort = documentText.length < 100;

    async function handleSubmit() {
        if (!documentText.trim() || tooShort) return;
        try {
            const { job_id } = await csPost<{ job_id: string }>(
                runResearch.url(project.id),
                {
                    document_text: documentText,
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

    return (
        <PaperShell>
            <SectionEyebrow>Stage 01 · Research</SectionEyebrow>
            <h2 className="mt-2 flex items-center gap-3 font-display text-[26px] font-semibold leading-tight tracking-tight">
                <FlaskConical className="size-5 text-primary" />
                Curriculum research
            </h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
                Paste the curriculum document. The model will extract topics, sub-topics, term allocations, and alignment notes.
            </p>

            {failed && (
                <Alert variant="destructive" className="mt-5">
                    <AlertTriangle className="size-4" />
                    <AlertDescription>
                        AI generation failed validation. Check the log drawer for details, then try again.
                    </AlertDescription>
                </Alert>
            )}

            <div className="mt-6 space-y-4">
                <Textarea
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    placeholder="Paste the full curriculum document text here (NERDC syllabus, course outline, etc.)…"
                    className="min-h-56 resize-y rounded-md border-[var(--border)] bg-background/60 font-mono text-[12.5px] leading-relaxed shadow-none focus-visible:ring-1"
                    disabled={isProcessing}
                />

                <GenerationProgress status={status} message={message} />

                <div className="flex flex-col gap-3 border-t border-dashed border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="tech">
                        {tooShort
                            ? `${100 - documentText.length} more characters needed`
                            : `${documentText.length.toLocaleString()} chars · ready`}
                    </span>
                    <CompoundGenerateButton
                        projectId={project.id}
                        stage="research"
                        resolvedModel={resolvedModel}
                        aiModels={aiModels}
                        currentStageOverrideId={project.research_model_id}
                        runOverrideId={runOverrideId}
                        onProjectUpdate={onProjectUpdate}
                        onRunOverrideChange={setRunOverrideId}
                        label="Parse curriculum"
                        busy={isProcessing}
                        busyLabel="Researching"
                        disabled={tooShort}
                        onGenerate={handleSubmit}
                    />
                </div>
            </div>
        </PaperShell>
    );
}

function ResearchReview({
    project,
    research,
    onProjectUpdate,
}: {
    project: ContentProject;
    research: ResearchResult;
    onProjectUpdate: (project: ContentProject) => void;
}) {
    const [editedTopics, setEditedTopics] = useState<ResearchTopic[]>(() => {
        const topics: ResearchTopic[] = [];
        for (const term of research.terms) {
            for (const topic of term.topics) {
                topics.push({ ...topic, term_number: term.term_number });
            }
        }
        return topics;
    });
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    function updateTopic<K extends keyof ResearchTopic>(index: number, field: K, value: ResearchTopic[K]) {
        setEditedTopics((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
    }

    async function handleApprove() {
        setIsApproving(true);
        try {
            const { project: updated, message } = await csPost<{ project: ContentProject; message: string }>(
                approveResearch.url(project.id),
                { topics: editedTopics },
            );
            onProjectUpdate(updated);
            sileo.success({ title: message });
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Request failed' });
        } finally {
            setIsApproving(false);
        }
    }

    function handleRegenerate() {
        setIsRegenerating(true);
        router.reload();
    }

    const termNumbers = [...new Set(editedTopics.map((t) => t.term_number))].sort();

    return (
        <PaperShell>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <SectionEyebrow>Stage 01 · Review draft</SectionEyebrow>
                    <h2 className="mt-2 flex items-center gap-3 font-display text-[26px] font-semibold leading-tight tracking-tight">
                        <FlaskConical className="size-5 text-primary" />
                        Curriculum draft
                    </h2>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">
                        {research.total_topics_found} topics found across {research.terms.length}{' '}
                        {research.terms.length === 1 ? 'term' : 'terms'}. Edit titles inline; toggle lab where relevant.
                    </p>
                </div>
                <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${
                        CONFIDENCE_TONE[research.source_confidence] ?? CONFIDENCE_TONE.medium
                    }`}
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-85" />
                    {research.source_confidence} confidence
                </span>
            </div>

            {(research.conflicts.length > 0 || research.missing_data.length > 0) && (
                <div className="mt-6 space-y-2">
                    {research.conflicts.length > 0 && (
                        <Alert>
                            <AlertTriangle className="size-4 text-[var(--warning)]" />
                            <AlertDescription>
                                <span className="font-medium">Conflicts: </span>
                                {research.conflicts.join('; ')}
                            </AlertDescription>
                        </Alert>
                    )}
                    {research.missing_data.length > 0 && (
                        <Alert>
                            <Info className="size-4 text-blue-500" />
                            <AlertDescription>
                                <span className="font-medium">Missing data: </span>
                                {research.missing_data.join('; ')}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}

            <div className="mt-7 space-y-7">
                {termNumbers.map((termNum) => {
                    const termTopics = editedTopics
                        .map((t, idx) => ({ ...t, _idx: idx }))
                        .filter((t) => t.term_number === termNum);

                    return (
                        <section key={termNum}>
                            <div className="flex items-baseline justify-between border-b border-dashed border-[var(--border)] pb-2">
                                <h3 className="font-display text-[15px] font-semibold tracking-tight">
                                    Term {termNum}
                                </h3>
                                <span className="tech">{termTopics.length} topics</span>
                            </div>
                            <ul className="mt-2 divide-y divide-[var(--border)]/60">
                                {termTopics.map((topic) => (
                                    <li
                                        key={topic._idx}
                                        className="flex items-center gap-3 py-2"
                                    >
                                        <span className="tech min-w-[2.5ch] text-right">
                                            {String(topic.sequence).padStart(2, '0')}
                                        </span>
                                        <Input
                                            value={topic.title}
                                            onChange={(e) => updateTopic(topic._idx, 'title', e.target.value)}
                                            className="h-8 border-none bg-transparent px-1 text-[13.5px] shadow-none focus-visible:ring-0"
                                        />
                                        <div className="flex shrink-0 items-center gap-2">
                                            {topic.practical_component && (
                                                <Badge variant="outline" className="gap-1 text-[10.5px]">
                                                    <FlaskConical className="size-3" />
                                                    Lab
                                                </Badge>
                                            )}
                                            <Switch
                                                checked={topic.practical_component}
                                                onCheckedChange={(checked) =>
                                                    updateTopic(topic._idx, 'practical_component', checked)
                                                }
                                                size="sm"
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>

            <div className="mt-8 flex items-center justify-end gap-2 border-t border-[var(--border)] pt-5">
                <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                >
                    {isRegenerating ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                    Regenerate
                </Button>
                <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="bg-[var(--success)] text-white hover:bg-[var(--success)]/90"
                >
                    {isApproving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Approve research
                </Button>
            </div>
        </PaperShell>
    );
}

export function StageResearchPreview({ project, aiModels, resolvedModel, isActive, onProjectUpdate, onLogAppend }: StageResearchPreviewProps) {
    const aiContext = project.ai_context;
    const isApproved = !!aiContext?.research_approved;
    const hasResearch = !!aiContext?.research;
    const hasFailed = !!aiContext?.research_failed;

    if (isApproved && !isActive) {
        return <ApprovedSummary project={project} />;
    }

    if (hasResearch && !isApproved) {
        return <ResearchReview project={project} research={aiContext!.research!} onProjectUpdate={onProjectUpdate} />;
    }

    return (
        <ResearchInput
            project={project}
            aiModels={aiModels}
            resolvedModel={resolvedModel}
            onProjectUpdate={onProjectUpdate}
            onLogAppend={onLogAppend}
            failed={hasFailed}
        />
    );
}
