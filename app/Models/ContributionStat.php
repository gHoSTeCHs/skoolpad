<?php

namespace App\Models;

use App\Enums\ContributionBadge;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContributionStat extends Model
{
    /** @use HasFactory<\Database\Factories\ContributionStatFactory> */
    use HasFactory, HasUuids;

    const CREATED_AT = null;

    protected $fillable = [
        'user_id',
        'total_submissions',
        'approved_submissions',
        'rejected_submissions',
        'contribution_points',
        'badge',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'badge' => ContributionBadge::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
