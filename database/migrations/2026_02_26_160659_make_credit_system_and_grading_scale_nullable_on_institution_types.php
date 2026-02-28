<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institution_types', function (Blueprint $table) {
            $table->string('credit_system')->nullable()->change();
            $table->foreignUuid('grading_scale_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('institution_types', function (Blueprint $table) {
            $table->string('credit_system')->nullable(false)->change();
            $table->foreignUuid('grading_scale_id')->nullable(false)->change();
        });
    }
};
