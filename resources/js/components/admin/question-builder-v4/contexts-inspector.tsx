'use no memo';

import { router } from '@inertiajs/react';
import {
    BookOpen,
    Check,
    ClipboardList,
    Code2,
    Image as ImageIcon,
    LineChart,
    Map as MapIcon,
    PenSquare,
    Plus,
    Sigma,
    Sparkles,
    Table as TableIcon,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import QuestionContextController from '@/actions/App/Http/Controllers/Admin/QuestionContextController';
import { DiagramEditModal } from '@/components/shared/tiptap/diagram-edit-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useDirtyRegistration } from './hooks/use-dirty-registration';
import type { ContextType, QuestionContextData, QuestionNode, QuestionPaper } from '@/types/questions';

const TEXT_TYPES: ContextType[] = ['passage', 'case_study', 'equation_set'];

const TYPE_META: Record<ContextType, { label: string; icon: LucideIcon }> = {
    passage: { label: 'Passage', icon: BookOpen },
    diagram: { label: 'Diagram', icon: ImageIcon },
    table: { label: 'Table', icon: TableIcon },
    case_study: { label: 'Case study', icon: ClipboardList },
    code_snippet: { label: 'Code snippet', icon: Code2 },
    map: { label: 'Map', icon: MapIcon },
    graph: { label: 'Graph', icon: LineChart },
    word_bank: { label: 'Word bank', icon: Sparkles },
    equation_set: { label: 'Equation set', icon: Sigma },
};

const TYPE_OPTIONS = (Object.keys(TYPE_META) as ContextType[]).map((v) => ({
    value: v,
    label: TYPE_META[v].label,
}));

function attachedContextIds(question: QuestionNode): Set<string> {
    if (question.context_links?.length) {
        return new Set(question.context_links.map((cl) => cl.context_id));
    }
    if (question.question_context_links?.length) {
        return new Set(question.question_context_links.map((cl) => cl.question_context_id));
    }
    return new Set();
}

function countContextUsage(paper: QuestionPaper): Map<string, number> {
    const counts = new Map<string, number>();
    const walk = (q: QuestionNode) => {
        const ids = attachedContextIds(q);
        ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
        q.children?.forEach(walk);
    };
    paper.sections.forEach((section) => section.questions.forEach(walk));
    return counts;
}

interface ContextsInspectorProps {
    paper: QuestionPaper;
    question: QuestionNode;
}

export function ContextsInspector({ paper, question }: ContextsInspectorProps) {
    const attachedIds = attachedContextIds(question);
    const attached = paper.contexts.filter((c) => attachedIds.has(c.id));
    const available = paper.contexts.filter((c) => !attachedIds.has(c.id));
    const usageCounts = useMemo(() => countContextUsage(paper), [paper]);

    const [pendingAttachId, setPendingAttachId] = useState<string | null>(null);
    const [pendingDetachId, setPendingDetachId] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [createType, setCreateType] = useState<ContextType>('passage');
    const [createTitle, setCreateTitle] = useState('');
    const [createContent, setCreateContent] = useState('');
    const [createAssetId, setCreateAssetId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [diagramOpen, setDiagramOpen] = useState(false);

    const paperContextIdsBefore = useRef<Set<string>>(new Set());
    const pendingAutoLink = useRef(false);

    const createDirty =
        createOpen && (createTitle.trim() !== '' || createContent.trim() !== '' || createAssetId !== null);

    const resetCreate = useCallback(() => {
        setCreateOpen(false);
        setCreateType('passage');
        setCreateTitle('');
        setCreateContent('');
        setCreateAssetId(null);
    }, []);

    useDirtyRegistration('contexts:new', createDirty, resetCreate);

    useEffect(() => {
        if (!pendingAutoLink.current) return;
        const prevIds = paperContextIdsBefore.current;
        const fresh = paper.contexts.find((c) => !prevIds.has(c.id));
        if (!fresh) return;
        pendingAutoLink.current = false;
        router.post(
            QuestionContextController.link.url({ question: question.id }),
            { context_id: fresh.id },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['paper'],
                onFinish: () => {
                    setCreating(false);
                    resetCreate();
                },
            },
        );
    }, [paper.contexts, question.id, resetCreate]);

    function handleAttach(contextId: string) {
        setPendingAttachId(contextId);
        router.post(
            QuestionContextController.link.url({ question: question.id }),
            { context_id: contextId },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['paper'],
                onFinish: () => setPendingAttachId(null),
            },
        );
    }

    function handleDetach(contextId: string) {
        setPendingDetachId(contextId);
        router.delete(
            QuestionContextController.unlink.url({
                question: question.id,
                questionContext: contextId,
            }),
            {
                preserveScroll: true,
                preserveState: true,
                only: ['paper'],
                onFinish: () => setPendingDetachId(null),
            },
        );
    }

    function handleCreate() {
        setCreating(true);
        paperContextIdsBefore.current = new Set(paper.contexts.map((c) => c.id));
        pendingAutoLink.current = true;

        const payload: Record<string, unknown> = {
            context_type: createType,
            title: createTitle.trim() || null,
        };
        if (TEXT_TYPES.includes(createType)) {
            payload.content = createContent.trim() || null;
        }
        if (createType === 'diagram' && createAssetId) {
            payload.media_url = `/admin/assets/${createAssetId}/svg`;
        }

        router.post(
            QuestionContextController.store.url({ questionPaper: paper.id }),
            payload as Record<string, string | null>,
            {
                preserveScroll: true,
                preserveState: true,
                only: ['paper'],
                onError: () => {
                    pendingAutoLink.current = false;
                    setCreating(false);
                },
            },
        );
    }

    const createDisabled =
        creating ||
        (createType === 'diagram' && !createAssetId) ||
        (TEXT_TYPES.includes(createType) && createContent.trim() === '');

    return (
        <div className="space-y-0 px-[18px] py-4">
            <p className="mb-3.5 text-[12.5px] leading-[1.5] text-[var(--fg-muted)]">
                Contexts are shared passages, diagrams, or data tables that multiple questions can
                reference. Defined at the paper level — attach one here.
            </p>

            <Section title="Attached" count={attached.length} isFirst>
                {attached.length === 0 ? (
                    <EmptyHint text="No contexts attached." />
                ) : (
                    <ul className="space-y-1.5">
                        {attached.map((ctx) => (
                            <ContextLinkCard
                                key={ctx.id}
                                ctx={ctx}
                                subLabel={TYPE_META[ctx.context_type].label}
                                action={
                                    <HoverRemoveButton
                                        label={pendingDetachId === ctx.id ? 'Detaching…' : 'Detach'}
                                        onClick={() => handleDetach(ctx.id)}
                                        disabled={pendingDetachId === ctx.id}
                                    />
                                }
                            />
                        ))}
                    </ul>
                )}
            </Section>

            <Section title="Available in this paper" count={available.length}>
                {available.length === 0 ? (
                    <EmptyHint
                        text={
                            paper.contexts.length === 0
                                ? 'No paper-level contexts yet. Create one below.'
                                : 'All paper contexts are already attached to this question.'
                        }
                    />
                ) : (
                    <ul className="space-y-1.5">
                        {available.map((ctx) => {
                            const uses = usageCounts.get(ctx.id) ?? 0;
                            const subLabel =
                                uses === 0
                                    ? `${TYPE_META[ctx.context_type].label} · unused`
                                    : `${TYPE_META[ctx.context_type].label} · used by ${uses} ${uses === 1 ? 'question' : 'questions'}`;
                            return (
                                <ContextLinkCard
                                    key={ctx.id}
                                    ctx={ctx}
                                    subLabel={subLabel}
                                    action={
                                        <AttachButton
                                            label={pendingAttachId === ctx.id ? 'Attaching…' : 'Attach'}
                                            onClick={() => handleAttach(ctx.id)}
                                            disabled={pendingAttachId === ctx.id}
                                        />
                                    }
                                />
                            );
                        })}
                    </ul>
                )}
            </Section>

            <div className="mt-3.5 border-t border-dashed border-[var(--border)] pt-3">
                {!createOpen ? (
                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="flex w-full items-center gap-1.5 rounded-[7px] border border-dashed border-[var(--border)] bg-transparent px-3 py-2.5 text-left text-[12.5px] text-[var(--fg-subtle)] transition-colors hover:border-[var(--primary-line)] hover:bg-[var(--primary-soft)] hover:text-foreground"
                    >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        Create new context
                    </button>
                ) : (
                    <div className="rounded-[7px] border border-[var(--border)] bg-[var(--bg-raised)]/40 p-3">
                        <div className="mb-2.5 flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-subtle)]">
                                New context
                            </span>
                            <button
                                type="button"
                                onClick={resetCreate}
                                disabled={creating}
                                className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--fg-subtle)] transition-colors hover:bg-[var(--ember-soft)] hover:text-[var(--ember)] disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            <Select value={createType} onValueChange={(v) => setCreateType(v as ContextType)}>
                                <SelectTrigger className="h-8 text-[12px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-[12px]">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder="Title (optional)"
                                value={createTitle}
                                onChange={(e) => setCreateTitle(e.target.value)}
                                className="h-8 text-[12px]"
                            />

                            {TEXT_TYPES.includes(createType) && (
                                <Textarea
                                    placeholder="Content…"
                                    value={createContent}
                                    onChange={(e) => setCreateContent(e.target.value)}
                                    rows={5}
                                    className="text-[12.5px] leading-[1.55]"
                                    style={{ fontFamily: 'var(--font-content)' }}
                                />
                            )}

                            {createType === 'diagram' && (
                                <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--bg)] p-3 text-center">
                                    {createAssetId ? (
                                        <div className="flex items-center justify-center gap-2 text-[12px]">
                                            <Check className="size-3.5 text-[color:var(--success)]" />
                                            <span className="text-muted-foreground">Diagram ready</span>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setDiagramOpen(true)}
                                            >
                                                <PenSquare className="size-3.5" />
                                                Edit
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setDiagramOpen(true)}
                                        >
                                            <PenSquare className="size-3.5" />
                                            Draw diagram
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={resetCreate}
                                    disabled={creating}
                                    className="rounded-md border border-[var(--border)] bg-transparent px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-[var(--bg-raised)] hover:text-foreground disabled:opacity-50"
                                >
                                    Discard
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={createDisabled}
                                    className={cn(
                                        'rounded-md bg-primary px-3 py-1 text-[11.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50',
                                    )}
                                >
                                    {creating ? 'Creating & linking…' : 'Create & Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <DiagramEditModal
                open={diagramOpen}
                onOpenChange={setDiagramOpen}
                owner={{ kind: 'question_paper', id: paper.id }}
                assetId={createAssetId}
                kind="free_form"
                caption={createTitle}
                altText={createTitle}
                onSaved={(assetId) => setCreateAssetId(assetId)}
            />
        </div>
    );
}

interface SectionProps {
    title: string;
    count: number;
    isFirst?: boolean;
    children: ReactNode;
}

function Section({ title, count, isFirst = false, children }: SectionProps) {
    return (
        <section
            className={cn(
                'pt-3',
                !isFirst && 'mt-3.5 border-t border-dashed border-[var(--border)]',
                isFirst && 'pt-0',
            )}
        >
            <header className="mb-2 flex items-center justify-between">
                <h4 className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--fg-subtle)]">
                    {title}
                </h4>
                <span className="font-mono text-[10px] text-[var(--fg-subtle)]">{count}</span>
            </header>
            {children}
        </section>
    );
}

