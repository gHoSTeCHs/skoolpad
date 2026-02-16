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
        Schema::create('content_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->string('submission_type');
            $table->foreignUuid('related_question_id')->nullable()->constrained('questions')->nullOnDelete();
            $table->foreignUuid('related_topic_id')->nullable()->constrained('canonical_topics')->nullOnDelete();
            $table->jsonb('content');
            $table->jsonb('images')->nullable();
            $table->foreignUuid('institution_course_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('exam_year')->nullable();
            $table->string('exam_semester')->nullable();
            $table->string('status')->default('pending');
            $table->foreignUuid('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reviewer_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_submissions');
    }
};
