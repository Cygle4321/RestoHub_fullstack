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
use App\Models\Restaurant;
use App\Services\RestaurantNotifier;
use App\Notifications\NewOrderNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class StoreController extends Controller
{
    public function show(string $slug)
    {
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

        return response()->json([
            'restaurant' => $restaurant,
            'categories' => $categories,
            'products' => $products,
            'delivery_zones' => $zones,
        ]);
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
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.options' => ['nullable', 'array'],
            'items.*.supplements' => ['nullable', 'array'],
        ]);

        if ($data['mode'] === 'livraison' && empty($data['delivery_address'])) {
            return response()->json(['message' => 'Adresse de livraison requise.'], 422);
        }

        $order = DB::transaction(function () use ($data, $restaurant) {
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
                    'quantity' => (int) $row['quantity'],
                    'unit_price' => $unit,
                    'line_total' => $lineTotal,
                    'options' => $row['options'] ?? null,
                    'supplements' => $row['supplements'] ?? null,
                ];
            }

            $deliveryFee = 0;
            $zoneName = null;
            if ($data['mode'] === 'livraison' && ! empty($data['delivery_zone_id'])) {
                $zone = DeliveryZone::where('restaurant_id', $restaurant->id)
                    ->where('id', $data['delivery_zone_id'])
                    ->where('is_active', true)
                    ->first();
                if ($zone) {
                    $deliveryFee = $zone->fee;
                    $zoneName = $zone->name;
                }
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

            foreach ($lineItems as $li) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $li['product']->id,
                    'name' => $li['product']->name,
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

            return $order->load('items');
        });

        $checkoutUrl = null;
        $payment = null;
        $paymentError = null;

        // Notification de nouvelle commande aux membres de la boutique
        app(RestaurantNotifier::class)->notify(
            $restaurant,
            new NewOrderNotification([
                'id' => $order->id,
                'number' => $order->number,
                'customer_name' => $order->customer_name,
                'total' => $order->total,
                'mode' => $order->mode,
            ]),
            'order'
        );

        // Paiement en ligne — validé immédiatement (FedaPay à réactiver plus tard).
        if (in_array($data['payment_method'], ['mobile_money', 'card', 'fedapay'], true)) {
            $payment = Payment::create([
                'restaurant_id' => $order->restaurant_id,
                'order_id' => $order->id,
                'provider' => $data['payment_method'],
                'type' => 'order',
                'amount' => $order->total,
                'currency' => 'XOF',
                'status' => 'approved',
                'method' => $data['payment_method'],
                'paid_at' => now(),
            ]);
            $order->update(['payment_status' => 'paid']);
        }

        // Email de confirmation au client
        if ($order->customer_email) {
            try {
                $frontendUrl = (string) env('FRONTEND_URL', 'http://localhost:5173');
                Mail::to($order->customer_email)->send(
                    new OrderConfirmationMail($order->load('restaurant', 'items'), $frontendUrl.'/store/'.$slug)
                );
            } catch (\Throwable $e) {
                Log::warning('Email de confirmation de commande échoué', ['order' => $order->id, 'error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'order' => $order,
            'payment' => $payment,
            'checkout_url' => $checkoutUrl,
            'payment_error' => $paymentError ?? null,
            'message' => 'Commande créée.',
        ], 201);
    }

    public function payment(string $slug, string $transactionId)
    {
        $restaurant = Restaurant::where('slug', $slug)->where('status', 'active')->firstOrFail();

        $payment = Payment::where('provider', 'fedapay')
            ->where('provider_ref', $transactionId)
            ->firstOrFail();

        $order = $payment->order;
        abort_if(! $order || $order->restaurant_id !== $restaurant->id, 404);

        return response()->json([
            'order' => $order->load('items'),
            'payment' => $payment,
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
}
