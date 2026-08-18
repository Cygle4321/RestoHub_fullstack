<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Promotion::where('restaurant_id', $request->user()->restaurant_id)->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40'],
            'type' => ['required', 'in:percent,fixed,free_delivery'],
            'value' => ['integer', 'min:0'],
            'min_order' => ['nullable', 'integer', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ]);
        $data['restaurant_id'] = $request->user()->restaurant_id;
        $data['code'] = strtoupper($data['code']);

        return response()->json(Promotion::create($data), 201);
    }

    public function update(Request $request, Promotion $promotion)
    {
        abort_unless($promotion->restaurant_id === $request->user()->restaurant_id, 403);
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:40'],
            'type' => ['sometimes', 'in:percent,fixed,free_delivery'],
            'value' => ['integer', 'min:0'],
            'min_order' => ['nullable', 'integer'],
            'usage_limit' => ['nullable', 'integer'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ]);
        if (isset($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }
        $promotion->update($data);

        return response()->json($promotion);
    }

    public function destroy(Request $request, Promotion $promotion)
    {
        abort_unless($promotion->restaurant_id === $request->user()->restaurant_id, 403);
        $promotion->delete();

        return response()->json(['message' => 'Promotion supprimée.']);
    }
}
