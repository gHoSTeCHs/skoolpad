<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('content_blocks', function (Blueprint $table) {
            $table->index('parent_block_id', 'idx_content_blocks_parent_block_id');
        });

        Schema::table('content_projects', function (Blueprint $table) {
            $table->index('created_by', 'idx_content_projects_created_by');
        });
    }

    public function down(): void
    {
        Schema::table('content_blocks', function (Blueprint $table) {
            $table->dropIndex('idx_content_blocks_parent_block_id');
        });

        Schema::table('content_projects', function (Blueprint $table) {
            $table->dropIndex('idx_content_projects_created_by');
        });
    }
};
