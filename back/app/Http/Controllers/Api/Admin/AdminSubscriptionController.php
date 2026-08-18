<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Http\Request;

class AdminSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = Subscription::with(['restaurant', 'plan'])->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->paginate(30));
    }

    public function plans()
    {
        return response()->json(Plan::orderBy('sort_order')->get());
    }

    public function storePlan(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
            'slug' => ['required', 'string', 'unique:plans,slug'],
            'description' => ['nullable', 'string'],
            'price_monthly' => ['required', 'integer', 'min:0'],
            'price_yearly' => ['nullable', 'integer', 'min:0'],
            'max_products' => ['nullable', 'integer'],
            'max_orders_month' => ['nullable', 'integer'],
            'features' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer'],
        ]);

        return response()->json(Plan::create($data), 201);
    }

    public function updatePlan(Request $request, Plan $plan)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string'],
            'description' => ['nullable', 'string'],
            'price_monthly' => ['sometimes', 'integer'],
            'price_yearly' => ['nullable', 'integer'],
            'max_products' => ['nullable', 'integer'],
            'max_orders_month' => ['nullable', 'integer'],
            'features' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer'],
        ]);
        $plan->update($data);

        return response()->json($plan);
    }
}
