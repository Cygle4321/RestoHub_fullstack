<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Customer extends Model
{
    protected $fillable = [
        'restaurant_id', 'user_id', 'name', 'phone', 'email', 'address',
        'orders_count', 'total_spent', 'last_order_at',
        'favorite_dish', 'favorite_dish_count', 'loyalty_stamps',
        'loyalty_rewards_count', 'notes',
    ];

    protected $appends = [
        'days_since_last_order',
        'segment',
        'loyalty_status',
    ];

    protected function casts(): array
    {
        return [
            'last_order_at' => 'datetime',
            'orders_count' => 'integer',
            'total_spent' => 'integer',
            'favorite_dish_count' => 'integer',
            'loyalty_stamps' => 'integer',
            'loyalty_rewards_count' => 'integer',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function getDaysSinceLastOrderAttribute(): ?int
    {
        if (! $this->last_order_at) {
            return null;
        }

        return (int) abs(now()->diffInDays($this->last_order_at));
    }

    public function getSegmentAttribute(): string
    {
        if ($this->orders_count === 0) {
            return 'nouveau';
        }

        $days = $this->days_since_last_order;

        if ($days !== null && $days >= 30) {
            return 'inactif';
        }

        if ($days !== null && $days >= 15) {
            return 'a_relancer';
        }

        if ($this->orders_count >= 5) {
            return 'vip';
        }

        return 'actif';
    }

    public function getLoyaltyStatusAttribute(): array
    {
        $threshold = 5;
        $count = (int) $this->orders_count;
        $stamps = $count % $threshold;
        $rewardsUnlocked = (int) floor($count / $threshold);
        $isRewardReady = ($count > 0 && $stamps === 0);

        return [
            'stamps' => $stamps,
            'threshold' => $threshold,
            'rewards_unlocked' => $rewardsUnlocked,
            'is_reward_ready' => $isRewardReady,
            'orders_until_next' => $threshold - $stamps,
        ];
    }

    /**
     * Recalcule et met à jour le plat favori du client d'après son historique de commandes.
     */
    public function recalculateFavoriteDish(): ?string
    {
        $topItem = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.customer_id', $this->id)
            ->where('orders.status', '!=', 'annulee')
            ->select('order_items.name', DB::raw('SUM(order_items.quantity) as total_qty'))
            ->groupBy('order_items.name')
            ->orderByDesc('total_qty')
            ->first();

        if ($topItem) {
            $cleanName = preg_replace('/\s*\[.*?\]$/', '', $topItem->name);
            $cleanName = trim($cleanName);

            $this->update([
                'favorite_dish' => $cleanName,
                'favorite_dish_count' => (int) $topItem->total_qty,
                'loyalty_stamps' => $this->orders_count % 5,
                'loyalty_rewards_count' => (int) floor($this->orders_count / 5),
            ]);

            return $cleanName;
        }

        return null;
    }
}
