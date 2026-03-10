<?php

use App\Models\ExamTimetableEntry;

it('archives past incomplete exams', function () {
    $pastEntry = ExamTimetableEntry::factory()->withCourse()->create([
        'exam_date' => now()->subDays(3),
        'is_completed' => false,
    ]);

    $this->artisan('exam-timetable:archive-past')
        ->expectsOutputToContain('Archived 1')
        ->assertExitCode(0);

    $pastEntry->refresh();
    expect($pastEntry->is_completed)->toBeTrue();
    expect($pastEntry->completed_at)->not->toBeNull();
});

it('skips future exams', function () {
    $futureEntry = ExamTimetableEntry::factory()->withCourse()->create([
        'exam_date' => now()->addDays(7),
        'is_completed' => false,
    ]);

    $this->artisan('exam-timetable:archive-past')
        ->expectsOutputToContain('Archived 0')
        ->assertExitCode(0);

    expect($futureEntry->fresh()->is_completed)->toBeFalse();
});

it('skips already completed exams', function () {
    $completedEntry = ExamTimetableEntry::factory()->withCourse()->completed()->create([
        'exam_date' => now()->subDays(5),
    ]);

    $originalCompletedAt = $completedEntry->completed_at->toISOString();

    $this->artisan('exam-timetable:archive-past')
        ->expectsOutputToContain('Archived 0')
        ->assertExitCode(0);

    expect($completedEntry->fresh()->completed_at->toISOString())->toBe($originalCompletedAt);
});
