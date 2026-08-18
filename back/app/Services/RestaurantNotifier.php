<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class RestaurantNotifier
{
    /**
     * Notifie les membres actifs du restaurant, sauf si la préférence est désactivée.
     */
    public function notify(Restaurant $restaurant, Notification $notification, string $settingKey = 'order'): void
    {
        $settings = $restaurant->notifications_settings ?? [];

        if (array_key_exists($settingKey, $settings) && ! $settings[$settingKey]) {
            return;
        }

        $users = User::where('restaurant_id', $restaurant->id)
            ->whereIn('role', ['owner', 'manager', 'staff'])
            ->where('is_active', true)
            ->get();

        foreach ($users as $user) {
            try {
                $user->notify($notification);
            } catch (\Throwable $e) {
                Log::warning('RestaurantNotifier email échoué', ['user' => $user->email, 'error' => $e->getMessage()]);
            }
        }
    }
}