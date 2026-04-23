import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, Check, CircleSlash, Loader2, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { sileo } from 'sileo';
import AIModelController from '@/actions/App/Http/Controllers/Admin/AIModelController';
import AIPlatformSettingsController from '@/actions/App/Http/Controllers/Admin/AIPlatformSettingsController';
import SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

interface AIModelRow {
    id: string;
    name: string;
    model_id: string;
    adapter_type: 'openai_compatible' | 'anthropic';
    adapter_type_label: string;
    is_active: boolean;
    input_cost_per_million: number;
    output_cost_per_million: number;
}

interface Props {
    aiModels: AIModelRow[];
    defaultModelId: string | null;
}

const breadcrumbs = [
    { title: 'Settings', href: SettingsController.index.url() },
    { title: 'AI Routing', href: AIPlatformSettingsController.edit.url() },
];

function formatCost(value: number): string {
    if (value === 0) return '0';
    if (value >= 1) return value.toFixed(2);
    return value.toFixed(2);
}

export default function AIRoutingSettings({ aiModels, defaultModelId }: Props) {
    const activeModels = useMemo(() => aiModels.filter((m) => m.is_active), [aiModels]);
    const currentDefault = useMemo(
        () => aiModels.find((m) => m.id === defaultModelId) ?? null,
        [aiModels, defaultModelId],
    );

    const [selectedId, setSelectedId] = useState<string>(defaultModelId ?? '');
    const [saving, setSaving] = useState(false);

    const dirty = selectedId !== (defaultModelId ?? '');
    const canSave = dirty && !saving && (selectedId === '' || activeModels.some((m) => m.id === selectedId));

    function handleSave() {
        setSaving(true);
        router.put(
            AIPlatformSettingsController.update.url(),
            { default_model_id: selectedId === '' ? null : selectedId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    sileo.success({ title: 'Platform default updated' });
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    sileo.error({ title: typeof first === 'string' ? first : 'Save failed' });
                },
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Routing — Settings" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="AI Routing"
                    description="Control which AI model Content Studio falls back to when no project or stage override is set."
                />

                <PlatformDefaultReadout
                    currentDefault={currentDefault}
                    activeCount={activeModels.length}
                    totalCount={aiModels.length}
                />

                {aiModels.length === 0 ? (
                    <EmptyState />
                ) : (
                    <Card>
                        <CardContent className="flex flex-col gap-4 p-4 md:p-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="font-display text-base font-semibold tracking-tight">
                                    Select platform default
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Applied to projects that haven&apos;t set their own default, and to stages that haven&apos;t been individually overridden.
                                </p>
                            </div>

                            <div className="flex flex-col divide-y divide-border/60 rounded-lg border">
                                <ModelRow
                                    kind="none"
                                    selected={selectedId === ''}
                                    onSelect={() => setSelectedId('')}
                                    index={0}
                                />
                                {aiModels.map((model, index) => (
                                    <ModelRow
                                        key={model.id}
                                        kind="model"
                                        model={model}
                                        selected={selectedId === model.id}
                                        onSelect={() => model.is_active && setSelectedId(model.id)}
                                        index={index + 1}
                                    />
                                ))}
                            </div>

                            <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t pt-4 md:flex-row md:items-center">
                                <div className="flex items-center gap-2">
                                    {dirty ? (
                                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300 reader:text-amber-300">
                                            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
                                            Unsaved changes
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                                            <span className="size-1.5 rounded-full bg-muted-foreground/40" aria-hidden />
                                            No pending changes
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(defaultModelId ?? '')}
                                        disabled={!dirty || saving}
                                        className="inline-flex h-9 items-center justify-center gap-1 rounded-md border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={!canSave}
                                        className={cn(
                                            'inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground',
                                            'transition-opacity hover:opacity-90',
                                            'disabled:cursor-not-allowed disabled:opacity-50',
                                        )}
                                    >
                                        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                                        Save default
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Link
                    href={AIModelController.index.url()}
                    className="group mx-auto inline-flex items-center gap-2 rounded-md border border-dashed border-border/70 bg-card/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                    Manage models
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>
        </AdminLayout>
    );
}

interface PlatformDefaultReadoutProps {
    currentDefault: AIModelRow | null;
    activeCount: number;
    totalCount: number;
}

function PlatformDefaultReadout({ currentDefault, activeCount, totalCount }: PlatformDefaultReadoutProps) {
    return (
        <section
            className="relative overflow-hidden rounded-lg border bg-card/60 shadow-sm"
            style={{ animation: 'fade-in 0.35s ease-out' }}
        >
            <div
                className={cn(
                    'pointer-events-none absolute inset-x-0 top-0 h-px',
                    currentDefault
                        ? 'bg-gradient-to-r from-transparent via-primary/40 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-amber-500/40 to-transparent',
                )}
            />
            <div className="grid grid-cols-1 divide-y divide-border/60 md:grid-cols-[1.4fr_auto_1fr_1fr] md:divide-x md:divide-y-0">
                <div className="flex min-w-0 flex-col gap-1 p-4 md:p-5">
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                'size-1.5 rounded-full',
                                currentDefault ? 'bg-primary' : 'bg-amber-500',
                            )}
                            aria-hidden
                        />
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Platform default
                        </span>
                    </div>
                    {currentDefault ? (
                        <>
                            <p className="truncate font-display text-lg font-semibold text-foreground md:text-xl">
                                {currentDefault.name}
                            </p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground/80">
                                {currentDefault.model_id} · {currentDefault.adapter_type_label}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-display text-lg font-semibold text-amber-700 md:text-xl dark:text-amber-300 reader:text-amber-300">
                                Not configured
                            </p>
                            <p className="flex items-center gap-1 font-mono text-[11px] text-amber-700/80 dark:text-amber-300/80 reader:text-amber-300/80">
                                <AlertTriangle className="size-3" />
                                Using sort-order fallback
                            </p>
                        </>
                    )}
                </div>

                {currentDefault && (
                    <div className="flex flex-col justify-center gap-1 p-4 md:p-5">
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Cost per 1M
                        </span>
                        <div className="flex items-baseline gap-3">
                            <span className="flex items-baseline gap-1 font-mono text-sm text-foreground">
                                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">In</span>
                                ${formatCost(currentDefault.input_cost_per_million)}
                            </span>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="flex items-baseline gap-1 font-mono text-sm text-foreground">
                                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">Out</span>
                                ${formatCost(currentDefault.output_cost_per_million)}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col justify-center gap-1 p-4 md:p-5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Active
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-2xl font-semibold tabular-nums text-foreground">
                            {activeCount}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                            / {totalCount} registered
                        </span>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-1 p-4 md:p-5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Status
                    </span>
                    <div className="flex items-center gap-1.5">
                        {currentDefault ? (
                            <>
                                <ShieldCheck className="size-4 text-[var(--success)]" />
                                <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--success)]">
                                    Resolved
                                </span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 reader:text-amber-400" />
                                <span className="font-mono text-xs uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300 reader:text-amber-300">
                                    Unconfigured
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

interface ModelRowProps {
    kind: 'none' | 'model';
    model?: AIModelRow;
    selected: boolean;
    onSelect: () => void;
    index: number;
}

function ModelRow({ kind, model, selected, onSelect, index }: ModelRowProps) {
    const isNone = kind === 'none';
    const inactive = !isNone && !model?.is_active;
    const disabled = inactive;

    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onSelect}
            disabled={disabled}
            style={{ animationDelay: `${index * 40}ms` }}
            className={cn(
                'relative flex w-full items-center gap-4 px-4 py-3 text-left transition-colors',
                'animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-300',
                'focus-visible:outline-none focus-visible:bg-muted/40',
                !disabled && 'hover:bg-muted/30',
                disabled && 'cursor-not-allowed opacity-50',
                selected && 'bg-primary/5',
            )}
        >
            {selected && (
                <span className="absolute inset-y-0 left-0 w-[3px] bg-primary" aria-hidden />
            )}

            <span
                className={cn(
                    'grid size-4 shrink-0 place-items-center rounded-full border transition-colors',
                    selected ? 'border-primary bg-primary/20' : 'border-border bg-background',
                    inactive && 'border-muted-foreground/30',
                )}
                aria-hidden
            >
                <span
                    className={cn(
                        'size-1.5 rounded-full transition-all',
                        selected ? 'bg-primary' : 'bg-transparent',
                    )}
                />
            </span>

            {isNone ? (
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <CircleSlash className="size-3.5 text-muted-foreground" />
                        No platform default
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/80">
                        Content Studio falls back to the first active model by sort order
                    </span>
                </div>
            ) : (
                <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-y-0.5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:gap-x-6">
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                            {model?.name}
                            {inactive && (
                                <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                                    Inactive
                                </span>
                            )}
                        </span>
                        <span className="truncate font-mono text-[10px] text-muted-foreground/80">
                            {model?.model_id}
                        </span>
                    </div>

                    <span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
                        {model?.adapter_type_label}
                    </span>

                    <div className="flex items-baseline gap-2 font-mono text-xs tabular-nums text-muted-foreground/90">
                        <span className="flex items-baseline gap-1">
                            <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">In</span>
                            ${formatCost(model?.input_cost_per_million ?? 0)}
                        </span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="flex items-baseline gap-1">
                            <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">Out</span>
                            ${formatCost(model?.output_cost_per_million ?? 0)}
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/50">/M</span>
                    </div>
                </div>
            )}
        </button>
    );
}

function EmptyState() {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 p-5">
                    <CircleSlash className="size-6 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                    <p className="font-display text-base font-semibold">No models configured</p>
                    <p className="text-sm text-muted-foreground">
                        Register at least one AI model before setting a platform default.
                    </p>
                </div>
                <Link
                    href={AIModelController.create.url()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                    Add your first model
                    <ArrowRight className="size-3.5" />
                </Link>
            </CardContent>
        </Card>
    );
}
