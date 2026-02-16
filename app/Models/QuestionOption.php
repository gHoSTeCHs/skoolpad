<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionOption extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionOptionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'question_id',
        'label',
        'content',
        'is_correct',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
