<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TeachingDepth;
use App\Http\Controllers\Controller;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseBlockMapping;
use App\Models\EducationSystem;
use App\Models\LevelSubject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;
use Inertia\Response;

class CurriculumMappingController extends Controller
{
    public function index(): Response
    {
        $educationSystems = EducationSystem::with([
            'curriculumTiers' => fn ($q) => $q->orderBy('sort_order'),
            'curriculumTiers.educationLevels' => fn ($q) => $q->orderBy('sort_order'),
            'curriculumSubjects' => fn ($q) => $q->with('discipline:id,name')->orderBy('name'),
            'streams' => fn ($q) => $q->orderBy('name'),
        ])->orderBy('name')->get();

        return Inertia::render('admin/curriculum-mappings/index', [
            'educationSystems' => $educationSystems,
            'teachingDepths' => TeachingDepth::toSelectOptions(),
        ]);
    }

    public function load(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'education_level_id' => ['required', 'uuid', 'exists:education_levels,id'],
            'curriculum_subject_id' => ['required', 'uuid', 'exists:curriculum_subjects,id'],
            'stream_id' => ['nullable', 'uuid', 'exists:streams,id'],
        ]);

        $levelSubject = LevelSubject::firstOrCreate(
            [
                'education_level_id' => $validated['education_level_id'],
                'curriculum_subject_id' => $validated['curriculum_subject_id'],
                'stream_id' => $validated['stream_id'] ?? null,
            ],
            ['is_compulsory' => true]
        );

        $mappings = CourseBlockMapping::where('curriculum_subject_level_id', $levelSubject->id)
            ->with('contentBlock:id,title,path,block_type,is_container')
            ->get()
            ->map(fn (CourseBlockMapping $m) => [
                'id' => $m->id,
                'content_block_id' => $m->content_block_id,
                'block_title' => $m->contentBlock->title,
                'block_path' => $m->contentBlock->path,
                'block_type' => $m->contentBlock->block_type->value,
                'is_container' => $m->contentBlock->is_container,
                'teaching_depth' => $m->teaching_depth->value,
                'is_core_block' => $m->is_core_block,
            ])
            ->values()
            ->all();

        $discipline = $levelSubject->curriculumSubject->discipline;
        $topics = $discipline
            ? CanonicalTopic::forDiscipline($discipline->id)
                ->where('is_published', true)
                ->whereHas('contentBlocks')
                ->with(['contentBlocks' => fn ($q) => $q->where('is_published', true)->orderBy('path')])
                ->orderBy('title')
                ->get(['id', 'title'])
                ->map(fn (CanonicalTopic $t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'blocks' => $t->contentBlocks->map(fn (ContentBlock $b) => [
                        'id' => $b->id,
                        'title' => $b->title,
                        'path' => $b->path,
                        'block_type' => $b->block_type->value,
                        'is_container' => $b->is_container,
                    ])->values()->all(),
                ])
                ->values()
                ->all()
            : [];

        return response()->json([
            'level_subject_id' => $levelSubject->id,
            'mappings' => $mappings,
            'topics' => $topics,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'curriculum_subject_level_id' => ['required', 'uuid', 'exists:level_subjects,id'],
            'mappings' => ['present', 'array'],
            'mappings.*.content_block_id' => ['required', 'uuid', 'exists:content_blocks,id'],
            'mappings.*.teaching_depth' => ['required', new Enum(TeachingDepth::class)],
            'mappings.*.is_core_block' => ['required', 'boolean'],
        ]);

        CourseBlockMapping::where('curriculum_subject_level_id', $validated['curriculum_subject_level_id'])
            ->delete();

        $now = now();
        $rows = collect($validated['mappings'])->map(fn (array $m) => [
            'id' => Str::uuid()->toString(),
            'institution_course_id' => null,
            'curriculum_subject_level_id' => $validated['curriculum_subject_level_id'],
            'content_block_id' => $m['content_block_id'],
            'teaching_depth' => $m['teaching_depth'],
            'is_core_block' => $m['is_core_block'],
            'week_start' => null,
            'week_end' => null,
            'lecture_hours' => null,
            'lab_hours' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        if (! empty($rows)) {
            CourseBlockMapping::insert($rows);
        }

        return back()->with('success', 'Curriculum block mappings updated.');
    }
}
