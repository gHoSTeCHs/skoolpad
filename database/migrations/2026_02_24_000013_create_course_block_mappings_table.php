<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_block_mappings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('institution_course_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('curriculum_subject_level_id')->nullable()->constrained('level_subjects')->cascadeOnDelete();
            $table->foreignUuid('content_block_id')->constrained()->cascadeOnDelete();
            $table->string('teaching_depth');
            $table->boolean('is_core_block')->default(true);
            $table->integer('week_start')->nullable();
            $table->integer('week_end')->nullable();
            $table->decimal('lecture_hours', 5, 2)->nullable();
            $table->decimal('lab_hours', 5, 2)->nullable();
            $table->timestamps();
        });

        DB::statement('ALTER TABLE course_block_mappings ADD CONSTRAINT course_block_mappings_source_xor CHECK ((institution_course_id IS NOT NULL)::int + (curriculum_subject_level_id IS NOT NULL)::int = 1)');
    }

    public function down(): void
    {
        Schema::dropIfExists('course_block_mappings');
    }
};
