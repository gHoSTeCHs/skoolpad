<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TeachingDepth;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateCourseBlockMappingRequest;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseBlockMapping;
use App\Models\InstitutionCourse;
use App\Services\Admin\CourseMappingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CourseBlockMappingController extends Controller
{
    public function __construct(
        private readonly CourseMappingService $courseMappingService,
    ) {}

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

    public function update(UpdateCourseBlockMappingRequest $request, InstitutionCourse $course): RedirectResponse
    {
        $this->courseMappingService->saveCourseBlockMappings($course, $request->validated('mappings'));

        return back()->with('success', 'Block mappings updated.');
    }
}
