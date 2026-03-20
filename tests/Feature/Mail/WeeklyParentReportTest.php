<?php

use App\Mail\WeeklyParentReport;

test('renders weekly report email with correct subject line and content', function () {
    $reportData = [
        'child_name' => 'Adaeze',
        'study_time_minutes' => 150,
        'subjects_practiced' => ['Mathematics', 'Biology'],
        'questions_answered' => 45,
        'accuracy' => 78.5,
        'verifications' => [
            'total' => 5,
            'understood' => 4,
            'needs_review' => 1,
        ],
        'readiness_scores' => [
            ['subject_name' => 'Mathematics', 'composite_score' => 72.5],
            ['subject_name' => 'Biology', 'composite_score' => 45.0],
        ],
    ];

    $mailable = new WeeklyParentReport($reportData);

    expect($mailable->envelope()->subject)->toBe('Weekly Study Report for Adaeze — Skoolpad');

    $mailable->assertSeeInHtml('Adaeze');
    $mailable->assertSeeInHtml('2h 30m');
    $mailable->assertSeeInHtml('Mathematics');
    $mailable->assertSeeInHtml('Biology');
    $mailable->assertSeeInHtml('78.5%');
    $mailable->assertSeeInHtml('5 topics verified');
    $mailable->assertSeeInHtml('72.5%');
});

test('renders zero-activity state gracefully', function () {
    $reportData = [
        'child_name' => 'Ibrahim',
        'study_time_minutes' => 0,
        'subjects_practiced' => [],
        'questions_answered' => 0,
        'accuracy' => 0,
        'verifications' => [
            'total' => 0,
            'understood' => 0,
            'needs_review' => 0,
        ],
        'readiness_scores' => [],
    ];

    $mailable = new WeeklyParentReport($reportData);

    $mailable->assertSeeInHtml('Ibrahim');
    $mailable->assertSeeInHtml('No study activity this week');
    $mailable->assertDontSeeInHtml('Study Time');
});
