<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\DeliveryZone;
use App\Models\Driver;
use App\Models\Order;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function zones(Request $request)
    {
        return response()->json(
            DeliveryZone::where('restaurant_id', $request->user()->restaurant_id)->get()
        );
    }

    public function storeZone(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'fee' => ['required', 'integer', 'min:0'],
            'delay' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);
        $data['restaurant_id'] = $request->user()->restaurant_id;
        $zone = DeliveryZone::create($data);
        \App\Models\Restaurant::find($data['restaurant_id'])?->clearStoreCache();

        return response()->json($zone, 201);
    }

    public function updateZone(Request $request, DeliveryZone $zone)
    {
        abort_unless($zone->restaurant_id === $request->user()->restaurant_id, 403);
        $zone->update($request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'fee' => ['sometimes', 'integer', 'min:0'],
            'delay' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]));
        $zone->restaurant?->clearStoreCache();

        return response()->json($zone);
    }

    public function destroyZone(Request $request, DeliveryZone $zone)
    {
        abort_unless($zone->restaurant_id === $request->user()->restaurant_id, 403);
        $zone->restaurant?->clearStoreCache();
        $zone->delete();

        return response()->json(['message' => 'Zone supprimée.']);
    }

    public function drivers(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $drivers = Driver::where('restaurant_id', $restaurantId)->get()->map(function (Driver $driver) {
            $driver->orders_today = $driver->orders()
                ->where('status', '!=', 'annulee')
                ->whereDate('created_at', now()->toDateString())
                ->count();

            return $driver;
        });

        return response()->json($drivers);
    }

    /** Commandes à livrer : mode livraison, prête ou en cours de livraison. */
    public function pendingOrders(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $orders = Order::with('driver')
            ->where('restaurant_id', $restaurantId)
            ->where('mode', 'livraison')
            ->whereIn('status', ['prete', 'en_livraison'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }

    public function assignDriver(Request $request, Order $order)
    {
        abort_unless($order->restaurant_id === $request->user()->restaurant_id, 403);

        $data = $request->validate([
            'driver_id' => ['required', 'integer'],
        ]);

        $driver = Driver::where('restaurant_id', $order->restaurant_id)
            ->where('id', $data['driver_id'])
            ->firstOrFail();

        $order->driver_id = $driver->id;
        $order->save();

        $driver->update(['status' => 'en_course']);

        if ($order->status === 'prete') {
            $order->pushStatus('en_livraison');
        }

        return response()->json($order->load('driver'));
    }

    public function unassignDriver(Request $request, Order $order)
    {
        abort_unless($order->restaurant_id === $request->user()->restaurant_id, 403);

        $driver = $order->driver;
        $order->driver_id = null;
        $order->save();

        // Le livreur redevient disponible s'il n'a plus de course en attente.
        if ($driver) {
            $stillBusy = Order::where('driver_id', $driver->id)
                ->where('status', 'en_livraison')
                ->exists();
            if (! $stillBusy) {
                $driver->update(['status' => 'disponible']);
            }
        }

        if ($order->status === 'en_livraison') {
            $order->pushStatus('prete');
        }

        return response()->json($order->load('driver'));
    }

    public function storeDriver(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:30'],
            'vehicle' => ['nullable', 'string', 'max:60'],
            'status' => ['in:disponible,en_course,indisponible'],
            'is_active' => ['boolean'],
        ]);
        $data['restaurant_id'] = $request->user()->restaurant_id;

        return response()->json(Driver::create($data), 201);
    }

    public function updateDriver(Request $request, Driver $driver)
    {
        abort_unless($driver->restaurant_id === $request->user()->restaurant_id, 403);
        $driver->update($request->validate([
            'name' => ['sometimes', 'string'],
            'phone' => ['sometimes', 'string'],
            'vehicle' => ['nullable', 'string'],
            'status' => ['in:disponible,en_course,indisponible'],
            'is_active' => ['boolean'],
        ]));

        return response()->json($driver);
    }
}
