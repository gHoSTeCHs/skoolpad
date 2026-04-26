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
    Sparkles,
} from 'lucide-react';
import { sileo } from 'sileo';
import { runResearch, approveResearch } from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { GenerationProgress } from '@/components/admin/content-studio/generation-progress';
import { StageModelSelector } from '@/components/admin/content-studio/stage-model-selector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useGenerationStream } from '@/hooks/use-generation-stream';
import { csPost } from '@/lib/content-studio';
import type { AIModelOption, ContentProject, GenerationLogEntry, ResearchResult, ResearchTopic, ResolvedStageModel } from '@/types/content-studio';

interface StageResearchProps {
    project: ContentProject;
    aiModels: AIModelOption[];
    resolvedModel: ResolvedStageModel;
    isActive: boolean;
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}

const CONFIDENCE_STYLES: Record<string, string> = {
    high: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 reader:bg-emerald-900/40 reader:text-emerald-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 reader:bg-amber-900/40 reader:text-amber-300',
    low: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 reader:bg-red-900/40 reader:text-red-300',
};

function ApprovedSummary({ project }: { project: ContentProject }) {
    const [expanded, setExpanded] = useState(false);
    const approved = project.ai_context?.research_approved;
    const topicCount = approved?.length ?? 0;
    const termCount = new Set(approved?.map((t) => t.term_number)).size;

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
                    Research approved — {topicCount} topics across {termCount} {termCount === 1 ? 'term' : 'terms'}
                </div>
                {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>
            {expanded && approved && (
                <div className="border-t border-[var(--badge-primary-bg)] px-4 py-3 dark:border-emerald-800/40 reader:border-emerald-800/40">
                    <div className="space-y-2">
                        {approved.map((topic, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-mono text-xs text-muted-foreground/60">{String(i + 1).padStart(2, '0')}</span>
                                <span>{topic.title}</span>
                                {topic.sub_topics.length > 0 && (
                                    <span className="text-xs text-muted-foreground/60">({topic.sub_topics.length} sub-topics)</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ResearchInput({
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
    const [documentText, setDocumentText] = useState('');
    const [runOverrideId, setRunOverrideId] = useState<string | null>(null);
    const { status, message, startStream } = useGenerationStream();
    const isProcessing = status === 'processing' || status === 'validating';
    const runOverrideModel = runOverrideId ? aiModels.find((m) => m.id === runOverrideId) : null;

    async function handleSubmit() {
        if (!documentText.trim() || documentText.length < 100) return;
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                    <FlaskConical className="size-4 text-primary" />
                    Curriculum Research
                </CardTitle>
                <CardDescription>
                    Paste your curriculum document below. The AI will extract topics, sub-topics, term allocations,
                    and alignment notes.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    placeholder="Paste the full curriculum document text here (NERDC syllabus, course outline, etc.)..."
                    className="min-h-48 font-mono text-xs leading-relaxed"
                    disabled={isProcessing}
                />
                <GenerationProgress status={status} message={message} />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground">
                        {documentText.length < 100
                            ? `${100 - documentText.length} more characters needed`
                            : `${documentText.length.toLocaleString()} characters`}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        <StageModelSelector
                            projectId={project.id}
                            stage="research"
                            resolvedModel={resolvedModel}
                            aiModels={aiModels}
                            currentStageOverrideId={project.research_model_id}
                            runOverrideId={runOverrideId}
                            onProjectUpdate={onProjectUpdate}
                            onRunOverrideChange={setRunOverrideId}
                            disabled={isProcessing}
                        />
                        <Button onClick={handleSubmit} disabled={isProcessing || documentText.length < 100}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Analyzing curriculum...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="size-4" />
                                    {runOverrideModel ? `Parse with ${runOverrideModel.name}` : 'Parse Curriculum'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
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
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 font-display text-base">
                            <FlaskConical className="size-4 text-primary" />
                            Curriculum Research Results
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {research.total_topics_found} topics found across {research.terms.length} {research.terms.length === 1 ? 'term' : 'terms'}
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className={CONFIDENCE_STYLES[research.source_confidence] ?? ''}>
                        {research.source_confidence} confidence
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {research.conflicts.length > 0 && (
                    <Alert>
                        <AlertTriangle className="size-4 text-[var(--warning)]" />
                        <AlertDescription>
                            <span className="font-medium">Conflicts found: </span>
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

                {termNumbers.map((termNum) => {
                    const termTopics = editedTopics
                        .map((t, idx) => ({ ...t, _idx: idx }))
                        .filter((t) => t.term_number === termNum);

                    return (
                        <div key={termNum} className="space-y-2">
                            <h4 className="font-display text-sm font-semibold text-foreground">
                                Term {termNum}
                                <span className="ml-2 font-body text-xs font-normal text-muted-foreground">
                                    {termTopics.length} topics
                                </span>
                            </h4>
                            <div className="space-y-1.5">
                                {termTopics.map((topic) => (
                                    <div
                                        key={topic._idx}
                                        className="flex items-center gap-3 rounded-md border bg-card/50 px-3 py-2"
                                    >
                                        <span className="font-mono text-xs text-muted-foreground/60">
                                            {String(topic.sequence).padStart(2, '0')}
                                        </span>
                                        <Input
                                            value={topic.title}
                                            onChange={(e) => updateTopic(topic._idx, 'title', e.target.value)}
                                            className="h-7 border-none bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                                        />
                                        <div className="flex shrink-0 items-center gap-2">
                                            {topic.practical_component && (
                                                <Badge variant="outline" className="text-xs">
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                <div className="flex items-center justify-end gap-2 pt-2">
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
                        Approve Research
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function StageResearch({ project, aiModels, resolvedModel, isActive, onProjectUpdate, onLogAppend }: StageResearchProps) {
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

    if (hasFailed) {
        return (
            <Card>
                <CardContent className="py-6">
                    <Alert variant="destructive">
                        <AlertTriangle className="size-4" />
                        <AlertDescription>
                            AI generation failed validation. Check the generation log below for details, then try again.
                        </AlertDescription>
                    </Alert>
                    <div className="mt-4">
                        <ResearchInput project={project} aiModels={aiModels} resolvedModel={resolvedModel} onProjectUpdate={onProjectUpdate} onLogAppend={onLogAppend} />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return <ResearchInput project={project} aiModels={aiModels} resolvedModel={resolvedModel} onProjectUpdate={onProjectUpdate} onLogAppend={onLogAppend} />;
}
