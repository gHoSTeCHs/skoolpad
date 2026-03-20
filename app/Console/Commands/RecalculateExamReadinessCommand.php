<?php

namespace App\Console\Commands;

use App\Enums\StudentType;
use App\Models\StudentProfile;
use App\Services\ExamReadinessService;
use Illuminate\Console\Command;

class RecalculateExamReadinessCommand extends Command
{
    protected $signature = 'parent:recalculate-readiness';

    protected $description = 'Recalculate exam readiness scores for all secondary students';

    public function handle(ExamReadinessService $readinessService): int
    {
        $profiles = StudentProfile::query()
            ->where('student_type', StudentType::Secondary)
            ->whereNotNull('education_level_id')
            ->with('user')
            ->cursor();

        $processed = 0;
        $errors = 0;

        foreach ($profiles as $profile) {
            try {
                $readinessService->recalculateAll($profile->user);
                $processed++;
            } catch (\Throwable $e) {
                $errors++;
                report($e);
            }
        }

        $this->info("Recalculated readiness for {$processed} students. Errors: {$errors}");

        return self::SUCCESS;
    }
}
