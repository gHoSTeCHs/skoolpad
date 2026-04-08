<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_models', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('adapter_type');
            $table->string('base_url');
            $table->text('api_key')->nullable();
            $table->string('model_id');
            $table->unsignedInteger('max_tokens')->default(8192);
            $table->unsignedInteger('input_cost_per_million')->default(0);
            $table->unsignedInteger('output_cost_per_million')->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_models');
    }
};
