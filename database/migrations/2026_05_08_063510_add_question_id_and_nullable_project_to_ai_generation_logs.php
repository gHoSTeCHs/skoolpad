<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE ai_generation_logs ALTER COLUMN content_project_id DROP NOT NULL');

        Schema::table('ai_generation_logs', function (Blueprint $table) {
            $table->foreignUuid('question_id')
                ->nullable()
                ->after('content_project_id')
                ->constrained('questions')
                ->nullOnDelete();

            $table->index('question_id');
        });
    }

    public function down(): void
    {
        Schema::table('ai_generation_logs', function (Blueprint $table) {
            $table->dropIndex(['question_id']);
            $table->dropForeign(['question_id']);
            $table->dropColumn('question_id');
        });

        DB::statement("UPDATE ai_generation_logs SET content_project_id = '00000000-0000-0000-0000-000000000000' WHERE content_project_id IS NULL");
        DB::statement('ALTER TABLE ai_generation_logs ALTER COLUMN content_project_id SET NOT NULL');
    }
};
