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
        Schema::table('block_completions', function (Blueprint $table) {
            $table->unsignedInteger('reading_time_seconds')->nullable()->after('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('block_completions', function (Blueprint $table) {
            $table->dropColumn('reading_time_seconds');
        });
    }
};
