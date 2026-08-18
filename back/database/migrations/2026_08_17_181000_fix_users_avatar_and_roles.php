<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('avatar')->nullable();
        });

        // La contrainte d'origine ne couvre que super_admin/owner/staff/customer.
        // Les invitations d'équipe (manager/cook/driver) doivent être autorisées.
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'owner', 'staff', 'customer', 'manager', 'cook', 'driver'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'owner', 'staff', 'customer'))");

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar');
        });
    }
};