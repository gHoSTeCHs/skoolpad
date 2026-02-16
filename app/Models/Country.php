<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    /** @use HasFactory<\Database\Factories\CountryFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'code',
        'currency_code',
    ];

    public function institutions(): HasMany
    {
        return $this->hasMany(Institution::class);
    }

    public function examTypes(): HasMany
    {
        return $this->hasMany(ExamType::class);
    }
}
