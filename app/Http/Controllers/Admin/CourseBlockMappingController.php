<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TeachingDepth;
use App\Http\Controllers\Controller;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseBlockMapping;
use App\Models\InstitutionCourse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;
use Inertia\Response;

class CourseBlockMappingController extends Controller
{
    public function index(InstitutionCourse $course): Response
    {
        $course->load(['discipline', 'institution']);

        $mappings = $course->courseBlockMappings()
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
                'week_start' => $m->week_start,
                'week_end' => $m->week_end,
                'lecture_hours' => $m->lecture_hours,
                'lab_hours' => $m->lab_hours,
            ])
            ->values()
            ->all();

        $topics = CanonicalTopic::forDiscipline($course->discipline_id)
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
            ->all();

        return Inertia::render('admin/courses/block-mappings', [
            'course' => [
                'id' => $course->id,
                'course_code' => $course->course_code,
                'course_title' => $course->course_title,
                'discipline' => ['id' => $course->discipline->id, 'name' => $course->discipline->name],
                'institution' => ['name' => $course->institution->name],
            ],
            'mappings' => $mappings,
            'topics' => $topics,
            'teachingDepths' => TeachingDepth::toSelectOptions(),
        ]);
    }

    public function update(Request $request, InstitutionCourse $course): RedirectResponse
    {
        $validated = $request->validate([
            'mappings' => ['present', 'array'],
            'mappings.*.content_block_id' => ['required', 'uuid', 'exists:content_blocks,id'],
            'mappings.*.teaching_depth' => ['required', new Enum(TeachingDepth::class)],
            'mappings.*.is_core_block' => ['required', 'boolean'],
            'mappings.*.week_start' => ['nullable', 'integer', 'min:1'],
            'mappings.*.week_end' => ['nullable', 'integer', 'min:1', 'gte:mappings.*.week_start'],
            'mappings.*.lecture_hours' => ['nullable', 'numeric', 'min:0'],
            'mappings.*.lab_hours' => ['nullable', 'numeric', 'min:0'],
        ]);

        $course->courseBlockMappings()->delete();

        $now = now();
        $rows = collect($validated['mappings'])->map(fn (array $m) => [
            'id' => Str::uuid()->toString(),
            'institution_course_id' => $course->id,
            'curriculum_subject_level_id' => null,
            'content_block_id' => $m['content_block_id'],
            'teaching_depth' => $m['teaching_depth'],
            'is_core_block' => $m['is_core_block'],
            'week_start' => $m['week_start'] ?? null,
            'week_end' => $m['week_end'] ?? null,
            'lecture_hours' => $m['lecture_hours'] ?? null,
            'lab_hours' => $m['lab_hours'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        if (! empty($rows)) {
            CourseBlockMapping::insert($rows);
        }

        return back()->with('success', 'Block mappings updated.');
    }
}
