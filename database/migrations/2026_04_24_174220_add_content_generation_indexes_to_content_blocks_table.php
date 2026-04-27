<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('content_blocks', function (Blueprint $table) {
            $table->index(['canonical_topic_id', 'is_container'], 'idx_content_blocks_topic_container');
            $table->index('generation_status', 'idx_content_blocks_generation_status');
        });
    }

    public function down(): void
    {
        Schema::table('content_blocks', function (Blueprint $table) {
            $table->dropIndex('idx_content_blocks_topic_container');
            $table->dropIndex('idx_content_blocks_generation_status');
        });
    }
};
