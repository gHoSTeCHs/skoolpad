<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canonical_topic_class_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('canonical_topic_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('education_level_id')->constrained()->cascadeOnDelete();
            $table->string('depth', 16)->default('intermediate');
            $table->integer('term_index')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->unique(['canonical_topic_id', 'education_level_id'], 'cta_topic_level_unique');
            $table->index(['education_level_id', 'is_primary'], 'cta_level_primary_idx');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                "ALTER TABLE canonical_topic_class_assignments ADD CONSTRAINT cta_depth_check
                 CHECK (depth IN ('introduction', 'intermediate', 'advanced', 'review'))"
            );
        }

        $this->backfillFromCanonicalTopicsEducationLevel();
    }

    private function backfillFromCanonicalTopicsEducationLevel(): void
    {
        if (! Schema::hasTable('canonical_topics') || ! Schema::hasTable('education_levels')) {
            return;
        }
        if (! Schema::hasColumn('canonical_topics', 'education_level')) {
            return;
        }

        $secondaryLevelId = $this->resolveLevelId(['secondary', 'senior secondary', 'ss1']);
        $tertiaryLevelId = $this->resolveLevelId(['tertiary', 'university', '100', 'undergraduate']);

        if (! $secondaryLevelId && ! $tertiaryLevelId) {
            return;
        }

        DB::table('canonical_topics')
            ->select('id', 'education_level')
            ->orderBy('id')
            ->chunk(500, function ($topics) use ($secondaryLevelId, $tertiaryLevelId) {
                $now = now();
                $rows = [];

                foreach ($topics as $topic) {
                    $tag = strtolower((string) $topic->education_level);
                    $targetLevelId = $tag === 'secondary' ? $secondaryLevelId : $tertiaryLevelId;
                    if (! $targetLevelId) {
                        continue;
                    }

                    $rows[] = [
                        'id' => (string) Str::uuid(),
                        'canonical_topic_id' => $topic->id,
                        'education_level_id' => $targetLevelId,
                        'depth' => 'intermediate',
                        'is_primary' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if (! empty($rows)) {
                    DB::table('canonical_topic_class_assignments')->insertOrIgnore($rows);
                }
            });
    }

    private function resolveLevelId(array $needles): ?string
    {
        $query = DB::table('education_levels as el')
            ->leftJoin('curriculum_tiers as ct', 'ct.id', '=', 'el.curriculum_tier_id')
            ->select('el.id')
            ->orderBy('el.sort_order', 'asc')
            ->limit(1);

        $query->where(function ($outer) use ($needles) {
            foreach ($needles as $needle) {
                $outer->orWhereRaw('LOWER(el.name) LIKE ?', ['%'.$needle.'%']);
                $outer->orWhereRaw('LOWER(el.display_name) LIKE ?', ['%'.$needle.'%']);
                $outer->orWhereRaw('LOWER(ct.name) LIKE ?', ['%'.$needle.'%']);
            }
        });

        $row = $query->first();

        return $row?->id;
    }

    public function down(): void
    {
        Schema::dropIfExists('canonical_topic_class_assignments');
    }
};
