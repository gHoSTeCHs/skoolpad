<?php

namespace App\Console\Commands;

use App\Models\ExamTimetableEntry;
use Illuminate\Console\Command;

class ArchivePastExamsCommand extends Command
{
    protected $signature = 'exam-timetable:archive-past';

    protected $description = 'Mark past exam entries as completed';

    public function handle(): int
    {
        $entries = ExamTimetableEntry::query()
            ->where('is_completed', false)
            ->where('exam_date', '<', now()->toDateString())
            ->get();

        foreach ($entries as $entry) {
            $entry->update([
                'is_completed' => true,
                'completed_at' => $entry->exam_date->endOfDay(),
            ]);
        }

        $this->info("Archived {$entries->count()} past exam(s).");

        return self::SUCCESS;
    }
}
