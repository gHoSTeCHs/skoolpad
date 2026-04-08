<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_generation_logs', function (Blueprint $table) {
            $table->foreignUuid('ai_model_id')->nullable()->after('content_project_id')->constrained('ai_models')->nullOnDelete();
            $table->unsignedInteger('input_tokens')->default(0)->after('tokens_used');
            $table->unsignedInteger('output_tokens')->default(0)->after('input_tokens');
        });
    }

    public function down(): void
    {
        Schema::table('ai_generation_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ai_model_id');
            $table->dropColumn(['input_tokens', 'output_tokens']);
        });
    }
};
