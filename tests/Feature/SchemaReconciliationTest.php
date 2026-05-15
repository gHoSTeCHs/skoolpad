<?php

use App\Enums\QuestionSource;
use App\Models\AssessmentSubject;
use App\Models\CanonicalTopic;
use App\Models\CanonicalTopicClassAssignment;
use App\Models\CanonicalTopicVisualizationBrief;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Models\ExamSyllabusTopic;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\SchemeOfWorkItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('allows scheme_of_work_items to coexist for the same level/term/week from different sources', function () {
    $level = \App\Models\LevelSubject::factory()->create();

    $nerdc = SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $level->id,
        'source_type' => 'nerdc',
        'term' => 1,
        'week_number' => 3,
    ]);
    $waec = SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $level->id,
        'source_type' => 'waec_syllabus',
        'term' => 1,
        'week_number' => 3,
    ]);

    expect($nerdc->id)->not->toBe($waec->id);
    expect($nerdc->source_type)->toBe('nerdc');
    expect($waec->source_type)->toBe('waec_syllabus');
});

it('rejects duplicate scheme_of_work_items for the same level/source/term/week', function () {
    $level = \App\Models\LevelSubject::factory()->create();

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $level->id,
        'source_type' => 'nerdc',
        'term' => 1,
        'week_number' => 1,
    ]);

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $level->id,
        'source_type' => 'nerdc',
        'term' => 1,
        'week_number' => 1,
    ]);
})->throws(\Illuminate\Database\UniqueConstraintViolationException::class);

it('creates a canonical_topic_class_assignment with depth and term', function () {
    $topic = CanonicalTopic::factory()->create();
    $level = EducationLevel::factory()->create();

    $assignment = CanonicalTopicClassAssignment::factory()->create([
        'canonical_topic_id' => $topic->id,
        'education_level_id' => $level->id,
        'depth' => 'introduction',
        'term_index' => 2,
        'is_primary' => true,
    ]);

    expect($assignment->canonicalTopic->id)->toBe($topic->id);
    expect($assignment->educationLevel->id)->toBe($level->id);
    expect($assignment->depth)->toBe('introduction');
    expect($assignment->is_primary)->toBeTrue();
});

it('rejects invalid depth on canonical_topic_class_assignments', function () {
    $topic = CanonicalTopic::factory()->create();
    $level = EducationLevel::factory()->create();

    DB::table('canonical_topic_class_assignments')->insert([
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'canonical_topic_id' => $topic->id,
        'education_level_id' => $level->id,
        'depth' => 'INVALID_DEPTH',
        'is_primary' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
})->throws(\Illuminate\Database\QueryException::class);

it('exposes educationLevels via BelongsToMany on canonical topics', function () {
    $topic = CanonicalTopic::factory()->create();
    $ss1 = EducationLevel::factory()->create(['name' => 'SS1']);
    $ss2 = EducationLevel::factory()->create(['name' => 'SS2']);

    CanonicalTopicClassAssignment::factory()->create([
        'canonical_topic_id' => $topic->id,
        'education_level_id' => $ss1->id,
        'depth' => 'introduction',
        'is_primary' => true,
    ]);
    CanonicalTopicClassAssignment::factory()->create([
        'canonical_topic_id' => $topic->id,
        'education_level_id' => $ss2->id,
        'depth' => 'intermediate',
    ]);

    expect($topic->educationLevels()->count())->toBe(2);
    expect($topic->classAssignments()->where('is_primary', true)->count())->toBe(1);
});

it('attaches a visualization brief to a canonical topic', function () {
    $topic = CanonicalTopic::factory()->create();

    $brief = CanonicalTopicVisualizationBrief::factory()->create([
        'canonical_topic_id' => $topic->id,
        'visualization_score' => 5,
    ]);

    expect($topic->visualizationBrief->id)->toBe($brief->id);
    expect($brief->visualization_score)->toBe(5);
});

it('rejects visualization_score outside 0–5 range', function () {
    $topic = CanonicalTopic::factory()->create();

    DB::table('canonical_topic_visualization_briefs')->insert([
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'canonical_topic_id' => $topic->id,
        'visualization_score' => 9,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
})->throws(\Illuminate\Database\QueryException::class);

it('creates an exam_syllabus_topic and a child', function () {
    $subject = AssessmentSubject::factory()->create();

    $parent = ExamSyllabusTopic::factory()->create([
        'assessment_subject_id' => $subject->id,
        'topic_number' => '1',
    ]);
    $child = ExamSyllabusTopic::factory()->create([
        'assessment_subject_id' => $subject->id,
        'parent_topic_id' => $parent->id,
        'topic_number' => '1.1',
    ]);

    expect($child->parent->id)->toBe($parent->id);
    expect($parent->children()->count())->toBe(1);
});

it('extends institution_courses to support both subjects and courses', function () {
    $level = EducationLevel::factory()->create();
    $institution = Institution::factory()->create();
    $department = Department::factory()->create();
    $discipline = Discipline::factory()->create();

    $subject = InstitutionCourse::factory()->create([
        'container_type' => 'subject',
        'institution_id' => null,
        'owning_department_id' => null,
        'discipline_id' => $discipline->id,
        'education_level_id' => $level->id,
        'course_code' => 'PHY-SS1',
        'course_title' => 'Physics SS1',
    ]);

    $course = InstitutionCourse::factory()->create([
        'container_type' => 'course',
        'institution_id' => $institution->id,
        'owning_department_id' => $department->id,
        'discipline_id' => $discipline->id,
        'course_code' => 'PHY 101',
        'course_title' => 'General Physics I',
        'credit_units' => 3,
    ]);

    expect($subject->isSubject())->toBeTrue();
    expect($subject->isCourse())->toBeFalse();
    expect($subject->institution_id)->toBeNull();
    expect($course->isCourse())->toBeTrue();
    expect($course->educationLevel)->toBeNull();
});

it('extends QuestionSource enum with PastPaperImported', function () {
    expect(QuestionSource::PastPaperImported->value)->toBe('past_paper_imported');
    expect(QuestionSource::PastPaperImported->label())->toBe('Past Paper (Imported)');
});

it('persists raw_ocr_excerpt on a question', function () {
    $question = Question::factory()->create([
        'source' => QuestionSource::PastPaperImported,
        'raw_ocr_excerpt' => "1. (a) Define velocity.\n   (b) A car travels 60 km in 1.5 hours...",
    ]);

    expect($question->raw_ocr_excerpt)->toContain('Define velocity');
    expect($question->source)->toBe(QuestionSource::PastPaperImported);
});
