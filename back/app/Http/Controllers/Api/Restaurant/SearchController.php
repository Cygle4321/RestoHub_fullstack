<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;

/**
 * Recherche globale du dashboard (commandes, produits, clients)
 * alimentant le champ de recherche du header.
 */
class SearchController extends Controller
{
    public function __invoke(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;
        $q = trim((string) $request->query('q', ''));

        if ($q === '') {
            return response()->json([
                'query' => '',
                'orders' => [],
                'products' => [],
                'customers' => [],
            ]);
        }

        $like = "%{$q}%";

        $orders = Order::where('restaurant_id', $restaurantId)
            ->where(function ($w) use ($like) {
                $w->where('number', 'like', $like)
                    ->orWhere('customer_name', 'like', $like)
                    ->orWhere('customer_phone', 'like', $like);
            })
            ->latest()
            ->limit(5)
            ->get(['id', 'number', 'customer_name', 'customer_phone', 'status', 'total', 'created_at']);

        $products = Product::where('restaurant_id', $restaurantId)
            ->where('name', 'like', $like)
            ->orderBy('name')
            ->limit(5)
            ->get(['id', 'name', 'price', 'is_available']);

        $customers = Customer::where('restaurant_id', $restaurantId)
            ->where(function ($w) use ($like) {
                $w->where('name', 'like', $like)
                    ->orWhere('phone', 'like', $like);
            })
            ->orderByDesc('orders_count')
            ->limit(5)
            ->get(['id', 'name', 'phone', 'orders_count', 'total_spent']);

        return response()->json([
            'query' => $q,
            'orders' => $orders,
            'products' => $products,
            'customers' => $customers,
        ]);
    }
}
