<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $items = Category::withCount('products')
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->orderBy('sort_order')
            ->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer'],
        ]);

        $restaurantId = $request->user()->restaurant_id;
        $data['restaurant_id'] = $restaurantId;
        $data['slug'] = Str::slug($data['name']);

        $category = Category::create($data);
        \App\Models\Restaurant::find($restaurantId)?->clearStoreCache();

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        abort_unless($category->restaurant_id === $request->user()->restaurant_id, 403);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer'],
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);
        $category->restaurant?->clearStoreCache();

        return response()->json($category);
    }

    public function destroy(Request $request, Category $category)
    {
        abort_unless($category->restaurant_id === $request->user()->restaurant_id, 403);
        $category->restaurant?->clearStoreCache();
        $category->delete();

        return response()->json(['message' => 'Catégorie supprimée.']);
    }
}
