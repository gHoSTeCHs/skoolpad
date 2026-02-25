<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CanonicalTopic;
use App\Models\EducationSystem;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SchemeOfWorkController extends Controller
{
    public function index(): Response
    {
        $educationSystems = EducationSystem::with([
            'curriculumTiers' => fn ($q) => $q->orderBy('sort_order'),
            'curriculumTiers.educationLevels' => fn ($q) => $q->orderBy('sort_order'),
            'curriculumSubjects' => fn ($q) => $q->orderBy('name'),
            'streams' => fn ($q) => $q->orderBy('name'),
        ])->orderBy('name')->get();

        return Inertia::render('admin/scheme-of-work/index', [
            'educationSystems' => $educationSystems,
            'topics' => CanonicalTopic::where('is_published', true)
                ->orderBy('title')
                ->get(['id', 'title']),
        ]);
    }

    public function load(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'education_level_id' => ['required', 'uuid', 'exists:education_levels,id'],
            'curriculum_subject_id' => ['required', 'uuid', 'exists:curriculum_subjects,id'],
            'stream_id' => ['nullable', 'uuid', 'exists:streams,id'],
            'term' => ['required', 'integer', 'min:1', 'max:3'],
        ]);

        $levelSubject = LevelSubject::firstOrCreate(
            [
                'education_level_id' => $validated['education_level_id'],
                'curriculum_subject_id' => $validated['curriculum_subject_id'],
                'stream_id' => $validated['stream_id'] ?? null,
            ],
            ['is_compulsory' => true]
        );

        $items = SchemeOfWorkItem::where('curriculum_subject_level_id', $levelSubject->id)
            ->where('term', $validated['term'])
            ->with(['canonicalTopic:id,title', 'contentBlock:id,title,path'])
            ->orderBy('week_number')
            ->get()
            ->map(fn (SchemeOfWorkItem $item) => [
                'id' => $item->id,
                'week_number' => $item->week_number,
                'topic_label' => $item->topic_label,
                'canonical_topic_id' => $item->canonical_topic_id,
                'content_block_id' => $item->content_block_id,
                'canonical_topic' => $item->canonicalTopic ? [
                    'id' => $item->canonicalTopic->id,
                    'title' => $item->canonicalTopic->title,
                ] : null,
                'content_block' => $item->contentBlock ? [
                    'id' => $item->contentBlock->id,
                    'title' => $item->contentBlock->title,
                    'path' => $item->contentBlock->path,
                ] : null,
            ])
            ->values()
            ->all();

        return response()->json([
            'level_subject_id' => $levelSubject->id,
            'items' => $items,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'curriculum_subject_level_id' => ['required', 'uuid', 'exists:level_subjects,id'],
            'term' => ['required', 'integer', 'min:1', 'max:3'],
            'items' => ['present', 'array'],
            'items.*.week_number' => ['required', 'integer', 'min:1', 'max:13'],
            'items.*.topic_label' => ['required', 'string', 'max:255'],
            'items.*.canonical_topic_id' => ['nullable', 'uuid', 'exists:canonical_topics,id'],
            'items.*.content_block_id' => ['nullable', 'uuid', 'exists:content_blocks,id'],
        ]);

        SchemeOfWorkItem::where('curriculum_subject_level_id', $validated['curriculum_subject_level_id'])
            ->where('term', $validated['term'])
            ->delete();

        $now = now();
        $rows = collect($validated['items'])->map(fn (array $item) => [
            'id' => Str::uuid()->toString(),
            'curriculum_subject_level_id' => $validated['curriculum_subject_level_id'],
            'term' => $validated['term'],
            'week_number' => $item['week_number'],
            'topic_label' => $item['topic_label'],
            'canonical_topic_id' => $item['canonical_topic_id'] ?? null,
            'content_block_id' => $item['content_block_id'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        if (! empty($rows)) {
            SchemeOfWorkItem::insert($rows);
        }

        return back()->with('success', 'Scheme of work updated.');
    }
}
