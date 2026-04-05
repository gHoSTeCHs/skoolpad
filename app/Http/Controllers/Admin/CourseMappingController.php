<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TopicWeight;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateCourseMappingRequest;
use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\InstitutionCourse;
use App\Services\Admin\CourseMappingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CourseMappingController extends Controller
{
    public function __construct(
        private readonly CourseMappingService $courseMappingService,
    ) {}

    public function index(InstitutionCourse $course): Response
    {
        $course->load(['discipline', 'institution']);

        $mappedTopics = $course->topicMappings()
            ->with('topic:id,title,difficulty_level')
            ->orderBy('sequence_order')
            ->get()
            ->map(fn (CourseTopicMapping $m) => [
                'id' => $m->id,
                'canonical_topic_id' => $m->canonical_topic_id,
                'title' => $m->topic->title,
                'difficulty_level' => $m->topic->difficulty_level->value,
                'sequence_order' => $m->sequence_order,
                'weight' => $m->weight->value,
            ])
            ->values()
            ->all();

        $mappedTopicIds = collect($mappedTopics)->pluck('canonical_topic_id')->all();

        $availableTopics = CanonicalTopic::forDiscipline($course->discipline_id)
            ->whereNotIn('id', $mappedTopicIds)
            ->where('is_published', true)
            ->orderBy('title')
            ->get(['id', 'title', 'difficulty_level'])
            ->map(fn (CanonicalTopic $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'difficulty_level' => $t->difficulty_level->value,
            ])
            ->values()
            ->all();

        $weightOptions = collect(TopicWeight::cases())
            ->map(fn (TopicWeight $w) => [
                'value' => $w->value,
                'label' => $w->label(),
            ])
            ->all();

        return Inertia::render('admin/courses/mappings', [
            'course' => [
                'id' => $course->id,
                'course_code' => $course->course_code,
                'course_title' => $course->course_title,
                'discipline' => [
                    'id' => $course->discipline->id,
                    'name' => $course->discipline->name,
                ],
                'institution' => [
                    'name' => $course->institution->name,
                ],
            ],
            'mapped_topics' => $mappedTopics,
            'available_topics' => $availableTopics,
            'weight_options' => $weightOptions,
        ]);
    }

    public function update(UpdateCourseMappingRequest $request, InstitutionCourse $course): RedirectResponse
    {
        $this->courseMappingService->saveTopicMappings($course, $request->validated('mappings'));

        return back()->with('success', 'Topic mappings updated.');
    }
}
