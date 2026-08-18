<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promotion extends Model
{
    protected $fillable = [
        'restaurant_id', 'code', 'type', 'value', 'min_order',
        'usage_limit', 'usage_count', 'starts_at', 'ends_at', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function isValid(int $orderTotal = 0): bool
    {
        if (! $this->is_active) {
            return false;
        }
        if ($this->starts_at && now()->lt($this->starts_at)) {
            return false;
        }
        if ($this->ends_at && now()->gt($this->ends_at)) {
            return false;
        }
        if ($this->usage_limit !== null && $this->usage_count >= $this->usage_limit) {
            return false;
        }
        if ($this->min_order && $orderTotal < $this->min_order) {
            return false;
        }

        return true;
    }
}
