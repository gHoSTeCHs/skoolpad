'use no memo';

import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import AnswerController from '@/actions/App/Http/Controllers/Admin/AnswerController';
import AnswerGenerationController from '@/actions/App/Http/Controllers/Admin/AnswerGenerationController';
import InputError from '@/components/input-error';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AnswerDepthData, AnswerDepthLevel } from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';
import { csrfFetch } from '@/lib/utils';
import { AiSeedBanner, type AnswerGenerationPlan } from './_shared/ai-seed-banner';
import { AnswerGenerationOverlay } from './_shared/answer-generation-overlay';

interface DepthCardProps {
    questionId: string;
    depthData: AnswerDepthData;
    onDirtyChange?: (dirty: boolean) => void;
}

const SHORT_KEY: Record<AnswerDepthLevel, string> = {
    quick: 'Q',
    standard: 'S',
    deep_dive: 'D',
};

const SHORT_CLASS: Record<AnswerDepthLevel, string> = {
    quick: 'depth-q',
    standard: 'depth-s',
    deep_dive: 'depth-d',
};

const TIER_COPY: Record<AnswerDepthLevel, string> = {
    quick: 'free tier · ~50 words · direct answer',
    standard: 'paid · ~200 words · context + reasoning',
    deep_dive: 'premium · > 500 words · derivations + references',
};

