<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cgpa_simulations', function (Blueprint $table) {
            $table->string('mode')->default('quick')->after('name');
            $table->foreignUuid('grading_scale_id')->nullable()->after('mode')
                ->constrained('grading_scales')->nullOnDelete();
            $table->jsonb('semester_data')->nullable()->after('projected_cgpa');
            $table->decimal('target_cgpa', 4, 2)->nullable()->after('semester_data');
        });
    }

    public function down(): void
    {
        Schema::table('cgpa_simulations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('grading_scale_id');
            $table->dropColumn(['mode', 'semester_data', 'target_cgpa']);
        });
    }
};
