<?php

namespace Database\Seeders;

use App\Enums\ThinkingMode;
use App\Models\AIModel;
use App\Models\AIProvider;
use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class AIModelSeeder extends Seeder
{
    public function run(): void
    {
        $deepseek = AIProvider::query()->where('slug', 'deepseek')->firstOrFail();
        $anthropic = AIProvider::query()->where('slug', 'anthropic')->firstOrFail();
        $google = AIProvider::query()->where('slug', 'google')->firstOrFail();
        $openai = AIProvider::query()->where('slug', 'openai')->firstOrFail();

        $models = [
            // ── DeepSeek ──────────────────────────────────────────────────
            [
                'provider_id' => $deepseek->id,
                'name' => 'DeepSeek V4-Flash',
                'slug' => 'deepseek-v4-flash',
                'model_id' => 'deepseek-v4-flash',
                'thinking_mode' => ThinkingMode::None,
                'max_tokens' => 8192,
                'input_cost_per_million' => 14,
                'output_cost_per_million' => 28,
                'sort_order' => 1,
            ],
            [
                'provider_id' => $deepseek->id,
                'name' => 'DeepSeek V4-Flash (Think)',
                'slug' => 'deepseek-v4-flash-think',
                'model_id' => 'deepseek-v4-flash',
                'thinking_mode' => ThinkingMode::Standard,
                'max_tokens' => 8192,
                'input_cost_per_million' => 14,
                'output_cost_per_million' => 28,
                'sort_order' => 2,
            ],
            [
                'provider_id' => $deepseek->id,
                'name' => 'DeepSeek V4-Pro',
                'slug' => 'deepseek-v4-pro',
                'model_id' => 'deepseek-v4-pro',
                'thinking_mode' => ThinkingMode::None,
                'max_tokens' => 8192,
                'input_cost_per_million' => 174,
                'output_cost_per_million' => 348,
                'sort_order' => 3,
            ],
            [
                'provider_id' => $deepseek->id,
                'name' => 'DeepSeek V4-Pro (Think)',
                'slug' => 'deepseek-v4-pro-think',
                'model_id' => 'deepseek-v4-pro',
                'thinking_mode' => ThinkingMode::Standard,
                'max_tokens' => 8192,
                'input_cost_per_million' => 174,
                'output_cost_per_million' => 348,
                'sort_order' => 4,
            ],
            [
                'provider_id' => $deepseek->id,
                'name' => 'DeepSeek V4-Pro (Think Max)',
                'slug' => 'deepseek-v4-pro-think-max',
                'model_id' => 'deepseek-v4-pro',
                'thinking_mode' => ThinkingMode::Max,
                'max_tokens' => 8192,
                'input_cost_per_million' => 174,
                'output_cost_per_million' => 348,
                'sort_order' => 5,
            ],

            // ── Anthropic ─────────────────────────────────────────────────
            [
                'provider_id' => $anthropic->id,
                'name' => 'Claude Sonnet 4',
                'slug' => 'claude-sonnet-4',
                'model_id' => 'claude-sonnet-4-20250514',
                'thinking_mode' => ThinkingMode::None,
                'max_tokens' => 8192,
                'input_cost_per_million' => 300,
                'output_cost_per_million' => 1500,
                'sort_order' => 10,
            ],

            // ── Google ────────────────────────────────────────────────────
            [
                'provider_id' => $google->id,
                'name' => 'Gemini 2.5 Flash',
                'slug' => 'gemini-flash',
                'model_id' => 'gemini-2.5-flash',
                'thinking_mode' => ThinkingMode::None,
                'max_tokens' => 8192,
                'input_cost_per_million' => 15,
                'output_cost_per_million' => 60,
                'sort_order' => 20,
            ],

            // ── OpenAI ────────────────────────────────────────────────────
            [
                'provider_id' => $openai->id,
                'name' => 'GPT-4.1 Mini',
                'slug' => 'gpt-4-1-mini',
                'model_id' => 'gpt-4.1-mini',
                'thinking_mode' => ThinkingMode::None,
                'max_tokens' => 8192,
                'input_cost_per_million' => 40,
                'output_cost_per_million' => 160,
                'sort_order' => 30,
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
                ['key' => 'content_studio.default_model_id'],
                ['value' => ['model_id' => $firstModel->id]],
            );

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
