import { Head, Link, router } from '@inertiajs/react';
import { Bot, CircleDot, KeyRound, Pencil, Plug, Plus, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import AIModelController from '@/actions/App/Http/Controllers/Admin/AIModelController';
import { SearchInput } from '@/components/admin/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import type { PaginatedData } from '@/types/models';
import type { AIModel } from '@/types/content-studio';

interface Filters {
    search?: string;
}

interface Props {
    models: PaginatedData<AIModel>;
    filters: Filters;
}

function formatCost(cents: number): string {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
}

const ADAPTER_STYLES = {
    openai_compatible: {
        border: 'border-l-teal-500 dark:border-l-teal-400 reader:border-l-teal-400',
        badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 reader:bg-teal-900/40 reader:text-teal-300',
    },
    anthropic: {
        border: 'border-l-amber-500 dark:border-l-amber-400 reader:border-l-amber-400',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 reader:bg-amber-900/40 reader:text-amber-300',
    },
} as const;

const breadcrumbs = [{ title: 'AI Models', href: '#' }];

export default function AIModelsIndex({ models, filters }: Props) {
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
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setTestResults((prev) => ({
                    ...prev,
                    [modelId]: {
                        success: data.success,
                        message: data.success
                            ? `Connected — ${data.generation_time_ms}ms`
                            : Object.values(data.errors ?? {}).join(', '),
                    },
                }));
            })
            .catch(() => {
                setTestResults((prev) => ({
                    ...prev,
                    [modelId]: { success: false, message: 'Request failed' },
                }));
            })
            .finally(() => setTesting(null));
    }

    function handleDelete(modelId: string) {
        if (confirm('Delete this AI model? This cannot be undone.')) {
            router.delete(AIModelController.destroy.url({ ai_model: modelId }));
        }
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Models" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            AI Models
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Configure AI providers for content generation.
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

                {models.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
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
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {models.data.map((model) => (
                            <ModelCard
                                key={model.id}
                                model={model}
                                isTesting={testing === model.id}
                                testResult={testResults[model.id]}
                                onTest={() => handleTestConnection(model.id)}
                                onDelete={() => handleDelete(model.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

interface ModelCardProps {
    model: AIModel;
    isTesting: boolean;
    testResult?: { success: boolean; message: string };
    onTest: () => void;
    onDelete: () => void;
}

function ModelCard({ model, isTesting, testResult, onTest, onDelete }: ModelCardProps) {
    const styles = ADAPTER_STYLES[model.adapter_type];

    return (
        <Card className={cn(
            'border-l-4 transition-shadow hover:shadow-md',
            styles.border,
            !model.is_active && 'opacity-60',
        )}>
            <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate font-medium text-foreground">
                                {model.name}
                            </h3>
                            {!model.is_active && (
                                <Badge variant="secondary" className="bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]">
                                    Inactive
                                </Badge>
                            )}
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {model.model_id}
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={onTest}
                            disabled={isTesting}
                            title="Test connection"
                        >
                            {isTesting ? (
                                <Zap className="size-4 animate-pulse text-amber-500" />
                            ) : (
                                <Plug className="size-4" />
                            )}
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                            <Link href={AIModelController.edit.url({ ai_model: model.id })} title="Edit">
                                <Pencil className="size-4" />
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={onDelete}
                            title="Delete"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className={cn('text-xs', styles.badge)}>
                        {model.adapter_type_label}
                    </Badge>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <KeyRound className="size-3" />
                        <CircleDot className={cn(
                            'size-2.5',
                            model.api_key
                                ? 'fill-green-500 text-green-500 dark:fill-green-400 dark:text-green-400'
                                : 'fill-muted-foreground/40 text-muted-foreground/40',
                        )} />
                        <span>{model.api_key ? 'Configured' : 'Not set'}</span>
                    </div>

                    <div className="ml-auto flex items-center gap-3 rounded-md bg-muted/50 px-2.5 py-1 text-xs tabular-nums">
                        <span>
                            <span className="text-muted-foreground">In </span>
                            <span className="font-medium">{formatCost(model.input_cost_per_million)}</span>
                        </span>
                        <span className="text-muted-foreground/50">|</span>
                        <span>
                            <span className="text-muted-foreground">Out </span>
                            <span className="font-medium">{formatCost(model.output_cost_per_million)}</span>
                        </span>
                    </div>
                </div>

                {testResult && (
                    <div className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-xs',
                        testResult.success
                            ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 reader:bg-green-900/20 reader:text-green-300'
                            : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 reader:bg-red-900/20 reader:text-red-300',
                    )}>
                        <CircleDot className={cn(
                            'size-2.5',
                            testResult.success
                                ? 'fill-green-500 text-green-500'
                                : 'fill-red-500 text-red-500',
                        )} />
                        {testResult.message}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
