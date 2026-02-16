<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('display_name');
            $table->string('plan_type');
            $table->integer('price_ngn');
            $table->integer('price_usd')->nullable();
            $table->string('billing_period');
            $table->string('paystack_plan_code', 100)->nullable();
            $table->jsonb('features')->default('{}');
            $table->integer('max_children')->nullable();
            $table->integer('max_students')->nullable();
            $table->integer('max_lecturers')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
