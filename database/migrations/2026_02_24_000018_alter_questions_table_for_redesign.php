<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_context_xor_check');

        Schema::table('questions', function (Blueprint $table) {
            $table->foreignUuid('question_paper_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('question_section_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('parent_question_id')->nullable()->constrained('questions')->nullOnDelete();
            $table->string('question_number')->nullable();
            $table->string('display_label')->nullable();
            $table->integer('sort_order')->default(0);
            $table->integer('depth_level')->default(0);
            $table->jsonb('response_config')->nullable();
            $table->jsonb('choice_group')->nullable();
            $table->text('explanation')->nullable();
            $table->string('bloom_level')->nullable();
            $table->boolean('is_published')->default(false);
        });

        DB::statement('ALTER TABLE questions ADD CONSTRAINT questions_depth_level_check CHECK (depth_level <= 3)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_depth_level_check');

        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['question_paper_id']);
            $table->dropForeign(['question_section_id']);
            $table->dropForeign(['parent_question_id']);

            $table->dropColumn([
                'question_paper_id',
                'question_section_id',
                'parent_question_id',
                'question_number',
                'display_label',
                'sort_order',
                'depth_level',
                'response_config',
                'choice_group',
                'explanation',
                'bloom_level',
                'is_published',
            ]);
        });
    }
};
