<?php

namespace App\Models;

use App\Enums\AcademicStatus;
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
        'institution_id',
        'faculty_id',
        'department_id',
        'level',
        'matric_number',
        'admission_year',
        'academic_status',
        'academic_status_changed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'academic_status' => AcademicStatus::class,
            'academic_status_changed_at' => 'datetime',
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
}
