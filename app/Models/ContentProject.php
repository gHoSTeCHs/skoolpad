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

    public function isSecondary(): bool
    {
        return $this->mode === ContentProjectMode::Secondary;
    }

    public function isTertiary(): bool
    {
        return $this->mode === ContentProjectMode::Tertiary;
    }

    public function hasResearch(): bool
    {
        return ! empty($this->ai_context['research']);
    }

    public function hasApprovedResearch(): bool
    {
        return ! empty($this->ai_context['research_approved']);
    }

    public function hasScheme(): bool
    {
        return ! empty($this->ai_context['scheme']);
    }

    public function hasApprovedScheme(): bool
    {
        return ! empty($this->ai_context['scheme_approved']);
    }

    public function getBlockStructure(string $topicKey): ?array
    {
        return $this->ai_context['blocks'][$topicKey] ?? null;
    }

    public function isBlockApproved(string $topicKey): bool
    {
        return ! empty($this->progress_data['blocks_approved'][$topicKey]);
    }

    public function updateAiContext(string $key, mixed $value): void
    {
        $context = $this->ai_context ?? [];
        $context[$key] = $value;
        $this->update(['ai_context' => $context]);
    }

    public function updateProgressData(string $key, mixed $value): void
    {
        $progress = $this->progress_data ?? [];
        $progress[$key] = $value;
        $this->update(['progress_data' => $progress]);
    }
}
