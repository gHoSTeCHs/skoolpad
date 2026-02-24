<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->foreignUuid('institution_type_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('education_system_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('education_level_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('stream_id')->nullable()->constrained()->nullOnDelete();
            $table->string('school_name')->nullable();
            $table->string('state_or_region')->nullable();
            $table->string('invite_code', 6)->nullable()->unique();
            $table->jsonb('exam_goals')->nullable();
            $table->jsonb('study_preferences')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropForeign(['institution_type_id']);
            $table->dropForeign(['education_system_id']);
            $table->dropForeign(['education_level_id']);
            $table->dropForeign(['stream_id']);

            $table->dropColumn([
                'institution_type_id',
                'education_system_id',
                'education_level_id',
                'stream_id',
                'school_name',
                'state_or_region',
                'invite_code',
                'exam_goals',
                'study_preferences',
            ]);
        });
    }
};
