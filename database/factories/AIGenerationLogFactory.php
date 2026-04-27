<?php

namespace Database\Factories;

use App\Models\AIGenerationLog;
use App\Models\AIModel;
use App\Models\ContentProject;
use Illuminate\Database\Eloquent\Factories\Factory;

class AIGenerationLogFactory extends Factory
{
    protected $model = AIGenerationLog::class;

    public function definition(): array
    {
        return [
            'content_project_id' => ContentProject::factory(),
            'ai_model_id' => AIModel::factory(),
            'prompt_type' => 'content',
            'system_prompt' => 'system',
            'user_prompt' => 'user',
            'raw_response' => '{}',
            'parsed_data' => [],
            'is_valid' => true,
            'validation_errors' => [],
            'model_used' => 'test-model',
            'provider' => 'openai_compatible',
            'tokens_used' => 100,
            'input_tokens' => 60,
            'output_tokens' => 40,
            'generation_time_ms' => 1000,
            'estimated_cost_cents' => 1,
        ];
    }
}
