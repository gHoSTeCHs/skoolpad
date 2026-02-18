<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('canonical_topics', function (Blueprint $table) {
            $table->string('education_level')->default('tertiary')->after('estimated_read_minutes');
            $table->jsonb('parent_verification_kit')->nullable()->after('education_level');
            $table->decimal('exam_frequency_score', 5, 4)->nullable()->after('parent_verification_kit');
            $table->timestamp('last_frequency_calculated_at')->nullable()->after('exam_frequency_score');
            $table->index('is_published');
        });
    }

    public function down(): void
    {
        Schema::table('canonical_topics', function (Blueprint $table) {
            $table->dropIndex(['is_published']);
            $table->dropColumn([
                'education_level',
                'parent_verification_kit',
                'exam_frequency_score',
                'last_frequency_calculated_at',
            ]);
        });
    }
};
