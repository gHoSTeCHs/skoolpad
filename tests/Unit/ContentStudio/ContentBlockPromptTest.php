<?php

use App\ContentStudio\Prompts\ContentBlockPrompt;
use Illuminate\Support\Facades\Validator;

uses(Tests\TestCase::class);

it('reports promptType as content', function () {
    expect((new ContentBlockPrompt)->promptType())->toBe('content');
});

it('uses temperature 0.5 by default or from config', function () {
    config()->set('content-studio.temperature.content', 0.5);
    expect((new ContentBlockPrompt)->temperature())->toBe(0.5);
});

it('uses maxTokens 8192', function () {
    expect((new ContentBlockPrompt)->maxTokens())->toBe(8192);
});

it('systemPrompt includes Nigerian context, Tiptap allow-list, hierarchy rules, drift discipline', function () {
    $sys = (new ContentBlockPrompt)->systemPrompt();

    expect($sys)->toContain('Nigerian')
        ->and($sys)->toContain('Tiptap')
        ->and($sys)->toContain('blockMath')
        ->and($sys)->toContain('paragraph')
        ->and($sys)->toContain('bold')
        ->toContain('key_terms_introduced')
        ->and($sys)->toContain('summary_sentence')
        ->and($sys)->toContain('glossary')
        ->and($sys)->toContain('do not redefine');
});

it('userPrompt renders all context fields', function () {
    $context = [
        'topic' => ['title' => 'Motion', 'summary' => 'Basics of motion.', 'subject' => 'Physics', 'education_level' => 'SS1', 'estimated_total_minutes' => 180],
        'block' => ['title' => 'What is Speed?', 'type' => 'text', 'guidance' => 'Define speed.', 'difficulty' => 'beginner', 'bloom' => 'understand', 'read_time' => 6],
        'hierarchy_breadcrumbs' => ['Kinematics', 'Linear motion'],
        'previous_leaf' => ['title' => 'Introduction to motion', 'summary_sentence' => 'Motion is the change of position.', 'content_guidance' => 'Introduce motion.'],
        'next_leaf' => ['title' => 'What is Velocity?', 'content_guidance' => 'Define velocity.'],
        'glossary' => ['terms' => [['term' => 'motion', 'definition' => 'change in position']], 'symbols' => []],
        'prior_block_summaries' => ['Motion is the change of position.'],
    ];

    $prompt = (new ContentBlockPrompt)->userPrompt($context);

    expect($prompt)->toContain('Motion')
        ->and($prompt)->toContain('What is Speed?')
        ->and($prompt)->toContain('Define speed.')
        ->and($prompt)->toContain('Kinematics')
        ->and($prompt)->toContain('Introduction to motion')
        ->and($prompt)->toContain('What is Velocity?')
        ->and($prompt)->toContain('Define velocity.')
        ->and($prompt)->toContain('motion')
        ->and($prompt)->toContain('change in position')
        ->and($prompt)->toContain('Motion is the change of position');
});

it('userPrompt handles null previous_leaf and next_leaf gracefully', function () {
    $context = [
        'topic' => ['title' => 'T', 'summary' => 's', 'subject' => 'S', 'education_level' => 'L', 'estimated_total_minutes' => 60],
        'block' => ['title' => 'B', 'type' => 'text', 'guidance' => 'g', 'difficulty' => 'beginner', 'bloom' => 'remember', 'read_time' => 5],
        'hierarchy_breadcrumbs' => [],
        'previous_leaf' => null,
        'next_leaf' => null,
        'glossary' => ['terms' => [], 'symbols' => []],
        'prior_block_summaries' => [],
    ];

    expect((new ContentBlockPrompt)->userPrompt($context))->toContain('B');
});

it('validates a well-formed P-04 response', function () {
    $schema = (new ContentBlockPrompt)->jsonSchema();
    $ok = [
        'block_title' => 'What is Speed?',
        'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'x']]]]],
        'summary_sentence' => 'Speed is distance over time.',
        'key_terms_introduced' => [['term' => 'speed', 'definition' => 'rate of distance per unit time']],
        'symbols_used' => [['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'm/s']],
        'formulas_used' => ['v = d/t'],
        'word_count' => 420,
        'nigerian_context_used' => true,
    ];

    expect(Validator::make($ok, $schema)->passes())->toBeTrue();
});

it('rejects missing summary_sentence', function () {
    $schema = (new ContentBlockPrompt)->jsonSchema();
    $bad = [
        'block_title' => 'x',
        'content' => ['type' => 'doc', 'content' => []],
        'key_terms_introduced' => [],
        'symbols_used' => [],
        'formulas_used' => [],
        'word_count' => 1,
        'nigerian_context_used' => false,
    ];

    expect(Validator::make($bad, $schema)->fails())->toBeTrue();
});

it('rejects content.type that is not doc', function () {
    $schema = (new ContentBlockPrompt)->jsonSchema();
    $bad = [
        'block_title' => 'x',
        'content' => ['type' => 'paragraph', 'content' => []],
        'summary_sentence' => 's',
        'key_terms_introduced' => [],
        'symbols_used' => [],
        'formulas_used' => [],
        'word_count' => 1,
        'nigerian_context_used' => false,
    ];

    expect(Validator::make($bad, $schema)->fails())->toBeTrue();
});

it('requires key_terms_introduced entries to have term and definition', function () {
    $schema = (new ContentBlockPrompt)->jsonSchema();
    $bad = [
        'block_title' => 'x',
        'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'x']]]]],
        'summary_sentence' => 's',
        'key_terms_introduced' => [['term' => 'speed']],
        'symbols_used' => [],
        'formulas_used' => [],
        'word_count' => 1,
        'nigerian_context_used' => false,
    ];

    expect(Validator::make($bad, $schema)->fails())->toBeTrue();
});
