<?php

namespace App\Services\Student;

use App\Enums\AcademicStatus;
use App\Enums\Semester;
use App\Enums\StudentType;
use App\Models\ExamGoal;
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class OnboardingService
{
    /** @param array<string, mixed> $validated */
    public function createTertiaryProfile(User $user, array $validated): StudentProfile
    {
        return DB::transaction(function () use ($user, $validated) {
            $profile = StudentProfile::query()->create([
                'user_id' => $user->id,
                'student_type' => StudentType::Tertiary,
                'institution_id' => $validated['institution_id'],
                'faculty_id' => $validated['faculty_id'],
                'department_id' => $validated['department_id'],
                'level' => $validated['level'],
                'matric_number' => $validated['matric_number'] ?? null,
                'admission_year' => $validated['admission_year'] ?? null,
                'study_preferences' => ['daily_goal_minutes' => 30],
                'academic_status' => AcademicStatus::Active,
                'invite_code' => $this->generateInviteCode(),
            ]);

            $semester = $this->currentSemester();
            $academicYear = $this->currentAcademicYear();

            foreach ($validated['course_ids'] as $courseId) {
                StudentCourse::query()->create([
                    'student_profile_id' => $profile->id,
                    'institution_course_id' => $courseId,
                    'semester' => $semester,
                    'academic_year' => $academicYear,
                ]);
            }

            return $profile;
        });
    }

    /** @param array<string, mixed> $validated */
    public function createSecondaryProfile(User $user, array $validated): StudentProfile
    {
        $profile = StudentProfile::query()->create([
            'user_id' => $user->id,
            'student_type' => StudentType::Secondary,
            'education_system_id' => $validated['education_system_id'],
            'education_level_id' => $validated['education_level_id'],
            'stream_id' => $validated['stream_id'] ?? null,
            'school_name' => $validated['school_name'] ?? null,
            'state_or_region' => $validated['state_or_region'] ?? null,
            'exam_goals' => $validated['exam_goals'] ?? null,
            'study_preferences' => ['daily_goal_minutes' => 30],
            'academic_status' => AcademicStatus::Active,
            'invite_code' => $this->generateInviteCode(),
        ]);

        if (! empty($validated['exam_goals'])) {
            foreach ($validated['exam_goals'] as $assessmentTypeId) {
                ExamGoal::query()->create([
                    'user_id' => $user->id,
                    'assessment_type_id' => $assessmentTypeId,
                    'is_active' => true,
                ]);
            }
        }

        return $profile;
    }

    public function generateInviteCode(): string
    {
        do {
            $code = strtoupper(substr(str_replace(['0', 'O', 'I', 'L'], '', bin2hex(random_bytes(4))), 0, 6));
        } while (StudentProfile::query()->where('invite_code', $code)->exists());

        return $code;
    }

    public function currentSemester(): string
    {
        $month = (int) now()->format('n');

        return $month >= 9 ? Semester::First->value : Semester::Second->value;
    }

    public function currentAcademicYear(): string
    {
        $month = (int) now()->format('n');
        $year = (int) now()->format('Y');

        if ($month >= 9) {
            return $year.'/'.($year + 1);
        }

        return ($year - 1).'/'.$year;
    }
}
