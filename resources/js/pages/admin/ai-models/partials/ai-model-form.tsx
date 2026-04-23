import { useForm } from '@inertiajs/react';
import { Globe, MessageSquare } from 'lucide-react';
import AIModelController from '@/actions/App/Http/Controllers/Admin/AIModelController';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSlug } from '@/hooks/use-slug';
import { cn } from '@/lib/utils';
import type { AIAdapterType, AIModel, EnumOption } from '@/types/content-studio';

interface AIModelFormProps {
    aiModel?: AIModel;
    adapterTypes: EnumOption[];
}

interface FormData {
    name: string;
    slug: string;
    adapter_type: AIAdapterType | '';
    base_url: string;
    api_key: string;
    model_id: string;
    max_tokens: number | '';
    input_cost_per_million: number | '';
    output_cost_per_million: number | '';
    is_active: boolean;
    sort_order: number | '';
}

const ADAPTER_INFO: Record<AIAdapterType, { icon: React.ReactNode; description: string; hint: string }> = {
    openai_compatible: {
        icon: <Globe className="size-5" />,
        description: 'OpenAI, DeepSeek, Gemini, Mistral, Ollama, OpenRouter, Together AI, Groq',
        hint: 'Uses /chat/completions endpoint',
    },
    anthropic: {
        icon: <MessageSquare className="size-5" />,
        description: 'Claude models via Anthropic API',
        hint: 'Uses /messages endpoint',
    },
};

export function AIModelForm({ aiModel, adapterTypes }: AIModelFormProps) {
    const isEditing = Boolean(aiModel);
    const { generateSlug, slugManuallyEdited } = useSlug();

    const form = useForm<FormData>({
        name: aiModel?.name ?? '',
        slug: aiModel?.slug ?? '',
        adapter_type: aiModel?.adapter_type ?? '',
        base_url: aiModel?.base_url ?? '',
        api_key: aiModel?.api_key ?? '',
        model_id: aiModel?.model_id ?? '',
        max_tokens: aiModel?.max_tokens ?? 8192,
        input_cost_per_million: aiModel?.input_cost_per_million ?? 0,
        output_cost_per_million: aiModel?.output_cost_per_million ?? 0,
        is_active: aiModel?.is_active ?? true,
        sort_order: aiModel?.sort_order ?? 0,
    });

    function handleNameChange(value: string) {
        form.setData('name', value);
        if (!slugManuallyEdited.current) {
            form.setData('slug', generateSlug(value));
        }
    }

    function handleAdapterSelect(adapter: AIAdapterType) {
        form.setData('adapter_type', adapter);
        if (!form.data.base_url) {
            const defaults: Record<AIAdapterType, string> = {
                openai_compatible: 'https://api.openai.com/v1',
                anthropic: 'https://api.anthropic.com/v1',
            };
            form.setData('base_url', defaults[adapter]);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEditing && aiModel) {
            form.put(AIModelController.update.url({ ai_model: aiModel.id }));
        } else {
            form.post(AIModelController.store.url());
        }
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={AIModelController.index.url()}
            submitLabel={isEditing ? 'Update Model' : 'Add Model'}
            isSubmitting={form.processing}
        >
            <div>
                <p className="mb-3 text-sm font-medium text-foreground">
                    Adapter Type <span className="text-destructive">*</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {adapterTypes.map((opt) => {
                        const info = ADAPTER_INFO[opt.value as AIAdapterType];
                        const selected = form.data.adapter_type === opt.value;

                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleAdapterSelect(opt.value as AIAdapterType)}
                                className={cn(
                                    'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                                    selected
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border hover:border-primary/40 hover:bg-muted/50',
                                )}
                            >
                                <div className={cn(
                                    'flex size-9 items-center justify-center rounded-lg',
                                    selected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground',
                                )}>
                                    {info?.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                        {info?.description}
                                    </p>
                                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                                        {info?.hint}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
                {form.errors.adapter_type && (
                    <p className="mt-2 text-sm text-destructive">{form.errors.adapter_type}</p>
                )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <FormField label="Display Name" name="name" error={form.errors.name} required>
                    <Input
                        id="name"
                        value={form.data.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. DeepSeek V3.2"
                    />
                </FormField>

                <FormField label="Slug" name="slug" error={form.errors.slug}>
                    <Input
                        id="slug"
                        value={form.data.slug}
                        onChange={(e) => {
                            slugManuallyEdited.current = true;
                            form.setData('slug', e.target.value);
                        }}
                        placeholder="auto-generated"
                    />
                </FormField>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <FormField label="Base URL" name="base_url" error={form.errors.base_url} required>
                    <Input
                        id="base_url"
                        value={form.data.base_url}
                        onChange={(e) => form.setData('base_url', e.target.value)}
                        placeholder="e.g. https://api.deepseek.com/v1"
                    />
                </FormField>

                <FormField label="Model ID" name="model_id" error={form.errors.model_id} required>
                    <Input
                        id="model_id"
                        value={form.data.model_id}
                        onChange={(e) => form.setData('model_id', e.target.value)}
                        placeholder="e.g. deepseek-chat"
                    />
                </FormField>
            </div>

            <FormField
                label="API Key"
                name="api_key"
                error={form.errors.api_key}
                description={isEditing ? 'Leave unchanged to keep the current key. Clear to remove.' : 'Leave empty for free APIs or local models.'}
            >
                <Input
                    id="api_key"
                    type="password"
                    value={form.data.api_key}
                    onChange={(e) => form.setData('api_key', e.target.value)}
                    placeholder={isEditing ? '••••••••' : 'sk-...'}
                    autoComplete="off"
                />
            </FormField>

            <div className="grid gap-6 sm:grid-cols-3">
                <FormField label="Max Tokens" name="max_tokens" error={form.errors.max_tokens} required>
                    <Input
                        id="max_tokens"
                        type="number"
                        min={100}
                        max={200000}
                        value={form.data.max_tokens}
                        onChange={(e) => form.setData('max_tokens', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                </FormField>

                <FormField
                    label="Input Cost"
                    name="input_cost_per_million"
                    error={form.errors.input_cost_per_million}
                    description="Cents per 1M tokens"
                    required
                >
                    <Input
                        id="input_cost_per_million"
                        type="number"
                        min={0}
                        value={form.data.input_cost_per_million}
                        onChange={(e) => form.setData('input_cost_per_million', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 27 = $0.27"
                    />
                </FormField>

                <FormField
                    label="Output Cost"
                    name="output_cost_per_million"
                    error={form.errors.output_cost_per_million}
                    description="Cents per 1M tokens"
                    required
                >
                    <Input
                        id="output_cost_per_million"
                        type="number"
                        min={0}
                        value={form.data.output_cost_per_million}
                        onChange={(e) => form.setData('output_cost_per_million', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 110 = $1.10"
                    />
                </FormField>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <FormField label="Sort Order" name="sort_order" error={form.errors.sort_order}>
                    <Input
                        id="sort_order"
                        type="number"
                        min={0}
                        value={form.data.sort_order}
                        onChange={(e) => form.setData('sort_order', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                </FormField>

                <FormField label="Active" name="is_active" error={form.errors.is_active}>
                    <div className="flex h-9 items-center">
                        <Switch
                            id="is_active"
                            checked={form.data.is_active}
                            onCheckedChange={(checked) => form.setData('is_active', checked)}
                        />
                    </div>
                </FormField>
            </div>
        </FormWrapper>
    );
}
