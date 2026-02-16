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
        Schema::create('topic_prerequisites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('topic_id')->constrained('canonical_topics')->cascadeOnDelete();
            $table->foreignUuid('prerequisite_topic_id')->constrained('canonical_topics')->cascadeOnDelete();
            $table->boolean('is_hard_prerequisite')->default(true);
            $table->timestamp('created_at')->nullable();

            $table->unique(['topic_id', 'prerequisite_topic_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('topic_prerequisites');
    }
};
