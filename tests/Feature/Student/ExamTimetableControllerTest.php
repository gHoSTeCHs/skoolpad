<?php

use App\Enums\TopicWeight;
use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\ExamTimetableEntry;
use App\Models\InstitutionCourse;
use App\Models\LevelSubject;
use App\Models\StudentCourse;
use App\Models\StudentProfile;

beforeEach(function () {
    $this->profile = StudentProfile::factory()->create();
    $this->user = $this->profile->user;
    $this->course = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $this->course->id,
    ]);

    $this->topic = CanonicalTopic::factory()->create();
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $this->topic->id,
        'sequence_order' => 1,
        'weight' => TopicWeight::Core,
    ]);

    $this->actingAs($this->user);
});

it('renders the exam timetable page with entries', function () {
    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(7),
    ]);

    $response = $this->get(route('exam-timetable.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('exam-timetable/index')
        ->has('entries', 1)
        ->has('enrolledCourses')
        ->has('isSecondary')
    );
});

it('shows available courses for tertiary student', function () {
    $response = $this->get(route('exam-timetable.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('enrolledCourses', 1)
        ->where('isSecondary', false)
    );
});

it('shows available level subjects for secondary student', function () {
    $secondaryProfile = StudentProfile::factory()->secondary()->create();
    $secondaryUser = $secondaryProfile->user;

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $secondaryProfile->education_level_id,
    ]);

    $this->actingAs($secondaryUser);

    $response = $this->get(route('exam-timetable.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('isSecondary', true)
        ->has('enrolledSubjects')
    );
});

it('stores entry for tertiary with InstitutionCourse', function () {
    $response = $this->post(route('exam-timetable.store'), [
        'institution_course_id' => $this->course->id,
        'label' => 'Final Exam',
        'exam_date' => now()->addDays(14)->format('Y-m-d'),
        'exam_time' => '09:00',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('exam_timetable_entries', [
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'label' => 'Final Exam',
    ]);
});

it('stores entry for secondary with LevelSubject', function () {
    $secondaryProfile = StudentProfile::factory()->secondary()->create();
    $secondaryUser = $secondaryProfile->user;

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $secondaryProfile->education_level_id,
    ]);

    $this->actingAs($secondaryUser);

    $response = $this->post(route('exam-timetable.store'), [
        'level_subject_id' => $levelSubject->id,
        'label' => 'WAEC Exam',
        'exam_date' => now()->addDays(30)->format('Y-m-d'),
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('exam_timetable_entries', [
        'user_id' => $secondaryUser->id,
        'level_subject_id' => $levelSubject->id,
        'label' => 'WAEC Exam',
    ]);
});

it('validates course belongs to student enrollment', function () {
    $otherCourse = InstitutionCourse::factory()->create();

    $response = $this->post(route('exam-timetable.store'), [
        'institution_course_id' => $otherCourse->id,
        'label' => 'Exam',
        'exam_date' => now()->addDays(7)->format('Y-m-d'),
    ]);

    $response->assertForbidden();
});

it('rejects duplicate same course and date', function () {
    $examDate = now()->addDays(14)->format('Y-m-d');

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => $examDate,
    ]);

    $response = $this->post(route('exam-timetable.store'), [
        'institution_course_id' => $this->course->id,
        'label' => 'Another Exam',
        'exam_date' => $examDate,
    ]);

    $this->assertDatabaseCount('exam_timetable_entries', 1);
});

it('saves AOC topics with entry', function () {
    $response = $this->post(route('exam-timetable.store'), [
        'institution_course_id' => $this->course->id,
        'label' => 'AOC Exam',
        'exam_date' => now()->addDays(14)->format('Y-m-d'),
        'aoc_topic_ids' => [$this->topic->id],
    ]);

    $response->assertRedirect();
    $entry = ExamTimetableEntry::first();
    expect($entry->aocTopics)->toHaveCount(1);
    expect($entry->aocTopics->first()->id)->toBe($this->topic->id);
});

it('validates AOC topics belong to course syllabus', function () {
    $unrelatedTopic = CanonicalTopic::factory()->create();

    $response = $this->post(route('exam-timetable.store'), [
        'institution_course_id' => $this->course->id,
        'label' => 'Exam',
        'exam_date' => now()->addDays(14)->format('Y-m-d'),
        'aoc_topic_ids' => [$unrelatedTopic->id],
    ]);

    $response->assertStatus(422);
});

it('rejects past date on store', function () {
    $response = $this->post(route('exam-timetable.store'), [
        'institution_course_id' => $this->course->id,
        'label' => 'Past Exam',
        'exam_date' => now()->subDay()->format('Y-m-d'),
    ]);

    $response->assertSessionHasErrors('exam_date');
});

it('updates fields including AOC', function () {
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(14),
    ]);

    $newTopic = CanonicalTopic::factory()->create();
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $newTopic->id,
        'sequence_order' => 2,
        'weight' => TopicWeight::Core,
    ]);

    $response = $this->put(route('exam-timetable.update', $entry), [
        'institution_course_id' => $this->course->id,
        'label' => 'Updated Label',
        'exam_date' => now()->addDays(21)->format('Y-m-d'),
        'aoc_topic_ids' => [$this->topic->id, $newTopic->id],
    ]);

    $response->assertRedirect();
    $entry->refresh();
    expect($entry->label)->toBe('Updated Label');
    expect($entry->aocTopics)->toHaveCount(2);
});

it('allows rescheduling an entry', function () {
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(7),
    ]);

    $newDate = now()->addDays(30)->format('Y-m-d');

    $response = $this->put(route('exam-timetable.update', $entry), [
        'institution_course_id' => $this->course->id,
        'label' => $entry->label,
        'exam_date' => $newDate,
    ]);

    $response->assertRedirect();
    expect($entry->fresh()->exam_date->format('Y-m-d'))->toBe($newDate);
});

