<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_contexts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('question_paper_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('context_type');
            $table->string('title');
            $table->text('content')->nullable();
            $table->string('media_url')->nullable();
            $table->jsonb('table_data')->nullable();
            $table->jsonb('word_bank')->nullable();
            $table->string('language')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_contexts');
    }
};
