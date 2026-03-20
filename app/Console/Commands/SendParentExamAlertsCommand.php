<?php

namespace App\Console\Commands;

use App\Enums\ParentChildLinkStatus;
use App\Models\ParentChildLink;
use App\Services\ParentFeatureGateService;
use App\Services\ParentNotificationService;
use Illuminate\Console\Command;

class SendParentExamAlertsCommand extends Command
{
    protected $signature = 'parent:send-exam-alerts';

    protected $description = 'Send exam alerts to parents within alert windows';

    public function handle(ParentNotificationService $notificationService, ParentFeatureGateService $featureGate): int
    {
        $eligibleExams = $notificationService->getAlertEligibleExams();

        $sent = 0;
        $skipped = 0;

        foreach ($eligibleExams as $exam) {
            $childUser = $exam->user;
            $studentProfile = $childUser?->studentProfile;

            if (! $studentProfile) {
                $skipped++;

                continue;
            }

            $links = ParentChildLink::query()
                ->where('student_profile_id', $studentProfile->id)
                ->where('status', ParentChildLinkStatus::Active)
                ->with('parentProfile.user')
                ->get();

            foreach ($links as $link) {
                $parentUser = $link->parentProfile?->user;

                if (! $parentUser) {
                    $skipped++;

                    continue;
                }

                if (! $featureGate->canAccessExamAlerts($parentUser)) {
                    $skipped++;

                    continue;
                }

                try {
                    $notificationService->sendExamAlert($link, $exam);
                    $sent++;
                } catch (\Throwable $e) {
                    $skipped++;
                    report($e);
                }
            }
        }

        $this->info("Sent {$sent} exam alert(s). Skipped {$skipped}.");

        return self::SUCCESS;
    }
}
