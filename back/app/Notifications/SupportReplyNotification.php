<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SupportReplyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public array $ticket)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'support',
            'ticket_id' => $this->ticket['id'] ?? null,
            'subject' => $this->ticket['subject'] ?? null,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
        $ticketId = $this->ticket['id'] ?? null;

        return (new MailMessage)
            ->subject('Réponse à votre ticket #'.$ticketId.' — RestoHub')
            ->greeting('Bonjour '.($notifiable->name ?? '').',')
            ->line('Le support RestoHub a répondu à votre ticket :')
            ->line('**#'.$ticketId.' — '.($this->ticket['subject'] ?? 'Sans objet').'**')
            ->line('Connectez-vous pour consulter la réponse.')
            ->action('Voir la conversation', $frontendUrl.'/dashboard/support');
    }
}