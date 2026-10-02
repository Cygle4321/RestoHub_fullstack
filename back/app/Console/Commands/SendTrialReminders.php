<?php

namespace App\Console\Commands;

use App\Mail\TrialReminderMail;
use App\Models\Restaurant;
use App\Models\Subscription;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

#[Signature('restohub:trial-reminders')]
#[Description('Relance par email les restaurants dont l\'essai expire sans paiement (J-1 / après le 13e jour)')]
class SendTrialReminders extends Command
{
    public function handle(): int
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
        $sent = 0;

        // Essai qui expire dans les 24h ou déjà dépassé, sans abonnement payé,
        // et sans relance déjà envoyée.
        $restaurants = Restaurant::with('plan')
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '<=', now()->addDay())
            ->whereNull('trial_reminder_sent_at')
            ->whereDoesntHave('subscriptions', function ($q) {
                $q->where('status', 'active');
            })
            ->get();

        foreach ($restaurants as $restaurant) {
            $owner = $restaurant->users()
                ->where('role', 'owner')
                ->where('is_active', true)
                ->first();

            if (! $owner) {
                continue;
            }

            // Si l'essai est déjà terminé, on marque l'abonnement d'essai comme expiré.
            if ($restaurant->trial_ends_at->isPast()) {
                Subscription::where('restaurant_id', $restaurant->id)
                    ->where('status', 'trialing')
                    ->update(['status' => 'expired']);
            }

            try {
                Mail::to($owner)->send(new TrialReminderMail(
                    $restaurant,
                    $restaurant->plan?->name ?? 'Starter',
                    $restaurant->trial_ends_at->isoFormat('D MMMM YYYY'),
                    $frontendUrl,
                ));
                $restaurant->update(['trial_reminder_sent_at' => now()]);
                $sent++;
            } catch (\Throwable $e) {
                Log::warning('Relance essai échouée', ['restaurant' => $restaurant->id, 'error' => $e->getMessage()]);
            }
        }

        $this->info("Relances d'essai envoyées : {$sent}");

        return self::SUCCESS;
    }
}