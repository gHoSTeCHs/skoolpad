<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('practice_sessions', function (Blueprint $table) {
            $table->foreignUuid('assessment_type_id')->nullable()->after('canonical_topic_id')->constrained()->nullOnDelete();
            $table->foreignUuid('question_paper_id')->nullable()->after('assessment_type_id')->constrained()->nullOnDelete();
        });

        Schema::table('practice_answers', function (Blueprint $table) {
            $table->jsonb('response_data')->nullable()->after('text_answer');
        });
    }

    public function down(): void
    {
        Schema::table('practice_sessions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assessment_type_id');
            $table->dropConstrainedForeignId('question_paper_id');
        });

        Schema::table('practice_answers', function (Blueprint $table) {
            $table->dropColumn('response_data');
        });
    }
};
