<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('content_projects', function (Blueprint $table) {
            $table->foreignUuid('content_model_id')->nullable()->after('blocks_model_id')
                ->constrained('ai_models')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('content_projects', function (Blueprint $table) {
            $table->dropForeign(['content_model_id']);
            $table->dropColumn('content_model_id');
        });
    }
};
