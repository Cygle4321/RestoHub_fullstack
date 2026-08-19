<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Restaurant;
use App\Rules\ValidImageDataUri;
use App\Services\ImageStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;
        $query = Product::with('category')
            ->where('restaurant_id', $restaurantId)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($cat = $request->query('category_id')) {
            $query->where('category_id', $cat);
        }
        if ($q = $request->query('q')) {
            $query->where('name', 'like', "%{$q}%");
        }
        if ($request->has('available')) {
            $query->where('is_available', filter_var($request->query('available'), FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->paginate(50));
    }

    public function store(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $restaurant = Restaurant::with('plan')->find($restaurantId);

        $max = $restaurant?->plan?->max_products;
        if ($max !== null && $restaurant->products()->count() >= $max) {
            return response()->json([
                'message' => "Limite de votre formule atteinte : {$max} produits maximum. Passez à une formule supérieure depuis l'onglet Abonnement.",
            ], 422);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'image' => ['nullable', 'string', new ValidImageDataUri],
            'is_available' => ['boolean'],
            'is_featured' => ['boolean'],
            'options' => ['nullable', 'array'],
            'supplements' => ['nullable', 'array'],
        ]);

        $data['restaurant_id'] = $restaurantId;
        $data['slug'] = $this->uniqueSlug($restaurantId, $data['name']);
        $data['image'] = app(ImageStorage::class)->store($data['image'] ?? null, 'products');

        $product = Product::create($data);
        $restaurant->clearStoreCache();

        return response()->json($product->load('category'), 201);
    }

    public function show(Request $request, Product $product)
    {
        $this->authorizeRestaurant($request, $product);

        return response()->json($product->load('category'));
    }

    public function update(Request $request, Product $product)
    {
        $this->authorizeRestaurant($request, $product);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'integer', 'min:0'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'image' => ['nullable', 'string', new ValidImageDataUri],
            'is_available' => ['boolean'],
            'is_featured' => ['boolean'],
            'options' => ['nullable', 'array'],
            'supplements' => ['nullable', 'array'],
            'sort_order' => ['integer'],
        ]);

        if (isset($data['name']) && $data['name'] !== $product->name) {
            $data['slug'] = $this->uniqueSlug($product->restaurant_id, $data['name'], $product->id);
        }

        if (array_key_exists('image', $data)) {
            $data['image'] = app(ImageStorage::class)->store($data['image'], 'products');
        }

        $product->update($data);
        $product->restaurant?->clearStoreCache();

        return response()->json($product->fresh('category'));
    }

    public function destroy(Request $request, Product $product)
    {
        $this->authorizeRestaurant($request, $product);
        $product->restaurant?->clearStoreCache();
        $product->delete();

        return response()->json(['message' => 'Produit supprimé.']);
    }

    protected function uniqueSlug(int $restaurantId, string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name);
        $base = $slug;
        $i = 1;
        while (
            Product::where('restaurant_id', $restaurantId)
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    protected function authorizeRestaurant(Request $request, Product $product): void
    {
        abort_unless(
            $request->user()->isSuperAdmin() || $product->restaurant_id === $request->user()->restaurant_id,
            403
        );
    }
}
