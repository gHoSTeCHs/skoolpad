<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $questions = DB::table('questions')
            ->whereIn('question_type', ['mcq', 'multi_select_mcq'])
            ->whereNull('response_config')
            ->get(['id']);

        foreach ($questions as $question) {
            $options = DB::table('question_options')
                ->where('question_id', $question->id)
                ->orderBy('sort_order')
                ->get(['label', 'content', 'is_correct']);

            if ($options->isEmpty()) {
                continue;
            }

            $responseConfig = [
                'options' => $options->map(fn ($opt) => [
                    'label' => $opt->label,
                    'text' => $opt->content,
                    'is_correct' => (bool) $opt->is_correct,
                ])->all(),
            ];

            DB::table('questions')
                ->where('id', $question->id)
                ->update(['response_config' => json_encode($responseConfig)]);
        }

        Schema::table('practice_answers', function ($table) {
            $table->dropForeign(['selected_option_id']);
            $table->dropColumn('selected_option_id');
            $table->string('selected_option_label')->nullable()->after('question_id');
        });

        Schema::dropIfExists('question_options');
    }

    public function down(): void
    {
        Schema::create('question_options', function ($table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->string('label', 5);
            $table->text('content');
            $table->boolean('is_correct')->default(false);
            $table->integer('sort_order');
            $table->timestamps();
        });

        Schema::table('practice_answers', function ($table) {
            $table->dropColumn('selected_option_label');
            $table->foreignUuid('selected_option_id')->nullable()->after('question_id')->constrained('question_options')->nullOnDelete();
        });
    }
};
