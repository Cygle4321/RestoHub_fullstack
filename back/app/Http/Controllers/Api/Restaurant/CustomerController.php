<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Promotion;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $baseQuery = Customer::where('restaurant_id', $restaurantId);

        // Statistiques globales pour les compteurs et KPI
        $now = now();
        $fifteenDaysAgo = $now->copy()->subDays(15);
        $thirtyDaysAgo = $now->copy()->subDays(30);

        $stats = [
            'total' => (clone $baseQuery)->count(),
            'a_relancer' => (clone $baseQuery)->whereNotNull('last_order_at')
                ->where('last_order_at', '<=', $fifteenDaysAgo)
                ->where('last_order_at', '>', $thirtyDaysAgo)
                ->count(),
            'inactif' => (clone $baseQuery)->whereNotNull('last_order_at')
                ->where('last_order_at', '<=', $thirtyDaysAgo)
                ->count(),
            'vip' => (clone $baseQuery)->where('orders_count', '>=', 5)->count(),
            'nouveau' => (clone $baseQuery)->where('orders_count', 1)->count(),
        ];

        $query = Customer::where('restaurant_id', $restaurantId)
            ->orderByDesc('last_order_at');

        // Filtre de segmentation
        $segment = $request->query('segment', 'all');
        if ($segment === 'a_relancer') {
            $query->whereNotNull('last_order_at')
                ->where('last_order_at', '<=', $fifteenDaysAgo)
                ->where('last_order_at', '>', $thirtyDaysAgo);
        } elseif ($segment === 'inactif') {
            $query->whereNotNull('last_order_at')
                ->where('last_order_at', '<=', $thirtyDaysAgo);
        } elseif ($segment === 'vip') {
            $query->where('orders_count', '>=', 5);
        } elseif ($segment === 'nouveau') {
            $query->where('orders_count', 1);
        }

        // Filtre de recherche
        if ($q = trim($request->query('q', ''))) {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%")
                    ->orWhere('favorite_dish', 'like', "%{$q}%");
            });
        }

        $customers = $query->paginate(30);

        // Remplissage rétroactif du plat favori si non calculé
        foreach ($customers as $c) {
            if (! $c->favorite_dish && $c->orders_count > 0) {
                $c->recalculateFavoriteDish();
            }
        }

        return response()->json([
            'data' => $customers->items(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
            'stats' => $stats,
        ]);
    }

    public function show(Request $request, Customer $customer)
    {
        abort_unless($customer->restaurant_id === $request->user()->restaurant_id, 403);

        if (! $customer->favorite_dish && $customer->orders_count > 0) {
            $customer->recalculateFavoriteDish();
        }

        return response()->json(
            $customer->load(['orders' => fn ($q) => $q->latest()->limit(25)->with('items')])
        );
    }

    /**
     * Génère un message de relance personnalisé pour le client et active le code promo si nécessaire.
     */
    public function relance(Request $request, Customer $customer)
    {
        $restaurant = $request->user()->restaurant;
        abort_unless($customer->restaurant_id === $restaurant->id, 403);

        $code = strtoupper(trim($request->input('code', 'REVIENS10')));
        $discount = (int) $request->input('discount', 10);

        // Crée ou s'assure de l'existence du code promo dans le restaurant
        Promotion::firstOrCreate(
            [
                'restaurant_id' => $restaurant->id,
                'code' => $code,
            ],
            [
                'type' => 'percent',
                'value' => $discount,
                'is_active' => true,
            ]
        );

        $dish = $customer->favorite_dish ?: 'vos plats préférés';
        $days = $customer->days_since_last_order ?? 15;
        $storeUrl = url("/store/{$restaurant->slug}");

        $message = "👋 Bonjour {$customer->name} !\n\n"
            ."Votre *{$dish}* vous attend chez *{$restaurant->name}* 🍲 !\n"
            ."Cela fait {$days} jours que nous ne vous avons pas vu.\n\n"
            ."🎁 Pour fêter votre retour, profitez de *-{$discount}%* sur votre prochaine commande avec le code promo exclusif *{$code}* !\n\n"
            ."👉 Commandez en 1 clic ici : {$storeUrl}\n\n"
            ."À très vite chez {$restaurant->name} !";

        // Nettoyage du numéro de téléphone pour WhatsApp
        $rawPhone = preg_replace('/[^0-9]/', '', $customer->phone);
        $waUrl = "https://api.whatsapp.com/send?phone={$rawPhone}&text=".urlencode($message);

        return response()->json([
            'message' => $message,
            'whatsapp_url' => $waUrl,
            'phone' => $customer->phone,
            'promo_code' => $code,
            'discount' => $discount,
        ]);
    }

    /**
     * Récupère ou met à jour les paramètres de la carte de fidélité du restaurant.
     */
    public function loyaltySettings(Request $request)
    {
        $restaurant = $request->user()->restaurant;

        if ($request->isMethod('put') || $request->isMethod('post')) {
            $data = $request->validate([
                'enabled' => ['required', 'boolean'],
                'threshold' => ['required', 'integer', 'min:2', 'max:20'],
                'reward_title' => ['required', 'string', 'max:120'],
            ]);

            $restaurant->update(['loyalty_settings' => $data]);

            return response()->json([
                'message' => 'Paramètres de fidélité mis à jour avec succès.',
                'settings' => $data,
            ]);
        }

        return response()->json([
            'settings' => $restaurant->loyalty_settings ?? [
                'enabled' => true,
                'threshold' => 5,
                'reward_title' => 'Une boisson offerte',
            ],
        ]);
    }
}
