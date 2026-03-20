<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadinessScoreHistory extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'readiness_score_history';

    protected $fillable = [
        'user_id',
        'curriculum_subject_level_id',
        'composite_score',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'composite_score' => 'decimal:2',
            'recorded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForSubject(Builder $query, string $userId, string $levelSubjectId): Builder
    {
        return $query
            ->where('user_id', $userId)
            ->where('curriculum_subject_level_id', $levelSubjectId);
    }

    public function scopeRecent(Builder $query, int $days = 28): Builder
    {
        return $query->where('recorded_at', '>=', now()->subDays($days));
    }
}
