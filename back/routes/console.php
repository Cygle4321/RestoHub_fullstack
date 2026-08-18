<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Rappel quotidien aux restaurants (configurable dans Réglages → Notifications)
Schedule::command('restohub:reminders')->dailyAt('08:00');

// Relance d'essai : email de paiement aux restaurants dont l'essai (14 jours) se termine sans paiement
Schedule::command('restohub:trial-reminders')->dailyAt('09:30');