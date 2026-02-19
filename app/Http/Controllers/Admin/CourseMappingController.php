<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TopicWeight;
use App\Http\Controllers\Controller;
use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\InstitutionCourse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CourseMappingController extends Controller
{
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

    public function update(Request $request, InstitutionCourse $course): RedirectResponse
    {
        $validated = $request->validate([
            'mappings' => ['present', 'array'],
            'mappings.*.canonical_topic_id' => ['required', 'string', 'exists:canonical_topics,id'],
            'mappings.*.sequence_order' => ['required', 'integer', 'min:1'],
            'mappings.*.weight' => ['required', 'string', Rule::in(TopicWeight::values())],
        ]);

        $course->topicMappings()->delete();

        $now = now();
        $rows = collect($validated['mappings'])->map(fn (array $mapping) => [
            'id' => Str::uuid()->toString(),
            'institution_course_id' => $course->id,
            'canonical_topic_id' => $mapping['canonical_topic_id'],
            'sequence_order' => $mapping['sequence_order'],
            'weight' => $mapping['weight'],
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        if (! empty($rows)) {
            CourseTopicMapping::insert($rows);
        }

        return back()->with('success', 'Topic mappings updated.');
    }
}
