<?php

namespace App\Console\Commands;

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

        $result = $notificationService->sendBatchExamAlerts($eligibleExams, $featureGate);

        $this->info("Sent {$result['sent']} exam alert(s). Skipped {$result['skipped']}.");

        return self::SUCCESS;
    }
}
