<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Invitation d'un membre d'équipe : lien de définition du mot de passe
 * (réutilise le flux "mot de passe oublié" du frontend).
 */
class TeamInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $member,
        public string $restaurantName,
        public string $invitedBy,
        public string $setPasswordUrl,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Rejoignez '.$this->restaurantName.' sur RestoHub',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.team-invitation',
            with: [
                'member' => $this->member,
                'restaurantName' => $this->restaurantName,
                'invitedBy' => $this->invitedBy,
                'setPasswordUrl' => $this->setPasswordUrl,
                'roleLabel' => match ($this->member->role) {
                    'manager' => 'Gestionnaire',
                    'cook' => 'Cuisinier',
                    'driver' => 'Livreur',
                    default => 'Personnel',
                },
            ],
        );
    }
}
