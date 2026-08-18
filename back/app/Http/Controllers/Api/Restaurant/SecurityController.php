<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class SecurityController extends Controller
{
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->save();

        return response()->json(['message' => 'Mot de passe mis à jour avec succès.']);
    }

    public function status(Request $request)
    {
        return response()->json(['enabled' => (bool) $request->user()->two_factor_enabled]);
    }

    public function toggleTwoFactor(Request $request, TwoFactorService $totp)
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'code' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        if (!$data['enabled']) {
            $user->forceFill([
                'two_factor_enabled' => false,
                'two_factor_secret' => null,
                'two_factor_confirmed_at' => null,
            ])->save();

            return response()->json([
                'enabled' => false,
                'message' => 'Authentification à deux facteurs désactivée.',
            ]);
        }

        if (!$user->two_factor_secret) {
            $user->forceFill(['two_factor_secret' => $totp->generateSecret()])->save();
        }

        $secret = $user->two_factor_secret;

        if (!empty($data['code'])) {
            if (!$totp->verify($secret, $data['code'])) {
                throw ValidationException::withMessages([
                    'code' => ['Code de vérification invalide.'],
                ]);
            }

            $user->forceFill([
                'two_factor_enabled' => true,
                'two_factor_confirmed_at' => now(),
            ])->save();

            return response()->json([
                'enabled' => true,
                'message' => 'Authentification à deux facteurs activée.',
            ]);
        }

        return response()->json([
            'enabled' => false,
            'pending' => true,
            'secret' => $secret,
            'qr_uri' => $totp->provisioningUri($secret, $user->email),
            'message' => 'Scannez le code QR avec Google Authenticator, puis saisissez le code affiché.',
        ]);
    }

    public function sessions(Request $request)
    {
        $currentToken = $request->user()->currentAccessToken();

        $sessions = $request->user()->tokens()->get(['id', 'name', 'last_used_at', 'created_at'])
            ->map(fn ($t) => [
                'id' => $t->id,
                'device' => $t->name,
                'last_used_at' => $t->last_used_at,
                'created_at' => $t->created_at,
                'current' => $currentToken && $t->id === $currentToken->id,
            ]);

        return response()->json(['sessions' => $sessions]);
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
