'use no memo';

import { useCallback, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImagePlus, PenSquare, Sparkles, Trash2 } from 'lucide-react';
import type { DiagramLabelConfig, EnumOption, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { StemCard } from './_shared/stem-card';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';
import { AcceptChips } from './_shared/accept-chips';
import { DiagramEditModal } from '@/components/shared/tiptap/diagram-edit-modal';

interface DiagramLabelAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
}

interface ExtendedDiagramConfig extends DiagramLabelConfig {
    image_url?: string;
    /** Set when the image was authored via Excalidraw — lets the modal re-open the same scene. */
    asset_id?: string | null;
    accepted?: Record<number, string[]>;
    per_label_marks?: Record<number, number>;
}

function defaultConfig(): ExtendedDiagramConfig {
    return {
        labels: [],
        image_url: '',
    };
}

export function DiagramLabelAuthor({ question, enumOptions }: DiagramLabelAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question);
    const config = (form.data.response_config as ExtendedDiagramConfig | null) ?? defaultConfig();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const [diagramOpen, setDiagramOpen] = useState(false);

    const setConfig = useCallback((next: ExtendedDiagramConfig) => {
        form.setData('response_config', next as never);
    }, [form]);

    function placeHotspot(e: React.MouseEvent<HTMLDivElement>) {
        if (!canvasRef.current || draggingIdx !== null) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const next = [...config.labels, { label: `${config.labels.length + 1}`, answer: '', x, y }];
        setConfig({ ...config, labels: next });
    }

    function removeLabel(idx: number) {
        const next = config.labels.filter((_, i) => i !== idx).map((l, i) => ({ ...l, label: `${i + 1}` }));
        const accepted = { ...(config.accepted ?? {}) };
        delete accepted[idx];
        const remapped: Record<number, string[]> = {};
        let target = 0;
        config.labels.forEach((_, i) => {
            if (i === idx) return;
            remapped[target++] = accepted[i] ?? [];
        });
        const perLabelMarks = { ...(config.per_label_marks ?? {}) };
        delete perLabelMarks[idx];
        const remappedMarks: Record<number, number> = {};
        target = 0;
        config.labels.forEach((_, i) => {
            if (i === idx) return;
            const mark = perLabelMarks[i];
            if (mark !== undefined) remappedMarks[target] = mark;
            target += 1;
        });
        setConfig({ ...config, labels: next, accepted: remapped, per_label_marks: remappedMarks });
    }

    function dragHotspot(idx: number, e: React.MouseEvent<HTMLSpanElement>) {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const next = config.labels.map((l, i) => (i === idx ? { ...l, x, y } : l));
        setConfig({ ...config, labels: next });
    }

    function setLabelAccepted(idx: number, values: string[]) {
        const labels = config.labels.map((l, i) =>
            i === idx ? { ...l, answer: values[0] ?? '' } : l,
        );
        setConfig({
            ...config,
            labels,
            accepted: { ...(config.accepted ?? {}), [idx]: values },
        });
    }

    function setLabelMarks(idx: number, marks: number) {
        setConfig({ ...config, per_label_marks: { ...(config.per_label_marks ?? {}), [idx]: marks } });
    }

    return (
        <form onSubmit={save} className="space-y-5">
            <StemCard
                title="Diagram-label stem"
                description="The student sees the diagram and labels the numbered hotspots."
                placeholder="Type the diagram-label prompt…"
                valueDoc={form.data.content_doc}
                error={form.errors.content}
                onChange={(json, plain) => form.setData((prev) => ({ ...prev, content: plain, content_doc: json }))}
                questionId={question.id}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Diagram + hotspots</CardTitle>
                    <CardDescription>
                        Upload an image, paste an SVG, or generate one with AI. Then click the canvas to place numbered hotspots.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!config.image_url ? (
                        <div className="rounded-md border-2 border-dashed border-border bg-card px-6 py-10 text-center">
                            <ImagePlus className="mx-auto size-8 text-[var(--fg-subtle)]" />
                            <p className="mt-3 font-display text-sm font-medium text-muted-foreground">
                                Drop an image, paste an SVG, or generate one with AI
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-[var(--fg-subtle)]">PNG · JPG · SVG · max 4 MB</p>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setDiagramOpen(true)}
                                >
                                    <PenSquare className="size-3.5" />
                                    Draw with Excalidraw
                                </Button>
                                <Button type="button" size="sm" variant="outline" disabled title="Coming soon">
                                    Upload image
                                </Button>
                                <Button type="button" size="sm" variant="outline" disabled title="Thread A — Track 2 follow-on">
                                    <Sparkles className="size-3.5" />
                                    AI generate
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div
                                ref={canvasRef}
                                onClick={placeHotspot}
                                style={{ cursor: draggingIdx === null ? 'crosshair' : 'grabbing' }}
                                className="relative overflow-hidden rounded-md border border-border bg-card"
                            >
                                <img
                                    src={config.image_url}
                                    alt=""
                                    className="block h-auto w-full select-none"
                                    draggable={false}
                                />
                                {config.labels.map((label, idx) => (
                                    <span
                                        key={idx}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            setDraggingIdx(idx);
                                        }}
                                        onMouseMove={(e) => {
                                            if (draggingIdx === idx) dragHotspot(idx, e);
                                        }}
                                        onMouseUp={(e) => {
                                            e.stopPropagation();
                                            setDraggingIdx(null);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            left: `${label.x ?? 0}%`,
                                            top: `${label.y ?? 0}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                        className="absolute inline-flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-primary font-mono text-[11px] font-bold text-primary-foreground shadow-[0_0_0_4px_rgba(26,107,79,0.16)]"
                                    >
                                        {label.label}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>{config.labels.length} hotspot{config.labels.length === 1 ? '' : 's'} placed</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setDiagramOpen(true)}
                                        className="font-mono text-[11px] text-[var(--fg-subtle)] hover:text-foreground"
                                    >
                                        <PenSquare className="mr-1 inline-block size-3" />
                                        Edit diagram
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfig({ ...config, image_url: '', asset_id: null, labels: [], accepted: {}, per_label_marks: {} })}
                                        className="font-mono text-[11px] text-[var(--fg-subtle)] hover:text-destructive"
                                    >
                                        <Trash2 className="mr-1 inline-block size-3" />
                                        Replace image
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {config.labels.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Accepted answers per label</CardTitle>
                        <CardDescription>List acceptable spellings/forms for each hotspot. Each label has its own marks weighting.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {config.labels.map((label, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-[auto_1fr_72px_32px] items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                                >
                                    <span className="rounded-full bg-[var(--badge-primary-fg)] px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                                        {label.label}
                                    </span>
                                    <AcceptChips
                                        values={config.accepted?.[idx] ?? []}
                                        onChange={(values) => setLabelAccepted(idx, values)}
                                        addLabel="+ add"
                                        placeholder="accepted answer"
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={config.per_label_marks?.[idx] ?? 0}
                                        onChange={(e) => setLabelMarks(idx, Number(e.target.value) || 0)}
                                        className="w-full rounded border border-border bg-transparent px-2 py-1 text-right font-mono text-[11px]"
                                        title="Per-label marks"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeLabel(idx)}
                                        className="size-8 rounded text-muted-foreground hover:bg-[var(--bg-raised)] hover:text-destructive"
                                        aria-label={`Remove hotspot ${label.label}`}
                                    >
                                        <Trash2 className="mx-auto size-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <MetadataCard
                marks={form.data.marks}
                difficulty={form.data.difficulty_level}
                bloom={form.data.bloom_level}
                enumOptions={enumOptions}
                errors={{
                    marks: form.errors.marks,
                    difficulty_level: form.errors.difficulty_level,
                    bloom_level: form.errors.bloom_level,
                }}
                onMarksChange={(m) => form.setData('marks', m)}
                onDifficultyChange={(d) => form.setData('difficulty_level', d)}
                onBloomChange={(b) => form.setData('bloom_level', b)}
            />

            <SaveBar isDirty={isDirty} processing={form.processing} recentlySuccessful={form.recentlySuccessful} />

            <DiagramEditModal
                open={diagramOpen}
                onOpenChange={setDiagramOpen}
                owner={{ kind: 'question', id: question.id }}
                assetId={config.asset_id ?? null}
                kind="free_form"
                caption=""
                altText=""
                onSaved={(assetId) =>
                    setConfig({
                        ...config,
                        asset_id: assetId,
                        image_url: `/admin/assets/${assetId}/svg?v=${Date.now()}`,
                    })
                }
            />
        </form>
    );
}
