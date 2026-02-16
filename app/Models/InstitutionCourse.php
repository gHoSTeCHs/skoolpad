<?php

namespace App\Models;

use App\Enums\CourseScope;
use App\Enums\Semester;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstitutionCourse extends Model
{
    /** @use HasFactory<\Database\Factories\InstitutionCourseFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'institution_id',
        'owning_department_id',
        'discipline_id',
        'course_code',
        'course_title',
        'level',
        'semester',
        'credit_units',
        'is_elective',
        'course_scope',
        'description',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'semester' => Semester::class,
            'course_scope' => CourseScope::class,
            'is_elective' => 'boolean',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function owningDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'owning_department_id');
    }

    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }

    public function courseTopicMappings(): HasMany
    {
        return $this->hasMany(CourseTopicMapping::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function courseDepartmentOfferings(): HasMany
    {
        return $this->hasMany(CourseDepartmentOffering::class);
    }

    public function studentCourses(): HasMany
    {
        return $this->hasMany(StudentCourse::class);
    }
}
