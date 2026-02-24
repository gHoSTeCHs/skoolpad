<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamReadinessCache extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'curriculum_subject_level_id',
        'syllabus_coverage',
        'practice_performance',
        'spaced_retention',
        'parent_verification',
        'composite_score',
        'calculated_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'syllabus_coverage' => 'decimal:2',
            'practice_performance' => 'decimal:2',
            'spaced_retention' => 'decimal:2',
            'parent_verification' => 'decimal:2',
            'composite_score' => 'decimal:2',
            'calculated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function levelSubject(): BelongsTo
    {
        return $this->belongsTo(LevelSubject::class, 'curriculum_subject_level_id');
    }
}
