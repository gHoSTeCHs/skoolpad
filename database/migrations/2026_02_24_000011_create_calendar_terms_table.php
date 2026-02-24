<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_terms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('institution_id')->constrained()->cascadeOnDelete();
            $table->string('academic_year');
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('sort_order');
            $table->timestamps();

            $table->unique(['institution_id', 'academic_year', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_terms');
    }
};
