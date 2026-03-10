<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_timetable_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('institution_course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('level_subject_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('assessment_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('label');
            $table->date('exam_date');
            $table->time('exam_time')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'institution_course_id', 'level_subject_id', 'exam_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_timetable_entries');
    }
};
