<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_papers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('institution_course_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('assessment_type_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('academic_session')->nullable();
            $table->string('semester')->nullable();
            $table->integer('year')->nullable();
            $table->integer('total_marks');
            $table->integer('duration_minutes');
            $table->text('instructions')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_papers');
    }
};
