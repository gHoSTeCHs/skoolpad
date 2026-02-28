<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institution_courses', function (Blueprint $table) {
            $table->string('level')->change();
        });

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('level')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->integer('level')->nullable()->change();
        });

        Schema::table('institution_courses', function (Blueprint $table) {
            $table->integer('level')->change();
        });
    }
};
