<?php

namespace App\ContentStudio\Support;

use App\Models\ContentBlockAsset;

/**
 * Track 2 CP12 — defence-in-depth for the diagram Tiptap node.
 *
 * Two concerns kept in one place because they share the doc-walk:
 *
 * 1. Cross-document asset scope. A diagram node inside content_block A must
 *    reference an asset owned by content_block A. Stops authors from accidentally
 *    re-using one block's diagram from another, and stops malicious payloads from
 *    quietly referencing assets from unrelated documents.
 *
 * 2. Alt-text on publish. Any diagram node whose asset has empty alt_text blocks
 *    the publish transition. Read-mode uses alt_text on the rendered <figure>;
 *    publishing without it ships an inaccessible artefact.
 *
 * Both checks no-op when the doc contains no diagram nodes.
 */
final class TiptapDiagramScope
{
    /**
     * Walk a Tiptap doc, return the asset IDs referenced by every diagram node.
     *
     * @return array<int, string>
     */
    public static function diagramAssetIds(array $doc): array
    {
        $ids = [];
        self::walkCollectIds($doc, $ids);

        return array_values(array_unique(array_filter($ids)));
    }

    /**
     * Validate every diagram node in $doc references an asset owned by the
     * expected scope ($ownerColumn = $ownerId).
     *
     * @return array<int, array{asset_id: string|null, reason: string}>
     */
    public static function findScopeViolations(array $doc, string $ownerColumn, string $ownerId): array
    {
        $allowedColumns = ['content_block_id', 'question_id', 'question_paper_id'];
        if (! in_array($ownerColumn, $allowedColumns, true)) {
            throw new \InvalidArgumentException("Unknown owner column: {$ownerColumn}");
        }

        $assetIds = self::diagramAssetIds($doc);
        if ($assetIds === []) {
            return [];
        }

        // Single round-trip lookup.
        $assets = ContentBlockAsset::query()
            ->whereIn('id', $assetIds)
            ->get(['id', 'content_block_id', 'question_id', 'question_paper_id'])
            ->keyBy('id');

        $violations = [];
        foreach ($assetIds as $assetId) {
            $asset = $assets->get($assetId);
            if (! $asset) {
                $violations[] = ['asset_id' => $assetId, 'reason' => 'asset does not exist'];

                continue;
            }
            if ((string) $asset->{$ownerColumn} !== (string) $ownerId) {
                $violations[] = [
                    'asset_id' => $assetId,
                    'reason' => "asset belongs to a different {$ownerColumn} (cross-document reference rejected)",
                ];
            }
        }

        return $violations;
    }

    /**
     * Return the IDs of any diagram-node assets whose alt_text is empty.
     * Used as a publish-time guard.
     *
     * @return array<int, string>
     */
    public static function findUnlabeledAssetIds(array $doc): array
    {
        $assetIds = self::diagramAssetIds($doc);
        if ($assetIds === []) {
            return [];
        }

        return ContentBlockAsset::query()
            ->whereIn('id', $assetIds)
            ->where(function ($q) {
                $q->whereNull('alt_text')->orWhere('alt_text', '');
            })
            ->pluck('id')
            ->all();
    }

    /**
     * @param  array<int, string>  $ids
     */
    private static function walkCollectIds(mixed $node, array &$ids): void
    {
        if (! is_array($node)) {
            return;
        }

        if (($node['type'] ?? null) === 'diagram') {
            $assetId = $node['attrs']['assetId'] ?? null;
            if (is_string($assetId) && $assetId !== '') {
                $ids[] = $assetId;
            }
        }

        if (isset($node['content']) && is_array($node['content'])) {
            foreach ($node['content'] as $child) {
                self::walkCollectIds($child, $ids);
            }
        }
    }
}
