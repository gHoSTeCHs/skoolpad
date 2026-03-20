<?php

use App\Models\CanonicalTopic;
use App\Models\CurriculumSubject;
use App\Models\CurriculumTier;
use App\Models\Department;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\UserLevel;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->actingAs($this->student);
});

test('dashboard shows tertiary student data', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->for($institution)->create();
    $department = Department::factory()->for($faculty)->create();

    StudentProfile::factory()->create([
        'user_id' => $this->student->id,
        'institution_id' => $institution->id,
        'faculty_id' => $faculty->id,
        'department_id' => $department->id,
        'level' => '200L',
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('student.student_type', 'tertiary')
            ->where('student.institution', $institution->name)
            ->where('student.department', $department->name)
            ->has('courses')
            ->has('stats')
        );
});

test('dashboard shows secondary student data with subjects', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->create(['education_system_id' => $system->id]);
    LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('student.student_type', 'secondary')
            ->where('student.education_system', $system->name)
            ->has('subjects', 1)
        );
});

test('dashboard returns parent invitation for secondary student', function () {
    $profile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
    ]);

    UserLevel::query()->create([
        'user_id' => $this->student->id,
        'current_xp' => 0,
        'current_level' => 1,
        'streak_days' => 3,
        'longest_streak' => 3,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('parent_invitation')
            ->where('parent_invitation.show', true)
        );
});

test('dashboard returns level progression for secondary student in transition period', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false, 'sort_order' => 1]);
    $level1 = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 1, 'name' => 'JSS 1']);
    $level2 = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 2, 'name' => 'JSS 2']);

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level1->id,
    ]);

    Carbon::setTestNow(Carbon::create(2026, 1, 5));

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('level_progression.show', true)
            ->where('level_progression.next_level_id', $level2->id)
        );

    Carbon::setTestNow();
});

test('dashboard returns no level progression for tertiary student', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->for($institution)->create();
    $department = Department::factory()->for($faculty)->create();

    StudentProfile::factory()->create([
        'user_id' => $this->student->id,
        'institution_id' => $institution->id,
        'faculty_id' => $faculty->id,
        'department_id' => $department->id,
    ]);

    Carbon::setTestNow(Carbon::create(2026, 1, 5));

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('level_progression', null)
        );

    Carbon::setTestNow();
});

test('dashboard re-shows parent invitation for early-level student after 7 days', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 1]);

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
        'parent_invite_dismissed_at' => now()->subDays(8),
    ]);

    UserLevel::query()->create([
        'user_id' => $this->student->id,
        'current_xp' => 0,
        'current_level' => 1,
        'streak_days' => 3,
        'longest_streak' => 3,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('parent_invitation.show', true)
            ->where('parent_invitation.is_early_level', true)
        );
});

test('dashboard keeps parent invitation dismissed for older secondary student', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 3]);

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
        'parent_invite_dismissed_at' => now()->subDays(8),
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('parent_invitation', null)
        );
});

test('dashboard returns is_early_level true for JSS students', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 2]);

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);

    UserLevel::query()->create([
        'user_id' => $this->student->id,
        'current_xp' => 0,
        'current_level' => 1,
        'streak_days' => 3,
        'longest_streak' => 3,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('parent_invitation.is_early_level', true)
        );
});

test('dashboard returns is_early_level false for SS students', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 4]);

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);

    UserLevel::query()->create([
        'user_id' => $this->student->id,
        'current_xp' => 0,
        'current_level' => 1,
        'streak_days' => 3,
        'longest_streak' => 3,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('parent_invitation.is_early_level', false)
        );
});

test('dashboard returns no parent invitation for tertiary student', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->for($institution)->create();
    $department = Department::factory()->for($faculty)->create();

    StudentProfile::factory()->create([
        'user_id' => $this->student->id,
        'institution_id' => $institution->id,
        'faculty_id' => $faculty->id,
        'department_id' => $department->id,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('parent_invitation', null)
        );
});

test('dashboard returns guided_study prop for secondary student', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('guided_study')
            ->where('guided_study.daily_goal_minutes', 30)
        );

    Carbon::setTestNow();
});

test('dashboard guided_study is null for tertiary student', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->for($institution)->create();
    $department = Department::factory()->for($faculty)->create();

    StudentProfile::factory()->create([
        'user_id' => $this->student->id,
        'institution_id' => $institution->id,
        'faculty_id' => $faculty->id,
        'department_id' => $department->id,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('guided_study', null)
        );
});

test('dashboard guided_study includes current term and week', function () {
    Carbon::setTestNow(Carbon::create(2026, 10, 1));

    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->create(['education_system_id' => $system->id]);
    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'term' => 1,
        'week_number' => 3,
        'topic_label' => 'Algebra Basics',
        'canonical_topic_id' => $topic->id,
    ]);

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('guided_study.current_term', 1)
            ->where('guided_study.current_week', 3)
            ->has('guided_study.items', 1)
        );

    Carbon::setTestNow();
});

test('dashboard passes study_plan_dismissed false when not dismissed', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('study_plan_dismissed', false)
        );
});
