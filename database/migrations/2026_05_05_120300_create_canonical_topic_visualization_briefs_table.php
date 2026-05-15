<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canonical_topic_visualization_briefs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('canonical_topic_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('visualization_score')->default(0);
            $table->jsonb('intents_json')->nullable();
            $table->timestamp('computed_at')->nullable();
            $table->integer('computed_from_paper_count')->default(0);
            $table->timestamps();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                'ALTER TABLE canonical_topic_visualization_briefs ADD CONSTRAINT ctvb_score_range_check
                 CHECK (visualization_score BETWEEN 0 AND 5)'
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('canonical_topic_visualization_briefs');
    }
};
