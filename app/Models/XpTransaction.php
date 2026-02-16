<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class XpTransaction extends Model
{
    /** @use HasFactory<\Database\Factories\XpTransactionFactory> */
    use HasFactory, HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'action',
        'xp_amount',
        'reference_type',
        'reference_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
