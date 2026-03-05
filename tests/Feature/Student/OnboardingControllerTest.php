<?php

use App\Enums\CourseScope;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->actingAs($this->student);

    $this->institution = Institution::factory()->create();
    $this->faculty = Faculty::factory()->for($this->institution)->create();
    $this->department = Department::factory()->for($this->faculty)->create();
});

test('show renders the onboarding page', function () {
    $this->get(route('onboarding.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('onboarding/index')
            ->has('semester')
            ->has('academic_year')
            ->has('countries')
        );
});

test('show redirects to dashboard if profile already exists', function () {
    StudentProfile::factory()->create([
        'user_id' => $this->student->id,
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
    ]);

    $this->get(route('onboarding.index'))
        ->assertRedirect(route('dashboard'));
});

test('store creates student profile and courses', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    $this->post(route('onboarding.store'), [
        'student_type' => 'tertiary',
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
        'level' => '200L',
        'matric_number' => 'TEST/22/CS/001',
        'admission_year' => 2022,
        'course_ids' => [$course->id],
    ])->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('student_profiles', [
        'user_id' => $this->student->id,
        'student_type' => 'tertiary',
        'institution_id' => $this->institution->id,
        'level' => '200L',
        'matric_number' => 'TEST/22/CS/001',
    ]);

    $this->assertDatabaseHas('student_courses', [
        'institution_course_id' => $course->id,
    ]);
});

test('store sets default study_preferences for tertiary', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    $this->post(route('onboarding.store'), [
        'student_type' => 'tertiary',
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
        'level' => '200L',
        'course_ids' => [$course->id],
    ])->assertRedirect(route('dashboard'));

    $profile = StudentProfile::where('user_id', $this->student->id)->first();
    expect($profile->study_preferences)->toBe(['daily_goal_minutes' => 30]);
});

test('store sets default study_preferences for secondary', function () {
    $country = \App\Models\Country::factory()->create();
    $system = \App\Models\EducationSystem::factory()->create(['country_id' => $country->id]);
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    $this->post(route('onboarding.store'), [
        'student_type' => 'secondary',
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ])->assertRedirect(route('dashboard'));

    $profile = StudentProfile::where('user_id', $this->student->id)->first();
    expect($profile->study_preferences)->toBe(['daily_goal_minutes' => 30]);
});

test('store saves school_name and state_or_region for secondary', function () {
    $country = \App\Models\Country::factory()->create();
    $system = \App\Models\EducationSystem::factory()->create(['country_id' => $country->id]);
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    $this->post(route('onboarding.store'), [
        'student_type' => 'secondary',
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
        'school_name' => 'Kings College Lagos',
        'state_or_region' => 'Lagos',
    ])->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('student_profiles', [
        'user_id' => $this->student->id,
        'school_name' => 'Kings College Lagos',
        'state_or_region' => 'Lagos',
    ]);
});

test('store validates required fields', function () {
    $this->post(route('onboarding.store'), [])
        ->assertSessionHasErrors(['student_type']);

    $this->post(route('onboarding.store'), ['student_type' => 'tertiary'])
        ->assertSessionHasErrors(['institution_id', 'faculty_id', 'department_id', 'level', 'course_ids']);
});

test('store rejects faculty from different institution', function () {
    $otherInstitution = Institution::factory()->create();
    $otherFaculty = Faculty::factory()->for($otherInstitution)->create();

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);

    $this->post(route('onboarding.store'), [
        'student_type' => 'tertiary',
        'institution_id' => $this->institution->id,
        'faculty_id' => $otherFaculty->id,
        'department_id' => $this->department->id,
        'level' => '200L',
        'course_ids' => [$course->id],
    ])->assertSessionHasErrors('faculty_id');
});

test('store rejects department from different faculty', function () {
    $otherFaculty = Faculty::factory()->for($this->institution)->create();
    $otherDept = Department::factory()->for($otherFaculty)->create();

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);

    $this->post(route('onboarding.store'), [
        'student_type' => 'tertiary',
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $otherDept->id,
        'level' => '200L',
        'course_ids' => [$course->id],
    ])->assertSessionHasErrors('department_id');
});

test('store allows optional matric_number and admission_year', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    $this->post(route('onboarding.store'), [
        'student_type' => 'tertiary',
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
        'level' => '100L',
        'course_ids' => [$course->id],
    ])->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('student_profiles', [
        'user_id' => $this->student->id,
        'matric_number' => null,
        'admission_year' => null,
    ]);
});

