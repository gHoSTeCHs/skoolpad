import { useForm } from '@inertiajs/react';
import { Sparkles, Upload, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import CanvasStencilController from '@/actions/App/Http/Controllers/Admin/CanvasStencilController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import type { StencilRow } from './stencils-filter-store';

export interface CategoryOption {
    value: string;
    label: string;
}

export interface LicenseOption {
    value: string;
    label: string;
    requires_attribution: boolean;
}

interface StencilFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stencil: StencilRow | null;
    categories: CategoryOption[];
    licenses: LicenseOption[];
    /** Inertia routes auto-refresh on success; this lets callers chain a side-effect. */
    onSuccess?: () => void;
}

interface FormShape {
    name: string;
    slug: string;
    category: string;
    tags: string;
    svg_content: string;
    license: string;
    source_attribution: string;
    source_url: string;
    sort_order: number;
    is_active: boolean;
}

export function StencilFormDialog({
    open,
    onOpenChange,
    stencil,
    categories,
    licenses,
    onSuccess,
}: StencilFormDialogProps) {
    'use no memo';
    const isEdit = !!stencil;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initial = useMemo<FormShape>(
        () => ({
            name: stencil?.name ?? '',
            slug: stencil?.slug ?? '',
            category: stencil?.category ?? categories[0]?.value ?? 'general',
            tags: (stencil?.tags ?? []).join(', '),
            svg_content: '',
            license: stencil?.license ?? 'skoolpad',
            source_attribution: stencil?.attribution ?? '',
            source_url: stencil?.source_url ?? '',
            sort_order: stencil?.sort_order ?? 0,
            is_active: stencil?.is_active ?? true,
        }),
        [stencil, categories],
    );

    const form = useForm<FormShape>(initial);
    const [svgPreview, setSvgPreview] = useState<string | null>(stencil?.svg_url ?? null);
    const [pasteError, setPasteError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        form.setData(initial);
        setSvgPreview(stencil?.svg_url ?? null);
        setPasteError(null);
        // We intentionally exclude `form` from deps — Inertia's setData is stable across renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initial.name, initial.slug, stencil?.id]);

    const activeLicense = licenses.find((l) => l.value === form.data.license);
    const attributionRequired = !!activeLicense?.requires_attribution;

    function handleSvgContent(content: string) {
        const trimmed = content.trim();
        if (!trimmed) {
            setSvgPreview(stencil?.svg_url ?? null);
            form.setData('svg_content', '');
            setPasteError(null);
            return;
        }
        if (!trimmed.startsWith('<svg') && !trimmed.startsWith('<?xml')) {
            setPasteError('Content must be a valid SVG document.');
            return;
        }
        setPasteError(null);
        form.setData('svg_content', trimmed);
        setSvgPreview(`data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`);
    }

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type && !file.type.includes('svg')) {
            setPasteError('Only SVG files are accepted.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => handleSvgContent(String(reader.result ?? ''));
        reader.readAsText(file);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        // Tags: comma-split, trim, drop empties.
        const tagsArray = form.data.tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0);

        // Inertia's transform mutates the form in place and returns void.
        form.transform((data) => ({
            ...data,
            tags: tagsArray as unknown as string,
        }));

        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess?.();
                onOpenChange(false);
            },
        };

        if (isEdit && stencil) {
            // Edit doesn't change svg_content (the file on disk stays); only metadata.
            form.put(
                CanvasStencilController.update.url({ canvasStencil: stencil.id }),
                opts,
            );
        } else {
            form.post(CanvasStencilController.store.url(), opts);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[96vw] sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-display text-[20px] tracking-tight">
                        {isEdit ? 'Edit stencil' : 'Upload stencil'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update the metadata for this stencil. The SVG file on disk stays the same.'
                            : 'Paste the SVG markup or upload a file. Use currentColor for strokes so the stencil adapts to canvas theming.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
                    {/* ─── Left: SVG preview + paste/upload ─── */}
                    <div className="flex flex-col gap-3">
                        <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            Specimen
                        </Label>
                        <div
                            className={cn(
                                'flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-card/40',
                                'bg-[radial-gradient(rgba(31,26,18,0.025)_1px,transparent_1px)] [background-size:16px_16px]',
                            )}
                            data-testid="stencil-form-preview"
                        >
                            {svgPreview ? (
                                <img
                                    src={svgPreview}
                                    alt="SVG preview"
                                    className="size-3/5 text-foreground"
                                />
                            ) : (
                                <div className="px-4 text-center text-[11px] italic text-muted-foreground">
                                    Paste SVG markup or upload a file to preview.
                                </div>
                            )}
                        </div>

                        {!isEdit && (
                            <>
                                <Textarea
                                    placeholder={'<svg xmlns="http://www.w3.org/2000/svg" …'}
                                    value={form.data.svg_content}
                                    onChange={(e) => handleSvgContent(e.target.value)}
                                    rows={6}
                                    className="resize-y font-mono text-[11px]"
                                    data-testid="stencil-form-svg"
                                />
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="size-3.5" />
                                        Upload .svg
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/svg+xml,.svg"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    {form.data.svg_content && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSvgContent('')}
                                            className="text-muted-foreground"
                                        >
                                            <X className="size-3.5" /> Clear
                                        </Button>
                                    )}
                                </div>
                                {pasteError && (
                                    <p className="text-xs text-destructive" data-testid="stencil-form-svg-error">
                                        {pasteError}
                                    </p>
                                )}
                                {form.errors.svg_content && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.svg_content}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* ─── Right: Metadata ─── */}
                    <div className="flex flex-col gap-3.5">
                        <div>
                            <Label htmlFor="stencil-name">Name</Label>
                            <Input
                                id="stencil-name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. Convex Lens"
                                data-testid="stencil-form-name"
                            />
                            {form.errors.name && (
                                <p className="mt-1 text-xs text-destructive">{form.errors.name}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="stencil-category">Category</Label>
                                <Select
                                    value={form.data.category}
                                    onValueChange={(v) => form.setData('category', v)}
                                >
                                    <SelectTrigger id="stencil-category">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>
                                                {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.category && (
                                    <p className="mt-1 text-xs text-destructive">{form.errors.category}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="stencil-sort">Sort order</Label>
                                <Input
                                    id="stencil-sort"
                                    type="number"
                                    min={0}
                                    value={form.data.sort_order}
                                    onChange={(e) => form.setData('sort_order', Number(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="stencil-tags">
                                Tags
                                <span className="ml-2 font-mono text-[10px] text-muted-foreground">comma-separated</span>
                            </Label>
                            <Input
                                id="stencil-tags"
                                value={form.data.tags}
                                onChange={(e) => form.setData('tags', e.target.value)}
                                placeholder="resistor, ohm, circuit"
                            />
                        </div>

                        <div>
                            <Label htmlFor="stencil-license">License</Label>
                            <Select
                                value={form.data.license}
                                onValueChange={(v) => form.setData('license', v)}
                            >
                                <SelectTrigger id="stencil-license">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {licenses.map((l) => (
                                        <SelectItem key={l.value} value={l.value}>
                                            <span className="flex items-center gap-2">
                                                <span>{l.label}</span>
                                                {l.requires_attribution && (
                                                    <Sparkles className="size-3 text-[var(--warning)]" />
                                                )}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.license && (
                                <p className="mt-1 text-xs text-destructive">{form.errors.license}</p>
                            )}
                            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                                CC-BY-SA is rejected by Skoolpad SVG sourcing policy.
                            </p>
                        </div>

                        {attributionRequired && (
                            <>
                                <div>
                                    <Label htmlFor="stencil-attribution">
                                        Attribution
                                        <span className="ml-2 font-mono text-[10px] text-[var(--warning)]">required</span>
                                    </Label>
                                    <Input
                                        id="stencil-attribution"
                                        value={form.data.source_attribution}
                                        onChange={(e) => form.setData('source_attribution', e.target.value)}
                                        placeholder="e.g. Servier Medical Art"
                                        data-testid="stencil-form-attribution"
                                    />
                                    {form.errors.source_attribution && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.source_attribution}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="stencil-source-url">Source URL</Label>
                                    <Input
                                        id="stencil-source-url"
                                        type="url"
                                        value={form.data.source_url}
                                        onChange={(e) => form.setData('source_url', e.target.value)}
                                        placeholder="https://…"
                                    />
                                </div>
                            </>
                        )}

                        <label className="flex items-center gap-2 text-sm text-foreground">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                                className="size-4 rounded border-border"
                            />
                            Active (visible to authors)
                        </label>
                    </div>

                    <DialogFooter className="col-span-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            data-testid="stencil-form-submit"
                        >
                            {form.processing ? 'Saving…' : isEdit ? 'Save changes' : 'Upload stencil'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
