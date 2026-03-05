<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_goals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('assessment_type_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('institution_course_id')->nullable()->constrained()->nullOnDelete();
            $table->date('exam_date')->nullable();
            $table->decimal('target_score', 5, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['user_id', 'assessment_type_id', 'institution_course_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_goals');
    }
};
