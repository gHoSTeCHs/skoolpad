<?php

namespace App\Console\Commands;

use App\Models\PracticeSession;
use Illuminate\Console\Command;

class ExpirePracticeSessionsCommand extends Command
{
    protected $signature = 'practice:expire-sessions';

    protected $description = 'Expire practice sessions inactive for 24+ hours';

    public function handle(): int
    {
        $count = PracticeSession::query()
            ->where('is_resumable', true)
            ->whereNull('completed_at')
            ->where('last_activity_at', '<', now()->subHours(24))
            ->update(['is_resumable' => false]);

        $this->info("Expired {$count} practice session(s).");

        return self::SUCCESS;
    }
}
