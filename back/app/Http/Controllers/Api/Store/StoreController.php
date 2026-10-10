<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Mail\OrderConfirmationMail;
use App\Models\Category;
use App\Models\Customer;
use App\Models\DeliveryZone;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\GroupOrder;
use App\Models\Restaurant;
use App\Services\FedaPayService;
use App\Services\RestaurantNotifier;
use App\Notifications\NewOrderNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class StoreController extends Controller
{
    public function show(string $slug)
    {
        return Cache::remember('store:show:'.$slug, 300, function () use ($slug) {
            $restaurant = Restaurant::where('slug', $slug)
                ->where('status', 'active')
                ->firstOrFail();

            $categories = Category::where('restaurant_id', $restaurant->id)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get();

            $products = Product::with('category')
                ->where('restaurant_id', $restaurant->id)
                ->where('is_available', true)
                ->orderBy('sort_order')
                ->get();

            $zones = DeliveryZone::where('restaurant_id', $restaurant->id)
                ->where('is_active', true)
                ->get();

            // Note moyenne des avis clients (affichée sur la boutique)
            $rating = \App\Models\Review::selectRaw('COALESCE(AVG(rating),0) as avg, COUNT(*) as count')
                ->where('restaurant_id', $restaurant->id)
                ->first();

            return [
                'restaurant' => array_merge($restaurant->toArray(), [
                    'rating_avg' => round((float) $rating->avg, 1),
                    'rating_count' => (int) $rating->count,
                ]),
                'categories' => $categories->toArray(),
                'products' => $products->toArray(),
                'delivery_zones' => $zones->toArray(),
            ];
        });
    }

    public function product(string $slug, string $productSlug)
    {
        $restaurant = Restaurant::where('slug', $slug)->where('status', 'active')->firstOrFail();
        $product = Product::where('restaurant_id', $restaurant->id)
            ->where('slug', $productSlug)
            ->where('is_available', true)
            ->firstOrFail();

        return response()->json($product->load('category'));
    }

    public function verifyPromo(Request $request, string $slug)
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $data = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'mode' => ['nullable', 'in:livraison,retrait'],
        ]);

        $subtotal = (int) round((float) $data['subtotal']);
        $promo = Promotion::where('restaurant_id', $restaurant->id)
            ->where('code', strtoupper($data['code']))
            ->first();

        if (! $promo || ! $promo->isValid($subtotal)) {
            $message = 'Ce code promo est invalide ou expiré.';
            if ($promo && ! $promo->is_active) {
                $message = 'Ce code promo a expiré ou a été désactivé.';
            } elseif ($promo && $promo->min_order && $subtotal < $promo->min_order) {
                $message = 'Commande minimale de '.number_format($promo->min_order, 0, ',', ' ').' FCFA requise pour ce code.';
            } elseif ($promo && $promo->usage_limit !== null && $promo->usage_count >= $promo->usage_limit) {
                $message = 'Ce code promo a atteint son nombre maximal d\'utilisations.';
            }

            return response()->json([
                'valid' => false,
                'code' => strtoupper($data['code']),
                'message' => $message,
            ]);
        }

        return response()->json([
            'valid' => true,
            'code' => $promo->code,
            'type' => $promo->type,
            'value' => $promo->value,
            'min_order' => $promo->min_order,
            'discount' => match ($promo->type) {
                'percent' => (int) round($subtotal * $promo->value / 100),
                'fixed' => min($promo->value, $subtotal),
                default => null,
            },
        ]);
    }

    public function checkout(Request $request, string $slug)
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        // Restaurant restreint (essai terminé sans abonnement payé) : plus de commandes
        if (! $restaurant->canUseService()) {
            return response()->json([
                'message' => 'Ce restaurant ne reçoit plus de commandes en ligne pour le moment.',
            ], 422);
        }

        // Limite mensuelle de commandes selon la formule de l'abonnement
        $maxOrders = $restaurant->plan?->max_orders_month;
        if ($maxOrders !== null) {
            $monthlyCount = $restaurant->orders()
                ->where('created_at', '>=', now()->startOfMonth())
                ->count();

            if ($monthlyCount >= $maxOrders) {
                return response()->json([
                    'message' => "Ce restaurant a atteint sa limite de commandes du mois ({$maxOrders}).",
                ], 422);
            }
        }

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email'],
            'mode' => ['required', 'in:livraison,retrait'],
            'delivery_address' => ['nullable', 'string'],
            'delivery_zone_id' => ['nullable', 'exists:delivery_zones,id'],
            'payment_method' => ['required', 'in:mobile_money,card,cash,fedapay'],
            'promo_code' => ['nullable', 'string'],
            'group_code' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.name' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.options' => ['nullable', 'array'],
            'items.*.supplements' => ['nullable', 'array'],
        ]);

        $zone = null;
        if ($data['mode'] === 'livraison') {
            if (empty($data['delivery_address'])) {
                return response()->json(['message' => 'Adresse de livraison requise.'], 422);
            }

            // Une commande livrée doit être rattachée à une zone valide dès
            // lors que le restaurant en propose : sinon les frais seraient
            // silencieusement à 0.
            $zonesQuery = DeliveryZone::where('restaurant_id', $restaurant->id)
                ->where('is_active', true);

            if (! empty($data['delivery_zone_id'])) {
                $zone = (clone $zonesQuery)->where('id', $data['delivery_zone_id'])->first();

                if (! $zone) {
                    return response()->json(['message' => 'Zone de livraison invalide.'], 422);
                }
            } elseif ($zonesQuery->exists()) {
                return response()->json(['message' => 'La zone de livraison est requise.'], 422);
            }
        }

        $order = DB::transaction(function () use ($data, $restaurant, $zone) {
            $subtotal = 0;
            $lineItems = [];

            foreach ($data['items'] as $row) {
                $product = Product::where('restaurant_id', $restaurant->id)
                    ->where('id', $row['product_id'])
                    ->where('is_available', true)
                    ->firstOrFail();

                $suppTotal = 0;
                if (! empty($row['supplements'])) {
                    foreach ($row['supplements'] as $s) {
                        $suppTotal += (int) ($s['price'] ?? 0);
                    }
                }

                $unit = $product->price + $suppTotal;
                $lineTotal = $unit * (int) $row['quantity'];
                $subtotal += $lineTotal;

                $lineItems[] = [
                    'product' => $product,
                    'custom_name' => $row['name'] ?? null,
                    'quantity' => (int) $row['quantity'],
                    'unit_price' => $unit,
                    'line_total' => $lineTotal,
                    'options' => $row['options'] ?? null,
                    'supplements' => $row['supplements'] ?? null,
                ];
            }

            $deliveryFee = 0;
            $zoneName = null;
            if ($data['mode'] === 'livraison' && $zone) {
                $deliveryFee = $zone->fee;
                $zoneName = $zone->name;
            }

            $discount = 0;
            $promoCode = null;
            if (! empty($data['promo_code'])) {
                $promo = Promotion::where('restaurant_id', $restaurant->id)
                    ->where('code', strtoupper($data['promo_code']))
                    ->first();
                if ($promo && $promo->isValid($subtotal)) {
                    $promoCode = $promo->code;
                    $discount = match ($promo->type) {
                        'percent' => (int) round($subtotal * $promo->value / 100),
                        'fixed' => min($promo->value, $subtotal),
                        'free_delivery' => $deliveryFee,
                        default => 0,
                    };
                    if ($promo->type === 'free_delivery') {
                        $deliveryFee = 0;
                    }
                    $promo->increment('usage_count');
                }
            }

            $total = max(0, $subtotal + $deliveryFee - $discount);

            $customer = Customer::firstOrCreate(
                [
                    'restaurant_id' => $restaurant->id,
                    'phone' => $data['customer_phone'],
                ],
                [
                    'name' => $data['customer_name'],
                    'email' => $data['customer_email'] ?? null,
                    'address' => $data['delivery_address'] ?? null,
                ]
            );

            $number = 'CMD-'.strtoupper(Str::random(6));

            $order = Order::create([
                'number' => $number,
                'restaurant_id' => $restaurant->id,
                'customer_id' => $customer->id,
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_email' => $data['customer_email'] ?? null,
                'status' => 'nouvelle',
                'mode' => $data['mode'],
                'delivery_address' => $data['delivery_address'] ?? null,
                'delivery_zone' => $zoneName,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'discount' => $discount,
                'total' => $total,
                'promo_code' => $promoCode,
                'payment_method' => $data['payment_method'],
                'payment_status' => $data['payment_method'] === 'cash' ? 'pending' : 'pending',
                'notes' => $data['notes'] ?? null,
                'status_history' => [
                    ['s' => 'nouvelle', 't' => now()->format('H:i'), 'at' => now()->toIso8601String()],
                ],
            ]);

            if (!empty($data['group_code'])) {
                $groupOrder = GroupOrder::where('restaurant_id', $restaurant->id)
                    ->where('code', strtoupper(trim($data['group_code'])))
                    ->first();
                if ($groupOrder) {
                    $groupOrder->update([
                        'order_id' => $order->id,
                        'status' => 'completed',
                    ]);
                }
            }

            foreach ($lineItems as $li) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $li['product']->id,
                    'name' => !empty($li['custom_name']) ? $li['custom_name'] : $li['product']->name,
                    'unit_price' => $li['unit_price'],
                    'quantity' => $li['quantity'],
                    'line_total' => $li['line_total'],
                    'options' => $li['options'],
                    'supplements' => $li['supplements'],
                ]);
            }

            $customer->update([
                'orders_count' => $customer->orders_count + 1,
                'total_spent' => $customer->total_spent + $total,
                'last_order_at' => now(),
                'name' => $data['customer_name'],
            ]);

            $customer->recalculateFavoriteDish();

            return $order->load('items');
        });

        $checkoutUrl = null;
        $payment = null;
        $paymentError = null;

        $online = in_array($data['payment_method'], ['mobile_money', 'card', 'fedapay'], true);

        if (! $online) {
            // Paiement à la livraison : commande confirmée immédiatement.
            Payment::create([
                'restaurant_id' => $order->restaurant_id,
                'order_id' => $order->id,
                'provider' => 'cash',
                'type' => 'order',
                'amount' => $order->total,
                'currency' => 'XOF',
                'status' => 'approved',
                'method' => 'cash',
                'paid_at' => now(),
            ]);
            $order->update(['payment_status' => 'paid']);
            $this->confirmOrder($order, $slug);
        } else {
            // Paiement en ligne via FedaPay : redirection vers la page de paiement.
            $result = app(FedaPayService::class)->createOrderPayment($order, [
                'email' => $order->customer_email,
                'phone' => $order->customer_phone,
            ]);

            $payment = $result['payment'];
            $checkoutUrl = $result['checkout_url'];
            $paymentError = $result['error'] ?? null;

            if ($paymentError) {
                $order->update(['payment_status' => 'failed']);
            }

            // La confirmation (notification équipe + email client) est envoyée
            // au retour / webhook FedaPay une fois le paiement approuvé.
        }

        return response()->json([
            'order' => $order,
            'payment' => $payment,
            'checkout_url' => $checkoutUrl,
            'payment_error' => $paymentError ?? null,
            'message' => 'Commande créée.',
        ], 201);
    }

    /**
     * Notification équipe + email client pour une commande payée.
     */
    protected function confirmOrder(Order $order, string $slug): void
    {
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
                Mail::to($order->customer_email)->send(
                    new OrderConfirmationMail($order->load('restaurant', 'items'), $frontendUrl.'/store/'.$slug)
                );
            } catch (\Throwable $e) {
                Log::warning('Email de confirmation de commande échoué', ['order' => $order->id, 'error' => $e->getMessage()]);
            }
        }
    }

    public function payment(string $slug, string $transactionId)
    {
        $restaurant = Restaurant::where('slug', $slug)->where('status', 'active')->firstOrFail();

        $payment = Payment::where('provider', 'fedapay')
            ->where('provider_ref', $transactionId)
            ->firstOrFail();

        $order = $payment->order;
        abort_if(! $order || $order->restaurant_id !== $restaurant->id, 404);

        // En dev (webhook injoignable depuis les serveurs FedaPay vers
        // localhost), on interroge l'API FedaPay pour récupérer le statut
        // réel du paiement au lieu de se fier uniquement à notre base.
        if ($payment->status === 'pending' || $payment->status === 'declined') {
            try {
                $remote = app(FedaPayService::class)->getTransaction($transactionId);
                $realStatus = strtolower((string) ($remote['status'] ?? ''));

                if ($realStatus !== '') {
                    $mapped = match ($realStatus) {
                        'approved' => 'approved',
                        'declined' => 'declined',
                        'canceled', 'cancelled' => 'cancelled',
                        default => $payment->status,
                    };

                    if ($mapped !== $payment->status) {
                        $wasPaid = $order->payment_status === 'paid';
                        $payment->update([
                            'status' => $mapped,
                            'paid_at' => $mapped === 'approved' ? now() : $payment->paid_at,
                        ]);
                        $order->update([
                            'payment_status' => $mapped === 'approved' ? 'paid' : ($mapped === 'pending' ? 'pending' : 'failed'),
                        ]);

                        if ($mapped === 'approved' && ! $wasPaid) {
                            app(FedaPayService::class)->confirmPayment($payment->fresh());
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Vérification du statut FedaPay (payment endpoint) échouée', ['tx' => $transactionId, 'error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'order' => $order->fresh()->load('items'),
            'payment' => $payment->fresh(),
        ]);
    }

    public function track(Request $request, string $slug)
    {
        $request->validate([
            'number' => ['required', 'string'],
            'phone' => ['required', 'string'],
        ]);

        $restaurant = Restaurant::where('slug', $slug)->firstOrFail();

        $order = Order::with('items')
            ->where('restaurant_id', $restaurant->id)
            ->where('number', $request->query('number'))
            ->where('customer_phone', $request->query('phone'))
            ->firstOrFail();

        return response()->json($order);
    }

    /**
     * Avis client laissé depuis la page de suivi, après une commande
     * livrée. Vérifié par numéro de commande + téléphone.
     */
    public function storeReview(Request $request, string $slug)
    {
        $data = $request->validate([
            'number' => ['required', 'string'],
            'phone' => ['required', 'string'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $restaurant = Restaurant::where('slug', $slug)->where('status', 'active')->firstOrFail();

        $order = Order::where('restaurant_id', $restaurant->id)
            ->where('number', strtoupper($data['number']))
            ->where('customer_phone', $data['phone'])
            ->firstOrFail();

        if ($order->status !== 'livree') {
            return response()->json([
                'message' => "Vous pourrez noter cette commande une fois livrée.",
            ], 422);
        }

        if (\App\Models\Review::where('order_id', $order->id)->exists()) {
            return response()->json(['message' => 'Cette commande a déjà été notée.'], 422);
        }

        $review = \App\Models\Review::create([
            'restaurant_id' => $restaurant->id,
            'order_id' => $order->id,
            'customer_name' => $order->customer_name,
            'rating' => (int) $data['rating'],
            'comment' => $data['comment'] ?? null,
        ]);

        // La note moyenne affichée sur la boutique vient d'être modifiée.
        $restaurant->clearStoreCache();

        return response()->json([
            'message' => 'Merci pour votre avis !',
            'review' => $review,
        ], 201);
    }

    /**
     * Renvoie le statut de fidélité d'un client par son numéro de téléphone.
     */
    public function customerLoyalty(string $slug, Request $request)
    {
        $phone = trim($request->query('phone', ''));
        if (! $phone) {
            return response()->json(['found' => false]);
        }

        $restaurant = Restaurant::where('slug', $slug)->firstOrFail();

        $customer = Customer::where('restaurant_id', $restaurant->id)
            ->where('phone', $phone)
            ->first();

        if (! $customer) {
            return response()->json([
                'found' => false,
                'phone' => $phone,
            ]);
        }

        $loyaltySettings = $restaurant->loyalty_settings ?? [
            'enabled' => true,
            'threshold' => 5,
            'reward_title' => 'Une boisson offerte',
        ];

        $threshold = (int) ($loyaltySettings['threshold'] ?? 5);
        $count = (int) $customer->orders_count;
        $stamps = $count % $threshold;
        $isNextReward = ($stamps === ($threshold - 1)); // La prochaine commande débloque la récompense

        return response()->json([
            'found' => true,
            'name' => $customer->name,
            'phone' => $customer->phone,
            'orders_count' => $count,
            'stamps' => $stamps,
            'threshold' => $threshold,
            'orders_until_next' => $threshold - $stamps,
            'is_next_reward' => $isNextReward,
            'favorite_dish' => $customer->favorite_dish,
            'reward_title' => $loyaltySettings['reward_title'] ?? 'Une boisson offerte',
            'loyalty_enabled' => (bool) ($loyaltySettings['enabled'] ?? true),
        ]);
    }
}
