<?php

namespace App\Models;

use App\Enums\TeachingDepth;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseBlockMapping extends Model
{
    /** @use HasFactory<\Database\Factories\CourseBlockMappingFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'institution_course_id',
        'curriculum_subject_level_id',
        'content_block_id',
        'teaching_depth',
        'is_core_block',
        'week_start',
        'week_end',
        'lecture_hours',
        'lab_hours',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'teaching_depth' => TeachingDepth::class,
            'is_core_block' => 'boolean',
            'week_start' => 'integer',
            'week_end' => 'integer',
            'lecture_hours' => 'decimal:2',
            'lab_hours' => 'decimal:2',
        ];
    }

    public function institutionCourse(): BelongsTo
    {
        return $this->belongsTo(InstitutionCourse::class);
    }

    public function levelSubject(): BelongsTo
    {
        return $this->belongsTo(LevelSubject::class, 'curriculum_subject_level_id');
    }

    public function contentBlock(): BelongsTo
    {
        return $this->belongsTo(ContentBlock::class);
    }
}
