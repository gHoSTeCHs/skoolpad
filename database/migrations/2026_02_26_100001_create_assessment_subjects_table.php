<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('assessment_type_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->boolean('is_compulsory')->default(false);
            $table->timestamps();

            $table->unique(['assessment_type_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_subjects');
    }
};
