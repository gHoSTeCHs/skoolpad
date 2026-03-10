<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ExamTimetableEntry extends Model
{
    /** @use HasFactory<\Database\Factories\ExamTimetableEntryFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'institution_course_id',
        'level_subject_id',
        'assessment_type_id',
        'label',
        'exam_date',
        'exam_time',
        'notes',
        'is_completed',
        'completed_at',
    ];

    /** @var list<string> */
    protected $appends = [
        'is_past',
        'days_remaining',
        'is_imminent',
        'is_upcoming',
        'subject_name',
        'has_aoc',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'exam_date' => 'date',
            'exam_time' => 'string',
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function institutionCourse(): BelongsTo
    {
        return $this->belongsTo(InstitutionCourse::class);
    }

    public function levelSubject(): BelongsTo
    {
        return $this->belongsTo(LevelSubject::class);
    }

    public function assessmentType(): BelongsTo
    {
        return $this->belongsTo(AssessmentType::class);
    }

    public function aocTopics(): BelongsToMany
    {
        return $this->belongsToMany(CanonicalTopic::class, 'exam_entry_aoc_topics')
            ->withTimestamps();
    }

    /** @return Attribute<bool, never> */
    protected function isPast(): Attribute
    {
        return Attribute::get(fn () => $this->exam_date->startOfDay()->lt(now()->startOfDay()));
    }

    /** @return Attribute<int, never> */
    protected function daysRemaining(): Attribute
    {
        return Attribute::get(fn () => (int) now()->startOfDay()->diffInDays($this->exam_date->startOfDay(), false));
    }

    /** @return Attribute<bool, never> */
    protected function isImminent(): Attribute
    {
        return Attribute::get(fn () => ! $this->is_completed && ! $this->is_past && $this->days_remaining <= 2);
    }

    /** @return Attribute<bool, never> */
    protected function isUpcoming(): Attribute
    {
        return Attribute::get(fn () => ! $this->is_completed && ! $this->is_past && $this->days_remaining > 2 && $this->days_remaining <= 7);
    }

    /** @return Attribute<string|null, never> */
    protected function subjectName(): Attribute
    {
        return Attribute::get(function () {
            if ($this->relationLoaded('institutionCourse') && $this->institutionCourse) {
                return $this->institutionCourse->course_title;
            }
            if ($this->relationLoaded('levelSubject') && $this->levelSubject) {
                return $this->levelSubject->curriculumSubject?->name;
            }

            return null;
        });
    }

    /** @return Attribute<bool, never> */
    protected function hasAoc(): Attribute
    {
        return Attribute::get(fn () => $this->relationLoaded('aocTopics') && $this->aocTopics->isNotEmpty());
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_completed', false)->where('exam_date', '>=', now()->toDateString());
    }

    public function scopePast(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->where('exam_date', '<', now()->toDateString())
                ->orWhere('is_completed', true);
        });
    }

    public function scopeImminent(Builder $query): Builder
    {
        return $query->where('is_completed', false)
            ->where('exam_date', '>=', now()->toDateString())
            ->where('exam_date', '<=', now()->addDays(2)->toDateString());
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('is_completed', false)
            ->where('exam_date', '>', now()->addDays(2)->toDateString())
            ->where('exam_date', '<=', now()->addDays(7)->toDateString());
    }

    public function scopeOrderedByDate(Builder $query): Builder
    {
        return $query->orderBy('exam_date')->orderBy('exam_time');
    }
}
