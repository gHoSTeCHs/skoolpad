<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('content_blocks', function (Blueprint $table) {
            $table->text('content_guidance')->nullable()->after('visualization_config');
            $table->string('generation_status')->default('not_started')->after('content_guidance');
            $table->string('summary_sentence', 1000)->nullable()->after('generation_status');
            $table->jsonb('key_terms_introduced')->nullable()->after('summary_sentence');
            $table->jsonb('symbols_used')->nullable()->after('key_terms_introduced');
            $table->jsonb('formulas_used')->nullable()->after('symbols_used');
            $table->unsignedInteger('word_count')->nullable()->after('formulas_used');
            $table->boolean('nigerian_context_used')->nullable()->after('word_count');
            $table->timestampTz('last_generated_at')->nullable()->after('nigerian_context_used');
            $table->foreignUuid('last_generation_log_id')->nullable()->after('last_generated_at')
                ->constrained('ai_generation_logs')->nullOnDelete();
            $table->jsonb('drift_advisory')->nullable()->after('last_generation_log_id');
        });
    }

    public function down(): void
    {
        Schema::table('content_blocks', function (Blueprint $table) {
            $table->dropForeign(['last_generation_log_id']);
            $table->dropColumn([
                'content_guidance', 'generation_status', 'summary_sentence',
                'key_terms_introduced', 'symbols_used', 'formulas_used',
                'word_count', 'nigerian_context_used',
                'last_generated_at', 'last_generation_log_id', 'drift_advisory',
            ]);
        });
    }
};
