<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_generation_logs', function (Blueprint $table) {
            $table->foreignUuid('content_block_id')
                ->nullable()
                ->constrained('content_blocks')
                ->nullOnDelete();

            $table->foreignUuid('canonical_topic_id')
                ->nullable()
                ->constrained('canonical_topics')
                ->nullOnDelete();

            $table->index(['content_project_id', 'content_block_id']);
            $table->index(['content_project_id', 'canonical_topic_id']);
        });
    }

    public function down(): void
    {
        Schema::table('ai_generation_logs', function (Blueprint $table) {
            $table->dropForeign(['content_block_id']);
            $table->dropForeign(['canonical_topic_id']);
            $table->dropIndex(['content_project_id', 'content_block_id']);
            $table->dropIndex(['content_project_id', 'canonical_topic_id']);
            $table->dropColumn(['content_block_id', 'canonical_topic_id']);
        });
    }
};
