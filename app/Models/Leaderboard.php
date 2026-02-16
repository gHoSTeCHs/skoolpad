<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Leaderboard extends Model
{
    /** @use HasFactory<\Database\Factories\LeaderboardFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'class_level',
        'weekly_xp',
        'week_start',
        'rank',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'week_start' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
