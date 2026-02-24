<?php

namespace App\Models;

use App\Enums\ParentalRelationship;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParentProfile extends Model
{
    /** @use HasFactory<\Database\Factories\ParentProfileFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'phone_number',
        'relationship',
        'notification_preferences',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'relationship' => ParentalRelationship::class,
            'notification_preferences' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parentChildLinks(): HasMany
    {
        return $this->hasMany(ParentChildLink::class);
    }
}
