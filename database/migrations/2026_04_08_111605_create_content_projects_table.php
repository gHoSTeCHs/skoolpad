<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('mode');
            $table->foreignUuid('education_level_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('curriculum_subject_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('discipline_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('draft');
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->jsonb('progress_data')->nullable();
            $table->jsonb('ai_context')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_projects');
    }
};
