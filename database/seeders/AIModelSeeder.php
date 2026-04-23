<?php

namespace Database\Seeders;

use App\Enums\AIAdapterType;
use App\Models\AIModel;
use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class AIModelSeeder extends Seeder
{
    public function run(): void
    {
        $models = [
            [
                'name' => 'DeepSeek V3.2',
                'slug' => 'deepseek-v3',
                'adapter_type' => AIAdapterType::OpenAICompatible,
                'base_url' => 'https://api.deepseek.com/v1',
                'model_id' => 'deepseek-chat',
                'max_tokens' => 8192,
                'input_cost_per_million' => 27,
                'output_cost_per_million' => 110,
                'sort_order' => 1,
            ],
            [
                'name' => 'Claude Sonnet 4',
                'slug' => 'claude-sonnet-4',
                'adapter_type' => AIAdapterType::Anthropic,
                'base_url' => 'https://api.anthropic.com/v1',
                'model_id' => 'claude-sonnet-4-20250514',
                'max_tokens' => 8192,
                'input_cost_per_million' => 300,
                'output_cost_per_million' => 1500,
                'sort_order' => 2,
            ],
            [
                'name' => 'Gemini 2.5 Flash',
                'slug' => 'gemini-flash',
                'adapter_type' => AIAdapterType::OpenAICompatible,
                'base_url' => 'https://generativelanguage.googleapis.com/v1beta/openai',
                'model_id' => 'gemini-2.5-flash',
                'max_tokens' => 8192,
                'input_cost_per_million' => 15,
                'output_cost_per_million' => 60,
                'sort_order' => 3,
            ],
            [
                'name' => 'GPT-4.1 Mini',
                'slug' => 'gpt-4-1-mini',
                'adapter_type' => AIAdapterType::OpenAICompatible,
                'base_url' => 'https://api.openai.com/v1',
                'model_id' => 'gpt-4.1-mini',
                'max_tokens' => 8192,
                'input_cost_per_million' => 40,
                'output_cost_per_million' => 160,
                'sort_order' => 4,
            ],
        ];

        foreach ($models as $model) {
            AIModel::query()->updateOrCreate(
                ['slug' => $model['slug']],
                $model,
            );
        }

        $firstModel = AIModel::query()->active()->orderBy('sort_order')->first();

        if ($firstModel) {
            PlatformSetting::query()->updateOrCreate(
                ['key' => 'ai_task_routing'],
                [
                    'value' => [
                        'scheme' => $firstModel->id,
                        'blocks' => $firstModel->id,
                        'content' => $firstModel->id,
                        'questions' => $firstModel->id,
                        'explanations' => $firstModel->id,
                        'research' => $firstModel->id,
                    ],
                ],
            );
        }
    }
}
