<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public array $data)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return $this->data;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
        $kind = $this->data['kind'] ?? 'restaurant';

        return match ($kind) {
            'support_ticket' => (new MailMessage)
                ->subject('Nouveau ticket de support — RestoHub')
                ->greeting('Bonjour '.($notifiable->name ?? '').',')
                ->line('Un nouveau ticket de support vient d\'être ouvert :')
                ->line('**#'.$this->data['ticket_id'].' — '.($this->data['subject'] ?? 'Sans objet').'**')
                ->line('Restaurant : '.($this->data['restaurant_name'] ?? '—'))
                ->action('Ouvrir le ticket', $frontendUrl.'/admin/support'),
            'subscription' => (new MailMessage)
                ->subject('Nouvel abonnement — RestoHub')
                ->greeting('Bonjour '.($notifiable->name ?? '').',')
                ->line('Un restaurant a souscrit à un plan :')
                ->line('**'.($this->data['plan_name'] ?? '—').'** — '.($this->data['restaurant_name'] ?? '—'))
                ->line('Montant : '.number_format($this->data['amount'] ?? 0, 0, ',', ' ').' FCFA')
                ->action('Voir les abonnements', $frontendUrl.'/admin/subscriptions'),
            default => (new MailMessage)
                ->subject('Nouveau restaurant inscrit — RestoHub')
                ->greeting('Bonjour '.($notifiable->name ?? '').',')
                ->line('Un nouveau restaurant vient de rejoindre la plateforme :')
                ->line('**'.($this->data['restaurant_name'] ?? '—').'**')
                ->line('Propriétaire : '.($this->data['owner'] ?? '—'))
                ->action('Voir le restaurant', $frontendUrl.'/admin/restaurants'),
        };
    }
}