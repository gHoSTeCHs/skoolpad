<?php

return [
    'ai_provider' => env('CONTENT_STUDIO_AI_PROVIDER', 'anthropic'),

    'providers' => [
        'anthropic' => [
            'model' => env('CONTENT_STUDIO_ANTHROPIC_MODEL', 'claude-sonnet-4-20250514'),
            'api_key' => env('ANTHROPIC_API_KEY'),
            'max_tokens' => 8192,
        ],
        'openai' => [
            'model' => env('CONTENT_STUDIO_OPENAI_MODEL', 'gpt-4o'),
            'api_key' => env('OPENAI_API_KEY'),
            'max_tokens' => 8192,
        ],
        'ollama' => [
            'model' => env('CONTENT_STUDIO_OLLAMA_MODEL', 'llama3.1:70b'),
            'base_url' => env('OLLAMA_BASE_URL', 'http://localhost:11434'),
            'max_tokens' => 8192,
        ],
    ],

    'temperature' => [
        'structure' => 0.3,
        'content' => 0.5,
        'questions' => 0.4,
        'explanations' => 0.5,
        'research' => 0.6,
    ],

    'retry' => [
        'max_attempts' => 2,
        'validation_correction' => true,
    ],

    'quality' => [
        'min_score_for_batch_approval' => 85,
        'flag_threshold' => 60,
    ],
];
