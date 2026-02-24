<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_readiness_caches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('curriculum_subject_level_id')->constrained('level_subjects')->cascadeOnDelete();
            $table->decimal('syllabus_coverage', 5, 2)->default(0);
            $table->decimal('practice_performance', 5, 2)->default(0);
            $table->decimal('spaced_retention', 5, 2)->default(0);
            $table->decimal('parent_verification', 5, 2)->default(0);
            $table->decimal('composite_score', 5, 2)->default(0);
            $table->timestamp('calculated_at');

            $table->unique(['user_id', 'curriculum_subject_level_id']);
            $table->index('user_id', 'idx_exam_readiness_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_readiness_caches');
    }
};
