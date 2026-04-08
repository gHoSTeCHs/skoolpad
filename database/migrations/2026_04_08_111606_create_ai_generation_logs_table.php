<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_generation_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('content_project_id')->constrained()->cascadeOnDelete();
            $table->string('prompt_type');
            $table->text('system_prompt');
            $table->text('user_prompt');
            $table->text('raw_response')->nullable();
            $table->jsonb('parsed_data')->nullable();
            $table->boolean('is_valid')->default(false);
            $table->jsonb('validation_errors')->nullable();
            $table->string('model_used');
            $table->string('provider');
            $table->integer('tokens_used')->default(0);
            $table->integer('generation_time_ms')->default(0);
            $table->integer('estimated_cost_cents')->nullable();
            $table->string('admin_action')->nullable();
            $table->foreignUuid('acted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_generation_logs');
    }
};