export function DepthCard({ questionId, depthData, onDirtyChange }: DepthCardProps) {
    const isExisting = depthData.answer !== null;

    const [planData, setPlanData] = useState<AnswerGenerationPlan | null>(null);
    const [planLoading, setPlanLoading] = useState(false);
    const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const form = useForm({
        depth_level: depthData.depth_level,
        content: (depthData.answer?.content ?? null) as TiptapJSON | null,
        content_plain: depthData.answer?.content_plain ?? '',
        is_published: depthData.answer?.is_published ?? false,
    });

    useEffect(() => {
        onDirtyChange?.(form.isDirty);
    }, [form.isDirty, onDirtyChange]);

    const handlePlan = useCallback(async () => {
        setPlanLoading(true);
        setGenerationError(null);
        try {
            const url = AnswerGenerationController.plan.url({
                question: questionId,
                depth: depthData.depth_level,
            });
            const res = await csrfFetch(url, { method: 'POST' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { message?: string }).message ?? 'Plan request failed');
            }
            const plan = (await res.json()) as AnswerGenerationPlan;
            setPlanData(plan);
        } catch (err) {
            setGenerationError(err instanceof Error ? err.message : 'Plan request failed');
        } finally {
            setPlanLoading(false);
        }
    }, [questionId, depthData.depth_level]);

    const handleGenerate = useCallback(async () => {
        setPlanLoading(true);
        setGenerationError(null);
        try {
            const url = AnswerGenerationController.generate.url({
                question: questionId,
                depth: depthData.depth_level,
            });
            const res = await csrfFetch(url, { method: 'POST' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { message?: string }).message ?? 'Generate request failed');
            }
            const { job_id } = (await res.json()) as { job_id: string };
            setGeneratingJobId(job_id);
            setPlanData(null);
        } catch (err) {
            setGenerationError(err instanceof Error ? err.message : 'Generate request failed');
        } finally {
            setPlanLoading(false);
        }
    }, [questionId, depthData.depth_level]);

    async function handleImageUpload(_file: File): Promise<string> {
        return '/placeholder-image.png';
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isExisting) {
            form.put(
                AnswerController.update.url({ question: questionId, answer: depthData.answer!.id }),
                { preserveScroll: true },
            );
        } else {
            form.post(
                AnswerController.store.url(questionId),
                { preserveScroll: true },
            );
        }
    }

    const dirty = form.isDirty;
    const shortKey = depthData.depth_level;
    const savedDataDirty = dirty ? 'true' : undefined;
    const savedDataEmpty = !isExisting && !dirty ? 'true' : undefined;

    return (
        <article
            className="ed-card"
            data-state={isExisting ? undefined : 'empty'}
            data-depth={depthData.depth_level}
        >
            <header className="ed-card-head">
                <div className="left">
                    <span className={`depth-icon ${SHORT_CLASS[shortKey]}`}>
                        {SHORT_KEY[shortKey]}
                    </span>
                    <div className="min-w-0">
                        <p className="title">
                            {depthData.label}
                            {isExisting ? ' explanation' : ''}
                        </p>
                        <p className="sub">{TIER_COPY[shortKey]}</p>
                    </div>
                </div>
                <div className="right">
                    <StatusPill isExisting={isExisting} isPublished={form.data.is_published} dirty={dirty} />
                </div>
            </header>

            <form onSubmit={handleSubmit}>
                <div className="ed-card-body space-y-4">
                    {generatingJobId ? (
                        <AnswerGenerationOverlay
                            questionId={questionId}
                            jobId={generatingJobId}
                            depthLabel={depthData.label}
                            onDone={() => setGeneratingJobId(null)}
                            onError={(msg) => {
                                setGeneratingJobId(null);
                                setGenerationError(msg);
                            }}
                        />
                    ) : isExisting ? (
                        <>
                            <div
                                className="editor-shell"
                                data-dirty={dirty ? 'true' : undefined}
                            >
                                <TiptapEditor
                                    value={form.data.content}
                                    onChange={(json, plain) => {
                                        form.setData((prev) => ({
                                            ...prev,
                                            content: json,
                                            content_plain: plain,
                                        }));
                                    }}
                                    onImageUpload={handleImageUpload}
                                    placeholder={`Write the ${depthData.label.toLowerCase()} answer here...`}
                                />
                            </div>
                            <InputError message={form.errors.content} />
                            <InputError message={form.errors.depth_level} />

                            <div className="flex items-center gap-3">
                                <Switch
                                    id={`is_published_${depthData.depth_level}`}
                                    checked={form.data.is_published}
                                    onCheckedChange={(checked) => form.setData('is_published', checked)}
                                />
                                <Label
                                    htmlFor={`is_published_${depthData.depth_level}`}
                                    className="text-[12px] text-muted-foreground"
                                >
                                    Publish this depth (visible to entitled students)
                                </Label>
                            </div>
                        </>
                    ) : (
                        <>
                            <AiSeedBanner
                                depth={depthData.depth_level}
                                loading={planLoading}
                                plan={planData}
                                onPlan={handlePlan}
                                onGenerate={handleGenerate}
                            />
                            {generationError && (
                                <p className="text-[11.5px] text-destructive">{generationError}</p>
                            )}
                        </>
                    )}
                </div>

                {!generatingJobId && (
                    <footer className="ed-card-foot">
                        <span className="saved" data-dirty={savedDataDirty} data-empty={savedDataEmpty}>
                            {dirty
                                ? 'Unsaved changes'
                                : isExisting
                                  ? 'Saved'
                                  : 'Not started'}
                            <Transition
                                show={form.recentlySuccessful}
                                enter="transition ease-in-out duration-150"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="transition ease-in-out duration-300"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <span className="ml-2 text-[var(--success)]">just now</span>
                            </Transition>
                        </span>

                        <div className="flex items-center gap-2">
                            {dirty && isExisting && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => form.reset()}
                                >
                                    Discard
                                </Button>
                            )}
                            {isExisting && (
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={form.processing}
                                    variant={depthData.depth_level === 'standard' ? 'default' : 'outline'}
                                >
                                    Save {depthData.label.toLowerCase()}
                                </Button>
                            )}
                        </div>
                    </footer>
                )}
            </form>
        </article>
    );
}

function StatusPill({
    isExisting,
    isPublished,
    dirty,
}: {
    isExisting: boolean;
    isPublished: boolean;
    dirty: boolean;
}) {
    if (!isExisting) {
        return <Badge variant="secondary">Not started</Badge>;
    }
    if (dirty) {
        return (
            <Badge
                variant="outline"
                className="border-[rgba(212,149,42,0.40)] bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]"
            >
                Draft · unsaved
            </Badge>
        );
    }
    if (isPublished) {
        return <Badge variant="default">Published</Badge>;
    }
    return (
        <Badge
            variant="outline"
            className="border-[rgba(212,149,42,0.40)] bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]"
        >
            Draft
        </Badge>
    );
}
