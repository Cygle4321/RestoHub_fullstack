<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\FedaPayService;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function plans()
    {
        return response()->json(Plan::where('is_active', true)->orderBy('sort_order')->get());
    }

    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'billing_cycle' => ['required', 'in:monthly,yearly'],
        ]);

        $user = $request->user();
        $plan = Plan::findOrFail($data['plan_id']);
        $amount = $data['billing_cycle'] === 'yearly'
            ? ($plan->price_yearly ?? $plan->price_monthly * 12)
            : $plan->price_monthly;

        // Déjà abonné au même plan + cycle : on ne crée pas de doublon.
        $existing = Subscription::where('restaurant_id', $user->restaurant_id)
            ->where('status', 'active')
            ->where('plan_id', $plan->id)
            ->where('billing_cycle', $data['billing_cycle'])
            ->latest('id')
            ->first();

        if ($existing) {
            return response()->json([
                'subscription' => $existing,
                'message' => 'Vous êtes déjà abonné à ce plan.',
            ], 200);
        }

        // Changement de plan : le précédent abonnement actif n'est clôturé
        // qu'à la confirmation du paiement (webhook) pour ne pas couper
        // l'accès en attendant le règlement.

        // Un paiement FedaPay en attente qui n'a jamais abouti ne doit pas
        // s'empiler : on clôt les éventuels abonnements "pending" restants
        // avant d'en créer un nouveau.
        Subscription::where('restaurant_id', $user->restaurant_id)
            ->where('status', 'pending')
            ->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

        $subscription = Subscription::create([
            'restaurant_id' => $user->restaurant_id,
            'plan_id' => $plan->id,
            'status' => 'pending',
            'billing_cycle' => $data['billing_cycle'],
            'amount' => $amount,
            'starts_at' => null,
            'ends_at' => null,
        ]);

        // Paiement FedaPay — redirection vers la page de paiement.
        $result = app(FedaPayService::class)->createSubscriptionPayment($subscription, [
            'firstname' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone ?? $user->restaurant?->phone ?? '',
        ]);

        $payment = $result['payment'];
        $checkoutUrl = $result['checkout_url'];
        $error = $result['error'] ?? null;

        if ($error) {
            $subscription->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

            return response()->json([
                'subscription' => $subscription->fresh(),
                'payment' => $payment,
                'checkout_url' => null,
                'error' => $error,
            ], 402);
        }

        // L'abonnement devient actif à la confirmation du paiement (webhook) :
        // clôture de l'ancien plan, activation du nouveau, mise à jour du
        // restaurant, notification super-admins.

        return response()->json([
            'subscription' => $subscription->fresh(),
            'payment' => $payment,
            'checkout_url' => $checkoutUrl,
            'error' => null,
        ], 201);
    }

    public function cancelSubscription(Request $request)
    {
        $user = $request->user();

        $subscription = Subscription::where('restaurant_id', $user->restaurant_id)
            ->where('status', 'active')
            ->latest()
            ->first();

        if (! $subscription) {
            return response()->json(['message' => 'Aucun abonnement actif à annuler.'], 404);
        }

        $subscription->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'ends_at' => $subscription->ends_at ?? now()->addMonth(),
        ]);

        return response()->json([
            'message' => 'Abonnement annulé. Vous gardez l\'accès jusqu\'à la fin de la période.',
            'subscription' => $subscription->fresh(),
        ]);
    }
}
