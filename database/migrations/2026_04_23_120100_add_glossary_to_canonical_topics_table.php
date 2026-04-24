<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('canonical_topics', function (Blueprint $table) {
            $table->jsonb('glossary')->nullable()->after('estimated_read_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('canonical_topics', function (Blueprint $table) {
            $table->dropColumn('glossary');
        });
    }
};