test('searchInstitutions returns matching institutions', function () {
    $this->getJson(route('api.onboarding.institutions.search', ['q' => $this->institution->name]))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['abbreviation' => $this->institution->abbreviation]);
});

test('searchInstitutions matches by abbreviation', function () {
    $this->getJson(route('api.onboarding.institutions.search', ['q' => $this->institution->abbreviation]))
        ->assertOk()
        ->assertJsonCount(1);
});

test('faculties returns faculties for institution', function () {
    $this->getJson(route('api.onboarding.faculties', $this->institution))
        ->assertOk()
        ->assertJsonCount(1);
});

test('departments returns departments for faculty', function () {
    $this->getJson(route('api.onboarding.departments', $this->faculty))
        ->assertOk()
        ->assertJsonCount(1);
});

test('courseSuggestions returns appropriate courses', function () {
    InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
        'level' => '200L',
        'course_scope' => CourseScope::Department,
        'semester' => \App\Enums\Semester::Both,
    ]);

    InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'level' => '200L',
        'course_scope' => CourseScope::InstitutionWide,
        'course_code' => 'GNS 201',
        'semester' => \App\Enums\Semester::Both,
    ]);

    $this->getJson(route('api.onboarding.course-suggestions', [
        'institution_id' => $this->institution->id,
        'department_id' => $this->department->id,
        'level' => '200L',
    ]))
        ->assertOk()
        ->assertJsonCount(2);
});

test('searchCourses returns matching courses', function () {
    InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'course_code' => 'CSC 301',
        'course_title' => 'Operating Systems',
    ]);

    $this->getJson(route('api.onboarding.courses.search', [
        'institution_id' => $this->institution->id,
        'q' => 'CSC',
    ]))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['course_code' => 'CSC 301']);
});

test('guests cannot access onboarding', function () {
    auth()->logout();

    $this->get(route('onboarding.index'))->assertRedirect(route('login'));
});

test('store creates secondary student profile', function () {
    $country = \App\Models\Country::factory()->create();
    $system = \App\Models\EducationSystem::factory()->create(['country_id' => $country->id]);
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    $this->post(route('onboarding.store'), [
        'student_type' => 'secondary',
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ])->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('student_profiles', [
        'user_id' => $this->student->id,
        'student_type' => 'secondary',
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);
});

test('store validates secondary required fields', function () {
    $this->post(route('onboarding.store'), ['student_type' => 'secondary'])
        ->assertSessionHasErrors(['education_system_id', 'education_level_id']);
});

test('store skips tertiary validation for secondary', function () {
    $country = \App\Models\Country::factory()->create();
    $system = \App\Models\EducationSystem::factory()->create(['country_id' => $country->id]);
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    $this->post(route('onboarding.store'), [
        'student_type' => 'secondary',
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ])->assertSessionDoesntHaveErrors(['institution_id', 'faculty_id', 'department_id', 'course_ids']);
});

test('store accepts secondary with empty course_ids array sent by frontend', function () {
    $country = \App\Models\Country::factory()->create();
    $system = \App\Models\EducationSystem::factory()->create(['country_id' => $country->id]);
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    $this->post(route('onboarding.store'), [
        'student_type' => 'secondary',
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
        'course_ids' => [],
    ])->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('student_profiles', [
        'user_id' => $this->student->id,
        'student_type' => 'secondary',
    ]);
});

test('store generates unique invite code for both paths', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    $this->post(route('onboarding.store'), [
        'student_type' => 'tertiary',
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
        'level' => '200L',
        'course_ids' => [$course->id],
    ]);

    $profile = StudentProfile::where('user_id', $this->student->id)->first();
    expect($profile->invite_code)->not->toBeNull()
        ->and(strlen($profile->invite_code))->toBe(6);
});

test('store validates education_level belongs to education_system', function () {
    $system1 = \App\Models\EducationSystem::factory()->create();
    $system2 = \App\Models\EducationSystem::factory()->create();
    $tier = \App\Models\CurriculumTier::factory()->for($system2)->create(['is_tertiary' => false]);
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    $this->post(route('onboarding.store'), [
        'student_type' => 'secondary',
        'education_system_id' => $system1->id,
        'education_level_id' => $level->id,
    ])->assertSessionHasErrors('education_level_id');
});

