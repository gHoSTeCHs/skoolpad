<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_blocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('canonical_topic_id')->constrained()->cascadeOnDelete();
            $table->uuid('parent_block_id')->nullable();
            $table->string('title');
            $table->string('slug');
            $table->string('block_type');
            $table->string('path');
            $table->integer('depth_level');
            $table->integer('sort_order');
            $table->jsonb('content')->nullable();
            $table->integer('estimated_read_time')->nullable();
            $table->string('difficulty_level')->nullable();
            $table->string('bloom_level')->nullable();
            $table->boolean('is_container')->default(false);
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->unique(['canonical_topic_id', 'path']);
        });

        Schema::table('content_blocks', function (Blueprint $table) {
            $table->foreign('parent_block_id')->references('id')->on('content_blocks')->cascadeOnDelete();
        });

        DB::statement('ALTER TABLE content_blocks ADD CONSTRAINT content_blocks_depth_level_check CHECK (depth_level <= 5)');
    }

    public function down(): void
    {
        Schema::dropIfExists('content_blocks');
    }
};
