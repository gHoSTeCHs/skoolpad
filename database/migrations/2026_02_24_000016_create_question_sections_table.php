<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('question_paper_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('instruction');
            $table->integer('marks');
            $table->integer('required_count')->nullable();
            $table->integer('sort_order');
            $table->timestamps();

            $table->unique(['question_paper_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_sections');
    }
};
