<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('readiness_score_history', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('curriculum_subject_level_id');
            $table->decimal('composite_score', 5, 2);
            $table->timestamp('recorded_at');

            $table->index(['user_id', 'curriculum_subject_level_id', 'recorded_at'], 'readiness_history_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('readiness_score_history');
    }
};
