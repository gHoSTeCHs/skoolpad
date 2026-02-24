<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('education_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('curriculum_tier_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('display_name');
            $table->integer('sort_order');
            $table->integer('typical_age_min')->nullable();
            $table->integer('typical_age_max')->nullable();
            $table->timestamps();

            $table->unique(['curriculum_tier_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('education_levels');
    }
};
