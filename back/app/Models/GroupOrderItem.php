<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupOrderItem extends Model
{
    protected $fillable = [
        'group_order_id',
        'product_id',
        'participant_name',
        'name',
        'quantity',
        'price',
        'options',
        'supplements',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'supplements' => 'array',
        ];
    }

    public function groupOrder(): BelongsTo
    {
        return $this->belongsTo(GroupOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
