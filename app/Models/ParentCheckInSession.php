<?php

namespace App\Models;

use App\Enums\CheckInSessionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParentCheckInSession extends Model
{
    /** @use HasFactory<\Database\Factories\ParentCheckInSessionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'parent_child_link_id',
        'session_date',
        'duration_minutes',
        'items',
        'completed_items',
        'status',
        'started_at',
        'completed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'session_date' => 'date',
            'duration_minutes' => 'integer',
            'items' => 'array',
            'completed_items' => 'array',
            'status' => CheckInSessionStatus::class,
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function parentChildLink(): BelongsTo
    {
        return $this->belongsTo(ParentChildLink::class);
    }

    public function scopeForDate(Builder $query, string $date): Builder
    {
        return $query->where('session_date', $date);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', CheckInSessionStatus::Completed);
    }
}
