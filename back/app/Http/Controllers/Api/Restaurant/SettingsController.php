<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Rules\ValidImageDataUri;
use App\Services\ImageStorage;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show(Request $request)
    {
        $restaurant = Restaurant::with('plan', 'activeSubscription')
            ->findOrFail($request->user()->restaurant_id);

        return response()->json($restaurant);
    }

    public function update(Request $request)
    {
        $restaurant = Restaurant::findOrFail($request->user()->restaurant_id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:160'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'logo' => ['nullable', 'string', new ValidImageDataUri],
            'cover' => ['nullable', 'string', new ValidImageDataUri],
            'color' => ['nullable', 'string', 'max:20'],
            'is_open' => ['boolean'],
            'hours' => ['nullable', 'array'],
            'social' => ['nullable', 'array'],
            'notifications_settings' => ['nullable', 'array'],
            'payment_settings' => ['nullable', 'array'],
            // Permet de publier la boutique depuis l'onboarding (pending → active)
            'status' => ['sometimes', 'in:pending,active,suspended'],
        ]);

        // Un owner ne peut que passer en active (pas se suspendre lui-même)
        if (isset($data['status']) && $data['status'] === 'suspended' && $restaurant->status !== 'suspended') {
            unset($data['status']);
        }

        foreach (['logo', 'cover'] as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = app(ImageStorage::class)->store($data[$field], 'restaurants');
            }
        }

        $restaurant->update($data);
        $restaurant->clearStoreCache();

        return response()->json($restaurant->fresh('plan', 'activeSubscription'));
    }

    public function billing(Request $request)
    {
        $restaurant = Restaurant::with(['plan', 'subscriptions.plan', 'activeSubscription'])
            ->findOrFail($request->user()->restaurant_id);

        return response()->json([
            'restaurant' => $restaurant,
            'subscription' => $restaurant->activeSubscription,
            'history' => $restaurant->subscriptions()->with('plan')->latest()->get(),
            'restricted' => ! $restaurant->canUseService(),
        ]);
    }
}
