import { Head, Link, router } from '@inertiajs/react';
import { Bot, KeyRound, Pencil, Plug, Plus, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import AIModelController from '@/actions/App/Http/Controllers/Admin/AIModelController';
import { SearchInput } from '@/components/admin/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import type { AIModel, ProviderWithModels } from '@/types/content-studio';

interface Filters {
    search?: string;
}

interface Props {
    providers: ProviderWithModels[];
    filters: Filters;
}

function formatCost(cents: number): string {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
}

const PROVIDER_STYLES: Record<string, { border: string; dot: string; badge: string }> = {
    deepseek: {
        border: 'border-l-[var(--badge-primary-fg)]',
        dot: 'bg-[var(--badge-primary-fg)]',
        badge: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    },
    anthropic: {
        border: 'border-l-[var(--badge-reward-fg)]',
        dot: 'bg-[var(--badge-reward-fg)]',
        badge: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    },
    google: {
        border: 'border-l-[var(--badge-danger-fg)]',
        dot: 'bg-[var(--badge-danger-fg)]',
        badge: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
    },
    openai: {
        border: 'border-l-[var(--badge-neutral-fg)]',
        dot: 'bg-[var(--badge-neutral-fg)]',
        badge: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
    },
};

const FALLBACK_STYLE = PROVIDER_STYLES.openai;

const breadcrumbs = [{ title: 'AI Models', href: '#' }];

export default function AIModelsIndex({ providers, filters }: Props) {
    const [testing, setTesting] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

    function handleTestConnection(modelId: string) {
        setTesting(modelId);
        setTestResults((prev) => {
            const next = { ...prev };
            delete next[modelId];
            return next;
        });

        fetch(AIModelController.testConnection.url({ ai_model: modelId }), {
            method: 'POST',
            headers: {
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then((r) => r.json())
            .then((data) =>
                setTestResults((prev) => ({
                    ...prev,
                    [modelId]: {
                        success: data.success,
                        message: data.success
                            ? `Connected — ${data.generation_time_ms}ms`
                            : Object.values(data.errors ?? {}).join(', '),
                    },
                })),
            )
            .catch(() =>
                setTestResults((prev) => ({
                    ...prev,
                    [modelId]: { success: false, message: 'Request failed' },
                })),
            )
            .finally(() => setTesting(null));
    }

    function handleDelete(modelId: string) {
        if (confirm('Delete this AI model? This cannot be undone.')) {
            router.delete(AIModelController.destroy.url({ ai_model: modelId }));
        }
    }

    const visibleProviders = filters.search
        ? providers.filter((p) => p.models.length > 0)
        : providers;

    const totalModels = providers.reduce((sum, p) => sum + p.models.length, 0);
    const noResults = !!filters.search && visibleProviders.length === 0;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Models" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">AI Models</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Configure providers and their models for content generation.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={AIModelController.create.url()}>
                            <Plus className="mr-2 size-4" />
                            Add Model
                        </Link>
                    </Button>
                </div>

                <SearchInput
                    value={filters.search ?? ''}
                    routeUrl={AIModelController.index.url()}
                    placeholder="Search models..."
                />

                {providers.length === 0 || (!filters.search && totalModels === 0) ? (
                    <Card>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 rounded-full bg-muted p-4">
                                <Bot className="size-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-display text-lg font-semibold">No AI models configured</h3>
                            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                Add your first AI model to enable content generation in the Content Studio.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href={AIModelController.create.url()}>
                                    <Plus className="mr-2 size-4" />
                                    Add Model
                                </Link>
                            </Button>
                        </div>
                    </Card>
                ) : noResults ? (
                    <Card>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-3 rounded-full bg-muted p-3">
                                <Bot className="size-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                No models match{' '}
                                <span className="font-medium text-foreground">"{filters.search}"</span>
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-4">
                        {visibleProviders.map((provider) => (
                            <ProviderSection
                                key={provider.id}
                                provider={provider}
                                testing={testing}
                                testResults={testResults}
                                onTest={handleTestConnection}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

// ─── Provider section ────────────────────────────────────────────────────────

interface ProviderSectionProps {
    provider: ProviderWithModels;
    testing: string | null;
    testResults: Record<string, { success: boolean; message: string }>;
    onTest: (modelId: string) => void;
    onDelete: (modelId: string) => void;
}

function ProviderSection({ provider, testing, testResults, onTest, onDelete }: ProviderSectionProps) {
    const styles = PROVIDER_STYLES[provider.slug] ?? FALLBACK_STYLE;
    const firstModelId = provider.models[0]?.id;

    return (
        <Card className={cn('overflow-hidden border-l-[5px]', styles.border)}>

            {/* ── Provider header ───────────────────────────────────────── */}
            <div className="flex flex-col gap-3 border-b border-border bg-muted px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className={cn('size-2.5 shrink-0 rounded-full', styles.dot)} />
                        <h2 className="font-display text-[15px] font-bold text-foreground">
                            {provider.name}
                        </h2>
                        <Badge
                            variant="secondary"
                            className={cn('h-5 px-1.5 text-[11px] leading-none', styles.badge)}
                        >
                            {provider.adapter_type_label}
                        </Badge>
                        {!provider.is_active && (
                            <Badge
                                variant="secondary"
                                className="h-5 bg-[var(--badge-neutral-bg)] px-1.5 text-[11px] leading-none text-[var(--badge-neutral-fg)]"
                            >
                                Inactive
                            </Badge>
                        )}
                    </div>
                    <p className="mt-1 pl-[18px] font-mono text-[11px] text-muted-foreground">
                        {provider.base_url}
                    </p>
                </div>

                <div className="flex items-center gap-3 pl-[18px] sm:pl-0">
                    {/* API key status pill */}
                    <div className={cn(
                        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        provider.api_key_set
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 reader:bg-green-900/30 reader:text-green-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 reader:bg-amber-900/30 reader:text-amber-400',
                    )}>
                        <div className={cn(
                            'size-1.5 rounded-full',
                            provider.api_key_set ? 'bg-green-500' : 'bg-amber-500',
                        )} />
                        {provider.api_key_set ? 'API key set' : 'No API key'}
                    </div>

                    <span className="text-xs text-muted-foreground tabular-nums">
                        {provider.models.length}{' '}
                        {provider.models.length === 1 ? 'model' : 'models'}
                    </span>

                    {firstModelId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden h-7 gap-1.5 text-xs sm:flex"
                            asChild
                        >
                            <Link href={AIModelController.edit.url({ ai_model: firstModelId })}>
                                <KeyRound className="size-3" />
                                Configure
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Models list ───────────────────────────────────────────── */}
            {provider.models.length === 0 ? (
                <p className="px-5 py-4 text-sm italic text-muted-foreground">
                    No models configured for this provider.
                </p>
            ) : (
                <div className="divide-y divide-border">
                    {provider.models.map((model) => (
                        <ModelRow
                            key={model.id}
                            model={model}
                            isTesting={testing === model.id}
                            testResult={testResults[model.id]}
                            onTest={() => onTest(model.id)}
                            onDelete={() => onDelete(model.id)}
                        />
                    ))}
                </div>
            )}
        </Card>
    );
}

// ─── Model row ───────────────────────────────────────────────────────────────

interface ModelRowProps {
    model: AIModel & { provider_api_key_set: boolean };
    isTesting: boolean;
    testResult?: { success: boolean; message: string };
    onTest: () => void;
    onDelete: () => void;
}

function ModelRow({ model, isTesting, testResult, onTest, onDelete }: ModelRowProps) {
    return (
        <div className={cn(!model.is_active && 'opacity-60')}>
            <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 px-5 py-3 transition-colors hover:bg-muted/40 sm:grid-cols-[1fr_96px_auto] md:grid-cols-[1fr_96px_172px_auto]">

                {/* Name + model ID */}
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                            {model.name}
                        </span>
                        {!model.is_active && (
                            <Badge
                                variant="secondary"
                                className="h-4 bg-[var(--badge-neutral-bg)] px-1.5 text-[10px] leading-none text-[var(--badge-neutral-fg)]"
                            >
                                Inactive
                            </Badge>
                        )}
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {model.model_id}
                    </p>
                </div>

                {/* Thinking mode — sm+ */}
                <div className="hidden sm:flex sm:justify-start">
                    {model.thinking_mode !== 'none' && (
                        <Badge
                            variant="outline"
                            className="font-mono text-[10px] uppercase tracking-wide"
                        >
                            {model.thinking_mode === 'max' ? 'Think Max' : 'Think'}
                        </Badge>
                    )}
                </div>

                {/* Cost chip — md+ */}
                <div className="hidden items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1 text-xs tabular-nums md:flex">
                    <span>
                        <span className="text-muted-foreground">In </span>
                        <span className="font-medium">{formatCost(model.input_cost_per_million)}</span>
                    </span>
                    <span className="text-muted-foreground/40">|</span>
                    <span>
                        <span className="text-muted-foreground">Out </span>
                        <span className="font-medium">{formatCost(model.output_cost_per_million)}</span>
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={onTest}
                        disabled={isTesting}
                        title="Test connection"
                    >
                        {isTesting ? (
                            <Zap className="size-3.5 animate-pulse text-amber-500" />
                        ) : (
                            <Plug className="size-3.5" />
                        )}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" asChild title="Edit">
                        <Link href={AIModelController.edit.url({ ai_model: model.id })}>
                            <Pencil className="size-3.5" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={onDelete}
                        title="Delete"
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* Test result strip */}
            {testResult && (
                <div className="px-5 pb-3">
                    <div className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-xs',
                        testResult.success
                            ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 reader:bg-green-900/20 reader:text-green-300'
                            : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 reader:bg-red-900/20 reader:text-red-300',
                    )}>
                        <div className={cn(
                            'size-2 shrink-0 rounded-full',
                            testResult.success ? 'bg-green-500' : 'bg-red-500',
                        )} />
                        {testResult.message}
                    </div>
                </div>
            )}
        </div>
    );
}
