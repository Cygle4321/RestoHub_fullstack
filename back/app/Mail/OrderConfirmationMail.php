<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order, public string $storeUrl)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Commande '.$this->order->number.' confirmée — '.($this->order->restaurant?->name ?? 'RestoHub'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.order-confirmation',
            with: ['order' => $this->order, 'storeUrl' => $this->storeUrl],
        );
    }
}