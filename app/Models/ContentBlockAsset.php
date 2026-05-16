<?php

namespace App\Models;

use App\Enums\AssetKind;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentBlockAsset extends Model
{
    /** @use HasFactory<\Database\Factories\ContentBlockAssetFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'content_block_id',
        'question_id',
        'question_paper_id',
        'kind',
        'excalidraw_json',
        'svg_payload',
        'alt_text',
        'caption',
        'created_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'kind' => AssetKind::class,
            'excalidraw_json' => 'array',
        ];
    }

    public function contentBlock(): BelongsTo
    {
        return $this->belongsTo(ContentBlock::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function questionPaper(): BelongsTo
    {
        return $this->belongsTo(QuestionPaper::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The scope this asset belongs to: 'content_block' | 'question' | 'question_paper'.
     * Derived from which FK is set; enforced as exactly-one at the DB level.
     */
    public function ownerScope(): string
    {
        if ($this->content_block_id !== null) {
            return 'content_block';
        }
        if ($this->question_id !== null) {
            return 'question';
        }

        return 'question_paper';
    }
}
