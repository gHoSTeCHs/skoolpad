<?php

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Services\ContentBlockGenerationService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function seedTopicWithBlocks(): array
{
    $topic = CanonicalTopic::factory()->create([
        'title' => 'Motion',
        'summary' => 'Basics of motion.',
        'estimated_read_minutes' => 60,
    ]);

    $container = ContentBlock::factory()->container()->at('1')->for($topic, 'canonicalTopic')->create(['title' => 'Kinematics']);
    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->generated()->create(['title' => 'Intro', 'parent_block_id' => $container->id, 'summary_sentence' => 'Motion introduced.']);
    $b2 = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')
        ->withGuidance('Define speed.')->notStarted()->create(['title' => 'What is Speed?', 'parent_block_id' => $container->id]);
    $b3 = ContentBlock::factory()->leaf()->at('1.3')->for($topic, 'canonicalTopic')
        ->withGuidance('Define velocity.')->notStarted()->create(['title' => 'What is Velocity?', 'parent_block_id' => $container->id]);

    return compact('topic', 'container', 'b1', 'b2', 'b3');
}

it('assembles context with topic, block, hierarchy, prev/next leaves, prior summaries, glossary', function () {
    ['topic' => $topic, 'b1' => $b1, 'b2' => $b2, 'b3' => $b3] = seedTopicWithBlocks();
    $topic->update([
        'education_level' => 'SS1',
        'glossary' => [
            'terms' => [['term' => 'motion', 'definition' => 'change of position', 'first_block_id' => $b1->id]],
            'symbols' => [],
        ],
    ]);

    $project = \App\Models\ContentProject::factory()->create();

    $service = app(ContentBlockGenerationService::class);
    $context = $service->assembleContext($b2->fresh(), $project);

    expect($context['topic']['title'])->toBe('Motion')
        ->and($context['topic']['education_level'])->toBe('SS1')
        ->and($context['block']['title'])->toBe('What is Speed?')
        ->and($context['block']['type'])->toBe('text')
        ->and($context['hierarchy_breadcrumbs'])->toBe(['Kinematics'])
        ->and($context['previous_leaf']['title'])->toBe('Intro')
        ->and($context['previous_leaf']['summary_sentence'])->toBe('Motion introduced.')
        ->and($context['next_leaf']['title'])->toBe('What is Velocity?')
        ->and($context['next_leaf']['content_guidance'])->toBe('Define velocity.')
        ->and($context['prior_block_summaries'])->toBe(['Motion introduced.'])
        ->and($context['glossary']['terms'])->toHaveCount(1);
});

it('caps glossary at GLOSSARY_TERMS_CAP with a warning', function () {
    ['topic' => $topic, 'b2' => $b2] = seedTopicWithBlocks();

    $oversized = [];
    for ($i = 0; $i < ContentBlockGenerationService::GLOSSARY_TERMS_CAP + 10; $i++) {
        $oversized[] = ['term' => "t{$i}", 'definition' => 'd', 'first_block_id' => 'x'];
    }
    $topic->update(['glossary' => ['terms' => $oversized, 'symbols' => []]]);

    $project = \App\Models\ContentProject::factory()->create();
    $service = app(ContentBlockGenerationService::class);
    $context = $service->assembleContext($b2->fresh(), $project);

    expect($context['glossary']['terms'])->toHaveCount(ContentBlockGenerationService::GLOSSARY_TERMS_CAP);
});
