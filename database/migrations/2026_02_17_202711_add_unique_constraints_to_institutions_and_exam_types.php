<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institutions', function (Blueprint $table) {
            $table->unique('name');
            $table->unique('abbreviation');
        });

        Schema::table('exam_types', function (Blueprint $table) {
            $table->unique('name');
        });
    }

    public function down(): void
    {
        Schema::table('institutions', function (Blueprint $table) {
            $table->dropUnique(['name']);
            $table->dropUnique(['abbreviation']);
        });

        Schema::table('exam_types', function (Blueprint $table) {
            $table->dropUnique(['name']);
        });
    }
};
