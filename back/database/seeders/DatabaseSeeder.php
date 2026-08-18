<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Restaurant;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $starter = Plan::create([
            'name' => 'Starter',
            'slug' => 'starter',
            'description' => 'Pour démarrer',
            'price_monthly' => 10000,
            'price_yearly' => 100000,
            'max_products' => 50,
            'max_orders_month' => 300,
            'features' => ['Boutique en ligne', 'Commandes', 'QR Code'],
            'sort_order' => 1,
        ]);

        $business = Plan::create([
            'name' => 'Business',
            'slug' => 'business',
            'description' => 'Pour les restaurants en croissance',
            'price_monthly' => 25000,
            'price_yearly' => 250000,
            'max_products' => 200,
            'max_orders_month' => 2000,
            'features' => ['Tout Starter', 'Promotions', 'Statistiques', 'Livreurs'],
            'sort_order' => 2,
        ]);

        Plan::create([
            'name' => 'Premium',
            'slug' => 'premium',
            'description' => 'Sans limites',
            'price_monthly' => 50000,
            'price_yearly' => 500000,
            'max_products' => null,
            'max_orders_month' => null,
            'features' => ['Tout Business', 'Support prioritaire', 'Multi-utilisateurs'],
            'sort_order' => 3,
        ]);

        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@restohub.com',
            'password' => 'password',
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $restaurant = Restaurant::create([
            'name' => "Le Saveur d'Or",
            'slug' => 'le-saveur-dor',
            'email' => 'contact@lesaveurdor.com',
            'phone' => '+22507000000',
            'address' => 'Cocody, Rue des Jardins, Abidjan',
            'description' => 'Cuisine africaine moderne et grillades premium depuis 2015.',
            'color' => '#14b8a6',
            'is_open' => true,
            'status' => 'active',
            'plan_id' => $business->id,
            'hours' => [
                'lun' => '11:00 - 23:00', 'mar' => '11:00 - 23:00', 'mer' => '11:00 - 23:00',
                'jeu' => '11:00 - 23:00', 'ven' => '11:00 - 00:00', 'sam' => '11:00 - 00:00',
                'dim' => '12:00 - 22:00',
            ],
        ]);

        User::create([
            'name' => 'Mohamed Diallo',
            'email' => 'owner@lesaveurdor.com',
            'phone' => '+22507000000',
            'password' => 'password',
            'role' => 'owner',
            'restaurant_id' => $restaurant->id,
            'is_active' => true,
        ]);

        Subscription::create([
            'restaurant_id' => $restaurant->id,
            'plan_id' => $business->id,
            'status' => 'active',
            'billing_cycle' => 'monthly',
            'amount' => $business->price_monthly,
            'starts_at' => now()->subMonth(),
            'ends_at' => now()->addMonth(),
        ]);

        $cats = ['Entrées', 'Grillades', 'Plats traditionnels', 'Boissons', 'Desserts'];
        $catModels = [];
        foreach ($cats as $i => $name) {
            $catModels[$name] = Category::create([
                'restaurant_id' => $restaurant->id,
                'name' => $name,
                'slug' => Str::slug($name),
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        $products = [
            ['Poulet Braisé', 'Grillades', 4500, true],
            ['Brochettes de bœuf', 'Grillades', 3000, true],
            ['Kedjenou de poulet', 'Plats traditionnels', 5000, false],
            ["Salade d'avocat", 'Entrées', 2500, false],
            ['Jus de bissap', 'Boissons', 1000, true],
            ['Alloco', 'Entrées', 1500, false],
            ['Poisson entier grillé', 'Grillades', 7500, true],
            ['Fufu sauce graine', 'Plats traditionnels', 3500, false],
        ];

        foreach ($products as [$name, $cat, $price, $featured]) {
            Product::create([
                'restaurant_id' => $restaurant->id,
                'category_id' => $catModels[$cat]->id,
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => $name.' — spécialité maison.',
                'price' => $price,
                'is_available' => true,
                'is_featured' => $featured,
            ]);
        }
    }
}
