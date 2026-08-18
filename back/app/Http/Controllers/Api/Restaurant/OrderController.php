<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Notifications\OrderCancelledNotification;
use App\Services\RestaurantNotifier;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $query = Order::with('items')
            ->where('restaurant_id', $restaurantId)
            ->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($mode = $request->query('mode')) {
            $query->where('mode', $mode);
        }
        if ($q = $request->query('q')) {
            $query->where(function ($w) use ($q) {
                $w->where('number', 'like', "%{$q}%")
                    ->orWhere('customer_name', 'like', "%{$q}%")
                    ->orWhere('customer_phone', 'like', "%{$q}%");
            });
        }
        if ($date = $request->query('date')) {
            $query->whereDate('created_at', $date);
        }

        return response()->json($query->paginate((int) $request->query('per_page', 20)));
    }

    public function show(Request $request, Order $order)
    {
        $this->authorizeRestaurant($request, $order);

        return response()->json($order->load('items', 'customer'));
    }

    public function updateStatus(Request $request, Order $order)
    {
        $this->authorizeRestaurant($request, $order);

        $data = $request->validate([
            'status' => ['required', 'in:nouvelle,confirmee,en_preparation,prete,en_livraison,livree,annulee'],
        ]);

        $order->pushStatus($data['status']);

        // Notification d'annulation aux membres de la boutique
        if ($data['status'] === 'annulee') {
            app(RestaurantNotifier::class)->notify(
                $order->restaurant,
                new OrderCancelledNotification([
                    'id' => $order->id,
                    'number' => $order->number,
                ]),
                'cancel'
            );
        }

        return response()->json($order->fresh('items'));
    }

    protected function authorizeRestaurant(Request $request, Order $order): void
    {
        if ($request->user()->isSuperAdmin()) {
            return;
        }
        abort_unless($order->restaurant_id === $request->user()->restaurant_id, 403);
    }
}
