<?php

namespace App\Console\Commands;

use App\Enums\ParentChildLinkStatus;
use App\Models\ParentChildLink;
use App\Services\ParentCheckInService;
use Illuminate\Console\Command;

class GenerateNightlyCheckInsCommand extends Command
{
    protected $signature = 'parent:generate-check-ins';

    protected $description = 'Pre-generate check-in sessions for all active parent-child links';

    public function handle(ParentCheckInService $checkInService): int
    {
        $today = now()->toDateString();

        $links = ParentChildLink::query()
            ->where('status', ParentChildLinkStatus::Active)
            ->whereDoesntHave('checkInSessions', fn ($q) => $q->forDate($today))
            ->cursor();

        $generated = 0;
        $errors = 0;

        foreach ($links as $link) {
            try {
                $checkInService->generateCheckIn($link);
                $generated++;
            } catch (\Throwable $e) {
                $errors++;
                report($e);
            }
        }

        $this->info("Generated {$generated} check-in sessions. Errors: {$errors}");

        return self::SUCCESS;
    }
}
