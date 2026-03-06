<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_goals', function (Blueprint $table) {
            $table->foreignUuid('assessment_subject_id')
                ->nullable()
                ->after('assessment_type_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('exam_goals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assessment_subject_id');
        });
    }
};
