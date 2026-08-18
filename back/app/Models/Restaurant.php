<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Restaurant extends Model
{
    protected $fillable = [
        'name', 'slug', 'email', 'phone', 'address', 'description',
        'logo', 'cover', 'color', 'is_open', 'hours', 'social',
        'status', 'plan_id', 'trial_ends_at', 'subscription_ends_at',
        'trial_reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'is_open' => 'boolean',
            'hours' => 'array',
            'social' => 'array',
            'notifications_settings' => 'array',
            'payment_settings' => 'array',
            'trial_ends_at' => 'datetime',
            'subscription_ends_at' => 'datetime',
            'trial_reminder_sent_at' => 'datetime',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function deliveryZones(): HasMany
    {
        return $this->hasMany(DeliveryZone::class);
    }

    public function drivers(): HasMany
    {
        return $this->hasMany(Driver::class);
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->whereIn('status', ['active', 'trialing'])->latestOfMany();
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function hasPaidSubscription(): bool
    {
        return $this->subscriptions()->where('status', 'active')->exists();
    }

    public function trialIsValid(): bool
    {
        return $this->trial_ends_at === null || $this->trial_ends_at->isFuture();
    }

    /**
     * L'abonnement est payé, ou l'essai n'est pas encore terminé.
     */
    public function canUseService(): bool
    {
        return $this->hasPaidSubscription() || $this->trialIsValid();
    }
}
