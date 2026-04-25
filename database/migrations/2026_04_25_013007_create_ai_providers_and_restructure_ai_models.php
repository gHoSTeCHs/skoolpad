<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_providers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('adapter_type');
            $table->string('base_url');
            $table->text('api_key')->nullable();
            $table->boolean('supports_thinking')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Derive providers from the distinct (adapter_type, base_url) combinations
        // already in ai_models. We map known base_urls to human names.
        $urlToProvider = [
            'https://api.deepseek.com/v1' => ['name' => 'DeepSeek',  'slug' => 'deepseek',   'supports_thinking' => true,  'sort_order' => 1],
            'https://api.anthropic.com/v1' => ['name' => 'Anthropic', 'slug' => 'anthropic',  'supports_thinking' => false, 'sort_order' => 2],
            'https://generativelanguage.googleapis.com/v1beta/openai' => ['name' => 'Google',    'slug' => 'google',     'supports_thinking' => false, 'sort_order' => 3],
            'https://api.openai.com/v1' => ['name' => 'OpenAI',    'slug' => 'openai',     'supports_thinking' => false, 'sort_order' => 4],
        ];

        $existingModels = DB::table('ai_models')->get(['id', 'adapter_type', 'base_url', 'api_key']);

        $providerIdByUrl = [];
        $seenSlugs = [];

        foreach ($existingModels as $model) {
            $baseUrl = rtrim($model->base_url, '/');
            if (isset($providerIdByUrl[$baseUrl])) {
                continue;
            }

            $meta = $urlToProvider[$baseUrl] ?? [
                'name' => ucfirst(parse_url($baseUrl, PHP_URL_HOST) ?? 'Unknown'),
                'slug' => Str::slug(parse_url($baseUrl, PHP_URL_HOST) ?? 'unknown'),
                'supports_thinking' => false,
                'sort_order' => 99,
            ];

            // Ensure unique slug
            $slug = $meta['slug'];
            if (isset($seenSlugs[$slug])) {
                $slug .= '-'.substr($model->id, 0, 4);
            }
            $seenSlugs[$slug] = true;

            // Collect api_key from first model with a non-null key for this base_url
            $apiKey = $existingModels
                ->filter(fn ($m) => rtrim($m->base_url, '/') === $baseUrl && ! empty($m->api_key))
                ->first()
                ?->api_key;

            $providerId = (string) Str::uuid();
            DB::table('ai_providers')->insert([
                'id' => $providerId,
                'name' => $meta['name'],
                'slug' => $slug,
                'adapter_type' => $model->adapter_type,
                'base_url' => $baseUrl,
                'api_key' => $apiKey,
                'supports_thinking' => $meta['supports_thinking'],
                'is_active' => true,
                'sort_order' => $meta['sort_order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $providerIdByUrl[$baseUrl] = $providerId;
        }

        Schema::table('ai_models', function (Blueprint $table) {
            $table->foreignUuid('provider_id')
                ->nullable()
                ->after('id')
                ->constrained('ai_providers');
            $table->string('thinking_mode')->default('none')->after('model_id');
        });

        // Populate provider_id on existing models
        foreach ($existingModels as $model) {
            $baseUrl = rtrim($model->base_url, '/');
            $providerId = $providerIdByUrl[$baseUrl] ?? null;
            if ($providerId) {
                DB::table('ai_models')
                    ->where('id', $model->id)
                    ->update(['provider_id' => $providerId]);
            }
        }

        // Update the existing DeepSeek model to V4-Flash (model_id was deepseek-chat)
        DB::table('ai_models')
            ->where('slug', 'deepseek-v3')
            ->update([
                'name' => 'DeepSeek V4-Flash',
                'slug' => 'deepseek-v4-flash',
                'model_id' => 'deepseek-v4-flash',
                'max_tokens' => 8192,
                'input_cost_per_million' => 14,
                'output_cost_per_million' => 28,
                'updated_at' => now(),
            ]);

        Schema::table('ai_models', function (Blueprint $table) {
            $table->dropColumn(['adapter_type', 'base_url', 'api_key']);
        });
    }

    public function down(): void
    {
        Schema::table('ai_models', function (Blueprint $table) {
            $table->string('adapter_type')->default('openai_compatible')->after('slug');
            $table->string('base_url')->default('')->after('adapter_type');
            $table->text('api_key')->nullable()->after('base_url');
        });

        // Restore columns from providers
        $providers = DB::table('ai_providers')->get();
        foreach ($providers as $provider) {
            DB::table('ai_models')
                ->where('provider_id', $provider->id)
                ->update([
                    'adapter_type' => $provider->adapter_type,
                    'base_url' => $provider->base_url,
                    'api_key' => $provider->api_key,
                ]);
        }

        // Restore the old DeepSeek model name/id
        DB::table('ai_models')
            ->where('slug', 'deepseek-v4-flash')
            ->update([
                'name' => 'DeepSeek V3.2',
                'slug' => 'deepseek-v3',
                'model_id' => 'deepseek-chat',
            ]);

        Schema::table('ai_models', function (Blueprint $table) {
            $table->dropForeign(['provider_id']);
            $table->dropColumn(['provider_id', 'thinking_mode']);
        });

        Schema::dropIfExists('ai_providers');
    }
};
