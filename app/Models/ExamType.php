<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamType extends Model
{
    /** @use HasFactory<\Database\Factories\ExamTypeFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'country_id',
        'name',
        'slug',
        'description',
        'duration_minutes',
        'questions_per_subject',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function examSubjects(): HasMany
    {
        return $this->hasMany(ExamSubject::class);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('name', 'ilike', "%{$term}%");
    }
}
