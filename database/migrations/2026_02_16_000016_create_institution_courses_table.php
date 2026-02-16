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
        Schema::create('institution_courses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('owning_department_id')->constrained('departments')->cascadeOnDelete();
            $table->foreignUuid('discipline_id')->constrained()->cascadeOnDelete();
            $table->string('course_code');
            $table->string('course_title');
            $table->integer('level');
            $table->string('semester');
            $table->integer('credit_units')->nullable();
            $table->boolean('is_elective')->default(false);
            $table->string('course_scope')->default('department');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['institution_id', 'course_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('institution_courses');
    }
};
