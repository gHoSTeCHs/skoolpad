<?php

namespace App\Models;

use App\Enums\Semester;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentCourse extends Model
{
    /** @use HasFactory<\Database\Factories\StudentCourseFactory> */
    use HasFactory, HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'student_profile_id',
        'institution_course_id',
        'semester',
        'academic_year',
        'is_archived',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'semester' => Semester::class,
            'is_archived' => 'boolean',
        ];
    }

    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function institutionCourse(): BelongsTo
    {
        return $this->belongsTo(InstitutionCourse::class);
    }
}
