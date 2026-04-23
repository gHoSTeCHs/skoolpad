<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            UPDATE ai_generation_logs
            SET prompt_type = 'scheme'
            WHERE prompt_type = 'structure'
              AND jsonb_exists(parsed_data, 'terms')
              AND jsonb_exists(parsed_data, 'total_topics_allocated')
        SQL);

        DB::statement(<<<'SQL'
            UPDATE ai_generation_logs
            SET prompt_type = 'blocks'
            WHERE prompt_type = 'structure'
              AND jsonb_exists(parsed_data, 'topic_title')
              AND jsonb_exists(parsed_data, 'blocks')
        SQL);
    }

    public function down(): void
    {
        DB::statement(<<<'SQL'
            UPDATE ai_generation_logs
            SET prompt_type = 'structure'
            WHERE prompt_type IN ('scheme', 'blocks')
        SQL);
    }
};
