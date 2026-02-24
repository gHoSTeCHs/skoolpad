<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grading_scales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('scale_type');
            $table->decimal('scale_min', 8, 2);
            $table->decimal('scale_max', 8, 2);
            $table->decimal('pass_threshold', 8, 2);
            $table->jsonb('grade_boundaries');
            $table->jsonb('classification_labels')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grading_scales');
    }
};
