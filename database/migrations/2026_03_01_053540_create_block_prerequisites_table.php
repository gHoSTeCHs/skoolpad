<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('block_prerequisites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('block_id')->constrained('content_blocks')->cascadeOnDelete();
            $table->foreignUuid('prerequisite_block_id')->constrained('content_blocks')->cascadeOnDelete();
            $table->boolean('is_hard_prerequisite')->default(true);
            $table->timestamp('created_at')->nullable();

            $table->unique(['block_id', 'prerequisite_block_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('block_prerequisites');
    }
};
