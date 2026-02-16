<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('course_topic_mappings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('institution_course_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('canonical_topic_id')->constrained()->cascadeOnDelete();
            $table->integer('sequence_order');
            $table->string('weight')->default('core');
            $table->timestamps();

            $table->unique(['institution_course_id', 'canonical_topic_id'], 'ctm_course_topic_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_topic_mappings');
    }
};
