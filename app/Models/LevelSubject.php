<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LevelSubject extends Model
{
    /** @use HasFactory<\Database\Factories\LevelSubjectFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'education_level_id',
        'curriculum_subject_id',
        'is_compulsory',
        'stream_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_compulsory' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (LevelSubject $model) {
            $model->created_at = $model->freshTimestamp();
        });
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    public function curriculumSubject(): BelongsTo
    {
        return $this->belongsTo(CurriculumSubject::class);
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function courseBlockMappings(): HasMany
    {
        return $this->hasMany(CourseBlockMapping::class, 'curriculum_subject_level_id');
    }

    public function schemeOfWorkItems(): HasMany
    {
        return $this->hasMany(SchemeOfWorkItem::class, 'curriculum_subject_level_id');
    }

    public function examReadinessCaches(): HasMany
    {
        return $this->hasMany(ExamReadinessCache::class, 'curriculum_subject_level_id');
    }
}
