<?php

namespace App\Models;

use App\Enums\AIAdapterType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AIModel extends Model
{
    /** @use HasFactory<\Database\Factories\AIModelFactory> */
    use HasFactory, HasUuids;

    protected $table = 'ai_models';

    protected $fillable = [
        'name',
        'slug',
        'adapter_type',
        'base_url',
        'api_key',
        'model_id',
        'max_tokens',
        'input_cost_per_million',
        'output_cost_per_million',
        'is_active',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'adapter_type' => AIAdapterType::class,
            'api_key' => 'encrypted',
            'max_tokens' => 'integer',
            'input_cost_per_million' => 'integer',
            'output_cost_per_million' => 'integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function aiGenerationLogs(): HasMany
    {
        return $this->hasMany(AIGenerationLog::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('name', 'ilike', "%{$term}%");
    }
}
