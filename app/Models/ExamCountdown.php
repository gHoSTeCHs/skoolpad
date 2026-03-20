<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamCountdown extends Model
{
    /** @use HasFactory<\Database\Factories\ExamCountdownFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'exam_name',
        'exam_date',
        'alert_start_days_before',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'exam_date' => 'date',
            'alert_start_days_before' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
