<?php

namespace App\Models;

use App\Enums\StencilCategory;
use App\Enums\StencilLicense;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CanvasStencil extends Model
{
    /** @use HasFactory<\Database\Factories\CanvasStencilFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'category',
        'tags',
        'svg_path',
        'thumbnail_path',
        'license',
        'source_attribution',
        'source_url',
        'sort_order',
        'is_active',
        'created_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'category' => StencilCategory::class,
            'license' => StencilLicense::class,
            'tags' => 'array',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
