<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheme_of_work_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('curriculum_subject_level_id')->constrained('level_subjects')->cascadeOnDelete();
            $table->integer('term');
            $table->integer('week_number');
            $table->string('topic_label');
            $table->foreignUuid('canonical_topic_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('content_block_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['curriculum_subject_level_id', 'term', 'week_number']);
            $table->index(['curriculum_subject_level_id', 'term']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheme_of_work_items');
    }
};
