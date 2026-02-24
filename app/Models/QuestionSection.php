<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionSection extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionSectionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'question_paper_id',
        'label',
        'instruction',
        'marks',
        'required_count',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'marks' => 'integer',
            'required_count' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function questionPaper(): BelongsTo
    {
        return $this->belongsTo(QuestionPaper::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }
}
