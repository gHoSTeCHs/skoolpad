<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('content_projects', function (Blueprint $table) {
            $table->foreignUuid('default_ai_model_id')
                ->nullable()
                ->after('status')
                ->constrained('ai_models')
                ->nullOnDelete();

            $table->foreignUuid('research_model_id')
                ->nullable()
                ->after('default_ai_model_id')
                ->constrained('ai_models')
                ->nullOnDelete();

            $table->foreignUuid('scheme_model_id')
                ->nullable()
                ->after('research_model_id')
                ->constrained('ai_models')
                ->nullOnDelete();

            $table->foreignUuid('blocks_model_id')
                ->nullable()
                ->after('scheme_model_id')
                ->constrained('ai_models')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('content_projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('blocks_model_id');
            $table->dropConstrainedForeignId('scheme_model_id');
            $table->dropConstrainedForeignId('research_model_id');
            $table->dropConstrainedForeignId('default_ai_model_id');
        });
    }
};
