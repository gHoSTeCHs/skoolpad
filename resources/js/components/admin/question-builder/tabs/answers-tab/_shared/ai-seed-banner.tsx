import { CheckCircle2, Clock, ImageIcon, ListIcon, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AnswerDepthLevel } from '@/types/questions';

export interface AnswerGenerationPlan {
    prose_outline: string[];
    illustration_briefs: { type: string; description: string }[];
    estimated_tokens: number;
    estimated_seconds: number;
}

interface AiSeedBannerProps {
    depth: AnswerDepthLevel;
    disabled?: boolean;
    loading?: boolean;
    plan?: AnswerGenerationPlan | null;
    onPlan?: () => void;
    onGenerate?: () => void;
}

const SEED_HEADLINE: Record<AnswerDepthLevel, { lead: string; sub: string }> = {
    quick: {
        lead: 'Seed Quick from the question stem + linked topics.',
        sub: 'AI drafts a 1–2 sentence direct answer. You review, edit, and publish.',
    },
    standard: {
        lead: 'Seed Standard from the Quick answer + linked context blocks.',
        sub: 'AI drafts a step-by-step explanation with reasoning. ~200 words.',
    },
    deep_dive: {
        lead: 'Seed Deep Dive from the Standard explanation + linked context.',
        sub: 'AI generates prose and any required illustrations together (recency stack diagram, comparison plots). You review, edit, and publish.',
    },
};

const PROSE_PLAN_PREVIEW: Record<AnswerDepthLevel, string[]> = {
    quick: [
        'One-sentence direct answer to the question',
        'One-sentence justification grounded in the linked topic',
    ],
    standard: [
        'Concept framing — what the question is testing',
        'Step-by-step solution / reasoning chain',
        'Why each distractor (if any) is tempting and wrong',
        'One-line takeaway / mnemonic',
    ],
    deep_dive: [
        'Full taxonomy: where this concept sits in the broader topic',
        'Worked derivation or mathematical foundation',
        'Edge cases and counter-examples',
        'References to canonical sources',
    ],
};

const ILLUSTRATION_PLAN_PREVIEW: Record<AnswerDepthLevel, string[]> = {
    quick: [],
    standard: ['Optional: a single clarifying diagram if the concept is spatial'],
    deep_dive: [
        'Comparison diagram — primary distinction the question is probing',
        'Decision-tree or flow chart for the underlying mechanism',
    ],
};

const PROVIDER_NOTE: Record<AnswerDepthLevel, string> = {
    quick: '~ 6 sec · uses claude-sonnet-4-6 · counts against today\'s AI budget',
    standard: '~ 14 sec · uses claude-sonnet-4-6 · counts against today\'s AI budget',
    deep_dive: '~ 22 sec · uses claude-opus-4-7 · counts against today\'s AI budget',
};

export function AiSeedBanner({
    depth,
    disabled = false,
    loading = false,
    plan = null,
    onPlan,
    onGenerate,
}: AiSeedBannerProps) {
    const headline = SEED_HEADLINE[depth];
    const prose = plan ? plan.prose_outline : PROSE_PLAN_PREVIEW[depth];
    const illustrations = plan
        ? plan.illustration_briefs.map((b) => b.description)
        : ILLUSTRATION_PLAN_PREVIEW[depth];
    const illustrationCount = plan ? plan.illustration_briefs.length : illustrations.length;
    const isPlanReady = plan !== null;

    return (
        <>
            <div className="ai-seed-banner">
                <span className="ai-seed-chip">AI</span>
                <div className="min-w-0 flex-1 text-sm leading-snug text-foreground">
                    <strong className="font-semibold">{headline.lead}</strong>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">{headline.sub}</p>
                </div>
                {isPlanReady ? (
                    <Button
                        size="sm"
                        onClick={onGenerate}
                        disabled={disabled || loading}
                        className="shrink-0 gap-1.5"
                    >
                        {loading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <CheckCircle2 className="size-3.5" />
                        )}
                        Confirm &amp; Generate
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        onClick={onPlan}
                        disabled={disabled || loading}
                        className="shrink-0 gap-1.5"
                    >
                        {loading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Sparkles className="size-3.5" />
                        )}
                        {loading ? 'Planning…' : 'Generate'}
                    </Button>
                )}
            </div>

            <div className="ai-seed-grid">
                <div className="ai-seed-card">
                    <div className="mb-2 flex items-center gap-2">
                        <ListIcon className="size-3.5 text-primary" />
                        <span
                            className="text-[12px] font-semibold text-foreground"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Prose plan
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-[var(--fg-subtle)]">
                            {isPlanReady ? 'AI plan' : 'example'}
                        </span>
                    </div>
                    <ul className="m-0 list-disc pl-4 text-[12px] leading-relaxed text-muted-foreground">
                        {prose.map((line, i) => (
                            <li key={i}>{line}</li>
                        ))}
                    </ul>
                </div>

                <div className="ai-seed-card" data-tone="ember">
                    <div className="mb-2 flex items-center gap-2">
                        <ImageIcon className="size-3.5 text-[var(--destructive)]" />
                        <span
                            className="text-[12px] font-semibold text-[var(--destructive)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Illustration plan
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-[var(--fg-subtle)]">
                            {illustrationCount} figure{illustrationCount === 1 ? '' : 's'}
                        </span>
                    </div>
                    {illustrations.length === 0 ? (
                        <p className="m-0 text-[12px] italic text-muted-foreground">
                            No illustrations planned for this depth.
                        </p>
                    ) : (
                        <ul className="m-0 list-disc pl-4 text-[12px] leading-relaxed text-muted-foreground">
                            {illustrations.map((line, i) => (
                                <li key={i}>{line}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="ai-seed-meta">
                <Clock className="size-3" />
                <span>
                    {plan
                        ? `~ ${plan.estimated_seconds} sec · ${plan.estimated_tokens.toLocaleString()} tokens`
                        : PROVIDER_NOTE[depth]}
                </span>
                <span className="ml-auto text-[var(--fg-subtle)]">
                    {isPlanReady ? 'review plan, then confirm →' : 'edit plan before generating →'}
                </span>
            </div>
        </>
    );
}