it('marks entry as completed', function () {
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(7),
    ]);

    $response = $this->post(route('exam-timetable.complete', $entry));

    $response->assertRedirect();
    $entry->refresh();
    expect($entry->is_completed)->toBeTrue();
    expect($entry->completed_at)->not->toBeNull();
});

it('deletes entry', function () {
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(7),
    ]);

    $response = $this->delete(route('exam-timetable.destroy', $entry));

    $response->assertRedirect();
    $this->assertDatabaseMissing('exam_timetable_entries', ['id' => $entry->id]);
});

it('returns grouped calendar data', function () {
    $date = now()->addDays(7);

    ExamTimetableEntry::factory()->count(2)->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => $date,
    ]);

    $response = $this->getJson(route('api.exam-timetable.calendar'));

    $response->assertOk();
    $response->assertJsonStructure(['entries']);
    $dateKey = $date->format('Y-m-d');
    $response->assertJsonCount(2, "entries.{$dateKey}");
});

it('prevents modifying another user entry', function () {
    $otherEntry = ExamTimetableEntry::factory()->withCourse()->create([
        'exam_date' => now()->addDays(7),
    ]);

    $this->put(route('exam-timetable.update', $otherEntry), [
        'institution_course_id' => $otherEntry->institution_course_id,
        'label' => 'Hacked',
        'exam_date' => now()->addDays(7)->format('Y-m-d'),
    ])->assertForbidden();
    $this->post(route('exam-timetable.complete', $otherEntry))->assertForbidden();
    $this->delete(route('exam-timetable.destroy', $otherEntry))->assertForbidden();
});

it('migrates existing ExamGoals on first visit to index', function () {
    $assessmentType = \App\Models\AssessmentType::factory()->create();
    \App\Models\ExamGoal::factory()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => $assessmentType->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(14),
        'is_active' => true,
    ]);

    $this->get(route('exam-timetable.index'));

    $this->assertDatabaseHas('exam_timetable_entries', [
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'assessment_type_id' => $assessmentType->id,
    ]);
});

it('does not re-migrate ExamGoals when flag is set', function () {
    $this->profile->update([
        'study_preferences' => array_merge(
            $this->profile->study_preferences ?? [],
            ['exam_goals_migrated' => true]
        ),
    ]);

    \App\Models\ExamGoal::factory()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => \App\Models\AssessmentType::factory()->create()->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(14),
        'is_active' => true,
    ]);

    $this->get(route('exam-timetable.index'));

    $this->assertDatabaseCount('exam_timetable_entries', 0);
});

it('includes topic readiness per entry in index', function () {
    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $response = $this->get(route('exam-timetable.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topicReadiness')
        );
});

it('includes mock papers for national exam entries in index', function () {
    $assessmentType = \App\Models\AssessmentType::factory()->create();
    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'assessment_type_id' => $assessmentType->id,
        'exam_date' => now()->addDays(10),
    ]);

    \App\Models\QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $assessmentType->id,
    ]);

    $response = $this->get(route('exam-timetable.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('mockPapers')
        );
});

it('creates full mock session and redirects for startMock', function () {
    $assessmentType = \App\Models\AssessmentType::factory()->create();
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'assessment_type_id' => $assessmentType->id,
        'exam_date' => now()->addDays(10),
    ]);

    $paper = \App\Models\QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $assessmentType->id,
    ]);
    \App\Models\Question::factory()->create([
        'question_paper_id' => $paper->id,
        'institution_course_id' => $this->course->id,
    ]);

    $response = $this->post(route('exam-timetable.start-mock', $entry), [
        'question_paper_id' => $paper->id,
    ]);

    $response->assertRedirect();
    expect($response->getTargetUrl())->toContain('practice');

    $this->assertDatabaseHas('practice_sessions', [
        'user_id' => $this->user->id,
        'question_paper_id' => $paper->id,
        'mode' => \App\Enums\PracticeMode::FullMock->value,
    ]);
});

it('rejects unpublished paper for startMock', function () {
    $assessmentType = \App\Models\AssessmentType::factory()->create();
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'assessment_type_id' => $assessmentType->id,
        'exam_date' => now()->addDays(10),
    ]);

    $paper = \App\Models\QuestionPaper::factory()->create([
        'assessment_type_id' => $assessmentType->id,
        'is_published' => false,
    ]);

    $response = $this->post(route('exam-timetable.start-mock', $entry), [
        'question_paper_id' => $paper->id,
    ]);

    $response->assertForbidden();
});

it('rejects paper not matching entry assessment type for startMock', function () {
    $assessmentType = \App\Models\AssessmentType::factory()->create();
    $otherType = \App\Models\AssessmentType::factory()->create();
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'assessment_type_id' => $assessmentType->id,
        'exam_date' => now()->addDays(10),
    ]);

    $paper = \App\Models\QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $otherType->id,
    ]);

    $response = $this->post(route('exam-timetable.start-mock', $entry), [
        'question_paper_id' => $paper->id,
    ]);

    $response->assertForbidden();
});

it('prevents access to another users entry for startMock', function () {
    $otherProfile = \App\Models\StudentProfile::factory()->create();
    $otherUser = $otherProfile->user;

    $assessmentType = \App\Models\AssessmentType::factory()->create();
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $otherUser->id,
        'institution_course_id' => $this->course->id,
        'assessment_type_id' => $assessmentType->id,
        'exam_date' => now()->addDays(10),
    ]);

    $paper = \App\Models\QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $assessmentType->id,
    ]);

    $response = $this->post(route('exam-timetable.start-mock', $entry), [
        'question_paper_id' => $paper->id,
    ]);

    $response->assertForbidden();
});
