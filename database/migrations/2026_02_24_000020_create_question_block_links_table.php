<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_block_links', function (Blueprint $table) {
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('content_block_id')->constrained()->cascadeOnDelete();
            $table->string('relevance');
            $table->timestamp('created_at')->nullable();

            $table->unique(['question_id', 'content_block_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_block_links');
    }
};
