<?php

use App\DataTransferObjects\ContentResponse;
use App\Enums\ContentProjectStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Services\Admin\ContentBlockService;
use App\Services\ContentGenerationService;
use App\Services\ContentProjectService;

function makeService(?ContentGenerationService $genService = null): ContentProjectService
{
    return new ContentProjectService(
        $genService ?? Mockery::mock(ContentGenerationService::class),
        app(ContentBlockService::class),
    );
}

function mockGenerationService(array $responseData): ContentGenerationService
{
    $mock = Mockery::mock(ContentGenerationService::class);
    $mock->shouldReceive('generate')
        ->once()
        ->andReturn(new ContentResponse(
            valid: true,
            data: $responseData,
            raw_response: json_encode($responseData),
            model_used: 'test-model',
            tokens_used: 100,
            input_tokens: 50,
            output_tokens: 50,
        ));

    return $mock;
}

it('rejects research when project is not in draft or research status', function () {
    $project = ContentProject::factory()->withStatus(ContentProjectStatus::Structuring)->create();
    $service = makeService();

    $service->runCurriculumResearch($project, 'some document text');
})->throws(\DomainException::class, 'Draft, Research');

it('stores research results in ai_context on success', function () {
    $researchData = [
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

    $project = ContentProject::factory()->create();
    $service = makeService(mockGenerationService($researchData));

    $response = $service->runCurriculumResearch($project, 'Curriculum document text...');

    expect($response->valid)->toBeTrue();

    $project->refresh();
    expect($project->ai_context['research'])->toEqual($researchData)
        ->and($project->status)->toBe(ContentProjectStatus::Research);
});

it('approves research and stores edited topics', function () {
    $project = ContentProject::factory()->withResearch()->create();
    $service = makeService();

    $editedTopics = [
        ['title' => 'Intro to Physics', 'sub_topics' => ['definition'], 'term_number' => 1, 'sequence' => 1, 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null],
    ];

    $service->approveResearch($project, $editedTopics);

    $project->refresh();
    expect($project->ai_context['research_approved'])->toEqual($editedTopics)
        ->and($project->progress_data['research_approved_at'])->not->toBeNull();
});

it('rejects research approval when no research exists', function () {
    $project = ContentProject::factory()->withStatus(ContentProjectStatus::Research)->create([
        'ai_context' => [],
    ]);
    $service = makeService();

    $service->approveResearch($project, [['title' => 'Test']]);
})->throws(\DomainException::class, 'No research results');

it('rejects scheme generation when research is not approved', function () {
    $project = ContentProject::factory()->withResearch()->create();
    $service = makeService();

    $service->runSchemeGeneration($project, ['terms_count' => 3, 'weeks_per_term' => 10]);
})->throws(\DomainException::class, 'Research must be approved');

it('approves scheme and creates scheme of work items', function () {
    $project = ContentProject::factory()->withScheme()->create();
    $service = makeService();

    $editedScheme = [
        [
            'term_number' => 1,
            'instructional_weeks' => 10,
            'topics' => [
                ['title' => 'Introduction to Physics', 'week_start' => 1, 'week_end' => 1, 'periods' => 3, 'notes' => null],
                ['title' => 'Measurement', 'week_start' => 2, 'week_end' => 3, 'periods' => 6, 'notes' => 'practical'],
            ],
        ],
    ];

    $service->approveScheme($project, $editedScheme);

    $project->refresh();
    expect($project->status)->toBe(ContentProjectStatus::Structuring)
        ->and($project->ai_context['scheme_approved'])->toEqual($editedScheme);

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

    expect($items)->toHaveCount(3)
        ->and($items[0]->topic_label)->toBe('Introduction to Physics')
        ->and($items[0]->week_number)->toBe(1)
        ->and($items[1]->topic_label)->toBe('Measurement')
        ->and($items[1]->week_number)->toBe(2)
        ->and($items[2]->topic_label)->toBe('Measurement')
        ->and($items[2]->week_number)->toBe(3);
});

it('re-approving scheme replaces existing scheme of work items', function () {
    $project = ContentProject::factory()->withScheme()->create();
    $service = makeService();

    $firstScheme = [
        ['term_number' => 1, 'instructional_weeks' => 10, 'topics' => [
            ['title' => 'Introduction to Physics', 'week_start' => 1, 'week_end' => 2, 'periods' => 6, 'notes' => null],
        ]],
    ];
    $service->approveScheme($project, $firstScheme);

    $project->refresh();
    $project->status = ContentProjectStatus::Research;
    $project->save();

    $secondScheme = [
        ['term_number' => 1, 'instructional_weeks' => 10, 'topics' => [
            ['title' => 'Introduction to Physics', 'week_start' => 1, 'week_end' => 1, 'periods' => 3, 'notes' => null],
        ]],
    ];

    $project->updateAiContext('scheme', ['terms' => $secondScheme]);
    $service->approveScheme($project, $secondScheme);

    $levelSubject = LevelSubject::query()
        ->where('education_level_id', $project->education_level_id)
        ->where('curriculum_subject_id', $project->curriculum_subject_id)
        ->first();

    $items = SchemeOfWorkItem::query()
        ->where('curriculum_subject_level_id', $levelSubject->id)
        ->get();

    expect($items)->toHaveCount(1);
});

it('allows tertiary projects to skip scheme of work', function () {
    $project = ContentProject::factory()
        ->tertiary()
        ->withStatus(ContentProjectStatus::Research)
        ->create([
            'ai_context' => [
                'research' => ['terms' => []],
                'research_approved' => [['title' => 'Data Structures', 'sub_topics' => [], 'term_number' => 1, 'sequence' => 1, 'estimated_hours' => 6, 'practical_component' => false, 'waec_alignment_note' => null]],
            ],
            'progress_data' => ['research_approved_at' => now()->toISOString()],
        ]);

    $service = makeService();
    $service->skipScheme($project);

    $project->refresh();
    expect($project->status)->toBe(ContentProjectStatus::Structuring)
        ->and($project->progress_data['scheme_skipped'])->toBeTrue();
});

it('prevents secondary projects from skipping scheme', function () {
    $project = ContentProject::factory()->withApprovedResearch()->create();
    $service = makeService();

    $service->skipScheme($project);
})->throws(\DomainException::class, 'Only tertiary');

it('approves block structure and creates topic + blocks', function () {
    $project = ContentProject::factory()->withApprovedScheme()->create();
    $service = makeService();

    $data = [
        'topic_title' => 'Introduction to Physics',
        'topic_slug' => 'introduction-to-physics',
        'topic_summary' => 'An overview of physics as a discipline.',
        'estimated_total_minutes' => 35,
        'blocks' => [
            [
                'title' => 'Introduction to Physics',
                'slug' => 'introduction-to-physics',
                'block_type' => 'container',
                'is_container' => true,
                'depth_level' => 0,
                'parent_index' => null,
                'sort_order' => 1,
                'estimated_read_time' => null,
                'difficulty_level' => null,
                'bloom_level' => null,
                'visualization' => ['recommended' => false],
                'content_guidance' => 'Root container for the topic.',
            ],
            [
                'title' => 'What is Physics?',
                'slug' => 'what-is-physics',
                'block_type' => 'text',
                'is_container' => false,
                'depth_level' => 1,
                'parent_index' => 0,
                'sort_order' => 1,
                'estimated_read_time' => 5,
                'difficulty_level' => 'beginner',
                'bloom_level' => 'remember',
                'visualization' => ['recommended' => false],
                'content_guidance' => 'Define physics and its branches.',
            ],
            [
                'title' => 'Branches of Physics',
                'slug' => 'branches-of-physics',
                'block_type' => 'text',
                'is_container' => false,
                'depth_level' => 1,
                'parent_index' => 0,
                'sort_order' => 2,
                'estimated_read_time' => 7,
                'difficulty_level' => 'beginner',
                'bloom_level' => 'understand',
                'visualization' => ['recommended' => false],
                'content_guidance' => 'Explain the main branches.',
            ],
            [
                'title' => 'Practice Questions',
                'slug' => 'practice-questions',
                'block_type' => 'exercise',
                'is_container' => false,
                'depth_level' => 1,
                'parent_index' => 0,
                'sort_order' => 3,
                'estimated_read_time' => 8,
                'difficulty_level' => 'beginner',
                'bloom_level' => 'apply',
                'visualization' => ['recommended' => false],
                'content_guidance' => 'Simple exercises about physics branches.',
            ],
            [
                'title' => 'Key Terms',
                'slug' => 'key-terms',
                'block_type' => 'reference',
                'is_container' => false,
                'depth_level' => 1,
                'parent_index' => 0,
                'sort_order' => 4,
                'estimated_read_time' => 5,
                'difficulty_level' => 'beginner',
                'bloom_level' => 'remember',
                'visualization' => ['recommended' => false],
                'content_guidance' => 'Key terms and definitions summary.',
            ],
        ],
    ];

    $service->approveBlockStructure($project, 'introduction-to-physics', $data);

    $topic = CanonicalTopic::query()->where('slug', 'introduction-to-physics')->first();
    expect($topic)->not->toBeNull()
        ->and($topic->title)->toBe('Introduction to Physics')
        ->and($topic->summary)->toBe('An overview of physics as a discipline.')
        ->and($topic->estimated_read_minutes)->toBe(35)
        ->and($topic->is_published)->toBeFalse();

    $blocks = ContentBlock::query()
        ->where('canonical_topic_id', $topic->id)
        ->orderBy('path')
        ->get();

    expect($blocks)->toHaveCount(5);

    $root = $blocks->firstWhere('depth_level', 0);
    expect($root->is_container)->toBeTrue()
        ->and($root->block_type->value)->toBe('container');

    $leafBlocks = $blocks->where('is_container', false);
    expect($leafBlocks)->toHaveCount(4);

    $project->refresh();
    expect($project->progress_data['blocks_approved']['introduction-to-physics'])->not->toBeNull()
        ->and($project->progress_data['blocks_approved']['introduction-to-physics']['topic_id'])->toBe($topic->id);
});

it('links scheme of work items to created topic', function () {
    $project = ContentProject::factory()->withApprovedScheme()->create();
    $service = makeService();

    $levelSubject = LevelSubject::query()->firstOrCreate([
        'education_level_id' => $project->education_level_id,
        'curriculum_subject_id' => $project->curriculum_subject_id,
    ]);

    SchemeOfWorkItem::query()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'term' => 1,
        'week_number' => 1,
        'topic_label' => 'Introduction to Physics',
    ]);

    $data = [
        'topic_title' => 'Introduction to Physics',
        'topic_slug' => 'introduction-to-physics',
        'topic_summary' => 'Overview of physics.',
        'estimated_total_minutes' => 30,
        'blocks' => [
            ['title' => 'Root', 'slug' => 'root', 'block_type' => 'container', 'is_container' => true, 'depth_level' => 0, 'parent_index' => null, 'sort_order' => 1, 'estimated_read_time' => null, 'difficulty_level' => null, 'bloom_level' => null, 'visualization' => ['recommended' => false], 'content_guidance' => 'Root.'],
            ['title' => 'Intro', 'slug' => 'intro', 'block_type' => 'text', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 1, 'estimated_read_time' => 5, 'difficulty_level' => 'beginner', 'bloom_level' => 'remember', 'visualization' => ['recommended' => false], 'content_guidance' => 'Intro.'],
            ['title' => 'Details', 'slug' => 'details', 'block_type' => 'text', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 2, 'estimated_read_time' => 7, 'difficulty_level' => 'beginner', 'bloom_level' => 'understand', 'visualization' => ['recommended' => false], 'content_guidance' => 'Details.'],
            ['title' => 'Quiz', 'slug' => 'quiz', 'block_type' => 'quiz', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 3, 'estimated_read_time' => 5, 'difficulty_level' => 'beginner', 'bloom_level' => 'apply', 'visualization' => ['recommended' => false], 'content_guidance' => 'Quiz.'],
            ['title' => 'Summary', 'slug' => 'summary', 'block_type' => 'reference', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 4, 'estimated_read_time' => 3, 'difficulty_level' => 'beginner', 'bloom_level' => 'remember', 'visualization' => ['recommended' => false], 'content_guidance' => 'Summary.'],
        ],
    ];

    $service->approveBlockStructure($project, 'introduction-to-physics', $data);

    $topic = CanonicalTopic::query()->where('slug', 'introduction-to-physics')->first();
    $item = SchemeOfWorkItem::query()
        ->where('curriculum_subject_level_id', $levelSubject->id)
        ->where('week_number', 1)
        ->first();

    expect($item->canonical_topic_id)->toBe($topic->id);
});
