<?php

namespace App\Models;

use App\Enums\ImportStatus;
use App\Enums\ImportType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportLog extends Model
{
    /** @use HasFactory<\Database\Factories\ImportLogFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'import_type',
        'original_filename',
        'status',
        'total_rows',
        'success_count',
        'error_count',
        'errors',
        'processed_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'import_type' => ImportType::class,
            'status' => ImportStatus::class,
            'errors' => 'array',
        ];
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
