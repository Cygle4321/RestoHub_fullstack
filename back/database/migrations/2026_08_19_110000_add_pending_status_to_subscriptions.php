<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Le statut "pending" permet d'avoir un abonnement en attente de
        // paiement FedaPay avant de l'activer via le webhook.
        DB::statement('ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_status_check');
        DB::statement("ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['trialing'::character varying, 'active'::character varying, 'past_due'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'pending'::character varying])::text[])))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_status_check');
        DB::statement("ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['trialing'::character varying, 'active'::character varying, 'past_due'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[])))");
    }
};