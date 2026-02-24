<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_assessment_links', function (Blueprint $table) {
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('assessment_type_id')->constrained()->cascadeOnDelete();
            $table->integer('year')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->unique(['question_id', 'assessment_type_id', 'year'], 'qal_question_assessment_year_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_assessment_links');
    }
};
