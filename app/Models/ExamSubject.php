<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSubject extends Model
{
    /** @use HasFactory<\Database\Factories\ExamSubjectFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'exam_type_id',
        'name',
        'slug',
        'is_compulsory',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_compulsory' => 'boolean',
        ];
    }

    public function examType(): BelongsTo
    {
        return $this->belongsTo(ExamType::class);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('name', 'ilike', "%{$term}%");
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }
}
