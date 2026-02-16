<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformSetting extends Model
{
    /** @use HasFactory<\Database\Factories\PlatformSettingFactory> */
    use HasFactory, HasUuids;

    const CREATED_AT = null;

    protected $fillable = [
        'key',
        'value',
        'updated_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
