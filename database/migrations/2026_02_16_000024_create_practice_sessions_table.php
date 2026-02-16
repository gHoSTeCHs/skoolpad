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
        Schema::create('practice_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('institution_course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('canonical_topic_id')->nullable()->constrained()->nullOnDelete();
            $table->string('mode');
            $table->integer('question_count');
            $table->integer('correct_count')->default(0);
            $table->integer('total_time_seconds')->nullable();
            $table->integer('time_limit_seconds')->nullable();
            $table->decimal('score_percentage', 5, 2)->nullable();
            $table->string('tier_at_creation')->nullable();
            $table->boolean('is_resumable')->default(true);
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practice_sessions');
    }
};
