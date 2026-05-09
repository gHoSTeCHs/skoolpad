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

        // content_project_id is left nullable — restoring NOT NULL would require deleting
        // all answer-generation log rows (which legitimately have content_project_id = null)
        // and would violate the FK constraint with a sentinel UUID. Accept nullable on rollback.
    }
};
