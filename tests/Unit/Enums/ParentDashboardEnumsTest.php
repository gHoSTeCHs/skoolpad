<?php

use App\Enums\AccountType;
use App\Enums\CheckInSessionStatus;
use App\Enums\Term;
use App\Enums\TopicCoverageSource;
use App\Enums\TopicCoverageStatus;

test('AccountType has correct cases and labels', function () {
    expect(AccountType::cases())->toHaveCount(2);
    expect(AccountType::Student->value)->toBe('student');
    expect(AccountType::Parent->value)->toBe('parent');
    expect(AccountType::Student->label())->toBe('Student');
    expect(AccountType::Parent->label())->toBe('Parent');
});

test('AccountType provides select options', function () {
    $options = AccountType::toSelectOptions();

    expect($options)->toHaveCount(2);
    expect($options[0])->toMatchArray(['value' => 'student', 'label' => 'Student']);
    expect($options[1])->toMatchArray(['value' => 'parent', 'label' => 'Parent']);
});

test('TopicCoverageStatus has correct cases and labels', function () {
    expect(TopicCoverageStatus::cases())->toHaveCount(3);
    expect(TopicCoverageStatus::NotYetCovered->value)->toBe('not_yet_covered');
    expect(TopicCoverageStatus::Covered->value)->toBe('covered');
    expect(TopicCoverageStatus::Skipped->value)->toBe('skipped');
    expect(TopicCoverageStatus::NotYetCovered->label())->toBe('Not Yet Covered');
});

test('TopicCoverageSource has correct cases and labels', function () {
    expect(TopicCoverageSource::cases())->toHaveCount(3);
    expect(TopicCoverageSource::SchemeDefault->value)->toBe('scheme_default');
    expect(TopicCoverageSource::ParentReported->value)->toBe('parent_reported');
    expect(TopicCoverageSource::AppActivity->value)->toBe('app_activity');
});

test('Term has correct cases, labels, and toInt mapping', function () {
    expect(Term::cases())->toHaveCount(3);
    expect(Term::First->value)->toBe('first');
    expect(Term::Second->value)->toBe('second');
    expect(Term::Third->value)->toBe('third');
    expect(Term::First->label())->toBe('First Term');
    expect(Term::First->toInt())->toBe(1);
    expect(Term::Second->toInt())->toBe(2);
    expect(Term::Third->toInt())->toBe(3);
});

test('CheckInSessionStatus has correct cases and labels', function () {
    expect(CheckInSessionStatus::cases())->toHaveCount(3);
    expect(CheckInSessionStatus::Pending->value)->toBe('pending');
    expect(CheckInSessionStatus::InProgress->value)->toBe('in_progress');
    expect(CheckInSessionStatus::Completed->value)->toBe('completed');
    expect(CheckInSessionStatus::InProgress->label())->toBe('In Progress');
});
