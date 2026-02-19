<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\TopicDifficulty;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCanonicalTopicRequest;
use App\Http\Requests\Admin\UpdateCanonicalTopicRequest;
use App\Models\CanonicalTopic;
use App\Models\Discipline;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CanonicalTopicController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $topics = CanonicalTopic::query()
            ->with(['discipline:id,name', 'parent:id,title'])
            ->when($request->filled('discipline_id'), fn ($q) => $q->where('discipline_id', $request->string('discipline_id')))
            ->when($request->filled('difficulty_level'), fn ($q) => $q->where('difficulty_level', $request->string('difficulty_level')))
            ->when($request->has('is_published'), fn ($q) => $q->where('is_published', $request->boolean('is_published')))
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->tap(fn ($q) => $this->applySorting($q, $request, ['title', 'difficulty_level', 'created_at'], 'created_at', 'desc'))
            ->paginate(20)
            ->withQueryString();

        $topics->through(fn ($topic) => [
            'id' => $topic->id,
            'title' => $topic->title,
            'slug' => $topic->slug,
            'difficulty_level' => $topic->difficulty_level,
            'is_published' => $topic->is_published,
            'published_at' => $topic->published_at,
            'estimated_read_minutes' => $topic->estimated_read_minutes,
            'created_at' => $topic->created_at,
            'discipline' => $topic->discipline ? [
                'id' => $topic->discipline->id,
                'name' => $topic->discipline->name,
            ] : null,
            'parent' => $topic->parent ? [
                'id' => $topic->parent->id,
                'title' => $topic->parent->title,
            ] : null,
        ]);

        return Inertia::render('admin/topics/index', [
            'topics' => $this->paginated($topics),
            'disciplines' => Discipline::all(['id', 'name']),
            'filters' => $request->only(['search', 'discipline_id', 'difficulty_level', 'is_published', 'sort', 'direction']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/topics/create', [
            'disciplines' => Discipline::all(['id', 'name']),
            'difficulty_levels' => array_map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], TopicDifficulty::cases()),
        ]);
    }

    public function store(StoreCanonicalTopicRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $prerequisites = $data['prerequisites'] ?? null;
        unset($data['prerequisites']);

        if (! empty($data['is_published'])) {
            $data['published_at'] = now();
        }

        $topic = CanonicalTopic::create($data);

        if ($prerequisites) {
            $topic->prerequisites()->sync(
                collect($prerequisites)->mapWithKeys(fn ($p) => [
                    $p['id'] => ['is_hard_prerequisite' => $p['is_hard_prerequisite']],
                ])->all()
            );
        }

        return to_route('admin.topics.edit', $topic)->with('success', 'Topic created.');
    }

    public function edit(CanonicalTopic $topic): Response
    {
        $topic->load(['discipline', 'prerequisites', 'parent']);

        return Inertia::render('admin/topics/edit', [
            'topic' => [
                'id' => $topic->id,
                'title' => $topic->title,
                'slug' => $topic->slug,
                'discipline_id' => $topic->discipline_id,
                'parent_topic_id' => $topic->parent_topic_id,
                'difficulty_level' => $topic->difficulty_level,
                'content' => $topic->content,
                'content_plain' => $topic->content_plain,
                'summary' => $topic->summary,
                'estimated_read_minutes' => $topic->estimated_read_minutes,
                'is_published' => $topic->is_published,
                'published_at' => $topic->published_at,
                'prerequisites' => $topic->prerequisites->map(fn ($prereq) => [
                    'id' => $prereq->id,
                    'title' => $prereq->title,
                    'is_hard_prerequisite' => (bool) $prereq->pivot->is_hard_prerequisite,
                ]),
            ],
            'disciplines' => Discipline::all(['id', 'name']),
            'difficulty_levels' => array_map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], TopicDifficulty::cases()),
            'available_topics' => CanonicalTopic::query()
                ->where('discipline_id', $topic->discipline_id)
                ->where('id', '!=', $topic->id)
                ->get(['id', 'title']),
        ]);
    }

    public function update(UpdateCanonicalTopicRequest $request, CanonicalTopic $topic): RedirectResponse
    {
        $data = $request->validated();
        $prerequisites = $data['prerequisites'] ?? [];
        unset($data['prerequisites']);

        if (! empty($data['is_published']) && $topic->published_at === null) {
            $data['published_at'] = now();
        }

        $topic->update($data);

        $topic->prerequisites()->sync(
            collect($prerequisites)->mapWithKeys(fn ($p) => [
                $p['id'] => ['is_hard_prerequisite' => $p['is_hard_prerequisite']],
            ])->all()
        );

        return to_route('admin.topics.edit', $topic)->with('success', 'Topic updated.');
    }

    public function preview(CanonicalTopic $topic): Response
    {
        return Inertia::render('admin/topics/preview', [
            'topic' => [
                'title' => $topic->title,
                'content' => $topic->content,
                'summary' => $topic->summary,
                'difficulty_level' => $topic->difficulty_level,
                'estimated_read_minutes' => $topic->estimated_read_minutes,
            ],
        ]);
    }

    public function togglePublish(CanonicalTopic $topic): RedirectResponse
    {
        $topic->is_published = ! $topic->is_published;

        if ($topic->is_published && $topic->published_at === null) {
            $topic->published_at = now();
        }

        $topic->save();

        $status = $topic->is_published ? 'published' : 'unpublished';

        return back()->with('success', "Topic {$status}.");
    }
}
