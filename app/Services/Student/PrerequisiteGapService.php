<?php

namespace App\Services\Student;

use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\PracticeAnswer;
use App\Models\TopicCompletion;
use App\Models\User;

class PrerequisiteGapService
{
    /**
     * @return array{banner: string, prerequisites: array<int, array{id: string, title: string, is_hard: bool, status: string, accuracy: float|null}>}
     */
    public function getPrerequisiteStatus(User $user, CanonicalTopic $topic): array
    {
        $prerequisites = $topic->prerequisites()
            ->get(['canonical_topics.id', 'canonical_topics.title', 'topic_prerequisites.is_hard_prerequisite']);

        if ($prerequisites->isEmpty()) {
            return ['banner' => 'none', 'prerequisites' => []];
        }

        $completedTopicIds = TopicCompletion::query()->where('user_id', $user->id)
            ->whereIn('canonical_topic_id', $prerequisites->pluck('id'))
            ->pluck('canonical_topic_id')
            ->toArray();

        $accuracyByTopic = $this->calculateAccuracyByTopic($user, $prerequisites->pluck('id')->toArray());

        $results = $prerequisites->map(function ($prereq) use ($completedTopicIds, $accuracyByTopic) {
            $isCompleted = in_array($prereq->id, $completedTopicIds);
            $accuracy = $accuracyByTopic[$prereq->id] ?? null;

            if ($isCompleted && ($accuracy === null || $accuracy >= 60)) {
                $status = 'completed';
            } elseif ($accuracy !== null) {
                $status = 'attempted';
            } else {
                $status = 'not_started';
            }

            return [
                'id' => $prereq->id,
                'title' => $prereq->title,
                'is_hard' => (bool) $prereq->pivot->is_hard_prerequisite,
                'status' => $status,
                'accuracy' => $accuracy,
            ];
        })->values()->all();

        $banner = $this->determineBanner($results);

        return ['banner' => $banner, 'prerequisites' => $results];
    }

    /**
     * @param  array<int, string>  $topicIds
     * @return array<string, float>
     */
    private function calculateAccuracyByTopic(User $user, array $topicIds): array
    {
        $answers = PracticeAnswer::query()
            ->whereHas('practiceSession', fn ($q) => $q
                ->where('user_id', $user->id)
                ->whereIn('canonical_topic_id', $topicIds)
            )
            ->join('practice_sessions', 'practice_answers.practice_session_id', '=', 'practice_sessions.id')
            ->selectRaw('practice_sessions.canonical_topic_id, count(*) as total, sum(case when practice_answers.is_correct then 1 else 0 end) as correct')
            ->groupBy('practice_sessions.canonical_topic_id')
            ->get();

        $result = [];
        foreach ($answers as $row) {
            if ($row->total > 0) {
                $result[$row->canonical_topic_id] = round(($row->correct / $row->total) * 100, 1);
            }
        }

        return $result;
    }

    /** @return array<int, string> */
    public function getLockedBlockIds(User $user, CanonicalTopic $topic): array
    {
        $blocksWithHardPrereqs = ContentBlock::query()->where('canonical_topic_id', $topic->id)
            ->whereHas('prerequisites', fn ($q) => $q->where('block_prerequisites.is_hard_prerequisite', true))
            ->with(['prerequisites' => fn ($q) => $q->where('block_prerequisites.is_hard_prerequisite', true)])
            ->get();

        if ($blocksWithHardPrereqs->isEmpty()) {
            return [];
        }

        $allPrereqIds = $blocksWithHardPrereqs->flatMap(
            fn ($block) => $block->prerequisites->pluck('id')
        )->unique()->values()->all();

        $completedBlockIds = BlockCompletion::query()->where('user_id', $user->id)
            ->whereIn('content_block_id', $allPrereqIds)
            ->pluck('content_block_id')
            ->toArray();

        $lockedIds = [];
        foreach ($blocksWithHardPrereqs as $block) {
            foreach ($block->prerequisites as $prereq) {
                if (! in_array($prereq->id, $completedBlockIds)) {
                    $lockedIds[] = $block->id;
                    break;
                }
            }
        }

        return $lockedIds;
    }

    /**
     * @param  array<int, array{is_hard: bool, status: string}>  $results
     */
    private function determineBanner(array $results): string
    {
        $allMet = true;
        $anyHardUnmet = false;
        $allHardUnmet = true;
        $hasHard = false;

        foreach ($results as $prereq) {
            if ($prereq['status'] !== 'completed') {
                $allMet = false;
            }

            if ($prereq['is_hard']) {
                $hasHard = true;
                if ($prereq['status'] !== 'completed') {
                    $anyHardUnmet = true;
                } else {
                    $allHardUnmet = false;
                }
            }
        }

        if ($allMet) {
            return 'success';
        }

        if ($hasHard && $anyHardUnmet && $allHardUnmet) {
            return 'danger';
        }

        return 'warning';
    }
}
