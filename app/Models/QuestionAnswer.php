<?php

namespace App\Models;

use App\Enums\AnswerDepthLevel;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionAnswer extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionAnswerFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'question_id',
        'depth_level',
        'content',
        'content_plain',
        'is_published',
        'created_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'depth_level' => AnswerDepthLevel::class,
            'content' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
