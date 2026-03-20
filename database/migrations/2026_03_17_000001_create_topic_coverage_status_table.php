<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topic_coverage_status', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('parent_child_link_id')->constrained('parent_child_links')->cascadeOnDelete();
            $table->foreignUuid('canonical_topic_id')->constrained('canonical_topics')->cascadeOnDelete();
            $table->string('status');
            $table->timestamp('covered_at')->nullable();
            $table->string('source');
            $table->timestamps();

            $table->unique(['parent_child_link_id', 'canonical_topic_id'], 'topic_coverage_link_topic_unique');
            $table->index('parent_child_link_id', 'idx_topic_coverage_link');
            $table->index('canonical_topic_id', 'idx_topic_coverage_topic');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topic_coverage_status');
    }
};
