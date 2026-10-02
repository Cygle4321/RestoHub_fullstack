<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\DeliveryZone;
use App\Models\Driver;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ──────────────────────────────────────────
        // PLANS
        // ──────────────────────────────────────────
        $starter = Plan::create([
            'name'             => 'Starter',
            'slug'             => 'starter',
            'description'      => 'Pour démarrer',
            'price_monthly'    => 10000,
            'price_yearly'     => 100000,
            'max_products'     => 50,
            'max_orders_month' => 300,
            'features'         => ['Boutique en ligne', 'Commandes', 'QR Code'],
            'sort_order'       => 1,
        ]);

        $business = Plan::create([
            'name'             => 'Business',
            'slug'             => 'business',
            'description'      => 'Pour les restaurants en croissance',
            'price_monthly'    => 25000,
            'price_yearly'     => 250000,
            'max_products'     => 200,
            'max_orders_month' => 2000,
            'features'         => ['Tout Starter', 'Promotions', 'Statistiques', 'Livreurs'],
            'sort_order'       => 2,
        ]);

        Plan::create([
            'name'             => 'Premium',
            'slug'             => 'premium',
            'description'      => 'Sans limites',
            'price_monthly'    => 50000,
            'price_yearly'     => 500000,
            'max_products'     => null,
            'max_orders_month' => null,
            'features'         => ['Tout Business', 'Support prioritaire', 'Multi-utilisateurs'],
            'sort_order'       => 3,
        ]);

        // ──────────────────────────────────────────
        // SUPER ADMIN
        // ──────────────────────────────────────────
        User::create([
            'name'      => 'Super Admin',
            'email'     => 'admin@restohub.com',
            'password'  => 'password',
            'role'      => 'super_admin',
            'is_active' => true,
        ]);

        // ──────────────────────────────────────────
        // RESTAURANT PRINCIPAL
        // ──────────────────────────────────────────
        $restaurant = Restaurant::create([
            'name'        => "Le Saveur d'Or",
            'slug'        => 'le-saveur-dor',
            'email'       => 'contact@lesaveurdor.com',
            'phone'       => '+22507000000',
            'address'     => 'Cocody, Rue des Jardins, Abidjan',
            'description' => 'Cuisine africaine moderne et grillades premium depuis 2015.',
            'color'       => '#14b8a6',
            'is_open'     => true,
            'status'      => 'active',
            'plan_id'     => $business->id,
            'hours'       => [
                'lun' => '11:00 - 23:00', 'mar' => '11:00 - 23:00',
                'mer' => '11:00 - 23:00', 'jeu' => '11:00 - 23:00',
                'ven' => '11:00 - 00:00', 'sam' => '11:00 - 00:00',
                'dim' => '12:00 - 22:00',
            ],
        ]);

        User::create([
            'name'          => 'Mohamed Diallo',
            'email'         => 'owner@lesaveurdor.com',
            'phone'         => '+22507000000',
            'password'      => 'password',
            'role'          => 'owner',
            'restaurant_id' => $restaurant->id,
            'is_active'     => true,
        ]);

        // Abonnement actif
        $sub = Subscription::create([
            'restaurant_id' => $restaurant->id,
            'plan_id'       => $business->id,
            'status'        => 'active',
            'billing_cycle' => 'monthly',
            'amount'        => $business->price_monthly,
            'starts_at'     => now()->subMonth(),
            'ends_at'       => now()->addMonth(),
        ]);

        Payment::create([
            'restaurant_id'   => $restaurant->id,
            'subscription_id' => $sub->id,
            'provider'        => 'fedapay',
            'provider_ref'    => 'FDP-SUB-'.strtoupper(Str::random(8)),
            'type'            => 'subscription',
            'amount'          => $business->price_monthly,
            'currency'        => 'XOF',
            'status'          => 'approved',
            'paid_at'         => now()->subMonth(),
        ]);

        // ──────────────────────────────────────────
        // PROMOTIONS
        // ──────────────────────────────────────────
        Promotion::create(['restaurant_id' => $restaurant->id, 'code' => 'PROMO10',   'type' => 'percent',      'value' => 10, 'min_order' => 5000, 'usage_limit' => 500, 'usage_count' => 47, 'is_active' => true]);
        Promotion::create(['restaurant_id' => $restaurant->id, 'code' => 'WELCOME5',  'type' => 'fixed',        'value' => 500,'min_order' => 0,    'usage_limit' => 300, 'usage_count' => 23, 'is_active' => true]);
        Promotion::create(['restaurant_id' => $restaurant->id, 'code' => 'LIVRAISON', 'type' => 'free_delivery','value' => 0,  'min_order' => 0,    'usage_limit' => null,'usage_count' => 31, 'is_active' => true]);

        // ──────────────────────────────────────────
        // ZONES DE LIVRAISON
        // ──────────────────────────────────────────
        $zone1 = DeliveryZone::create(['restaurant_id' => $restaurant->id, 'name' => 'Cocody',         'fee' => 500,  'delay' => '20-30 min', 'is_active' => true]);
        $zone2 = DeliveryZone::create(['restaurant_id' => $restaurant->id, 'name' => 'Plateau',        'fee' => 1000, 'delay' => '30-45 min', 'is_active' => true]);
        $zone3 = DeliveryZone::create(['restaurant_id' => $restaurant->id, 'name' => 'Marcory',        'fee' => 1500, 'delay' => '40-55 min', 'is_active' => true]);
        $zone4 = DeliveryZone::create(['restaurant_id' => $restaurant->id, 'name' => 'Yopougon',       'fee' => 2000, 'delay' => '50-70 min', 'is_active' => true]);
        DeliveryZone::create(['restaurant_id' => $restaurant->id, 'name' => 'Abobo / Anyama', 'fee' => 2500, 'delay' => '60-80 min', 'is_active' => true]);

        // ──────────────────────────────────────────
        // LIVREURS
        // ──────────────────────────────────────────
        Driver::create(['restaurant_id' => $restaurant->id, 'name' => 'Kouassi Yao', 'phone' => '+22507111111', 'vehicle' => 'Moto', 'status' => 'disponible',   'is_active' => true]);
        Driver::create(['restaurant_id' => $restaurant->id, 'name' => 'Awa Touré',   'phone' => '+22507222222', 'vehicle' => 'Vélo', 'status' => 'disponible',   'is_active' => true]);
        Driver::create(['restaurant_id' => $restaurant->id, 'name' => 'Seydou Koné', 'phone' => '+22507333333', 'vehicle' => 'Moto', 'status' => 'indisponible', 'is_active' => true]);

        // ──────────────────────────────────────────
        // CATÉGORIES & PRODUITS
        // ──────────────────────────────────────────
        $cats = ['Entrées', 'Grillades', 'Plats traditionnels', 'Boissons', 'Desserts'];
        $catModels = [];
        foreach ($cats as $i => $name) {
            $catModels[$name] = Category::create([
                'restaurant_id' => $restaurant->id,
                'name'          => $name,
                'slug'          => Str::slug($name),
                'sort_order'    => $i,
                'is_active'     => true,
            ]);
        }

        $productDefs = [
            ['Poulet Braisé',          'Grillades',          4500, true,  'Notre poulet braisé mariné 24h, cuit à la braise sur commande.'],
            ['Brochettes de bœuf',      'Grillades',          3000, true,  'Brochettes de bœuf tendre assaisonnées aux épices maison.'],
            ['Kedjenou de poulet',      'Plats traditionnels',5000, false, 'Poulet mijoté dans une sauce tomate-poivron légèrement épicée.'],
            ["Salade d'avocat",         'Entrées',            2500, false, "Salade fraîche à l'avocat, crevettes et vinaigrette citronnée."],
            ['Jus de bissap',           'Boissons',           1000, true,  "Jus de fleurs d'hibiscus maison, légèrement sucré."],
            ['Alloco',                  'Entrées',            1500, false, 'Bananes plantains frites, croustillantes et dorées.'],
            ['Poisson entier grillé',   'Grillades',          7500, true,  'Tilapia entier grillé au feu de bois, sauce pimentée.'],
            ['Fufu sauce graine',       'Plats traditionnels',3500, false, "Fufu de manioc accompagné d'une sauce de graine de palme."],
            ['Riz sauce arachide',      'Plats traditionnels',3000, true,  'Riz basmati avec une onctueuse sauce arachide et légumes.'],
            ['Thiéboudienne',           'Plats traditionnels',4000, false, 'Riz au poisson sénégalais, légumes et sauce tomate.'],
            ['Glace maison',            'Desserts',           1500, true,  'Glace artisanale aux saveurs tropicales (mangue, coco, bissap).'],
            ['Eau minérale',            'Boissons',            500, false, "Bouteille d'eau minérale fraîche."],
            ['Jus de gingembre',        'Boissons',           1200, true,  'Jus de gingembre frais, légèrement épicé.'],
        ];

        $products = [];
        foreach ($productDefs as [$name, $cat, $price, $featured, $desc]) {
            $products[] = Product::create([
                'restaurant_id' => $restaurant->id,
                'category_id'   => $catModels[$cat]->id,
                'name'          => $name,
                'slug'          => Str::slug($name),
                'description'   => $desc,
                'price'         => $price,
                'is_available'  => true,
                'is_featured'   => $featured,
            ]);
        }

        // ──────────────────────────────────────────
        // CLIENTS (15 clients réalistes)
        // ──────────────────────────────────────────
        $customerDefs = [
            ['Aminata Koné',      '+22507100001', 'aminata.kone@gmail.com',  'Cocody, Angré',         $zone1],
            ['Jean-Baptiste Dié', '+22507100002', null,                       'Plateau, Avenue 12',    $zone2],
            ['Fatoumata Barry',   '+22507100003', 'fbarry@outlook.com',       'Marcory, Zone 4',       $zone3],
            ['Ibrahim Coulibaly', '+22507100004', null,                       'Yopougon, Selmer',      $zone4],
            ['Marie-Claire Bah',  '+22507100005', 'mc.bah@gmail.com',         'Cocody, Riviera 3',    $zone1],
            ['Oumar Traoré',      '+22507100006', null,                       'Plateau, Centre',       $zone2],
            ['Kadiatou Diallo',   '+22507100007', 'k.diallo@hotmail.com',     'Marcory, Belleville',  $zone3],
            ['Yves Akandji',      '+22507100008', null,                       'Cocody, 2 Plateaux',   $zone1],
            ['Bintou Sanogo',     '+22507100009', 'bintou.s@gmail.com',       'Yopougon, Lokoa',      $zone4],
            ['Rodrigue Gbagbo',   '+22507100010', null,                       'Plateau, Immeuble XL', $zone2],
            ['Alice Kouadio',     '+22507100011', 'alice.kouadio@gmail.com',  'Cocody, Danga',        $zone1],
            ['Moussa Diabaté',    '+22507100012', null,                       'Marcory, Anoumabo',    $zone3],
            ['Sophie Agnero',     '+22507100013', 'sophie.a@gmail.com',       'Plateau, Indénié',     $zone2],
            ['Koffi Assiè',       '+22507100014', null,                       'Cocody, Palmeraie',    $zone1],
            ['Nathalie Yao',      '+22507100015', 'n.yao@yahoo.fr',           'Yopougon, Niangon',    $zone4],
        ];

        $customers = [];
        foreach ($customerDefs as [$name, $phone, $email, $address, $zone]) {
            $customers[] = [
                'model'   => Customer::create([
                    'restaurant_id' => $restaurant->id,
                    'name'          => $name,
                    'phone'         => $phone,
                    'email'         => $email,
                    'address'       => $address,
                    'orders_count'  => 0,
                    'total_spent'   => 0,
                    'last_order_at' => null,
                ]),
                'name'    => $name,
                'phone'   => $phone,
                'email'   => $email,
                'address' => $address,
                'zone'    => $zone,
            ];
        }

        // ──────────────────────────────────────────
        // 60 COMMANDES HISTORIQUES (30 derniers jours)
        // ──────────────────────────────────────────
        $statusPool  = ['livree', 'livree', 'livree', 'livree', 'livree', 'annulee'];
        $payMethods  = ['mobile_money', 'mobile_money', 'mobile_money', 'cash'];
        $reviewTexts = [
            5 => ['Excellent ! Livraison rapide et plat délicieux.', 'Parfait, je recommande vivement !', 'Très bon rapport qualité-prix.'],
            4 => ['Très bien, juste un peu de retard.', 'Bon plat, service agréable.', 'Satisfait de la commande.'],
            3 => ['Correct mais le plat était tiède.', 'Moyen, peut mieux faire.', 'Acceptable, rien d\'exceptionnel.'],
        ];

        for ($day = 30; $day >= 1; $day--) {
            $ordersThisDay = rand(1, 4);
            for ($o = 0; $o < $ordersThisDay; $o++) {
                $customer    = $customers[array_rand($customers)];
                $isDelivery  = rand(0, 3) > 0;
                $zone        = $isDelivery ? $customer['zone'] : null;
                $deliveryFee = $isDelivery ? $zone->fee : 0;

                // Articles (2 à 4 produits aléatoires)
                shuffle($products);
                $picked   = array_slice($products, 0, rand(2, 4));
                $subtotal = 0;
                $itemsData = [];
                foreach ($picked as $prod) {
                    $qty        = rand(1, 3);
                    $line       = $prod->price * $qty;
                    $subtotal  += $line;
                    $itemsData[] = ['product' => $prod, 'qty' => $qty, 'line' => $line];
                }

                $total     = $subtotal + $deliveryFee;
                $status    = $statusPool[array_rand($statusPool)];
                $payMethod = $payMethods[array_rand($payMethods)];
                $payStatus = ($status === 'annulee') ? 'failed' : 'paid';
                $date      = now()->subDays($day)->setTime(rand(11, 22), rand(0, 59));

                $order = Order::create([
                    'number'           => 'CMD-'.strtoupper(Str::random(6)),
                    'restaurant_id'    => $restaurant->id,
                    'customer_id'      => $customer['model']->id,
                    'customer_name'    => $customer['name'],
                    'customer_phone'   => $customer['phone'],
                    'customer_email'   => $customer['email'],
                    'status'           => $status,
                    'mode'             => $isDelivery ? 'livraison' : 'retrait',
                    'delivery_address' => $isDelivery ? $customer['address'] : null,
                    'delivery_zone'    => $isDelivery ? $zone->name : null,
                    'subtotal'         => $subtotal,
                    'delivery_fee'     => $deliveryFee,
                    'discount'         => 0,
                    'total'            => $total,
                    'payment_method'   => $payMethod,
                    'payment_status'   => ($status === 'annulee') ? 'failed' : 'paid',
                    'status_history'   => [
                        ['s' => 'nouvelle',       't' => '11:00', 'at' => $date->toIso8601String()],
                        ['s' => 'confirmee',      't' => '11:05', 'at' => $date->copy()->addMinutes(5)->toIso8601String()],
                        ['s' => 'en_preparation', 't' => '11:10', 'at' => $date->copy()->addMinutes(10)->toIso8601String()],
                        ['s' => $status,          't' => '11:40', 'at' => $date->copy()->addMinutes(40)->toIso8601String()],
                    ],
                    'created_at'  => $date,
                    'updated_at'  => $date->copy()->addMinutes(45),
                ]);

                foreach ($itemsData as $it) {
                    OrderItem::create([
                        'order_id'   => $order->id,
                        'product_id' => $it['product']->id,
                        'name'       => $it['product']->name,
                        'unit_price' => $it['product']->price,
                        'quantity'   => $it['qty'],
                        'line_total' => $it['line'],
                    ]);
                }

                // Paiement FedaPay
                if ($status === 'livree' && $payMethod === 'mobile_money') {
                    Payment::create([
                        'restaurant_id' => $restaurant->id,
                        'order_id'      => $order->id,
                        'provider'      => 'fedapay',
                        'provider_ref'  => 'FDP-'.strtoupper(Str::random(10)),
                        'type'          => 'order',
                        'amount'        => $total,
                        'currency'      => 'XOF',
                        'status'        => 'approved',
                        'paid_at'       => $date,
                        'created_at'    => $date,
                        'updated_at'    => $date,
                    ]);
                }

                // Avis client (70% des livraisons réussies)
                if ($status === 'livree' && rand(0, 9) < 7) {
                    $rating = rand(3, 5);
                    Review::create([
                        'restaurant_id' => $restaurant->id,
                        'order_id'      => $order->id,
                        'customer_name' => $customer['name'],
                        'rating'        => $rating,
                        'comment'       => $reviewTexts[$rating][array_rand($reviewTexts[$rating])],
                        'created_at'    => $date->copy()->addHour(),
                        'updated_at'    => $date->copy()->addHour(),
                    ]);
                }

                // Mise à jour compteurs client
                if ($status === 'livree') {
                    $customer['model']->increment('orders_count');
                    $customer['model']->increment('total_spent', $total);
                    $customer['model']->update(['last_order_at' => $date]);
                }
            }
        }

        // ──────────────────────────────────────────
        // 5 COMMANDES EN COURS (aujourd'hui — dashboard vivant)
        // ──────────────────────────────────────────
        $liveOrders = [
            ['nouvelle',       $customers[0],  'livraison', $zone1],
            ['confirmee',      $customers[2],  'livraison', $zone2],
            ['en_preparation', $customers[4],  'retrait',   null],
            ['en_preparation', $customers[7],  'livraison', $zone3],
            ['prete',          $customers[1],  'livraison', $zone1],
        ];

        foreach ($liveOrders as [$status, $customer, $mode, $zone]) {
            $deliveryFee = ($mode === 'livraison' && $zone) ? $zone->fee : 0;
            shuffle($products);
            $picked    = array_slice($products, 0, rand(2, 3));
            $subtotal  = 0;
            $itemsData = [];
            foreach ($picked as $prod) {
                $qty        = rand(1, 2);
                $line       = $prod->price * $qty;
                $subtotal  += $line;
                $itemsData[] = ['product' => $prod, 'qty' => $qty, 'line' => $line];
            }
            $total = $subtotal + $deliveryFee;

            $order = Order::create([
                'number'           => 'CMD-'.strtoupper(Str::random(6)),
                'restaurant_id'    => $restaurant->id,
                'customer_id'      => $customer['model']->id,
                'customer_name'    => $customer['name'],
                'customer_phone'   => $customer['phone'],
                'customer_email'   => $customer['email'],
                'status'           => $status,
                'mode'             => $mode,
                'delivery_address' => ($mode === 'livraison') ? $customer['address'] : null,
                'delivery_zone'    => ($mode === 'livraison' && $zone) ? $zone->name : null,
                'subtotal'         => $subtotal,
                'delivery_fee'     => $deliveryFee,
                'discount'         => 0,
                'total'            => $total,
                'payment_method'   => 'mobile_money',
                'payment_status'   => 'pending',
            ]);

            foreach ($itemsData as $it) {
                OrderItem::create([
                    'order_id'   => $order->id,
                    'product_id' => $it['product']->id,
                    'name'       => $it['product']->name,
                    'unit_price' => $it['product']->price,
                    'quantity'   => $it['qty'],
                    'line_total' => $it['line'],
                ]);
            }
        }

        $this->command->info('');
        $this->command->info('✅  Données de démo générées !');
        $this->command->info('    → 3 plans | 1 restaurant | 15 clients');
        $this->command->info('    → 60+ commandes sur 30 jours + 5 en cours');
        $this->command->info('    → Zones livraison, livreurs, promos, avis');
        $this->command->info('    Admin : admin@restohub.com / password');
        $this->command->info('    Owner : owner@lesaveurdor.com / password');
    }
}