function EmptyHint({ text }: { text: string }) {
    return <div className="py-2 text-[12px] italic text-[var(--fg-subtle)]">{text}</div>;
}

interface ContextLinkCardProps {
    ctx: QuestionContextData;
    subLabel: string;
    action: ReactNode;
}

function ContextLinkCard({ ctx, subLabel, action }: ContextLinkCardProps) {
    const Icon = TYPE_META[ctx.context_type].icon;
    return (
        <li className="group flex items-center gap-2.5 rounded-[7px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-raised)]">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[var(--honey-soft)] text-[var(--honey)]">
                <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-foreground">
                    {ctx.title ?? 'Untitled'}
                </div>
                <div className="mt-0.5 font-mono text-[10px] tracking-[0.04em] text-[var(--fg-subtle)]">
                    {subLabel}
                </div>
            </div>
            {action}
        </li>
    );
}

interface ActionButtonProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

function HoverRemoveButton({ label, onClick, disabled }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[10.5px] font-medium text-[var(--fg-subtle)] opacity-0 transition-all hover:bg-[var(--ember-soft)] hover:text-[var(--ember)] focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-50 disabled:!opacity-50"
            aria-label={label}
        >
            <X className="h-3 w-3" aria-hidden />
            <span className="sr-only">{label}</span>
        </button>
    );
}

function AttachButton({ label, onClick, disabled }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="inline-flex h-6 items-center gap-1 rounded-md border border-[var(--primary-line)] bg-[var(--primary-soft)] px-2 text-[10.5px] font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-primary-foreground disabled:opacity-50"
        >
            {label}
        </button>
    );
}
