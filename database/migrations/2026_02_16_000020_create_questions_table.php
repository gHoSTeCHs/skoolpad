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
        Schema::create('questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('institution_course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('question_type');
            $table->text('content');
            $table->integer('year')->nullable();
            $table->string('semester')->nullable();
            $table->integer('marks')->nullable();
            $table->string('difficulty_level')->nullable();
            $table->decimal('irt_difficulty', 6, 3)->nullable();
            $table->integer('attempt_count')->default(0);
            $table->integer('correct_count')->default(0);
            $table->integer('avg_time_seconds')->nullable();
            $table->string('source');
            $table->string('status')->default('draft');
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE questions ADD COLUMN search_vector tsvector');
            DB::statement('CREATE INDEX questions_search_vector_idx ON questions USING GIN (search_vector)');

            DB::unprepared("
                CREATE OR REPLACE FUNCTION questions_update_search_vector() RETURNS trigger AS \$\$
                BEGIN
                    NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
                    RETURN NEW;
                END;
                \$\$ LANGUAGE plpgsql;

                CREATE TRIGGER questions_search_update
                    BEFORE INSERT OR UPDATE ON questions
                    FOR EACH ROW EXECUTE FUNCTION questions_update_search_vector();
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared('DROP TRIGGER IF EXISTS questions_search_update ON questions');
            DB::unprepared('DROP FUNCTION IF EXISTS questions_update_search_vector()');
        }
        Schema::dropIfExists('questions');
    }
};
