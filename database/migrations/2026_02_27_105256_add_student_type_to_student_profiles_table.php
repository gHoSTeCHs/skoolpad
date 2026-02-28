<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('student_type')->nullable()->after('user_id');
            $table->timestamp('parent_invite_dismissed_at')->nullable();
        });

        DB::table('student_profiles')->whereNull('student_type')->update(['student_type' => 'tertiary']);

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->uuid('institution_id')->nullable()->change();
            $table->uuid('faculty_id')->nullable()->change();
            $table->uuid('department_id')->nullable()->change();
            $table->integer('level')->nullable()->change();
        });

        Schema::table('parent_child_links', function (Blueprint $table) {
            $table->uuid('parent_profile_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('parent_child_links', function (Blueprint $table) {
            $table->uuid('parent_profile_id')->nullable(false)->change();
        });

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->uuid('institution_id')->nullable(false)->change();
            $table->uuid('faculty_id')->nullable(false)->change();
            $table->uuid('department_id')->nullable(false)->change();
            $table->integer('level')->nullable(false)->change();
            $table->dropColumn(['student_type', 'parent_invite_dismissed_at']);
        });
    }
};
