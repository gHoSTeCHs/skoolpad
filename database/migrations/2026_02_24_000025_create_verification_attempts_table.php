<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verification_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('parent_child_link_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('canonical_topic_id')->constrained()->cascadeOnDelete();
            $table->jsonb('responses');
            $table->string('overall_result');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('parent_child_link_id', 'idx_verification_link');
            $table->index('canonical_topic_id', 'idx_verification_topic');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_attempts');
    }
};
