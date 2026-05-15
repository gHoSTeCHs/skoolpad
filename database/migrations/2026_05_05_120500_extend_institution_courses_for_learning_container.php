<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institution_courses', function (Blueprint $table) {
            $table->string('container_type', 16)->default('course')->after('id');
            $table->foreignUuid('education_level_id')
                ->nullable()
                ->after('discipline_id')
                ->constrained()
                ->nullOnDelete();
            $table->foreignUuid('stream_id')
                ->nullable()
                ->after('education_level_id')
                ->constrained()
                ->nullOnDelete();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE institution_courses ALTER COLUMN institution_id DROP NOT NULL');
            DB::statement('ALTER TABLE institution_courses ALTER COLUMN owning_department_id DROP NOT NULL');
        }

        Schema::table('institution_courses', function (Blueprint $table) {
            $table->dropUnique(['institution_id', 'course_code']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                "CREATE UNIQUE INDEX institution_courses_uni_unique
                 ON institution_courses (institution_id, course_code)
                 WHERE container_type = 'course' AND institution_id IS NOT NULL"
            );
            DB::statement(
                "CREATE UNIQUE INDEX institution_courses_subject_unique
                 ON institution_courses (education_level_id, course_title)
                 WHERE container_type = 'subject' AND education_level_id IS NOT NULL"
            );
            DB::statement(
                "ALTER TABLE institution_courses ADD CONSTRAINT institution_courses_container_type_check
                 CHECK (container_type IN ('course', 'subject'))"
            );
        }

        Schema::table('institution_courses', function (Blueprint $table) {
            $table->index(['container_type', 'education_level_id'], 'institution_courses_type_level_idx');
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE institution_courses DROP CONSTRAINT IF EXISTS institution_courses_container_type_check');
            DB::statement('DROP INDEX IF EXISTS institution_courses_uni_unique');
            DB::statement('DROP INDEX IF EXISTS institution_courses_subject_unique');
        }

        Schema::table('institution_courses', function (Blueprint $table) {
            $table->dropIndex('institution_courses_type_level_idx');
            $table->dropForeign(['stream_id']);
            $table->dropForeign(['education_level_id']);
            $table->dropColumn(['container_type', 'education_level_id', 'stream_id']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE institution_courses ALTER COLUMN institution_id SET NOT NULL');
            DB::statement('ALTER TABLE institution_courses ALTER COLUMN owning_department_id SET NOT NULL');
        }

        Schema::table('institution_courses', function (Blueprint $table) {
            $table->unique(['institution_id', 'course_code']);
        });
    }
};