test('store validates stream belongs to education_system', function () {
    $system = \App\Models\EducationSystem::factory()->create();
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $otherSystem = \App\Models\EducationSystem::factory()->create();
    $otherTier = \App\Models\CurriculumTier::factory()->for($otherSystem)->create();
    $stream = \App\Models\Stream::factory()->create([
        'education_system_id' => $otherSystem->id,
        'applies_from_tier_id' => $otherTier->id,
    ]);

    $this->post(route('onboarding.store'), [
        'student_type' => 'secondary',
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
        'stream_id' => $stream->id,
    ])->assertSessionHasErrors('stream_id');
});

test('store stores exam_goals as array', function () {
    $system = \App\Models\EducationSystem::factory()->create();
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $assessment = \App\Models\AssessmentType::factory()->exitExam()->create(['education_system_id' => $system->id]);

    $this->post(route('onboarding.store'), [
        'student_type' => 'secondary',
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
        'exam_goals' => [$assessment->id],
    ])->assertRedirect(route('dashboard'));

    $profile = StudentProfile::where('user_id', $this->student->id)->first();
    expect($profile->exam_goals)->toBe([$assessment->id]);
});

test('store creates exam goal records for secondary student', function () {
    $system = \App\Models\EducationSystem::factory()->create();
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $assessment = \App\Models\AssessmentType::factory()->exitExam()->create(['education_system_id' => $system->id]);

    $this->post(route('onboarding.store'), [
        'student_type' => 'secondary',
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
        'exam_goals' => [$assessment->id],
    ])->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('exam_goals', [
        'user_id' => $this->student->id,
        'assessment_type_id' => $assessment->id,
        'is_active' => true,
    ]);
    expect(\App\Models\ExamGoal::where('user_id', $this->student->id)->count())->toBe(1);
});

test('countries endpoint returns countries with non-tertiary systems', function () {
    $country = \App\Models\Country::factory()->create();
    $system = \App\Models\EducationSystem::factory()->create(['country_id' => $country->id]);
    \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);

    $this->getJson(route('api.onboarding.countries'))
        ->assertOk()
        ->assertJsonFragment(['id' => $country->id]);
});

test('educationSystems endpoint returns non-tertiary systems for country', function () {
    $country = \App\Models\Country::factory()->create();
    $system = \App\Models\EducationSystem::factory()->create(['country_id' => $country->id]);
    \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);

    $this->getJson(route('api.onboarding.education-systems', $country))
        ->assertOk()
        ->assertJsonFragment(['id' => $system->id]);
});

test('curriculumTiers endpoint returns non-tertiary tiers with levels', function () {
    $system = \App\Models\EducationSystem::factory()->create();
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    $this->getJson(route('api.onboarding.tiers', $system))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['id' => $tier->id]);
});

test('streams endpoint returns streams for education system', function () {
    $system = \App\Models\EducationSystem::factory()->create();
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create();
    $stream = \App\Models\Stream::factory()->create([
        'education_system_id' => $system->id,
        'applies_from_tier_id' => $tier->id,
    ]);

    $this->getJson(route('api.onboarding.streams', $system))
        ->assertOk()
        ->assertJsonFragment(['id' => $stream->id]);
});

test('levelSubjects endpoint returns subjects for education level', function () {
    $system = \App\Models\EducationSystem::factory()->create();
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create();
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = \App\Models\CurriculumSubject::factory()->create(['education_system_id' => $system->id]);
    \App\Models\LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $this->getJson(route('api.onboarding.level-subjects', $level))
        ->assertOk()
        ->assertJsonCount(1);
});

test('assessmentTypes endpoint returns exit/entrance exams', function () {
    $system = \App\Models\EducationSystem::factory()->create();
    \App\Models\AssessmentType::factory()->exitExam()->create(['education_system_id' => $system->id]);
    \App\Models\AssessmentType::factory()->create(['education_system_id' => $system->id]);

    $this->getJson(route('api.onboarding.assessment-types', $system))
        ->assertOk()
        ->assertJsonCount(1);
});

test('institutionTypeLevels endpoint returns level progression', function () {
    $type = \App\Models\InstitutionType::factory()->create([
        'level_progression' => ['100', '200', '300', '400'],
    ]);
    $institution = Institution::factory()->create(['institution_type_id' => $type->id]);

    $this->getJson(route('api.onboarding.level-progression', $institution))
        ->assertOk()
        ->assertJsonFragment(['level_progression' => ['100', '200', '300', '400']]);
});
