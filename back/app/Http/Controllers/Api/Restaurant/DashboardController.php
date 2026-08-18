<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;
        $days = max(1, (int) $request->query('days', 7));
        $from = now()->subDays($days)->startOfDay();

        $ordersQuery = Order::where('restaurant_id', $restaurantId)
            ->where('created_at', '>=', $from)
            ->where('status', '!=', 'annulee');

        $revenue = (clone $ordersQuery)->sum('total');
        $ordersCount = (clone $ordersQuery)->count();
        $customersCount = Customer::where('restaurant_id', $restaurantId)->count();
        $avgBasket = $ordersCount > 0 ? (int) round($revenue / $ordersCount) : 0;

        $salesSeries = Order::where('restaurant_id', $restaurantId)
            ->where('created_at', '>=', $from)
            ->where('status', '!=', 'annulee')
            ->select(
                DB::raw('DATE(created_at) as day'),
                DB::raw('SUM(total) as ventes'),
                DB::raw('COUNT(*) as commandes')
            )
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        $pending = Order::where('restaurant_id', $restaurantId)
            ->whereIn('status', ['nouvelle', 'confirmee', 'en_preparation'])
            ->latest()
            ->limit(10)
            ->get();

        $recent = Order::where('restaurant_id', $restaurantId)
            ->latest()
            ->limit(5)
            ->get();

        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.restaurant_id', $restaurantId)
            ->where('orders.created_at', '>=', $from)
            ->where('orders.status', '!=', 'annulee')
            ->select('order_items.name', DB::raw('SUM(order_items.quantity) as count'))
            ->groupBy('order_items.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        return response()->json([
            'kpis' => [
                'revenue' => $revenue,
                'orders' => $ordersCount,
                'customers' => $customersCount,
                'avg_basket' => $avgBasket,
            ],
            'sales_series' => $salesSeries,
            'pending_orders' => $pending,
            'recent_orders' => $recent,
            'top_products' => $topProducts,
            'products_count' => Product::where('restaurant_id', $restaurantId)->count(),
        ]);
    }
}
