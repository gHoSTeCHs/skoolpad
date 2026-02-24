<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_context_links', function (Blueprint $table) {
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('question_context_id')->constrained()->cascadeOnDelete();
            $table->integer('sort_order')->default(0);
            $table->string('label')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->unique(['question_id', 'question_context_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_context_links');
    }
};
