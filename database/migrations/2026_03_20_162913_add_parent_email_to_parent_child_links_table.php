<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parent_child_links', function (Blueprint $table) {
            $table->string('parent_email')->nullable()->after('parent_profile_id');
        });
    }

    public function down(): void
    {
        Schema::table('parent_child_links', function (Blueprint $table) {
            $table->dropColumn('parent_email');
        });
    }
};
