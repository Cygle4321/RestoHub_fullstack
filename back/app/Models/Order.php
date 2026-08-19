<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'number', 'restaurant_id', 'customer_id', 'customer_name', 'customer_phone',
        'customer_email', 'status', 'mode', 'delivery_address', 'delivery_zone',
        'subtotal', 'delivery_fee', 'discount', 'total', 'promo_code',
        'payment_method', 'payment_status', 'payment_ref', 'notes', 'driver_id',
        'status_history',
    ];

    protected function casts(): array
    {
        return [
            'status_history' => 'array',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function pushStatus(string $status): void
    {
        $history = $this->status_history ?? [];
        $history[] = [
            's' => $status,
            't' => now()->format('H:i'),
            'at' => now()->toIso8601String(),
        ];
        $this->status = $status;
        $this->status_history = $history;
        $this->save();
    }
}
