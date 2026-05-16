<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scheme_of_work_items', function (Blueprint $table) {
            $table->string('source_type', 32)->default('nerdc')->after('curriculum_subject_level_id');
            $table->string('source_url', 500)->nullable()->after('source_type');
            $table->integer('source_version_year')->nullable()->after('source_url');
            $table->jsonb('source_meta')->nullable()->after('source_version_year');
        });

        Schema::table('scheme_of_work_items', function (Blueprint $table) {
            $table->dropUnique(['curriculum_subject_level_id', 'term', 'week_number']);
            $table->unique(
                ['curriculum_subject_level_id', 'source_type', 'term', 'week_number'],
                'scheme_items_level_source_term_week_unique'
            );
            $table->index(
                ['curriculum_subject_level_id', 'source_type'],
                'scheme_items_level_source_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('scheme_of_work_items', function (Blueprint $table) {
            $table->dropIndex('scheme_items_level_source_idx');
            $table->dropUnique('scheme_items_level_source_term_week_unique');
            $table->unique(['curriculum_subject_level_id', 'term', 'week_number']);
            $table->dropColumn(['source_type', 'source_url', 'source_version_year', 'source_meta']);
        });
    }
};
