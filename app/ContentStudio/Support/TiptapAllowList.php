<?php

namespace App\ContentStudio\Support;

final class TiptapAllowList
{
    public const ALLOWED_BLOCK_NODES = [
        'doc', 'paragraph', 'heading', 'bulletList', 'orderedList', 'listItem',
        'blockquote', 'codeBlock', 'horizontalRule', 'blockMath',
        'table', 'tableRow', 'tableHeader', 'tableCell',
    ];

    public const ALLOWED_INLINE_NODES = [
        'text', 'inlineMath', 'hardBreak',
    ];

    public const ALLOWED_MARKS = [
        'bold', 'italic', 'underline', 'strike', 'code',
    ];

    /**
     * Walk a Tiptap JSON doc and return a list of violations.
     * Each violation is ['type' => string, 'path' => string, 'kind' => 'node'|'mark'|'structure'].
     *
     * @return array<int, array{type: string, path: string, kind: string}>
     */
    public static function findViolations(array $doc, string $path = '$'): array
    {
        $violations = [];

        if (($doc['type'] ?? null) !== 'doc') {
            return [['type' => (string) ($doc['type'] ?? 'missing'), 'path' => $path, 'kind' => 'structure']];
        }

        self::walkArray($doc['content'] ?? [], "{$path}.content", $violations);

        return $violations;
    }

    private static function walkArray(array $nodes, string $path, array &$violations): void
    {
        foreach ($nodes as $i => $node) {
            self::walkNode($node, str_replace('$.', '', "{$path}[{$i}]"), $violations);
        }
    }

    private static function walkNode(mixed $node, string $path, array &$violations): void
    {
        if (! is_array($node) || ! isset($node['type'])) {
            $violations[] = ['type' => 'malformed', 'path' => $path, 'kind' => 'structure'];

            return;
        }

        $type = $node['type'];
        $allowed = in_array($type, self::ALLOWED_BLOCK_NODES, true)
            || in_array($type, self::ALLOWED_INLINE_NODES, true);

        if (! $allowed) {
            $violations[] = ['type' => $type, 'path' => $path, 'kind' => 'node'];
        }

        foreach ($node['marks'] ?? [] as $mi => $mark) {
            if (! in_array($mark['type'] ?? '', self::ALLOWED_MARKS, true)) {
                $violations[] = ['type' => (string) ($mark['type'] ?? 'missing'), 'path' => "{$path}.marks[{$mi}]", 'kind' => 'mark'];
            }
        }

        if (isset($node['content']) && is_array($node['content'])) {
            self::walkArray($node['content'], "{$path}.content", $violations);
        }
    }
}
