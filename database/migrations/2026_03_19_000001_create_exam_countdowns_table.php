<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_countdowns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('exam_name');
            $table->date('exam_date');
            $table->integer('alert_start_days_before')->default(14);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('user_id', 'idx_exam_countdown_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_countdowns');
    }
};
