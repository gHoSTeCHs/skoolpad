<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parent_child_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('parent_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('student_profile_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('linked_at')->nullable();
            $table->timestamp('data_consent_granted_at')->nullable();
            $table->integer('study_goal_minutes')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->unique(['parent_profile_id', 'student_profile_id']);
            $table->index('parent_profile_id', 'idx_parent_child_parent');
            $table->index('student_profile_id', 'idx_parent_child_student');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_child_links');
    }
};
