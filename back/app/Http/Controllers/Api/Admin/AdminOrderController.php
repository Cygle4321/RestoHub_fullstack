<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['restaurant', 'items'])->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($restaurantId = $request->query('restaurant_id')) {
            $query->where('restaurant_id', $restaurantId);
        }

        return response()->json($query->paginate(30));
    }

    public function show(Order $order)
    {
        return response()->json($order->load('items', 'restaurant', 'customer'));
    }
}
