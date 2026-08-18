<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\AdminAlertNotification;
use Illuminate\Support\Facades\Log;

/**
 * Notifie tous les super admins de la plateforme (cloche admin + email).
 */
class AdminNotifier
{
    public function notify(array $data): void
    {
        $admins = User::where('role', 'super_admin')
            ->where('is_active', true)
            ->get();

        foreach ($admins as $admin) {
            try {
                $admin->notify(new AdminAlertNotification($data));
            } catch (\Throwable $e) {
                Log::warning('AdminNotifier email échoué', ['admin' => $admin->email, 'error' => $e->getMessage()]);
            }
        }
    }
}