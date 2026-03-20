<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('practice:expire-sessions')->hourly();
Schedule::command('exam-timetable:archive-past')->daily();
Schedule::command('parent:generate-check-ins')->dailyAt('15:00')->timezone('Africa/Lagos');
Schedule::command('parent:recalculate-readiness')->everySixHours();
Schedule::command('parent:send-weekly-reports')->weeklyOn(1, '07:00')->timezone('Africa/Lagos');
Schedule::command('parent:send-exam-alerts')->dailyAt('07:00')->timezone('Africa/Lagos');
