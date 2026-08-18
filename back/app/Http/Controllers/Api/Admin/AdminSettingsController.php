<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class AdminSettingsController extends Controller
{
    public const DEFAULTS = [
        'general' => [
            'name' => 'RestoHub',
            'url' => 'https://restohub.app',
            'email' => 'support@restohub.app',
            'description' => 'Plateforme SaaS de gestion de restaurants en ligne.',
            'maintenance' => false,
        ],
        'payments' => [
            'mobileMoney' => true,
            'carte' => true,
            'commission' => 5,
        ],
        'notifications' => [
            'nouveauRestaurant' => true,
            'paiement' => true,
            'echecPaiement' => true,
            'tickets' => true,
            'resumeHebdo' => false,
        ],
        'security' => [
            'twofa' => true,
        ],
    ];

    public function index(Request $request)
    {
        $stored = Setting::pluck('value', 'key')->toArray();

        $settings = [];
        foreach (self::DEFAULTS as $key => $default) {
            $saved = $stored[$key] ?? null;
            $settings[$key] = is_array($saved) ? array_replace($default, $saved) : $default;
        }

        $team = User::where('role', 'super_admin')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'avatar'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'avatar' => $u->avatar,
                'role' => 'Super Admin',
                'current' => $u->id === $request->user()->id,
            ]);

        $currentToken = $request->user()->currentAccessToken();
        $sessions = $request->user()->tokens()->get(['id', 'name', 'last_used_at', 'created_at'])
            ->map(fn ($t) => [
                'id' => $t->id,
                'device' => $t->name,
                'last_used_at' => $t->last_used_at,
                'created_at' => $t->created_at,
                'current' => $currentToken && $t->id === $currentToken->id,
            ]);

        return response()->json([
            'settings' => $settings,
            'team' => $team,
            'sessions' => $sessions,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'general' => ['sometimes', 'array'],
            'payments' => ['sometimes', 'array'],
            'notifications' => ['sometimes', 'array'],
            'security' => ['sometimes', 'array'],
        ]);

        foreach ($data as $key => $values) {
            $default = self::DEFAULTS[$key] ?? [];
            Setting::updateOrCreate(['key' => $key], ['value' => array_replace($default, $values)]);
        }

        return response()->json(['ok' => true]);
    }

    public function destroySession(Request $request, PersonalAccessToken $token)
    {
        $current = $request->user()->currentAccessToken();
        if ($token->tokenable_id !== $request->user()->id) {
            abort(403);
        }
        if ($current && $token->id === $current->id) {
            return response()->json(['error' => 'Impossible de révoquer la session courante'], 422);
        }

        $token->delete();

        return response()->json(['ok' => true]);
    }
}