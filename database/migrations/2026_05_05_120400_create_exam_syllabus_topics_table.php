<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_syllabus_topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('assessment_subject_id')->constrained()->cascadeOnDelete();
            $table->uuid('parent_topic_id')->nullable();
            $table->string('part_label')->nullable();
            $table->string('topic_number')->nullable();
            $table->string('title');
            $table->text('notes_md')->nullable();
            $table->jsonb('subtopics_json')->nullable();
            $table->string('source_url', 500)->nullable();
            $table->integer('version_year')->nullable();
            $table->timestamp('ingested_at')->nullable();
            $table->timestamps();

            $table->index(['assessment_subject_id', 'topic_number'], 'exam_syllabus_topics_subject_number_idx');
        });

        Schema::table('exam_syllabus_topics', function (Blueprint $table) {
            $table->foreign('parent_topic_id')
                ->references('id')->on('exam_syllabus_topics')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_syllabus_topics');
    }
};
