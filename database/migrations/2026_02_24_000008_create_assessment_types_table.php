<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('education_system_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->foreignUuid('tier_id')->nullable()->constrained('curriculum_tiers')->cascadeOnDelete();
            $table->boolean('is_exit_exam')->default(false);
            $table->boolean('is_entrance_exam')->default(false);
            $table->foreignUuid('grading_scale_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_types');
    }
};
