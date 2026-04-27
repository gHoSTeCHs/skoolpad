<?php

use App\Models\CanonicalTopic;

uses(Tests\TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

it('casts glossary as array and persists terms and symbols', function () {
    $glossary = [
        'terms' => [['term' => 'speed', 'definition' => 'distance over time', 'first_block_id' => 'b1']],
        'symbols' => [['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'm/s', 'first_block_id' => 'b1']],
    ];

    $topic = CanonicalTopic::factory()->create(['glossary' => $glossary]);

    expect($topic->fresh()->glossary)->toEqual($glossary);
});

it('defaults glossary to null on creation', function () {
    $topic = CanonicalTopic::factory()->create();

    expect($topic->glossary)->toBeNull();
});
