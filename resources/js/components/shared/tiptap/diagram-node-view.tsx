import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { ImagePlus, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { DiagramEditModal } from './diagram-edit-modal';
import type { DiagramAttrs, DiagramStorage } from './diagram-node';

interface AssetFetchResponse {
    asset: { svg_payload: string | null; caption: string | null; alt_text: string | null };
}

export function DiagramNodeView({ node, selected, editor, updateAttributes }: NodeViewProps) {
    'use no memo';
    const attrs = node.attrs as DiagramAttrs;
    const isEditable = editor.isEditable;
    const hasAsset = !!attrs.assetId;
    const [modalOpen, setModalOpen] = useState(false);
    const [svg, setSvg] = useState<string | null>(null);
    const [svgLoading, setSvgLoading] = useState(false);

    const storage: DiagramStorage | undefined = editor.storage.diagram;
    const owner = storage?.owner ?? null;

    // Load the cached SVG when assetId is set. Re-runs on assetId change so editing
    // and re-saving refreshes the inline render without a page reload.
    useEffect(() => {
        if (!attrs.assetId) {
            setSvg(null);
            return;
        }
        let cancelled = false;
        setSvgLoading(true);
        (async () => {
            try {
                const res = await fetch(`/admin/assets/${attrs.assetId}`, {
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) throw new Error(`Asset fetch failed (${res.status})`);
                const body: AssetFetchResponse = await res.json();
                if (!cancelled) setSvg(body.asset.svg_payload || null);
            } catch {
                if (!cancelled) setSvg(null);
            } finally {
                if (!cancelled) setSvgLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [attrs.assetId]);

    return (
        <NodeViewWrapper className="my-3">
            {hasAsset && svg ? (
                <figure
                    data-selected={selected || undefined}
                    contentEditable={false}
                    className={cn(
                        'group relative rounded-lg border border-border bg-card transition-colors',
                        'data-[selected=true]:border-primary data-[selected=true]:ring-1 data-[selected=true]:ring-primary/40',
                    )}
                    data-diagram-rendered
                    data-asset-id={attrs.assetId}
                >
                    <div
                        className="overflow-hidden rounded-t-lg [&_svg]:mx-auto [&_svg]:block [&_svg]:max-h-[480px] [&_svg]:w-full"
                        // svg_payload is server-trusted (TiptapAllowList validates input;
                        // exportToSvg generates only standard SVG primitives).
                        dangerouslySetInnerHTML={{ __html: svg }}
                        aria-label={attrs.altText || 'Diagram'}
                        role="img"
                    />
                    {(attrs.caption || isEditable) && (
                        <figcaption className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-3 py-2 text-xs">
                            <span className="italic text-muted-foreground">{attrs.caption || ' '}</span>
                            {isEditable && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setModalOpen(true)}
                                    data-testid="diagram-edit"
                                >
                                    <Pencil className="size-3.5" />
                                    Edit
                                </Button>
                            )}
                        </figcaption>
                    )}
                </figure>
            ) : (
                <div
                    data-selected={selected || undefined}
                    contentEditable={false}
                    className={cn(
                        'rounded-lg border-2 border-dashed border-border bg-card/50 px-6 py-8 text-center transition-colors',
                        'data-[selected=true]:border-primary data-[selected=true]:bg-primary/5',
                        !isEditable && 'cursor-default',
                    )}
                    data-diagram-placeholder
                    data-asset-id={attrs.assetId ?? ''}
                >
                    <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <ImagePlus className="size-5" />
                    </div>
                    <p className="mt-3 font-medium text-foreground">
                        {svgLoading ? 'Loading diagram…' : hasAsset ? 'Diagram (no preview yet)' : 'Diagram placeholder'}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        kind: {attrs.kind}
                        {hasAsset && (
                            <>
                                {' · id: '}
                                {attrs.assetId!.slice(0, 8)}…
                            </>
                        )}
                    </p>
                    {attrs.caption && (
                        <p className="mt-2 text-xs italic text-muted-foreground">{attrs.caption}</p>
                    )}
                    {isEditable && (
                        <div className="mt-4 flex justify-center">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setModalOpen(true)}
                                data-testid="diagram-edit"
                                title={
                                    owner
                                        ? `Edit diagram (saves to ${owner.kind})`
                                        : 'No owner scope configured for this editor'
                                }
                            >
                                <Pencil className="size-3.5" />
                                {hasAsset ? 'Edit diagram' : 'Draw'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <DiagramEditModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                owner={owner}
                assetId={attrs.assetId}
                kind={attrs.kind}
                caption={attrs.caption}
                altText={attrs.altText}
                onSaved={(assetId) => updateAttributes({ assetId })}
            />
        </NodeViewWrapper>
    );
}
