<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIGenerationLog extends Model
{
    use HasUuids;

    protected $table = 'ai_generation_logs';

    protected $fillable = [
        'content_project_id',
        'prompt_type',
        'system_prompt',
        'user_prompt',
        'raw_response',
        'parsed_data',
        'is_valid',
        'validation_errors',
        'model_used',
        'provider',
        'tokens_used',
        'generation_time_ms',
        'estimated_cost_cents',
        'admin_action',
        'acted_by',
        'acted_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'parsed_data' => 'array',
            'is_valid' => 'boolean',
            'validation_errors' => 'array',
            'tokens_used' => 'integer',
            'generation_time_ms' => 'integer',
            'estimated_cost_cents' => 'integer',
            'acted_at' => 'datetime',
        ];
    }

    public function contentProject(): BelongsTo
    {
        return $this->belongsTo(ContentProject::class);
    }

    public function actedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acted_by');
    }
}
