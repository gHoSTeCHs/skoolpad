<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canvas_stencils', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('name');
            $table->string('slug')->unique();
            $table->string('category', 48); // StencilCategory enum
            $table->jsonb('tags')->default('[]');

            // Storage path. Today: served from /public/stencils/{category}/{slug}.svg
            // Phase 6: migrated to R2 path; field name stays stable.
            $table->string('svg_path', 500);
            $table->string('thumbnail_path', 500)->nullable();

            // Provenance + licensing — pinned by SVG sourcing policy
            // (`2026-05-16-visualization-decisions-and-phase-6-alignment.md` §3).
            // Admin upload validates against CC-BY-SA at the FormRequest level.
            $table->string('license', 32)->default('skoolpad'); // StencilLicense enum
            $table->text('source_attribution')->nullable();
            $table->string('source_url', 500)->nullable();

            $table->smallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['category', 'is_active'], 'canvas_stencils_category_active_idx');
            $table->index(['is_active', 'sort_order'], 'canvas_stencils_browse_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canvas_stencils');
    }
};
