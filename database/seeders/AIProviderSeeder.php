<?php

namespace Database\Seeders;

use App\Enums\AIAdapterType;
use App\Models\AIProvider;
use Illuminate\Database\Seeder;

class AIProviderSeeder extends Seeder
{
    public function run(): void
    {
        $providers = [
            [
                'name' => 'DeepSeek',
                'slug' => 'deepseek',
                'adapter_type' => AIAdapterType::OpenAICompatible,
                'base_url' => 'https://api.deepseek.com/v1',
                'supports_thinking' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Anthropic',
                'slug' => 'anthropic',
                'adapter_type' => AIAdapterType::Anthropic,
                'base_url' => 'https://api.anthropic.com/v1',
                'supports_thinking' => false,
                'sort_order' => 2,
            ],
            [
                'name' => 'Google',
                'slug' => 'google',
                'adapter_type' => AIAdapterType::OpenAICompatible,
                'base_url' => 'https://generativelanguage.googleapis.com/v1beta/openai',
                'supports_thinking' => false,
                'sort_order' => 3,
            ],
            [
                'name' => 'OpenAI',
                'slug' => 'openai',
                'adapter_type' => AIAdapterType::OpenAICompatible,
                'base_url' => 'https://api.openai.com/v1',
                'supports_thinking' => false,
                'sort_order' => 4,
            ],
        ];

        foreach ($providers as $provider) {
            AIProvider::query()->updateOrCreate(
                ['slug' => $provider['slug']],
                $provider,
            );
        }
    }
}
