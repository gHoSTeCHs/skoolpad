import { useState, useEffect, type KeyboardEvent } from 'react';
import { router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import QuestionContextController from '@/actions/App/Http/Controllers/Admin/QuestionContextController';
import type { QuestionPaper, QuestionContextData, ContextType, EnumOption } from '@/types/questions';

interface ContextEditorProps {
    paper: QuestionPaper;
    context: QuestionContextData;
    contextTypeOptions: EnumOption[];
}

const TEXT_CONTENT_TYPES: ContextType[] = ['passage', 'case_study', 'equation_set'];
const MEDIA_TYPES: ContextType[] = ['diagram', 'map', 'graph'];
const CODE_TYPE: ContextType = 'code_snippet';
const TABLE_TYPE: ContextType = 'table';
const WORD_BANK_TYPE: ContextType = 'word_bank';

export default function ContextEditor({ paper, context, contextTypeOptions }: ContextEditorProps) {
    const [contextType, setContextType] = useState<ContextType>(context.context_type);
    const [title, setTitle] = useState(context.title ?? '');
    const [content, setContent] = useState(context.content ?? '');
    const [mediaUrl, setMediaUrl] = useState(context.media_url ?? '');
    const [language, setLanguage] = useState(context.language ?? '');
    const [tableData, setTableData] = useState(context.table_data ?? { headers: ['Column 1'], rows: [['']] });
    const [wordBank, setWordBank] = useState<string[]>(context.word_bank ?? []);
    const [wordInput, setWordInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setContextType(context.context_type);
        setTitle(context.title ?? '');
        setContent(context.content ?? '');
        setMediaUrl(context.media_url ?? '');
        setLanguage(context.language ?? '');
        setTableData(context.table_data ?? { headers: ['Column 1'], rows: [['']] });
        setWordBank(context.word_bank ?? []);
        setWordInput('');
        setErrors({});
    }, [context.id]);

    function buildPayload(): Record<string, unknown> {
        const payload: Record<string, unknown> = {
            context_type: contextType,
            title: title || null,
            content: null,
            media_url: null,
            table_data: null,
            word_bank: null,
            language: null,
        };

        if (TEXT_CONTENT_TYPES.includes(contextType)) {
            payload.content = content || null;
        }

        if (MEDIA_TYPES.includes(contextType)) {
            payload.media_url = mediaUrl || null;
            payload.content = content || null;
        }

        if (contextType === CODE_TYPE) {
            payload.content = content || null;
            payload.language = language || null;
        }

        if (contextType === TABLE_TYPE) {
            payload.table_data = tableData.headers.length > 0 ? tableData : null;
        }

        if (contextType === WORD_BANK_TYPE) {
            payload.word_bank = wordBank.length > 0 ? wordBank : null;
        }

        return payload;
    }

    function handleSave() {
        setSaving(true);
        router.put(
            QuestionContextController.update.url({
                questionPaper: paper.id,
                questionContext: context.id,
            }),
            buildPayload() as unknown as Record<string, string | null>,
            {
                preserveScroll: true,
                only: ['paper'],
                onSuccess: () => {
                    setSaving(false);
                    setErrors({});
                },
                onError: (errs) => {
                    setSaving(false);
                    setErrors(errs as Record<string, string>);
                },
            }
        );
    }

    function handleDelete() {
        if (!confirm('Delete this context? It will be unlinked from all questions.')) {
            return;
        }
        router.delete(
            QuestionContextController.destroy.url({
                questionPaper: paper.id,
                questionContext: context.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => router.reload({ only: ['paper'] }),
            }
        );
    }

    function addWord() {
        const trimmed = wordInput.trim();
        if (trimmed && !wordBank.includes(trimmed)) {
            setWordBank([...wordBank, trimmed]);
            setWordInput('');
        }
    }

    function removeWord(index: number) {
        setWordBank(wordBank.filter((_, i) => i !== index));
    }

    function handleWordKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addWord();
        }
    }

    function addTableColumn() {
        setTableData({
            headers: [...tableData.headers, `Column ${tableData.headers.length + 1}`],
            rows: tableData.rows.map((row) => [...row, '']),
        });
    }

    function removeTableColumn(colIndex: number) {
        if (tableData.headers.length <= 1) return;
        setTableData({
            headers: tableData.headers.filter((_, i) => i !== colIndex),
            rows: tableData.rows.map((row) => row.filter((_, i) => i !== colIndex)),
        });
    }

    function addTableRow() {
        setTableData({
            ...tableData,
            rows: [...tableData.rows, tableData.headers.map(() => '')],
        });
    }

    function removeTableRow(rowIndex: number) {
        if (tableData.rows.length <= 1) return;
        setTableData({
            ...tableData,
            rows: tableData.rows.filter((_, i) => i !== rowIndex),
        });
    }

    function updateTableHeader(colIndex: number, value: string) {
        const headers = [...tableData.headers];
        headers[colIndex] = value;
        setTableData({ ...tableData, headers });
    }

    function updateTableCell(rowIndex: number, colIndex: number, value: string) {
        const rows = tableData.rows.map((row) => [...row]);
        rows[rowIndex][colIndex] = value;
        setTableData({ ...tableData, rows });
    }

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Edit Context</h3>
                <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={handleDelete}>
                    Delete
                </Button>
            </div>

            <FormField label="Context Type" name="context_type" error={errors.context_type} required>
                <Select value={contextType} onValueChange={(v) => setContextType(v as ContextType)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select context type" />
                    </SelectTrigger>
                    <SelectContent>
                        {contextTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label="Title" name="title" error={errors.title}>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Context title..."
                />
            </FormField>

            {(TEXT_CONTENT_TYPES.includes(contextType) || MEDIA_TYPES.includes(contextType) || contextType === CODE_TYPE) && (
                <FormField label="Content" name="content" error={errors.content}>
                    <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={contextType === CODE_TYPE ? 8 : 5}
                        placeholder={
                            contextType === CODE_TYPE
                                ? 'Paste code snippet here...'
                                : MEDIA_TYPES.includes(contextType)
                                    ? 'Description or caption...'
                                    : 'Enter content...'
                        }
                        className={contextType === CODE_TYPE ? 'font-mono text-xs' : undefined}
                    />
                </FormField>
            )}

            {contextType === CODE_TYPE && (
                <FormField label="Language" name="language" error={errors.language}>
                    <Input
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        placeholder="e.g. python, javascript, c++"
                    />
                </FormField>
            )}

            {MEDIA_TYPES.includes(contextType) && (
                <FormField label="Media URL" name="media_url" error={errors.media_url}>
                    <Input
                        id="media_url"
                        type="url"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://..."
                    />
                </FormField>
            )}

            {contextType === TABLE_TYPE && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Table Data</span>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={addTableColumn} className="text-xs">
                                + Col
                            </Button>
                            <Button variant="outline" size="sm" onClick={addTableRow} className="text-xs">
                                + Row
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-md border border-border">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-muted/50">
                                    {tableData.headers.map((header, ci) => (
                                        <th key={ci} className="border-b border-r border-border p-1 last:border-r-0">
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    value={header}
                                                    onChange={(e) => updateTableHeader(ci, e.target.value)}
                                                    className="h-6 border-0 bg-transparent px-1 text-xs font-bold shadow-none focus-visible:ring-0"
                                                />
                                                {tableData.headers.length > 1 && (
                                                    <button
                                                        onClick={() => removeTableColumn(ci)}
                                                        className="shrink-0 border-none bg-transparent p-0 text-[10px] text-muted-foreground hover:text-destructive"
                                                    >
                                                        x
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="w-6 border-b border-border" />
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.rows.map((row, ri) => (
                                    <tr key={ri} className="border-b border-border/30 last:border-b-0">
                                        {row.map((cell, ci) => (
                                            <td key={ci} className="border-r border-border/30 p-1 last:border-r-0">
                                                <Input
                                                    value={cell}
                                                    onChange={(e) => updateTableCell(ri, ci, e.target.value)}
                                                    className="h-6 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
                                                />
                                            </td>
                                        ))}
                                        <td className="w-6 p-1 text-center">
                                            {tableData.rows.length > 1 && (
                                                <button
                                                    onClick={() => removeTableRow(ri)}
                                                    className="border-none bg-transparent p-0 text-[10px] text-muted-foreground hover:text-destructive"
                                                >
                                                    x
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {contextType === WORD_BANK_TYPE && (
                <div className="space-y-3">
                    <FormField label="Words" name="word_bank" error={errors.word_bank}>
                        <div className="flex gap-2">
                            <Input
                                value={wordInput}
                                onChange={(e) => setWordInput(e.target.value)}
                                onKeyDown={handleWordKeyDown}
                                placeholder="Type a word and press Enter"
                                className="flex-1"
                            />
                            <Button variant="outline" size="sm" onClick={addWord} disabled={!wordInput.trim()}>
                                Add
                            </Button>
                        </div>
                    </FormField>

                    {wordBank.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {wordBank.map((word, i) => (
                                <span
                                    key={i}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs transition-colors hover:border-destructive hover:bg-destructive/10"
                                    onClick={() => removeWord(i)}
                                    title="Click to remove"
                                >
                                    {word}
                                    <span className="text-[10px] text-muted-foreground">x</span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Context'}
            </Button>
        </div>
    );
}
