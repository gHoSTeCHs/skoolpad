<?php

namespace App\Console\Commands;

use App\Enums\ParentChildLinkStatus;
use App\Models\ParentChildLink;
use App\Services\ParentFeatureGateService;
use App\Services\ParentNotificationService;
use Illuminate\Console\Command;

class SendWeeklyParentReportsCommand extends Command
{
    protected $signature = 'parent:send-weekly-reports';

    protected $description = 'Send weekly study reports to parents with active premium subscriptions';

    public function handle(ParentNotificationService $notificationService, ParentFeatureGateService $featureGate): int
    {
        $links = ParentChildLink::query()
            ->where('status', ParentChildLinkStatus::Active)
            ->with(['parentProfile.user', 'studentProfile.user'])
            ->cursor();

        $sent = 0;
        $skipped = 0;

        foreach ($links as $link) {
            $parentProfile = $link->parentProfile;
            $studentProfile = $link->studentProfile;

            if (! $parentProfile?->user || ! $studentProfile?->user) {
                $skipped++;

                continue;
            }

            if (! $featureGate->canAccessWeeklyReport($parentProfile->user)) {
                $skipped++;

                continue;
            }

            try {
                $notificationService->sendWeeklyReport($parentProfile, $studentProfile);
                $sent++;
            } catch (\Throwable $e) {
                $skipped++;
                report($e);
            }
        }

        $this->info("Sent {$sent} weekly report(s). Skipped {$skipped}.");

        return self::SUCCESS;
    }
}
