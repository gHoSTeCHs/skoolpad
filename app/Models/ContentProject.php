<?php

namespace App\Models;

use App\Enums\ContentProjectMode;
use App\Enums\ContentProjectStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

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
        'default_ai_model_id',
        'research_model_id',
        'scheme_model_id',
        'blocks_model_id',
        'content_model_id',
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

    public function defaultAiModel(): BelongsTo
    {
        return $this->belongsTo(AIModel::class, 'default_ai_model_id');
    }

    public function researchModel(): BelongsTo
    {
        return $this->belongsTo(AIModel::class, 'research_model_id');
    }

    public function schemeModel(): BelongsTo
    {
        return $this->belongsTo(AIModel::class, 'scheme_model_id');
    }

    public function blocksModel(): BelongsTo
    {
        return $this->belongsTo(AIModel::class, 'blocks_model_id');
    }

    public function contentModel(): BelongsTo
    {
        return $this->belongsTo(AIModel::class, 'content_model_id');
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
        DB::transaction(function () use ($key, $value) {
            $fresh = static::query()->lockForUpdate()->find($this->id);
            $context = $fresh->ai_context ?? [];
            $context[$key] = $value;
            $fresh->update(['ai_context' => $context]);
            $this->setRawAttributes($fresh->getRawOriginal());
            $this->syncOriginal();
        });
    }

    public function updateProgressData(string $key, mixed $value): void
    {
        DB::transaction(function () use ($key, $value) {
            $fresh = static::query()->lockForUpdate()->find($this->id);
            $progress = $fresh->progress_data ?? [];
            $progress[$key] = $value;
            $fresh->update(['progress_data' => $progress]);
            $this->setRawAttributes($fresh->getRawOriginal());
            $this->syncOriginal();
        });
    }

    public function toShowArray(): array
    {
        $this->loadMissing(['educationLevel', 'curriculumSubject', 'discipline', 'createdBy']);

        $data = $this->toArray();
        unset($data['education_level'], $data['curriculum_subject'], $data['discipline'], $data['created_by']);

        return array_merge($data, [
            'created_by' => $this->getAttributeValue('created_by'),
            'mode_label' => $this->mode->label(),
            'status_label' => $this->status->label(),
            'education_level_name' => $this->educationLevel?->display_name ?? $this->educationLevel?->name,
            'curriculum_subject_name' => $this->curriculumSubject?->name,
            'discipline_name' => $this->discipline?->name,
            'created_by_name' => $this->createdBy?->name,
        ]);
    }
}
