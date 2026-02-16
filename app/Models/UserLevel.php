<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLevel extends Model
{
    /** @use HasFactory<\Database\Factories\UserLevelFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'current_xp',
        'current_level',
        'streak_days',
        'longest_streak',
        'last_activity_date',
        'streak_freeze_available',
        'streak_freeze_used_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'last_activity_date' => 'date',
            'streak_freeze_available' => 'boolean',
            'streak_freeze_used_at' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
