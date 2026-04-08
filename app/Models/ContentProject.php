<?php

namespace App\Models;

use App\Enums\ContentProjectMode;
use App\Enums\ContentProjectStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContentProject extends Model
{
    /** @use HasFactory<\Database\Factories\ContentProjectFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'mode',
        'education_level_id',
        'curriculum_subject_id',
        'discipline_id',
        'status',
        'created_by',
        'progress_data',
        'ai_context',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'mode' => ContentProjectMode::class,
            'status' => ContentProjectStatus::class,
            'progress_data' => 'array',
            'ai_context' => 'array',
        ];
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    public function curriculumSubject(): BelongsTo
    {
        return $this->belongsTo(CurriculumSubject::class);
    }

    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function aiGenerationLogs(): HasMany
    {
        return $this->hasMany(AIGenerationLog::class);
    }
}
