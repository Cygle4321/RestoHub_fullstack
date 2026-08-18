<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
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
                    'number' => $this->normalizePhone($order->customer_phone),
                    'country' => $customer['country']
                        ?? $this->countryForPhone($order->customer_phone)
                        ?? config('fedapay.phone_country', 'ci'),
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
                    'number' => $this->normalizePhone($customer['phone'] ?? ''),
                    'country' => $customer['country'] ?? 'bj',
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
                $sub = $payment->subscription;
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
        }

        if (in_array($mapped, ['declined', 'cancelled'], true) && $payment->order_id) {
            $payment->order?->update(['payment_status' => 'failed']);
        }

        return $payment->fresh();
    }

    protected function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        // FedaPay valide le numéro national (sans indicatif pays). On retire
        // l'indicatif du pays configuré si présent (+225/225 → 07xxxxxxxx).
        $dial = $this->countryDial(config('fedapay.phone_country', 'ci'));
        if ($dial && str_starts_with($digits, $dial)) {
            $digits = substr($digits, strlen($dial));
        }

        return $digits;
    }

    protected function countryDial(string $country): ?string
    {
        return [
            'ci' => '225',
            'bj' => '229',
            'sn' => '221',
            'tg' => '228',
            'ml' => '223',
        ][strtolower($country)] ?? null;
    }

    protected function countryForPhone(string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        foreach (['bj' => '229', 'ci' => '225', 'sn' => '221', 'tg' => '228', 'ml' => '223'] as $code => $dial) {
            if (str_starts_with($digits, $dial)) {
                return $code;
            }
        }

        return null;
    }
}
