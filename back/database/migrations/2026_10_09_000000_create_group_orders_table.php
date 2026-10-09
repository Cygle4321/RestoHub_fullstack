<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_orders', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Ex: GRP-101, GRP-482
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('title')->default('Pause Déjeuner Bureau');
            $table->string('host_name')->default('Organisateur');
            $table->string('host_phone')->nullable();
            $table->enum('status', ['open', 'locked', 'completed', 'cancelled'])->default('open');
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'code']);
            $table->index(['restaurant_id', 'status']);
        });

        Schema::create('group_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_order_id')->constrained('group_orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('participant_name'); // Prénom du collègue (ex: Moussa, Aïcha)
            $table->string('name'); // Nom du plat
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->unsignedInteger('price'); // Prix unitaire
            $table->json('options')->nullable();
            $table->json('supplements')->nullable();
            $table->timestamps();

            $table->index(['group_order_id', 'participant_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_order_items');
        Schema::dropIfExists('group_orders');
    }
};
