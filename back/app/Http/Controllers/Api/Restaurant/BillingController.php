<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\AdminNotifier;
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

        // Changement de plan : l'abonnement actif précédent est clôturé
        // pour que le plan actuel affiché reste sans ambiguïté.
        Subscription::where('restaurant_id', $user->restaurant_id)
            ->where('status', 'active')
            ->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'ends_at' => now(),
            ]);

        $subscription = Subscription::create([
            'restaurant_id' => $user->restaurant_id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'billing_cycle' => $data['billing_cycle'],
            'amount' => $amount,
            'starts_at' => now(),
            'ends_at' => $data['billing_cycle'] === 'yearly'
                ? now()->addYear()
                : now()->addMonth(),
        ]);

        // Paiement validé immédiatement (FedaPay à réactiver plus tard).
        $payment = Payment::create([
            'restaurant_id' => $user->restaurant_id,
            'subscription_id' => $subscription->id,
            'provider' => 'manual',
            'type' => 'subscription',
            'amount' => $amount,
            'currency' => 'XOF',
            'status' => 'approved',
            'method' => 'manual',
            'paid_at' => now(),
        ]);

        $restaurant = $user->restaurant;
        if ($restaurant && ! in_array($restaurant->status, ['suspended', 'inactive'], true)) {
            $restaurant->update([
                'status' => 'active',
                'plan_id' => $plan->id,
                'subscription_ends_at' => $subscription->ends_at,
            ]);
        }

        app(AdminNotifier::class)->notify([
            'kind' => 'subscription',
            'subscription_id' => $subscription->id,
            'plan_name' => $plan->name,
            'restaurant_name' => $user->restaurant?->name ?? '—',
            'amount' => $amount,
        ]);

        return response()->json([
            'subscription' => $subscription,
            'payment' => $payment,
            'checkout_url' => null,
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
