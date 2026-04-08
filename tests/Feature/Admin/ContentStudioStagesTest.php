<?php

use App\DataTransferObjects\ContentResponse;
use App\Enums\ContentProjectStatus;
use App\Enums\UserRole;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Models\User;
use App\Services\ContentGenerationService;

it('prevents students from accessing stage endpoints', function () {
    $student = User::factory()->create(['role' => UserRole::Student]);
    $project = ContentProject::factory()->create();

    $this->actingAs($student)
        ->postJson(route('admin.content-studio.run-research', $project), [
            'document_text' => str_repeat('x', 200),
        ])
        ->assertForbidden();
});

it('runs curriculum research and stores results', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);

    $mockData = [
        'education_level' => 'SS1',
        'subject' => 'Physics',
        'total_topics_found' => 2,
        'source_confidence' => 'medium',
        'terms' => [
            ['term_number' => 1, 'term_label' => 'First Term', 'topics' => [
                ['sequence' => 1, 'title' => 'Topic A', 'sub_topics' => [], 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null],
                ['sequence' => 2, 'title' => 'Topic B', 'sub_topics' => ['sub1'], 'estimated_hours' => 4, 'practical_component' => true, 'waec_alignment_note' => null],
            ]],
        ],
        'lab_work_summary' => null,
        'conflicts' => [],
        'missing_data' => [],
    ];

    $mock = Mockery::mock(ContentGenerationService::class);
    $mock->shouldReceive('generate')->once()->andReturn(new ContentResponse(
        valid: true,
        data: $mockData,
        raw_response: json_encode($mockData),
        model_used: 'test',
        tokens_used: 100,
        input_tokens: 50,
        output_tokens: 50,
    ));
    $this->app->instance(ContentGenerationService::class, $mock);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-research', $project), [
            'document_text' => str_repeat('Curriculum content here. ', 50),
        ])
        ->assertRedirect();

    $project->refresh();
    expect($project->status)->toBe(ContentProjectStatus::Research)
        ->and($project->ai_context['research']['total_topics_found'])->toBe(2);
});

it('rejects research with invalid document text', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-research', $project), [
            'document_text' => 'too short',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['document_text']);
});

it('approves research with edited topics', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withResearch()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-research', $project), [
            'topics' => [
                ['title' => 'Topic A', 'sub_topics' => [], 'term_number' => 1, 'sequence' => 1, 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null],
            ],
        ])
        ->assertRedirect();

    $project->refresh();
    expect($project->ai_context['research_approved'])->toHaveCount(1);
});

it('rejects scheme generation when research is not approved', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withResearch()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.run-scheme', $project), [
            'terms_count' => 3,
            'weeks_per_term' => 10,
        ])
        ->assertStatus(500);
});

it('approves scheme and creates scheme of work items', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withScheme()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-scheme', $project), [
            'terms' => [
                [
                    'term_number' => 1,
                    'instructional_weeks' => 10,
                    'topics' => [
                        ['title' => 'Introduction to Physics', 'week_start' => 1, 'week_end' => 1, 'periods' => 3, 'notes' => null],
                        ['title' => 'Measurement', 'week_start' => 2, 'week_end' => 2, 'periods' => 4, 'notes' => null],
                    ],
                ],
            ],
        ])
        ->assertRedirect();

    $project->refresh();
    expect($project->status)->toBe(ContentProjectStatus::Structuring);

    $levelSubject = LevelSubject::query()
        ->where('education_level_id', $project->education_level_id)
        ->where('curriculum_subject_id', $project->curriculum_subject_id)
        ->first();

    expect(SchemeOfWorkItem::query()->where('curriculum_subject_level_id', $levelSubject->id)->count())->toBe(2);
});

it('allows tertiary projects to skip scheme', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()
        ->tertiary()
        ->withStatus(ContentProjectStatus::Research)
        ->create([
            'created_by' => $user->id,
            'ai_context' => [
                'research' => ['terms' => []],
                'research_approved' => [['title' => 'Data Structures', 'sub_topics' => [], 'term_number' => 1, 'sequence' => 1, 'estimated_hours' => 6, 'practical_component' => false, 'waec_alignment_note' => null]],
            ],
            'progress_data' => ['research_approved_at' => now()->toISOString()],
        ]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.skip-scheme', $project))
        ->assertRedirect();

    $project->refresh();
    expect($project->status)->toBe(ContentProjectStatus::Structuring);
});

it('approves block structure and creates topic with blocks', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedScheme()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project), [
            'topic_key' => 'introduction-to-physics',
            'topic_title' => 'Introduction to Physics',
            'topic_slug' => 'introduction-to-physics',
            'topic_summary' => 'An overview of physics.',
            'estimated_total_minutes' => 30,
            'blocks' => [
                ['title' => 'Root', 'slug' => 'root', 'block_type' => 'container', 'is_container' => true, 'depth_level' => 0, 'parent_index' => null, 'sort_order' => 1, 'estimated_read_time' => null, 'difficulty_level' => null, 'bloom_level' => null, 'visualization' => ['recommended' => false], 'content_guidance' => 'Root container.'],
                ['title' => 'What is Physics?', 'slug' => 'what-is-physics', 'block_type' => 'text', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 1, 'estimated_read_time' => 5, 'difficulty_level' => 'beginner', 'bloom_level' => 'remember', 'visualization' => ['recommended' => false], 'content_guidance' => 'Define physics.'],
                ['title' => 'Branches', 'slug' => 'branches', 'block_type' => 'text', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 2, 'estimated_read_time' => 7, 'difficulty_level' => 'beginner', 'bloom_level' => 'understand', 'visualization' => ['recommended' => false], 'content_guidance' => 'Branches of physics.'],
                ['title' => 'Quiz', 'slug' => 'quiz', 'block_type' => 'quiz', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 3, 'estimated_read_time' => 5, 'difficulty_level' => 'beginner', 'bloom_level' => 'apply', 'visualization' => ['recommended' => false], 'content_guidance' => 'Quick check.'],
                ['title' => 'Summary', 'slug' => 'summary', 'block_type' => 'reference', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 4, 'estimated_read_time' => 3, 'difficulty_level' => 'beginner', 'bloom_level' => 'remember', 'visualization' => ['recommended' => false], 'content_guidance' => 'Key terms.'],
            ],
        ])
        ->assertRedirect();

    $topic = CanonicalTopic::query()->where('slug', 'introduction-to-physics')->first();
    expect($topic)->not->toBeNull();
    expect(ContentBlock::query()->where('canonical_topic_id', $topic->id)->count())->toBe(5);
});

it('passes ai_context and generation logs to show page', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withResearch()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->get(route('admin.content-studio.show', $project))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/content-studio/show')
            ->has('project.ai_context')
            ->has('generationLogs')
        );
});
