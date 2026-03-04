<?php

namespace App\Models;

use App\Enums\SpacedRepetitionStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpacedRepetitionItem extends Model
{
    /** @use HasFactory<\Database\Factories\SpacedRepetitionItemFactory> */
    use HasFactory, HasUuids;

    protected $appends = ['strength'];

    protected $fillable = [
        'user_id',
        'question_id',
        'ease_factor',
        'interval_days',
        'repetition_count',
        'next_review_at',
        'last_reviewed_at',
        'status',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'next_review_at' => 'date',
            'last_reviewed_at' => 'datetime',
            'status' => SpacedRepetitionStatus::class,
        ];
    }

    /** @return Attribute<string, never> */
    protected function strength(): Attribute
    {
        return Attribute::get(function (): string {
            if ($this->interval_days <= 1) {
                return 'weak';
            }

            if ($this->interval_days <= 7) {
                return 'growing';
            }

            return 'strong';
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
