<?php

use App\Services\ContentBlockGenerationService;

it('first-seen-wins: existing term from different block is not overwritten', function () {
    $glossary = ['terms' => [['term' => 'speed', 'definition' => 'A', 'first_block_id' => 'b1']], 'symbols' => []];
    $newTerms = [['term' => 'speed', 'definition' => 'B']];

    $out = ContentBlockGenerationService::mergeGlossary($glossary, $newTerms, [], 'b2');

    expect($out['terms'])->toHaveCount(1)
        ->and($out['terms'][0]['definition'])->toBe('A')
        ->and($out['terms'][0]['first_block_id'])->toBe('b1');
});

it('adds new terms with first_block_id set to the generating block', function () {
    $glossary = ['terms' => [], 'symbols' => []];
    $out = ContentBlockGenerationService::mergeGlossary(
        $glossary,
        [['term' => 'speed', 'definition' => 'rate']],
        [['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'm/s']],
        'b1',
    );

    expect($out['terms'][0])->toMatchArray(['term' => 'speed', 'definition' => 'rate', 'first_block_id' => 'b1'])
        ->and($out['symbols'][0])->toMatchArray(['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'm/s', 'first_block_id' => 'b1']);
});

it('regeneration: updates definition for terms this block owns', function () {
    $glossary = ['terms' => [['term' => 'speed', 'definition' => 'old', 'first_block_id' => 'b1']], 'symbols' => []];
    $out = ContentBlockGenerationService::mergeGlossary(
        $glossary,
        [['term' => 'speed', 'definition' => 'new']],
        [],
        'b1',
    );

    expect($out['terms'][0]['definition'])->toBe('new')
        ->and($out['terms'][0]['first_block_id'])->toBe('b1');
});

it('regeneration: removes terms this block used to own but no longer introduces', function () {
    $glossary = ['terms' => [
        ['term' => 'speed', 'definition' => 'x', 'first_block_id' => 'b1'],
        ['term' => 'force', 'definition' => 'y', 'first_block_id' => 'b1'],
        ['term' => 'mass', 'definition' => 'z', 'first_block_id' => 'b2'],
    ], 'symbols' => []];

    $out = ContentBlockGenerationService::mergeGlossary(
        $glossary,
        [['term' => 'speed', 'definition' => 'x2']],
        [],
        'b1',
    );

    expect(collect($out['terms'])->pluck('term')->all())->toEqualCanonicalizing(['speed', 'mass']);
});

it('dedupe by lowercased term', function () {
    $glossary = ['terms' => [['term' => 'Speed', 'definition' => 'first', 'first_block_id' => 'b1']], 'symbols' => []];
    $out = ContentBlockGenerationService::mergeGlossary(
        $glossary,
        [['term' => 'speed', 'definition' => 'second']],
        [],
        'b2',
    );

    expect($out['terms'])->toHaveCount(1)
        ->and($out['terms'][0]['definition'])->toBe('first');
});
