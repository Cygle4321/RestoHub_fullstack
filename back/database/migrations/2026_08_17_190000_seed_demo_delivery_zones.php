<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $restaurant = DB::table('restaurants')->where('slug', 'le-saveur-dor')->first();
        if (! $restaurant) {
            return;
        }

        if (DB::table('delivery_zones')->where('restaurant_id', $restaurant->id)->exists()) {
            return;
        }

        DB::table('delivery_zones')->insert([
            ['restaurant_id' => $restaurant->id, 'name' => 'Cocody', 'fee' => 1000, 'delay' => '25-35 min', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['restaurant_id' => $restaurant->id, 'name' => 'Marcory', 'fee' => 1500, 'delay' => '30-45 min', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['restaurant_id' => $restaurant->id, 'name' => 'Yopougon', 'fee' => 2000, 'delay' => '40-60 min', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        $restaurant = DB::table('restaurants')->where('slug', 'le-saveur-dor')->first();
        if (! $restaurant) {
            return;
        }

        DB::table('delivery_zones')
            ->where('restaurant_id', $restaurant->id)
            ->whereIn('name', ['Cocody', 'Marcory', 'Yopougon'])
            ->delete();
    }
};
