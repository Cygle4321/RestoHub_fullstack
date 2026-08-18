<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TrialReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public object $restaurant,
        public string $planName,
        public string $trialEndDate,
        public string $frontendUrl,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre période d\'essai RestoHub prend fin',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.trial-reminder',
            with: [
                'restaurant' => $this->restaurant,
                'planName' => $this->planName,
                'trialEndDate' => $this->trialEndDate,
                'frontendUrl' => $this->frontendUrl,
            ],
        );
    }
}
