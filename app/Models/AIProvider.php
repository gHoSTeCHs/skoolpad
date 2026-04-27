<?php

namespace App\Models;

use App\Enums\AIAdapterType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AIProvider extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_providers';

    protected $fillable = [
        'name',
        'slug',
        'adapter_type',
        'base_url',
        'api_key',
        'supports_thinking',
        'is_active',
        'sort_order',
    ];

    protected $hidden = ['api_key'];

    protected function casts(): array
    {
        return [
            'adapter_type' => AIAdapterType::class,
            'api_key' => 'encrypted',
            'supports_thinking' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function aiModels(): HasMany
    {
        return $this->hasMany(AIModel::class, 'provider_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
