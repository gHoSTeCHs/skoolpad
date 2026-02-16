<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('course_department_offerings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('institution_course_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('department_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_compulsory')->default(true);
            $table->timestamp('created_at')->nullable();

            $table->unique(['institution_course_id', 'department_id'], 'cdo_course_department_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_department_offerings');
    }
};
