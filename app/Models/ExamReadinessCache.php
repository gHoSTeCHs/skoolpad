<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamReadinessCache extends Model
{
    /** @use HasFactory<\Database\Factories\ExamReadinessCacheFactory> */
    use HasFactory, HasUuids;

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

    public function history(): HasMany
    {
        return $this->hasMany(ReadinessScoreHistory::class, 'curriculum_subject_level_id', 'curriculum_subject_level_id')
            ->where('user_id', $this->user_id);
    }
}
