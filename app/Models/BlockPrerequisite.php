<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class BlockPrerequisite extends Pivot
{
    use HasUuids;

    protected $table = 'block_prerequisites';

    public $incrementing = false;

    const UPDATED_AT = null;

    protected $fillable = [
        'block_id',
        'prerequisite_block_id',
        'is_hard_prerequisite',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_hard_prerequisite' => 'boolean',
        ];
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(ContentBlock::class, 'block_id');
    }

    public function prerequisite(): BelongsTo
    {
        return $this->belongsTo(ContentBlock::class, 'prerequisite_block_id');
    }
}
