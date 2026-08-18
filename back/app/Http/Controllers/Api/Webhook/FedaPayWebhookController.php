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

        $payment = $fedaPay->handleWebhook($payload);

        return response()->json([
            'ok' => true,
            'payment_id' => $payment?->id,
            'status' => $payment?->status,
        ]);
    }

    /**
     * FedaPay redirige le navigateur du client ici (GET) une fois le
     * règlement terminé. On vérifie le statut réel auprès de l'API puis
     * on redirige vers la page de confirmation de la boutique.
     */
    protected function handleReturn(Request $request, FedaPayService $fedaPay)
    {
        $txId = (string) ($request->query('id') ?? '');
        $statusFromUrl = strtolower((string) ($request->query('status') ?? 'pending'));

        $slug = null;
        $orderNumber = null;
        $payment = Payment::where('provider', 'fedapay')
            ->where('provider_ref', $txId)
            ->first();

        if ($payment) {
            $order = $payment->order;
            $orderNumber = $order?->number;
            $slug = $order?->restaurant?->slug;
        }

        // Toujours vérifier le statut réel auprès de FedaPay (ne pas se
        // fier uniquement au paramètre de l'URL).
        if ($txId !== '') {
            $remote = $fedaPay->getTransaction($txId);
            $realStatus = strtolower((string) ($remote['status'] ?? $statusFromUrl));
            if ($payment && $realStatus !== $payment->status) {
                $payment->update([
                    'status' => $realStatus,
                    'paid_at' => $realStatus === 'approved' ? now() : $payment->paid_at,
                ]);
                if ($payment->order) {
                    $payment->order->update([
                        'payment_status' => $realStatus === 'approved' ? 'paid' : ($realStatus === 'pending' ? 'pending' : 'failed'),
                    ]);
                }
            }
        }

        $frontend = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
        $storeSlug = $slug ?? 'le-saveur-dor';
        $url = "{$frontend}/store/{$storeSlug}/confirmation";

        $query = ['tx' => $txId, 'status' => $statusFromUrl];
        if ($orderNumber) {
            $query['number'] = $orderNumber;
        }

        return redirect()->away($url.'?'.http_build_query($query));
    }
}