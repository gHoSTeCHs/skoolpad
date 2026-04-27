<?php

use App\Services\ContentBlockGenerationService;

it('encodes dotted paths as zero-padded strings for correct lexicographic ordering', function () {
    expect(ContentBlockGenerationService::pathKey('1'))->toBe('000001')
        ->and(ContentBlockGenerationService::pathKey('1.2.3'))->toBe('000001.000002.000003')
        ->and(ContentBlockGenerationService::pathKey('1.10'))->toBe('000001.000010');
});

it('orders paths correctly via pathKey', function () {
    $paths = ['1.10', '1.2', '2', '1.2.1'];
    usort($paths, fn ($a, $b) => ContentBlockGenerationService::pathKey($a) <=> ContentBlockGenerationService::pathKey($b));

    expect($paths)->toBe(['1.2', '1.2.1', '1.10', '2']);
});
