<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('favorite_dish')->nullable()->after('address');
            $table->unsignedInteger('favorite_dish_count')->default(0)->after('favorite_dish');
            $table->unsignedInteger('loyalty_stamps')->default(0)->after('favorite_dish_count');
            $table->unsignedInteger('loyalty_rewards_count')->default(0)->after('loyalty_stamps');
            $table->text('notes')->nullable()->after('loyalty_rewards_count');
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->json('loyalty_settings')->nullable()->after('payment_settings');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('loyalty_reward_applied')->default(false)->after('promo_code');
            $table->string('loyalty_reward_description')->nullable()->after('loyalty_reward_applied');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['loyalty_reward_applied', 'loyalty_reward_description']);
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn('loyalty_settings');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'favorite_dish',
                'favorite_dish_count',
                'loyalty_stamps',
                'loyalty_rewards_count',
                'notes',
            ]);
        });
    }
};
