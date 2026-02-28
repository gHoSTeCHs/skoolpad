<?php

namespace App\Models;

use App\Enums\AcademicStatus;
use App\Enums\StudentType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentProfile extends Model
{
    /** @use HasFactory<\Database\Factories\StudentProfileFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'student_type',
        'institution_id',
        'faculty_id',
        'department_id',
        'level',
        'matric_number',
        'admission_year',
        'academic_status',
        'academic_status_changed_at',
        'institution_type_id',
        'education_system_id',
        'education_level_id',
        'stream_id',
        'school_name',
        'state_or_region',
        'invite_code',
        'exam_goals',
        'study_preferences',
        'parent_invite_dismissed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'student_type' => StudentType::class,
            'academic_status' => AcademicStatus::class,
            'academic_status_changed_at' => 'datetime',
            'parent_invite_dismissed_at' => 'datetime',
            'exam_goals' => 'array',
            'study_preferences' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function studentCourses(): HasMany
    {
        return $this->hasMany(StudentCourse::class);
    }

    public function institutionType(): BelongsTo
    {
        return $this->belongsTo(\App\Models\InstitutionType::class);
    }

    public function educationSystem(): BelongsTo
    {
        return $this->belongsTo(EducationSystem::class);
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function parentChildLinks(): HasMany
    {
        return $this->hasMany(ParentChildLink::class);
    }

    public function isTertiary(): bool
    {
        return $this->student_type === StudentType::Tertiary;
    }

    public function isSecondary(): bool
    {
        return $this->student_type === StudentType::Secondary;
    }

    public function findNextLevel(): ?EducationLevel
    {
        $currentLevel = $this->educationLevel()->with('curriculumTier')->first();
        if (! $currentLevel || ! $currentLevel->curriculumTier) {
            return null;
        }

        $nextInTier = EducationLevel::query()
            ->where('curriculum_tier_id', $currentLevel->curriculum_tier_id)
            ->where('sort_order', '>', $currentLevel->sort_order)
            ->orderBy('sort_order')
            ->first();

        if ($nextInTier) {
            return $nextInTier;
        }

        $tier = $currentLevel->curriculumTier;
        $nextTier = CurriculumTier::query()
            ->where('education_system_id', $tier->education_system_id)
            ->where('is_tertiary', false)
            ->where('sort_order', '>', $tier->sort_order)
            ->orderBy('sort_order')
            ->first();

        if (! $nextTier) {
            return null;
        }

        return EducationLevel::query()
            ->where('curriculum_tier_id', $nextTier->id)
            ->orderBy('sort_order')
            ->first();
    }
}
