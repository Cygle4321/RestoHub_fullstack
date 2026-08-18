<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::where('restaurant_id', $request->user()->restaurant_id)
            ->orderByDesc('last_order_at');

        if ($q = $request->query('q')) {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate(30));
    }

    public function show(Request $request, Customer $customer)
    {
        abort_unless($customer->restaurant_id === $request->user()->restaurant_id, 403);

        return response()->json(
            $customer->load(['orders' => fn ($q) => $q->latest()->limit(20)])
        );
    }
}
