<?php

use App\Enums\BlockGenerationStatus;

it('has three cases with expected values', function () {
    expect(BlockGenerationStatus::NotStarted->value)->toBe('not_started')
        ->and(BlockGenerationStatus::Generated->value)->toBe('generated')
        ->and(BlockGenerationStatus::Approved->value)->toBe('approved');
});

it('provides human labels', function () {
    expect(BlockGenerationStatus::NotStarted->label())->toBe('Not started')
        ->and(BlockGenerationStatus::Generated->label())->toBe('Generated')
        ->and(BlockGenerationStatus::Approved->label())->toBe('Approved');
});

it('exposes select options via HasSelectOptions trait', function () {
    $options = BlockGenerationStatus::toSelectOptions();

    expect($options)->toHaveCount(3)
        ->and($options[0])->toMatchArray(['value' => 'not_started', 'label' => 'Not started']);
});
