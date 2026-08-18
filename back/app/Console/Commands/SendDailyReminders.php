<?php

namespace App\Console\Commands;

use App\Mail\DailyReminderMail;
use App\Models\Order;
use App\Models\Restaurant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendDailyReminders extends Command
{
    protected $signature = 'restohub:reminders';

    protected $description = "Envoie le rappel quotidien aux restaurants qui l'ont activé";

    public function handle(): int
    {
        $frontendUrl = (string) env('FRONTEND_URL', 'http://localhost:5173');
        $sent = 0;

        foreach (Restaurant::all() as $restaurant) {
            $settings = $restaurant->notifications_settings ?? [];

            if (array_key_exists('reminder', $settings) && ! $settings['reminder']) {
                continue;
            }

            $owner = $restaurant->users()
                ->where('role', 'owner')
                ->where('is_active', true)
                ->first();

            if (! $owner) {
                continue;
            }

            $pending = Order::where('restaurant_id', $restaurant->id)
                ->where('status', 'nouvelle')
                ->count();

            try {
                Mail::to($owner)->send(new DailyReminderMail($restaurant, $pending, $frontendUrl));
                $sent++;
            } catch (\Throwable $e) {
                Log::warning('Rappel quotidien échoué', ['restaurant' => $restaurant->id, 'error' => $e->getMessage()]);
            }
        }

        $this->info("Rappels envoyés : {$sent}");

        return self::SUCCESS;
    }
}