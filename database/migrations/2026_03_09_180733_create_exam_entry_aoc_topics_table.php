<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_entry_aoc_topics', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('exam_timetable_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('canonical_topic_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['exam_timetable_entry_id', 'canonical_topic_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_entry_aoc_topics');
    }
};
