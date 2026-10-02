<?php

namespace App\Services;

use App\Mail\OrderConfirmationMail;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Notifications\NewOrderNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * FedaPay payment gateway integration.
 *
 * Configure keys in .env:
 *   FEDAPAY_SECRET_KEY=
 *   FEDAPAY_PUBLIC_KEY=
 *   FEDAPAY_ENVIRONMENT=sandbox
 *   FEDAPAY_WEBHOOK_SECRET=
 *
 * Docs: https://docs.fedapay.com
 */
class FedaPayService
{
    protected string $secretKey;

    protected string $baseUrl;

    protected string $currency;

    public function __construct()
    {
        $this->secretKey = (string) config('fedapay.secret_key');
        $this->baseUrl = (string) config('fedapay.base_url');
        $this->currency = (string) config('fedapay.currency', 'XOF');
    }

    protected function client()
    {
        if (empty($this->secretKey)) {
            throw new RuntimeException(
                'FEDAPAY_SECRET_KEY is not configured. Add it to your .env file.'
            );
        }

        return Http::withToken($this->secretKey)
            ->acceptJson()
            ->baseUrl($this->baseUrl)
            ->timeout(30);
    }

    /**
     * Create a payment transaction for a store order.
     *
     * @return array{payment: Payment, checkout_url: string|null, transaction_id: string|null}
     */
    public function createOrderPayment(Order $order, array $customer = []): array
    {
        $payment = Payment::create([
            'restaurant_id' => $order->restaurant_id,
            'order_id' => $order->id,
            'provider' => 'fedapay',
            'type' => 'order',
            'amount' => $order->total,
            'currency' => $this->currency,
            'status' => 'pending',
            'method' => $order->payment_method,
        ]);

        $country = $customer['country']
            ?? config('fedapay.phone_country', 'bj');

        $payload = [
            'description' => 'Commande '.$order->number,
            'amount' => $order->total,
            'currency' => ['iso' => $this->currency],
            'callback_url' => config('fedapay.callback_url'),
            'customer' => [
                'firstname' => $customer['firstname'] ?? $order->customer_name,
                'lastname' => $customer['lastname'] ?? '',
                'email' => $customer['email'] ?? $order->customer_email ?? 'client@example.com',
                'phone_number' => [
                    'number' => $this->normalizePhone($order->customer_phone, $country),
                    'country' => $country,
                ],
            ],
            'custom_metadata' => [
                'order_id' => $order->id,
                'order_number' => $order->number,
                'payment_id' => $payment->id,
                'type' => 'order',
            ],
        ];

        try {
            $response = $this->client()->post('/transactions', $payload);

            if (! $response->successful()) {
                Log::error('FedaPay create transaction failed', [
                    'body' => $response->json(),
                    'status' => $response->status(),
                ]);
                $payment->update(['status' => 'declined', 'payload' => $response->json()]);

                return [
                    'payment' => $payment->fresh(),
                    'checkout_url' => null,
                    'transaction_id' => null,
                    'error' => $response->json('message') ?? 'Payment initiation failed',
                ];
            }

            $data = $response->json('v1/transaction') ?? $response->json();
            $txId = (string) ($data['id'] ?? $data['transaction']['id'] ?? '');

            // Lien de paiement hébergé (méthode documentée : /transactions/{id}/token)
            $checkoutUrl = $txId !== '' ? ($this->paymentLink($txId) ?? $data['payment_url'] ?? null) : null;

            $payment->update([
                'provider_ref' => $txId,
                'payload' => $data,
            ]);

            $order->update([
                'payment_ref' => $txId,
                'payment_status' => 'pending',
            ]);

            return [
                'payment' => $payment->fresh(),
                'checkout_url' => $checkoutUrl,
                'transaction_id' => $txId,
            ];
        } catch (\Throwable $e) {
            Log::error('FedaPay exception', ['message' => $e->getMessage()]);
            $payment->update(['status' => 'declined', 'payload' => ['error' => $e->getMessage()]]);

            return [
                'payment' => $payment->fresh(),
                'checkout_url' => null,
                'transaction_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create a payment for a restaurant subscription (SaaS billing).
     */
    public function createSubscriptionPayment(Subscription $subscription, array $customer): array
    {
        $payment = Payment::create([
            'restaurant_id' => $subscription->restaurant_id,
            'subscription_id' => $subscription->id,
            'provider' => 'fedapay',
            'type' => 'subscription',
            'amount' => $subscription->amount,
            'currency' => $this->currency,
            'status' => 'pending',
        ]);

        $country = $customer['country'] ?? config('fedapay.phone_country', 'bj');

        $payload = [
            'description' => 'Abonnement RestoHub #'.$subscription->id,
            'amount' => $subscription->amount,
            'currency' => ['iso' => $this->currency],
            'callback_url' => config('fedapay.callback_url'),
            'customer' => [
                'firstname' => $customer['firstname'] ?? 'Client',
                'lastname' => $customer['lastname'] ?? '',
                'email' => $customer['email'] ?? 'owner@example.com',
                'phone_number' => [
                    'number' => $this->normalizePhone($customer['phone'] ?? '', $country),
                    'country' => $country,
                ],
            ],
            'custom_metadata' => [
                'subscription_id' => $subscription->id,
                'restaurant_id' => $subscription->restaurant_id,
                'payment_id' => $payment->id,
                'type' => 'subscription',
            ],
        ];

        try {
            $response = $this->client()->post('/transactions', $payload);

            if (! $response->successful()) {
                $payment->update(['status' => 'declined', 'payload' => $response->json()]);

                return [
                    'payment' => $payment->fresh(),
                    'checkout_url' => null,
                    'transaction_id' => null,
                    'error' => $response->json('message') ?? 'Payment initiation failed',
                ];
            }

            $data = $response->json('v1/transaction') ?? $response->json();
            $txId = (string) ($data['id'] ?? '');
            $checkoutUrl = $txId !== '' ? ($this->paymentLink($txId) ?? $data['payment_url'] ?? null) : null;

            $payment->update(['provider_ref' => $txId, 'payload' => $data]);
            $subscription->update(['fedapay_transaction_id' => $txId]);

            return [
                'payment' => $payment->fresh(),
                'checkout_url' => $checkoutUrl,
                'transaction_id' => $txId,
            ];
        } catch (\Throwable $e) {
            Log::error('FedaPay subscription payment error', ['message' => $e->getMessage()]);
            $payment->update(['status' => 'declined', 'payload' => ['error' => $e->getMessage()]]);

            return [
                'payment' => $payment->fresh(),
                'checkout_url' => null,
                'transaction_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Récupère le lien de paiement hébergé d'une transaction.
     * Méthode documentée : POST /transactions/{id}/token → { token, url }.
     */
    protected function paymentLink(string $transactionId): ?string
    {
        try {
            $response = $this->client()->post('/transactions/'.$transactionId.'/token');

            return $response->successful() ? ($response->json('url') ?? null) : null;
        } catch (\Throwable $e) {
            Log::warning('FedaPay paymentLink', ['message' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Retrieve transaction status from FedaPay.
     */
    public function getTransaction(string $transactionId): ?array
    {
        try {
            $response = $this->client()->get('/transactions/'.$transactionId);
            if (! $response->successful()) {
                return null;
            }

            return $response->json('v1/transaction') ?? $response->json();
        } catch (\Throwable $e) {
            Log::error('FedaPay getTransaction', ['message' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Handle webhook / callback from FedaPay.
     */
    public function handleWebhook(array $payload): ?Payment
    {
        $txId = (string) (
            $payload['id']
            ?? $payload['entity']['id']
            ?? $payload['transaction']['id']
            ?? $payload['data']['id']
            ?? ''
        );

        if ($txId === '') {
            Log::warning('FedaPay webhook without transaction id', $payload);

            return null;
        }

        $payment = Payment::where('provider', 'fedapay')
            ->where('provider_ref', $txId)
            ->first();

        if (! $payment) {
            // Try metadata payment_id
            $paymentId = $payload['custom_metadata']['payment_id']
                ?? $payload['entity']['custom_metadata']['payment_id']
                ?? null;
            if ($paymentId) {
                $payment = Payment::find($paymentId);
            }
        }

        if (! $payment) {
            Log::warning('FedaPay webhook: payment not found', ['tx' => $txId]);

            return null;
        }

        $status = strtolower((string) (
            $payload['status']
            ?? $payload['entity']['status']
            ?? $payload['transaction']['status']
            ?? ''
        ));

        $mapped = match ($status) {
            'approved', 'transaction.approved' => 'approved',
            'declined', 'transaction.declined' => 'declined',
            'canceled', 'cancelled', 'transaction.canceled' => 'cancelled',
            default => $payment->status,
        };

        $payment->update([
            'status' => $mapped,
            'payload' => $payload,
            'paid_at' => $mapped === 'approved' ? now() : $payment->paid_at,
        ]);

        if ($mapped === 'approved') {
            if ($payment->order_id) {
                $order = $payment->order;
                $order->update(['payment_status' => 'paid']);
            }
            if ($payment->subscription_id) {
                $this->activateSubscription($payment);
            }
        }

        if (in_array($mapped, ['declined', 'cancelled'], true) && $payment->order_id) {
            $payment->order?->update(['payment_status' => 'failed']);
        }

        return $payment->fresh();
    }

    /**
     * Active un abonnement après confirmation du paiement (webhook ou
     * retour navigateur). Clôture les autres abonnements actifs du
     * restaurant (changement de plan depuis la facturation) puis met à
     * jour le restaurant. Idempotent : relancer la méthode est sans effet
     * de bord sur un abonnement déjà actif.
     */
    public function activateSubscription(Payment $payment): void
    {
        $sub = $payment->subscription;

        if (! $sub || $sub->status === 'active') {
            return;
        }

        Subscription::where('restaurant_id', $sub->restaurant_id)
            ->where('id', '!=', $sub->id)
            ->where('status', 'active')
            ->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'ends_at' => now(),
            ]);

        $sub->update([
            'status' => 'active',
            'starts_at' => $sub->starts_at ?? now(),
            'ends_at' => ($sub->billing_cycle === 'yearly')
                ? now()->addYear()
                : now()->addMonth(),
        ]);
        $sub->restaurant?->update([
            'status' => 'active',
            'plan_id' => $sub->plan_id,
            'subscription_ends_at' => $sub->ends_at,
        ]);
    }

    /**
     * Actions déclenchées une seule fois lorsqu'un paiement est approuvé :
     * notification équipe (commande), email client (commande),
     * notification super-admins (abonnement).
     */
    public function confirmPayment(Payment $payment): void
    {
        if ($payment->order_id) {
            $order = $payment->order;
            if (! $order || $order->payment_status !== 'paid') {
                return;
            }

            app(RestaurantNotifier::class)->notify(
                $order->restaurant,
                new NewOrderNotification([
                    'id' => $order->id,
                    'number' => $order->number,
                    'customer_name' => $order->customer_name,
                    'total' => $order->total,
                    'mode' => $order->mode,
                ]),
                'order'
            );

            if ($order->customer_email) {
                try {
                    $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
                    $slug = $order->restaurant?->slug ?? 'le-saveur-dor';
                    \Illuminate\Support\Facades\Mail::to($order->customer_email)->send(
                        new OrderConfirmationMail(
                            $order->load('restaurant', 'items'),
                            $frontendUrl.'/store/'.$slug
                        )
                    );
                } catch (\Throwable $e) {
                    Log::warning('Email de confirmation (FedaPay) échoué', ['order' => $order->id, 'error' => $e->getMessage()]);
                }
            }
        }

        if ($payment->subscription_id && $payment->subscription) {
            $sub = $payment->subscription;
            app(AdminNotifier::class)->notify([
                'kind' => 'subscription',
                'subscription_id' => $sub->id,
                'plan_name' => $sub->plan?->name,
                'restaurant_name' => $sub->restaurant?->name ?? '—',
                'amount' => $sub->amount,
            ]);
        }
    }

    protected function normalizePhone(string $phone, ?string $country = null): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        // FedaPay valide le numéro national (sans indicatif pays). On retire
        // n'importe quel indicatif de pays connu (229/225/221/228/223).
        foreach (['229', '225', '221', '228', '223'] as $dial) {
            if (str_starts_with($digits, $dial)) {
                $digits = substr($digits, strlen($dial));
                break;
            }
        }

        return $digits;
    }
}
