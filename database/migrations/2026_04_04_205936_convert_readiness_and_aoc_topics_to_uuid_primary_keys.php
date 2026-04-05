<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE readiness_score_history DROP CONSTRAINT readiness_score_history_pkey');
        DB::statement('ALTER TABLE readiness_score_history DROP COLUMN id');
        DB::statement('ALTER TABLE readiness_score_history ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid()');
        DB::statement('ALTER TABLE readiness_score_history ADD PRIMARY KEY (id)');

        DB::statement('ALTER TABLE exam_entry_aoc_topics DROP CONSTRAINT exam_entry_aoc_topics_pkey');
        DB::statement('ALTER TABLE exam_entry_aoc_topics DROP COLUMN id');
        DB::statement('ALTER TABLE exam_entry_aoc_topics ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid()');
        DB::statement('ALTER TABLE exam_entry_aoc_topics ADD PRIMARY KEY (id)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE readiness_score_history DROP CONSTRAINT readiness_score_history_pkey');
        DB::statement('ALTER TABLE readiness_score_history DROP COLUMN id');
        DB::statement('ALTER TABLE readiness_score_history ADD COLUMN id bigserial PRIMARY KEY');

        DB::statement('ALTER TABLE exam_entry_aoc_topics DROP CONSTRAINT exam_entry_aoc_topics_pkey');
        DB::statement('ALTER TABLE exam_entry_aoc_topics DROP COLUMN id');
        DB::statement('ALTER TABLE exam_entry_aoc_topics ADD COLUMN id bigserial PRIMARY KEY');
    }
};
