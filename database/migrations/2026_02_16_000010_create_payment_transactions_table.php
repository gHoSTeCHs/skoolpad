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
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('subscription_id')->nullable()->constrained('user_subscriptions')->nullOnDelete();
            $table->string('transaction_context')->nullable();
            $table->uuid('context_id')->nullable();
            $table->string('paystack_reference', 100)->unique();
            $table->integer('amount_kobo');
            $table->string('currency', 3)->default('NGN');
            $table->string('status');
            $table->jsonb('paystack_response')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
