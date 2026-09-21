<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Budget extends Model
{
    protected $fillable = [
        'user_id',
        'month',
        'needs_percentage',
        'wants_percentage',
        'savings_percentage',
    ];

    protected $casts = [
        'needs_percentage' => 'decimal:2',
        'wants_percentage' => 'decimal:2',
        'savings_percentage' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}