<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum_tiers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('education_system_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->integer('sort_order');
            $table->boolean('is_tertiary')->default(false);
            $table->timestamps();

            $table->unique(['education_system_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_tiers');
    }
};
