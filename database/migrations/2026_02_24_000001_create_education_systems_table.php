<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('education_systems', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignUuid('country_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('system_type');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('education_systems');
    }
};
