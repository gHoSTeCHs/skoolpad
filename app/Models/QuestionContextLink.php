<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class QuestionContextLink extends Pivot
{
    protected $table = 'question_context_links';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'question_id',
        'question_context_id',
        'sort_order',
        'label',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function questionContext(): BelongsTo
    {
        return $this->belongsTo(QuestionContext::class);
    }
}
