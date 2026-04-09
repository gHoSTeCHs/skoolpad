<?php

use App\DataTransferObjects\ContentResponse;
use App\Enums\ContentProjectStatus;
use App\Enums\UserRole;
use App\Models\ContentProject;
use App\Models\User;
use App\Services\ContentGenerationService;

function mockResearchGeneration(array $data): void
{
    $mock = Mockery::mock(ContentGenerationService::class);
    $mock->shouldReceive('generate')->once()->andReturn(new ContentResponse(
        valid: true,
        data: $data,
        raw_response: json_encode($data),
        model_used: 'test-model',
        tokens_used: 150,
        input_tokens: 80,
        output_tokens: 70,
    ));
    app()->instance(ContentGenerationService::class, $mock);
}

it('completes full research flow: create → run → review → approve', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);

    expect($project->status)->toBe(ContentProjectStatus::Draft);

    $researchData = [
        'education_level' => 'SS1',
        'subject' => 'Physics',
        'total_topics_found' => 3,
        'source_confidence' => 'high',
        'terms' => [
            [
                'term_number' => 1,
                'term_label' => 'First Term',
                'topics' => [
                    ['sequence' => 1, 'title' => 'Intro to Physics', 'sub_topics' => ['definition', 'branches'], 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null],
                    ['sequence' => 2, 'title' => 'Measurement', 'sub_topics' => ['units'], 'estimated_hours' => 4, 'practical_component' => true, 'waec_alignment_note' => null],
                    ['sequence' => 3, 'title' => 'Motion', 'sub_topics' => ['speed', 'velocity'], 'estimated_hours' => 6, 'practical_component' => false, 'waec_alignment_note' => 'Frequently tested'],
                ],
            ],
        ],
        'lab_work_summary' => 'Basic measurement lab',
        'conflicts' => [],
        'missing_data' => ['Term 2 topics not listed'],
    ];

    mockResearchGeneration($researchData);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-research', $project), [
            'document_text' => str_repeat('NERDC curriculum content for SS1 Physics. ', 20),
        ])
        ->assertRedirect();

    $project->refresh();
    expect($project->status)->toBe(ContentProjectStatus::Research)
        ->and($project->ai_context['research']['total_topics_found'])->toBe(3)
        ->and($project->ai_context['research']['source_confidence'])->toBe('high');

    $editedTopics = [
        ['title' => 'Intro to Physics', 'sub_topics' => ['definition', 'branches', 'history'], 'term_number' => 1, 'sequence' => 1, 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null],
        ['title' => 'Measurement and Units', 'sub_topics' => ['units', 'instruments'], 'term_number' => 1, 'sequence' => 2, 'estimated_hours' => 5, 'practical_component' => true, 'waec_alignment_note' => null],
        ['title' => 'Motion', 'sub_topics' => ['speed', 'velocity', 'acceleration'], 'term_number' => 1, 'sequence' => 3, 'estimated_hours' => 6, 'practical_component' => false, 'waec_alignment_note' => 'Frequently tested'],
    ];

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-research', $project), [
            'topics' => $editedTopics,
        ])
        ->assertRedirect();

    $project->refresh();
    expect($project->ai_context['research_approved'])->toHaveCount(3)
        ->and($project->ai_context['research_approved'][0]['title'])->toBe('Intro to Physics')
        ->and($project->ai_context['research_approved'][0]['sub_topics'])->toContain('history')
        ->and($project->ai_context['research_approved'][1]['title'])->toBe('Measurement and Units')
        ->and($project->progress_data['research_approved_at'])->not->toBeNull();
});

it('can re-run research to replace previous results', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withResearch()->create(['created_by' => $user->id]);

    $newData = [
        'education_level' => 'SS1',
        'subject' => 'Physics',
        'total_topics_found' => 5,
        'source_confidence' => 'high',
        'terms' => [
            [
                'term_number' => 1,
                'term_label' => 'First Term',
                'topics' => [
                    ['sequence' => 1, 'title' => 'Topic A', 'sub_topics' => [], 'estimated_hours' => 2, 'practical_component' => false, 'waec_alignment_note' => null],
                    ['sequence' => 2, 'title' => 'Topic B', 'sub_topics' => [], 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null],
                    ['sequence' => 3, 'title' => 'Topic C', 'sub_topics' => [], 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null],
                    ['sequence' => 4, 'title' => 'Topic D', 'sub_topics' => [], 'estimated_hours' => 4, 'practical_component' => true, 'waec_alignment_note' => null],
                    ['sequence' => 5, 'title' => 'Topic E', 'sub_topics' => [], 'estimated_hours' => 5, 'practical_component' => false, 'waec_alignment_note' => null],
                ],
            ],
        ],
        'lab_work_summary' => null,
        'conflicts' => [],
        'missing_data' => [],
    ];

    mockResearchGeneration($newData);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-research', $project), [
            'document_text' => str_repeat('Updated curriculum document. ', 20),
        ])
        ->assertRedirect();

    $project->refresh();
    expect($project->ai_context['research']['total_topics_found'])->toBe(5);
});

it('stores failure context when AI returns invalid response', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);

    $mock = Mockery::mock(ContentGenerationService::class);
    $mock->shouldReceive('generate')->once()->andReturn(new ContentResponse(
        valid: false,
        data: [],
        validation_errors: ['terms' => ['The terms field is required.']],
        raw_response: '{"invalid": true}',
        model_used: 'test-model',
        tokens_used: 50,
    ));
    app()->instance(ContentGenerationService::class, $mock);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-research', $project), [
            'document_text' => str_repeat('Some document. ', 20),
        ])
        ->assertRedirect();

    $project->refresh();
    expect($project->ai_context['research_failed'])->not->toBeNull()
        ->and($project->ai_context['research_failed']['validation_errors'])->toHaveKey('terms');
});

it('prevents non-staff from running research', function () {
    $student = User::factory()->create(['role' => UserRole::Student]);
    $project = ContentProject::factory()->create();

    $this->actingAs($student)
        ->postJson(route('admin.content-studio.run-research', $project), [
            'document_text' => str_repeat('x', 200),
        ])
        ->assertForbidden();
});

it('rejects approval when no research exists yet', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()
        ->withStatus(ContentProjectStatus::Research)
        ->create(['created_by' => $user->id, 'ai_context' => []]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-research', $project), [
            'topics' => [['title' => 'Test', 'sub_topics' => [], 'term_number' => 1, 'sequence' => 1, 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null]],
        ])
        ->assertRedirect()
        ->assertSessionHas('error');
});
