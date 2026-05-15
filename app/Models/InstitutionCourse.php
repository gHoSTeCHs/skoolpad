<?php

namespace App\Models;

use App\Enums\CourseScope;
use App\Enums\Semester;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstitutionCourse extends Model
{
    /** @use HasFactory<\Database\Factories\InstitutionCourseFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'container_type',
        'institution_id',
        'owning_department_id',
        'discipline_id',
        'education_level_id',
        'stream_id',
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
            'level' => 'string',
            'credit_units' => 'integer',
            'container_type' => 'string',
        ];
    }

    public function isSubject(): bool
    {
        return $this->container_type === 'subject';
    }

    public function isCourse(): bool
    {
        return $this->container_type === 'course';
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
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

    public function departmentOfferings(): HasMany
    {
        return $this->hasMany(CourseDepartmentOffering::class, 'institution_course_id');
    }

    public function offeredToDepartments(): BelongsToMany
    {
        return $this->belongsToMany(
            Department::class,
            'course_department_offerings',
            'institution_course_id',
            'department_id'
        )->withPivot('is_compulsory');
    }

    public function topicMappings(): HasMany
    {
        return $this->hasMany(CourseTopicMapping::class, 'institution_course_id')->orderBy('sequence_order');
    }

    public function topics(): BelongsToMany
    {
        return $this->belongsToMany(
            CanonicalTopic::class,
            'course_topic_mappings',
            'institution_course_id',
            'canonical_topic_id'
        )->withPivot('sequence_order', 'weight')->orderByPivot('sequence_order');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function studentCourses(): HasMany
    {
        return $this->hasMany(StudentCourse::class);
    }

    public function courseBlockMappings(): HasMany
    {
        return $this->hasMany(CourseBlockMapping::class);
    }

    public function questionPapers(): HasMany
    {
        return $this->hasMany(QuestionPaper::class);
    }

    public function scopeForInstitution(Builder $query, string $institutionId): Builder
    {
        return $query->where('institution_id', $institutionId);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        $escaped = str_replace(['%', '_'], ['\%', '\_'], $term);

        return $query->where(function (Builder $q) use ($escaped) {
            $q->where('course_code', 'ilike', "%{$escaped}%")
                ->orWhere('course_title', 'ilike', "%{$escaped}%");
        });
    }
}
