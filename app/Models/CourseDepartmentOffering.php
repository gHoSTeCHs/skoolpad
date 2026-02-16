<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseDepartmentOffering extends Model
{
    /** @use HasFactory<\Database\Factories\CourseDepartmentOfferingFactory> */
    use HasFactory, HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'institution_course_id',
        'department_id',
        'is_compulsory',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_compulsory' => 'boolean',
        ];
    }

    public function institutionCourse(): BelongsTo
    {
        return $this->belongsTo(InstitutionCourse::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
