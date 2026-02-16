<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('canonical_topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('discipline_id')->constrained()->cascadeOnDelete();
            $table->uuid('parent_topic_id')->nullable();
            $table->string('title');
            $table->string('slug');
            $table->jsonb('content')->nullable();
            $table->text('content_plain')->nullable();
            $table->text('summary')->nullable();
            $table->string('difficulty_level')->nullable();
            $table->integer('estimated_read_minutes')->nullable();
            $table->string('language', 5)->default('en');
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['discipline_id', 'slug']);
        });

        Schema::table('canonical_topics', function (Blueprint $table) {
            $table->foreign('parent_topic_id')->references('id')->on('canonical_topics')->nullOnDelete();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE canonical_topics ADD COLUMN search_vector tsvector');
            DB::statement('CREATE INDEX canonical_topics_search_vector_idx ON canonical_topics USING GIN (search_vector)');

            DB::unprepared("
                CREATE OR REPLACE FUNCTION canonical_topics_update_search_vector() RETURNS trigger AS \$\$
                BEGIN
                    NEW.search_vector := to_tsvector('english',
                        COALESCE(NEW.title, '') || ' ' ||
                        COALESCE(NEW.content_plain, '') || ' ' ||
                        COALESCE(NEW.summary, '')
                    );
                    RETURN NEW;
                END;
                \$\$ LANGUAGE plpgsql;

                CREATE TRIGGER canonical_topics_search_update
                    BEFORE INSERT OR UPDATE ON canonical_topics
                    FOR EACH ROW EXECUTE FUNCTION canonical_topics_update_search_vector();
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared('DROP TRIGGER IF EXISTS canonical_topics_search_update ON canonical_topics');
            DB::unprepared('DROP FUNCTION IF EXISTS canonical_topics_update_search_vector()');
        }
        Schema::dropIfExists('canonical_topics');
    }
};
