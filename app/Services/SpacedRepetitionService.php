<?php

namespace App\Services;

use App\Enums\SpacedRepetitionStatus;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\SpacedRepetitionItem;
use App\Models\User;
use Illuminate\Support\Collection;

class SpacedRepetitionService
{
    private const INTERVAL_MAP = [0 => 1, 1 => 3, 2 => 7, 3 => 21];

    public function scheduleReview(User $user, Question $question, bool $isCorrect): SpacedRepetitionItem
    {
        $item = SpacedRepetitionItem::firstOrNew([
            'user_id' => $user->id,
            'question_id' => $question->id,
        ]);

        if (! $item->exists) {
            $item->ease_factor = 2.50;
            $item->repetition_count = 0;
            $item->interval_days = 1;
            $item->status = SpacedRepetitionStatus::Active;
        }

        if ($isCorrect) {
            $rep = $item->repetition_count;

            if ($rep >= 4) {
                $item->status = SpacedRepetitionStatus::Graduated;
                $item->interval_days = 21;
            } else {
                $item->interval_days = self::INTERVAL_MAP[$rep] ?? 21;
                $item->repetition_count = $rep + 1;
                $item->status = SpacedRepetitionStatus::Active;

                if ($item->repetition_count >= 4) {
                    $item->status = SpacedRepetitionStatus::Graduated;
                }
            }
        } else {
            $item->repetition_count = 0;
            $item->interval_days = 1;
            $item->status = SpacedRepetitionStatus::Active;
        }

        $item->last_reviewed_at = now();
        $item->next_review_at = now()->addDays($item->interval_days)->toDateString();
        $item->save();

        return $item;
    }

    public function processReviewAnswer(User $user, Question $question, bool $isCorrect): SpacedRepetitionItem
    {
        return $this->scheduleReview($user, $question, $isCorrect);
    }

    public function getDueItems(User $user, ?InstitutionCourse $course = null, ?int $limit = null): Collection
    {
        return SpacedRepetitionItem::query()
            ->where('user_id', $user->id)
            ->where('status', SpacedRepetitionStatus::Active)
            ->whereDate('next_review_at', '<=', today())
            ->when($course, fn ($q) => $q->whereHas('question', fn ($sub) => $sub->where('institution_course_id', $course->id)))
            ->with(['question:id,institution_course_id,content,question_type,difficulty_level', 'question.institutionCourse:id,course_code'])
            ->orderBy('next_review_at', 'asc')
            ->limit($limit ?? (int) config('practice.review_queue_limit', 50))
            ->get();
    }

    public function getDueCount(User $user, ?InstitutionCourse $course = null): int
    {
        return SpacedRepetitionItem::query()
            ->where('user_id', $user->id)
            ->where('status', SpacedRepetitionStatus::Active)
            ->whereDate('next_review_at', '<=', today())
            ->when($course, fn ($q) => $q->whereHas('question', fn ($sub) => $sub->where('institution_course_id', $course->id)))
            ->count();
    }

    /** @return array<int, int> */
    public function getUpcomingCounts(User $user, int $days = 14): array
    {
        $counts = [];

        for ($i = 0; $i < $days; $i++) {
            $date = today()->addDays($i)->toDateString();

            $counts[$i] = SpacedRepetitionItem::query()
                ->where('user_id', $user->id)
                ->where('status', SpacedRepetitionStatus::Active)
                ->whereDate('next_review_at', $date)
                ->count();
        }

        return $counts;
    }
}
