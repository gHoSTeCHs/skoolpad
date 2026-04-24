<?php

use App\ContentStudio\Support\TiptapAllowList;

it('accepts a doc with allowed node types', function () {
    $doc = [
        'type' => 'doc',
        'content' => [
            ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'hi']]],
            ['type' => 'heading', 'attrs' => ['level' => 2], 'content' => [['type' => 'text', 'text' => 'h']]],
            ['type' => 'bulletList', 'content' => [
                ['type' => 'listItem', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'a']]]]],
            ]],
        ],
    ];

    expect(TiptapAllowList::findViolations($doc))->toBeEmpty();
});

it('rejects disallowed node types with path', function () {
    $doc = [
        'type' => 'doc',
        'content' => [
            ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'hi']]],
            ['type' => 'videoEmbed', 'attrs' => ['src' => 'http://x']],
        ],
    ];

    $violations = TiptapAllowList::findViolations($doc);

    expect($violations)->toHaveCount(1)
        ->and($violations[0])->toMatchArray(['type' => 'videoEmbed', 'path' => 'content[1]']);
});

it('rejects disallowed mark types on text nodes', function () {
    $doc = [
        'type' => 'doc',
        'content' => [
            ['type' => 'paragraph', 'content' => [
                ['type' => 'text', 'text' => 'bad', 'marks' => [['type' => 'rainbow']]],
            ]],
        ],
    ];

    $violations = TiptapAllowList::findViolations($doc);

    expect($violations)->toHaveCount(1)
        ->and($violations[0]['type'])->toBe('rainbow');
});

it('rejects doc with missing or wrong top-level type', function () {
    expect(TiptapAllowList::findViolations(['type' => 'paragraph', 'content' => []]))->toHaveCount(1);
    expect(TiptapAllowList::findViolations(['content' => []]))->toHaveCount(1);
});

it('accepts deeply nested allowed structures', function () {
    $doc = [
        'type' => 'doc',
        'content' => [
            ['type' => 'orderedList', 'content' => [
                ['type' => 'listItem', 'content' => [
                    ['type' => 'paragraph', 'content' => [
                        ['type' => 'text', 'text' => 'deep', 'marks' => [['type' => 'bold'], ['type' => 'italic']]],
                    ]],
                    ['type' => 'bulletList', 'content' => [
                        ['type' => 'listItem', 'content' => [
                            ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'deeper']]],
                        ]],
                    ]],
                ]],
            ]],
        ],
    ];

    expect(TiptapAllowList::findViolations($doc))->toBeEmpty();
});
