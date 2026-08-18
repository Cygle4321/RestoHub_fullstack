<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public array $order)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'order',
            'order_number' => $this->order['number'] ?? null,
            'order_id' => $this->order['id'] ?? null,
            'customer_name' => $this->order['customer_name'] ?? null,
            'total' => $this->order['total'] ?? null,
            'mode' => $this->order['mode'] ?? null,
        ];
    }
}