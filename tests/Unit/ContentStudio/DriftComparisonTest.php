<?php

use App\Services\ContentBlockGenerationService;

it('returns null when contract unchanged', function () {
    $prior = ['key_terms' => [['term' => 'speed', 'definition' => 'rate']], 'symbols' => [], 'summary' => 'S'];
    $new = $prior;

    expect(ContentBlockGenerationService::compareContract($prior, $new))->toBeNull();
});

it('flags term removed', function () {
    $prior = ['key_terms' => [['term' => 'speed', 'definition' => 'rate'], ['term' => 'force', 'definition' => 'push']], 'symbols' => [], 'summary' => 'S'];
    $new = ['key_terms' => [['term' => 'speed', 'definition' => 'rate']], 'symbols' => [], 'summary' => 'S'];

    $diff = ContentBlockGenerationService::compareContract($prior, $new);

    expect($diff)->not->toBeNull()
        ->and($diff['reason'])->toContain('key_terms')
        ->and($diff['terms_removed'])->toEqualCanonicalizing(['force']);
});

it('flags term definition changed', function () {
    $prior = ['key_terms' => [['term' => 'speed', 'definition' => 'A']], 'symbols' => [], 'summary' => 'S'];
    $new = ['key_terms' => [['term' => 'speed', 'definition' => 'B']], 'symbols' => [], 'summary' => 'S'];

    $diff = ContentBlockGenerationService::compareContract($prior, $new);

    expect($diff['terms_changed'])->toContain('speed');
});

it('flags symbol unit changed', function () {
    $prior = ['key_terms' => [], 'symbols' => [['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'm/s']], 'summary' => 'S'];
    $new = ['key_terms' => [], 'symbols' => [['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'km/h']], 'summary' => 'S'];

    $diff = ContentBlockGenerationService::compareContract($prior, $new);

    expect($diff['reason'])->toContain('symbols');
});

it('flags symbol removed', function () {
    $prior = ['key_terms' => [], 'symbols' => [['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'm/s']], 'summary' => 'S'];
    $new = ['key_terms' => [], 'symbols' => [], 'summary' => 'S'];

    $diff = ContentBlockGenerationService::compareContract($prior, $new);

    expect($diff['symbols_removed'])->toContain('v');
});

it('flags summary change', function () {
    $prior = ['key_terms' => [], 'symbols' => [], 'summary' => 'Old summary'];
    $new = ['key_terms' => [], 'symbols' => [], 'summary' => 'New summary'];

    $diff = ContentBlockGenerationService::compareContract($prior, $new);

    expect($diff['reason'])->toContain('summary');
});
