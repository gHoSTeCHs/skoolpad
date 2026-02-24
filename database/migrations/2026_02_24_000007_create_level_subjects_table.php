<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('level_subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('education_level_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('curriculum_subject_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_compulsory')->default(true);
            $table->foreignUuid('stream_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->unique(['education_level_id', 'curriculum_subject_id', 'stream_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('level_subjects');
    }
};
