<?php

use App\Enums\AcademicStatus;
use App\Enums\AccountType;
use App\Enums\AnswerDepthLevel;
use App\Enums\BillingPeriod;
use App\Enums\CheckInSessionStatus;
use App\Enums\ContentSubmissionStatus;
use App\Enums\ContentSubmissionType;
use App\Enums\ContributionBadge;
use App\Enums\CourseScope;
use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use App\Enums\PracticeMode;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\Semester;
use App\Enums\SpacedRepetitionStatus;
use App\Enums\Term;
use App\Enums\TopicCoverageSource;
use App\Enums\TopicCoverageStatus;
use App\Enums\TopicDifficulty;
use App\Enums\TopicWeight;
use App\Enums\UserRole;

dataset('enums', [
    'UserRole' => [UserRole::class, 6],
    'InstitutionType' => [InstitutionType::class, 4],
    'OwnershipType' => [OwnershipType::class, 3],
    'CourseScope' => [CourseScope::class, 3],
    'Semester' => [Semester::class, 3],
    'TopicWeight' => [TopicWeight::class, 3],
    'TopicDifficulty' => [TopicDifficulty::class, 3],
    'QuestionDifficulty' => [QuestionDifficulty::class, 3],
    'QuestionType' => [QuestionType::class, 16],
    'QuestionStatus' => [QuestionStatus::class, 4],
    'QuestionSource' => [QuestionSource::class, 4],
    'AnswerDepthLevel' => [AnswerDepthLevel::class, 3],
    'ContentSubmissionType' => [ContentSubmissionType::class, 4],
    'ContentSubmissionStatus' => [ContentSubmissionStatus::class, 3],
    'PracticeMode' => [PracticeMode::class, 8],
    'SpacedRepetitionStatus' => [SpacedRepetitionStatus::class, 3],
    'ContributionBadge' => [ContributionBadge::class, 4],
    'BillingPeriod' => [BillingPeriod::class, 3],
    'AcademicStatus' => [AcademicStatus::class, 3],
    'AccountType' => [AccountType::class, 2],
    'TopicCoverageStatus' => [TopicCoverageStatus::class, 3],
    'TopicCoverageSource' => [TopicCoverageSource::class, 3],
    'Term' => [Term::class, 3],
    'CheckInSessionStatus' => [CheckInSessionStatus::class, 3],
]);

test('enum has correct case count and labels', function (string $enumClass, int $expectedCount) {
    $cases = $enumClass::cases();

    expect($cases)->toHaveCount($expectedCount);

    foreach ($cases as $case) {
        expect($case->label())->toBeString()->not->toBeEmpty();
    }
})->with('enums');
