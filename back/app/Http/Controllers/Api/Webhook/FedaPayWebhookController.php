<?php

namespace App\Http\Controllers\Api\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\FedaPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FedaPayWebhookController extends Controller
{
    public function __invoke(Request $request, FedaPayService $fedaPay)
    {
        // GET = retour navigateur du client après paiement sur la page FedaPay
        if ($request->isMethod('get')) {
            return $this->handleReturn($request, $fedaPay);
        }

        // Vérification de la signature HMAC-SHA256 (base64) du corps brut.
        $secret = config('fedapay.webhook_secret');
        if ($secret) {
            $signature = $request->header('X-Fedapay-Signature');
            $computed = base64_encode(hash_hmac('sha256', $request->getContent(), (string) $secret, true));

            if (! $signature || ! hash_equals($computed, (string) $signature)) {
                Log::warning('FedaPay webhook: signature invalide', [
                    'has_signature' => (bool) $signature,
                ]);

                return response()->json(['error' => 'Signature invalide.'], 401);
            }
        } else {
            Log::warning('FedaPay webhook: FEDAPAY_WEBHOOK_SECRET non configuré, signature non vérifiée');
        }

        $payload = $request->all();
        Log::info('FedaPay webhook received', ['keys' => array_keys($payload)]);

        // On mémorise l'état du paiement pour ne notifier qu'une seule fois
        // (le webhook POST et le retour GET peuvent tous deux arriver).
        $txId = (string) ($payload['id'] ?? $payload['entity']['id'] ?? $payload['transaction']['id'] ?? $payload['data']['id'] ?? '');
        $existing = Payment::where('provider', 'fedapay')->where('provider_ref', $txId)->first();
        $wasPaid = $existing?->order?->payment_status === 'paid';

        $payment = $fedaPay->handleWebhook($payload);

        if ($payment && $payment->status === 'approved' && ! $wasPaid) {
            $fedaPay->confirmPayment($payment);
        }

        return response()->json([
            'ok' => true,
            'payment_id' => $payment?->id,
            'status' => $payment?->status,
        ]);
    }

    /**
     * FedaPay redirige le navigateur du client ici (GET) une fois le
     * règlement terminé. On vérifie le statut réel auprès de l'API puis
     * on redirige vers la page adaptée : confirmation de commande pour la
     * boutique, page de facturation pour un abonnement SaaS.
     */
    protected function handleReturn(Request $request, FedaPayService $fedaPay)
    {
        $txId = (string) ($request->query('id') ?? '');
        $statusFromUrl = strtolower((string) ($request->query('status') ?? 'pending'));

        $payment = Payment::where('provider', 'fedapay')
            ->where('provider_ref', $txId)
            ->first();

        // Toujours vérifier le statut réel auprès de FedaPay (ne pas se
        // fier uniquement au paramètre de l'URL).
        $realStatus = $statusFromUrl;
        if ($txId !== '') {
            $remote = $fedaPay->getTransaction($txId);
            $realStatus = strtolower((string) ($remote['status'] ?? $statusFromUrl));
        }

        if ($payment && $realStatus !== $payment->status) {
            $wasPaid = $payment->order?->payment_status === 'paid'
                || $payment->subscription?->status === 'active';

            $payment->update([
                'status' => $realStatus,
                'paid_at' => $realStatus === 'approved' ? now() : $payment->paid_at,
            ]);

            if ($payment->order) {
                $payment->order->update([
                    'payment_status' => $realStatus === 'approved'
                        ? 'paid'
                        : ($realStatus === 'pending' ? 'pending' : 'failed'),
                ]);
            }

            if ($payment->subscription) {
                if ($realStatus === 'approved') {
                    $fedaPay->activateSubscription($payment);
                } elseif (in_array($realStatus, ['declined', 'cancelled'], true)) {
                    $payment->subscription->update([
                        'status' => 'cancelled',
                        'cancelled_at' => now(),
                    ]);
                }
            }

            if ($realStatus === 'approved' && ! $wasPaid) {
                $fedaPay->confirmPayment($payment->fresh());
            }
        }

        $frontend = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');

        if ($payment?->subscription_id) {
            $url = $frontend.'/dashboard/billing';
        } else {
            $order = $payment?->order;
            $slug = $order?->restaurant?->slug ?? 'le-saveur-dor';
            $url = $frontend.'/store/'.$slug.'/confirmation';
        }

        $query = ['tx' => $txId, 'status' => $realStatus];
        if ($payment?->order?->number) {
            $query['number'] = $payment->order->number;
        }

        return redirect()->away($url.'?'.http_build_query($query));
    }
}