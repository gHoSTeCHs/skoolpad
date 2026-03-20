<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parent_child_links', function (Blueprint $table) {
            $table->string('current_term')->nullable()->after('study_goal_minutes');
            $table->date('term_start_date')->nullable()->after('current_term');
            $table->timestamp('grace_period_ends_at')->nullable()->after('term_start_date');
        });
    }

    public function down(): void
    {
        Schema::table('parent_child_links', function (Blueprint $table) {
            $table->dropColumn(['current_term', 'term_start_date', 'grace_period_ends_at']);
        });
    }
};
