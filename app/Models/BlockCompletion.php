<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockCompletion extends Model
{
    /** @use HasFactory<\Database\Factories\BlockCompletionFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'content_block_id',
        'completed_at',
        'reading_time_seconds',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contentBlock(): BelongsTo
    {
        return $this->belongsTo(ContentBlock::class);
    }
}
