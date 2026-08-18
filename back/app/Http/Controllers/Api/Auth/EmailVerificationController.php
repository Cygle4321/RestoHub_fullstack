<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmailVerificationController extends Controller
{
    /**
     * Valide la signature signée, marque l'email comme vérifié et
     * redirige vers la page de confirmation du frontend.
     * La route est protégée par le middleware "signed" (expiration + signature).
     */
    public function __invoke(Request $request, string $id, string $hash)
    {
        $user = User::findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        Log::info('Email vérifié', ['user_id' => $user->id, 'email' => $user->email]);

        $frontend = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');

        return redirect()->away($frontend.'/email-verified');
    }
}