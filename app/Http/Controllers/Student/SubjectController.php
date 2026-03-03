<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\BlockCompletion;
use App\Models\LevelSubject;
use App\Models\TopicCompletion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function show(LevelSubject $levelSubject, Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        abort_unless(
            $profile
            && $profile->education_level_id === $levelSubject->education_level_id
            && (! $levelSubject->stream_id || $levelSubject->stream_id === $profile->stream_id),
            403,
            'You do not have access to this subject.'
        );

        $levelSubject->load([
            'curriculumSubject:id,name',
            'educationLevel:id,name,display_name',
            'stream:id,name',
        ]);

        $items = $levelSubject->schemeOfWorkItems()
            ->with([
                'canonicalTopic:id,title,slug',
                'contentBlock:id,title,estimated_read_time',
            ])
            ->orderBy('term')
            ->orderBy('week_number')
            ->get();

        $topicIds = $items->pluck('canonical_topic_id')->filter()->unique()->values();
        $blockIds = $items->pluck('content_block_id')->filter()->unique()->values();

        $completedTopicIds = TopicCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('canonical_topic_id', $topicIds)
            ->pluck('canonical_topic_id')
            ->toArray();

        $completedBlockIds = BlockCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('content_block_id', $blockIds)
            ->pluck('content_block_id')
            ->toArray();

        $completedCount = 0;
        $totalCount = $items->count();

        $terms = $items
            ->groupBy('term')
            ->map(function ($termItems, $term) use ($completedTopicIds, $completedBlockIds, &$completedCount) {
                $weeks = $termItems->groupBy('week_number')->map(function ($weekItems, $week) use ($completedTopicIds, $completedBlockIds, &$completedCount) {
                    return [
                        'week' => $week,
                        'items' => $weekItems->map(function ($item) use ($completedTopicIds, $completedBlockIds, &$completedCount) {
                            $isCompleted = false;
                            if ($item->content_block_id && in_array($item->content_block_id, $completedBlockIds)) {
                                $isCompleted = true;
                            } elseif ($item->canonical_topic_id && in_array($item->canonical_topic_id, $completedTopicIds)) {
                                $isCompleted = true;
                            }

                            if ($isCompleted) {
                                $completedCount++;
                            }

                            return [
                                'id' => $item->id,
                                'topic_label' => $item->topic_label,
                                'canonical_topic_id' => $item->canonical_topic_id,
                                'content_block_id' => $item->content_block_id,
                                'topic_title' => $item->canonicalTopic?->title,
                                'topic_slug' => $item->canonicalTopic?->slug,
                                'block_title' => $item->contentBlock?->title,
                                'estimated_read_time' => $item->contentBlock?->estimated_read_time,
                                'is_completed' => $isCompleted,
                            ];
                        })->values(),
                    ];
                })->values();

                return [
                    'term' => $term,
                    'weeks' => $weeks,
                ];
            })
            ->values();

        return Inertia::render('subjects/show', [
            'subject' => [
                'id' => $levelSubject->id,
                'name' => $levelSubject->curriculumSubject->name,
                'is_compulsory' => $levelSubject->is_compulsory,
                'education_level' => $levelSubject->educationLevel->display_name ?? $levelSubject->educationLevel->name ?? null,
                'stream' => $levelSubject->stream?->name,
            ],
            'terms' => $terms,
            'progress' => [
                'completed' => $completedCount,
                'total' => $totalCount,
            ],
        ]);
    }
}
