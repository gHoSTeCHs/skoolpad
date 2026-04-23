<?php

use App\Enums\ContentProjectStatus;
use App\Jobs\RunContentGeneration;
use App\Models\ContentProject;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

it('completes full scheme flow: dispatch job → approve → verify DB writes', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedResearch()->create(['created_by' => $user->id]);

    Queue::fake();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-scheme', $project), [
            'terms_count' => 3,
            'weeks_per_term' => 10,
        ])
        ->assertAccepted()
        ->assertJsonStructure(['job_id']);

    Queue::assertPushed(RunContentGeneration::class, function ($job) use ($project) {
        return $job->project->id === $project->id
            && $job->promptType === 'scheme';
    });

    $schemeData = [
        'education_level' => 'SS1',
        'subject' => 'Physics',
        'terms' => [
            [
                'term_number' => 1,
                'instructional_weeks' => 10,
                'topics' => [
                    ['title' => 'Introduction to Physics', 'week_start' => 1, 'week_end' => 1, 'periods' => 3, 'notes' => null],
                    ['title' => 'Measurement', 'week_start' => 2, 'week_end' => 3, 'periods' => 6, 'notes' => 'includes practical'],
                    ['title' => 'Motion', 'week_start' => 4, 'week_end' => 6, 'periods' => 9, 'notes' => null],
                ],
                'total_periods' => 18,
            ],
        ],
        'total_topics_allocated' => 3,
    ];

    $project->updateAiContext('scheme', $schemeData);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-scheme', $project), [
            'terms' => $schemeData['terms'],
        ])
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    $project->refresh();
    expect($project->status)->toBe(ContentProjectStatus::Structuring)
        ->and($project->ai_context['scheme_approved'])->not->toBeNull()
        ->and($project->progress_data['scheme_approved_at'])->not->toBeNull();

    $levelSubject = LevelSubject::query()
        ->where('education_level_id', $project->education_level_id)
        ->where('curriculum_subject_id', $project->curriculum_subject_id)
        ->first();

    expect($levelSubject)->not->toBeNull();

    $items = SchemeOfWorkItem::query()
        ->where('curriculum_subject_level_id', $levelSubject->id)
        ->orderBy('term')
        ->orderBy('week_number')
        ->get();

    expect($items)->toHaveCount(6);

    expect($items[0]->topic_label)->toBe('Introduction to Physics')
        ->and($items[0]->term)->toBe(1)
        ->and($items[0]->week_number)->toBe(1);

    expect($items[1]->topic_label)->toBe('Measurement')
        ->and($items[1]->week_number)->toBe(2);
    expect($items[2]->topic_label)->toBe('Measurement')
        ->and($items[2]->week_number)->toBe(3);

    expect($items[3]->topic_label)->toBe('Motion')
        ->and($items[3]->week_number)->toBe(4);
    expect($items[4]->topic_label)->toBe('Motion')
        ->and($items[4]->week_number)->toBe(5);
    expect($items[5]->topic_label)->toBe('Motion')
        ->and($items[5]->week_number)->toBe(6);
});

it('creates LevelSubject via firstOrCreate when it does not exist', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withScheme()->create(['created_by' => $user->id]);

    $levelSubjectBefore = LevelSubject::query()
        ->where('education_level_id', $project->education_level_id)
        ->where('curriculum_subject_id', $project->curriculum_subject_id)
        ->first();

    expect($levelSubjectBefore)->toBeNull();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-scheme', $project), [
            'terms' => [
                [
                    'term_number' => 1,
                    'instructional_weeks' => 10,
                    'topics' => [
                        ['title' => 'Introduction to Physics', 'week_start' => 1, 'week_end' => 1, 'periods' => 3, 'notes' => null],
                    ],
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    $levelSubjectAfter = LevelSubject::query()
        ->where('education_level_id', $project->education_level_id)
        ->where('curriculum_subject_id', $project->curriculum_subject_id)
        ->first();

    expect($levelSubjectAfter)->not->toBeNull();
});

it('replaces existing scheme items on re-approval', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withScheme()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-scheme', $project), [
            'terms' => [
                [
                    'term_number' => 1,
                    'instructional_weeks' => 10,
                    'topics' => [
                        ['title' => 'Introduction to Physics', 'week_start' => 1, 'week_end' => 2, 'periods' => 6, 'notes' => null],
                        ['title' => 'Measurement', 'week_start' => 3, 'week_end' => 3, 'periods' => 4, 'notes' => null],
                    ],
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    $levelSubject = LevelSubject::query()
        ->where('education_level_id', $project->education_level_id)
        ->where('curriculum_subject_id', $project->curriculum_subject_id)
        ->first();

    expect(SchemeOfWorkItem::query()->where('curriculum_subject_level_id', $levelSubject->id)->count())->toBe(3);

    $project->refresh();
    $project->update(['status' => ContentProjectStatus::Research]);
    $project->updateAiContext('scheme', ['terms' => [['term_number' => 1, 'instructional_weeks' => 10, 'topics' => [['title' => 'Only Topic', 'week_start' => 1, 'week_end' => 1, 'periods' => 3, 'notes' => null]]]]]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-scheme', $project), [
            'terms' => [
                [
                    'term_number' => 1,
                    'instructional_weeks' => 10,
                    'topics' => [
                        ['title' => 'Only Topic', 'week_start' => 1, 'week_end' => 1, 'periods' => 3, 'notes' => null],
                    ],
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    expect(SchemeOfWorkItem::query()->where('curriculum_subject_level_id', $levelSubject->id)->count())->toBe(1)
        ->and(SchemeOfWorkItem::query()->where('curriculum_subject_level_id', $levelSubject->id)->first()->topic_label)->toBe('Only Topic');
});

it('allows tertiary projects to skip scheme and advance to structuring', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()
        ->tertiary()
        ->withStatus(ContentProjectStatus::Research)
        ->create([
            'created_by' => $user->id,
            'ai_context' => [
                'research' => ['terms' => []],
                'research_approved' => [
                    ['title' => 'Data Structures', 'sub_topics' => ['arrays', 'linked lists'], 'term_number' => 1, 'sequence' => 1, 'estimated_hours' => 6, 'practical_component' => false, 'waec_alignment_note' => null],
                ],
            ],
            'progress_data' => ['research_approved_at' => now()->toISOString()],
        ]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.skip-scheme', $project))
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    $project->refresh();
    expect($project->status)->toBe(ContentProjectStatus::Structuring)
        ->and($project->progress_data['scheme_skipped'])->toBeTrue()
        ->and($project->progress_data['scheme_skipped_at'])->not->toBeNull();
});

it('prevents secondary projects from skipping scheme', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedResearch()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.skip-scheme', $project))
        ->assertUnprocessable()
        ->assertJson(['message' => 'Only tertiary projects can skip the scheme of work stage.']);
});

it('rejects scheme generation when research is not yet approved', function () {
    Queue::fake();

    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withResearch()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-scheme', $project), [
            'terms_count' => 3,
            'weeks_per_term' => 10,
        ])
        ->assertAccepted()
        ->assertJsonStructure(['job_id']);

    Queue::assertPushed(RunContentGeneration::class);
});

it('validates scheme generation request fields', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedResearch()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-scheme', $project), [
            'terms_count' => 0,
            'weeks_per_term' => 50,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['terms_count', 'weeks_per_term']);
});
