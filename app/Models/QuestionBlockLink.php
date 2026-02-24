<?php

namespace App\Models;

use App\Enums\Relevance;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class QuestionBlockLink extends Pivot
{
    protected $table = 'question_block_links';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'question_id',
        'content_block_id',
        'relevance',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'relevance' => Relevance::class,
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function contentBlock(): BelongsTo
    {
        return $this->belongsTo(ContentBlock::class);
    }
}
