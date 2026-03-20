<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parent_check_in_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('parent_child_link_id')->constrained('parent_child_links')->cascadeOnDelete();
            $table->date('session_date');
            $table->integer('duration_minutes')->default(10);
            $table->jsonb('items')->default('[]');
            $table->jsonb('completed_items')->default('[]');
            $table->string('status')->default('pending');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['parent_child_link_id', 'session_date'], 'check_in_link_date_unique');
            $table->index('parent_child_link_id', 'idx_check_in_link');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_check_in_sessions');
    }
};
