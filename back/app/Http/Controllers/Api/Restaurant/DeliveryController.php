<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\DeliveryZone;
use App\Models\Driver;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function zones(Request $request)
    {
        return response()->json(
            DeliveryZone::where('restaurant_id', $request->user()->restaurant_id)->get()
        );
    }

    public function storeZone(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'fee' => ['required', 'integer', 'min:0'],
            'delay' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);
        $data['restaurant_id'] = $request->user()->restaurant_id;

        return response()->json(DeliveryZone::create($data), 201);
    }

    public function updateZone(Request $request, DeliveryZone $zone)
    {
        abort_unless($zone->restaurant_id === $request->user()->restaurant_id, 403);
        $zone->update($request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'fee' => ['sometimes', 'integer', 'min:0'],
            'delay' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]));

        return response()->json($zone);
    }

    public function destroyZone(Request $request, DeliveryZone $zone)
    {
        abort_unless($zone->restaurant_id === $request->user()->restaurant_id, 403);
        $zone->delete();

        return response()->json(['message' => 'Zone supprimée.']);
    }

    public function drivers(Request $request)
    {
        return response()->json(
            Driver::where('restaurant_id', $request->user()->restaurant_id)->get()
        );
    }

    public function storeDriver(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:30'],
            'vehicle' => ['nullable', 'string', 'max:60'],
            'status' => ['in:disponible,en_course,indisponible'],
            'is_active' => ['boolean'],
        ]);
        $data['restaurant_id'] = $request->user()->restaurant_id;

        return response()->json(Driver::create($data), 201);
    }

    public function updateDriver(Request $request, Driver $driver)
    {
        abort_unless($driver->restaurant_id === $request->user()->restaurant_id, 403);
        $driver->update($request->validate([
            'name' => ['sometimes', 'string'],
            'phone' => ['sometimes', 'string'],
            'vehicle' => ['nullable', 'string'],
            'status' => ['in:disponible,en_course,indisponible'],
            'is_active' => ['boolean'],
        ]));

        return response()->json($driver);
    }
}
