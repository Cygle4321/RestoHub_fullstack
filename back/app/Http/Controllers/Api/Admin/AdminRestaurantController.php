<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;

class AdminRestaurantController extends Controller
{
    public function index(Request $request)
    {
        $query = Restaurant::with(['plan', 'users'])
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($q = $request->query('q')) {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function show(Restaurant $restaurant)
    {
        $restaurant->load(['plan', 'users', 'subscriptions.plan', 'activeSubscription']);
        $restaurant->loadCount('orders');
        $restaurant->loadSum('orders', 'total');

        return response()->json($restaurant);
    }

    public function updateStatus(Request $request, Restaurant $restaurant)
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,active,suspended,inactive'],
        ]);

        $restaurant->update($data);

        return response()->json($restaurant);
    }
}
