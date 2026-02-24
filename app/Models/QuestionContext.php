<?php

namespace App\Models;

use App\Enums\ContextType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionContext extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionContextFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'question_paper_id',
        'context_type',
        'title',
        'content',
        'media_url',
        'table_data',
        'word_bank',
        'language',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'context_type' => ContextType::class,
            'table_data' => 'array',
            'word_bank' => 'array',
        ];
    }

    public function questionPaper(): BelongsTo
    {
        return $this->belongsTo(QuestionPaper::class);
    }

    public function questionContextLinks(): HasMany
    {
        return $this->hasMany(QuestionContextLink::class);
    }
}
