import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ContextCard, { type ContextCardData } from '@/components/skoolpad/questions/context-card';
import QuestionContextController from '@/actions/App/Http/Controllers/Admin/QuestionContextController';
import type { QuestionNode, QuestionPaper, QuestionContextData, ContextType } from '@/types/questions';

const TEXT_TYPES: ContextType[] = ['passage', 'case_study', 'equation_set'];

const CONTEXT_TYPE_OPTIONS: { value: ContextType; label: string }[] = [
    { value: 'passage', label: 'Passage' },
    { value: 'diagram', label: 'Diagram' },
    { value: 'table', label: 'Table' },
    { value: 'case_study', label: 'Case Study' },
    { value: 'code_snippet', label: 'Code Snippet' },
    { value: 'map', label: 'Map' },
    { value: 'graph', label: 'Graph' },
    { value: 'word_bank', label: 'Word Bank' },
    { value: 'equation_set', label: 'Equation Set' },
];

function getLinkedContextIds(question: QuestionNode): Set<string> {
    if (question.context_links?.length) {
        return new Set(question.context_links.map((cl) => cl.context_id));
    }
    if (question.question_context_links?.length) {
        return new Set(question.question_context_links.map((cl) => cl.question_context_id));
    }
    return new Set();
}

function toCardData(ctx: QuestionContextData): ContextCardData {
    return {
        id: ctx.id,
        contextType: ctx.context_type,
        title: ctx.title,
        content: ctx.content,
        mediaUrl: ctx.media_url,
        tableData: ctx.table_data,
        wordBank: ctx.word_bank,
    };
}

interface ContextsTabProps {
    paper: QuestionPaper;
    question: QuestionNode;
}

export function ContextsTab({ paper, question }: ContextsTabProps) {
    const linkedIds = getLinkedContextIds(question);
    const linkedContexts = paper.contexts.filter((c) => linkedIds.has(c.id));
    const unlinkedContexts = paper.contexts.filter((c) => !linkedIds.has(c.id));

    const [linkContextId, setLinkContextId] = useState('');
    const [createType, setCreateType] = useState<ContextType>('passage');
    const [createTitle, setCreateTitle] = useState('');
    const [createContent, setCreateContent] = useState('');
    const [linking, setLinking] = useState(false);
    const [creating, setCreating] = useState(false);

    const paperContextIdsBefore = useRef<Set<string>>(new Set());
    const pendingAutoLink = useRef(false);

    useEffect(() => {
        setLinkContextId('');
        setCreateType('passage');
        setCreateTitle('');
        setCreateContent('');
        pendingAutoLink.current = false;
    }, [question.id]);

    useEffect(() => {
        if (!pendingAutoLink.current) return;
        const prevIds = paperContextIdsBefore.current;
        const newContext = paper.contexts.find((c) => !prevIds.has(c.id));
        if (!newContext) return;

        pendingAutoLink.current = false;
        router.post(
            QuestionContextController.link.url({ question: question.id }),
            { context_id: newContext.id },
            {
                preserveScroll: true,
                only: ['paper'],
                onSuccess: () => setCreating(false),
                onError: () => setCreating(false),
            },
        );
    }, [paper.contexts, question.id]);

    function handleUnlink(contextId: string) {
        router.delete(
            QuestionContextController.unlink.url({ question: question.id, questionContext: contextId }),
            { preserveScroll: true, only: ['paper'] },
        );
    }

    function handleLinkExisting() {
        if (!linkContextId) return;
        setLinking(true);
        router.post(
            QuestionContextController.link.url({ question: question.id }),
            { context_id: linkContextId },
            {
                preserveScroll: true,
                only: ['paper'],
                onSuccess: () => { setLinking(false); setLinkContextId(''); },
                onError: () => setLinking(false),
            },
        );
    }

    function handleCreate() {
        paperContextIdsBefore.current = new Set(paper.contexts.map((c) => c.id));
        pendingAutoLink.current = true;
        setCreating(true);

        const payload: Record<string, unknown> = {
            context_type: createType,
            title: createTitle || null,
        };
        if (TEXT_TYPES.includes(createType)) {
            payload.content = createContent || null;
        }

        router.post(
            QuestionContextController.store.url({ questionPaper: paper.id }),
            payload as Record<string, string | null>,
            {
                preserveScroll: true,
                only: ['paper'],
                onError: () => {
                    pendingAutoLink.current = false;
                    setCreating(false);
                },
            },
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                        Linked contexts
                        {linkedContexts.length > 0 && (
                            <span className="ml-2 rounded-full bg-[var(--bg-raised)] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                {linkedContexts.length}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {linkedContexts.length === 0 ? (
                        <p className="rounded-md border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">
                            No contexts linked to this question yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {linkedContexts.map((ctx) => (
                                <div key={ctx.id} className="relative">
                                    <ContextCard context={toCardData(ctx)} />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-2 top-2 h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                                        onClick={() => handleUnlink(ctx.id)}
                                    >
                                        Unlink
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {unlinkedContexts.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Link existing context</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Select value={linkContextId} onValueChange={setLinkContextId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select a context…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {unlinkedContexts.map((ctx) => (
                                        <SelectItem key={ctx.id} value={ctx.id}>
                                            <span className="mr-2 text-[10px] uppercase text-muted-foreground">
                                                {ctx.context_type.replace('_', ' ')}
                                            </span>
                                            {ctx.title ?? 'Untitled'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="sm" disabled={!linkContextId || linking} onClick={handleLinkExisting}>
                                {linking ? 'Linking…' : 'Link'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Create new context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Select value={createType} onValueChange={(v) => setCreateType(v as ContextType)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CONTEXT_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        placeholder="Title (optional)"
                        value={createTitle}
                        onChange={(e) => setCreateTitle(e.target.value)}
                    />

                    {TEXT_TYPES.includes(createType) && (
                        <Textarea
                            placeholder="Content…"
                            value={createContent}
                            onChange={(e) => setCreateContent(e.target.value)}
                            rows={4}
                        />
                    )}

                    <Button className="w-full" onClick={handleCreate} disabled={creating}>
                        {creating ? 'Creating & linking…' : 'Create & Link'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
