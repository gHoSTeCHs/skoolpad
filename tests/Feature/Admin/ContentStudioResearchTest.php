<?php

use App\Enums\ContentProjectStatus;
use App\Enums\UserRole;
use App\Jobs\RunContentGeneration;
use App\Models\ContentProject;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

it('dispatches research job and returns 202 with job_id', function () {
    Queue::fake();

    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);

    expect($project->status)->toBe(ContentProjectStatus::Draft);

    $response = $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-research', $project), [
            'document_text' => str_repeat('NERDC curriculum content for SS1 Physics. ', 20),
        ]);

    $response->assertAccepted()
        ->assertJsonStructure(['job_id']);

    Queue::assertPushed(RunContentGeneration::class, function ($job) use ($project) {
        return $job->project->id === $project->id
            && $job->promptType === 'research';
    });
});

it('completes full research flow: dispatch job → approve topics', function () {
    Queue::fake();

    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-research', $project), [
            'document_text' => str_repeat('NERDC curriculum content for SS1 Physics. ', 20),
        ])
        ->assertAccepted()
        ->assertJsonStructure(['job_id']);

    Queue::assertPushed(RunContentGeneration::class);

    $project->update(['status' => ContentProjectStatus::Research]);
    $project->updateAiContext('research', [
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
    ]);

    $editedTopics = [
        ['title' => 'Intro to Physics', 'sub_topics' => ['definition', 'branches', 'history'], 'term_number' => 1, 'sequence' => 1, 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null],
        ['title' => 'Measurement and Units', 'sub_topics' => ['units', 'instruments'], 'term_number' => 1, 'sequence' => 2, 'estimated_hours' => 5, 'practical_component' => true, 'waec_alignment_note' => null],
        ['title' => 'Motion', 'sub_topics' => ['speed', 'velocity', 'acceleration'], 'term_number' => 1, 'sequence' => 3, 'estimated_hours' => 6, 'practical_component' => false, 'waec_alignment_note' => 'Frequently tested'],
    ];

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-research', $project), [
            'topics' => $editedTopics,
        ])
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    $project->refresh();
    expect($project->ai_context['research_approved'])->toHaveCount(3)
        ->and($project->ai_context['research_approved'][0]['title'])->toBe('Intro to Physics')
        ->and($project->ai_context['research_approved'][0]['sub_topics'])->toContain('history')
        ->and($project->ai_context['research_approved'][1]['title'])->toBe('Measurement and Units')
        ->and($project->progress_data['research_approved_at'])->not->toBeNull();
});

it('can re-run research to dispatch a new job', function () {
    Queue::fake();

    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withResearch()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-research', $project), [
            'document_text' => str_repeat('Updated curriculum document. ', 20),
        ])
        ->assertAccepted()
        ->assertJsonStructure(['job_id']);

    Queue::assertPushed(RunContentGeneration::class, function ($job) use ($project) {
        return $job->project->id === $project->id
            && $job->promptType === 'research';
    });
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
        ->assertUnprocessable()
        ->assertJson(['message' => 'No research results to approve. Run curriculum research first.']);
});
