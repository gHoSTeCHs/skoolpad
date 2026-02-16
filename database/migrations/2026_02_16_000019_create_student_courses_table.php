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
        Schema::create('student_courses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('institution_course_id')->constrained()->cascadeOnDelete();
            $table->string('semester');
            $table->string('academic_year');
            $table->boolean('is_archived')->default(false);
            $table->timestamp('created_at')->nullable();

            $table->unique(['student_profile_id', 'institution_course_id', 'academic_year'], 'sc_profile_course_year_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_courses');
    }
};
