<?php

namespace App\Mail;

use App\Models\Restaurant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DailyReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Restaurant $restaurant, public int $pendingOrders, public string $frontendUrl)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre boutique '.$this->restaurant->name.' — récap du jour',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.daily-reminder',
            with: ['restaurant' => $this->restaurant, 'pendingOrders' => $this->pendingOrders, 'frontendUrl' => $this->frontendUrl],
        );
    }
}