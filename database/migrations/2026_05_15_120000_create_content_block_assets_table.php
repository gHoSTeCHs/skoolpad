<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_block_assets', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Polymorphic-via-nullable-FK: exactly one of these is non-null
            $table->foreignUuid('content_block_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('question_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('question_paper_id')->nullable()->constrained()->cascadeOnDelete();

            $table->string('kind', 32); // 'diagram_excalidraw' | 'image' | 'video_embed'

            // Excalidraw source-of-truth + cached SVG render
            $table->jsonb('excalidraw_json')->nullable();
            $table->text('svg_payload')->nullable();

            // Accessibility & display
            $table->string('alt_text')->nullable();
            $table->string('caption')->nullable();

            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['content_block_id']);
            $table->index(['question_id']);
            $table->index(['question_paper_id']);
        });

        // Enforce exactly-one-owner at the DB level (Postgres)
        DB::statement(<<<'SQL'
            ALTER TABLE content_block_assets
            ADD CONSTRAINT content_block_assets_single_owner_chk
            CHECK (
                (CASE WHEN content_block_id   IS NULL THEN 0 ELSE 1 END
               + CASE WHEN question_id        IS NULL THEN 0 ELSE 1 END
               + CASE WHEN question_paper_id  IS NULL THEN 0 ELSE 1 END) = 1
            )
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('content_block_assets');
    }
};
