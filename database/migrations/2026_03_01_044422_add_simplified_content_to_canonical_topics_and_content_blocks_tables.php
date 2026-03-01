<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('canonical_topics', function (Blueprint $table) {
            $table->jsonb('simplified_content')->nullable()->after('content_plain');
        });

        Schema::table('content_blocks', function (Blueprint $table) {
            $table->jsonb('simplified_content')->nullable()->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('canonical_topics', function (Blueprint $table) {
            $table->dropColumn('simplified_content');
        });

        Schema::table('content_blocks', function (Blueprint $table) {
            $table->dropColumn('simplified_content');
        });
    }
};
