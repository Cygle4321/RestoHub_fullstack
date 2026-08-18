<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Restaurant;
use App\Models\Subscription;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use App\Rules\ValidImageDataUri;
use App\Services\AdminNotifier;
use App\Services\ImageStorage;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'restaurant_name' => ['required', 'string', 'max:160'],
        ]);

        $user = DB::transaction(function () use ($data) {
            $slug = Str::slug($data['restaurant_name']);
            $base = $slug;
            $i = 1;
            while (Restaurant::where('slug', $slug)->exists()) {
                $slug = $base.'-'.$i++;
            }

            $plan = Plan::where('slug', 'starter')->first()
                ?? Plan::orderBy('sort_order')->first();

            $restaurant = Restaurant::create([
                'name' => $data['restaurant_name'],
                'slug' => $slug,
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'status' => 'pending',
                'plan_id' => $plan?->id,
                'trial_ends_at' => now()->addDays(14),
                'is_open' => false,
            ]);

            if ($plan) {
                Subscription::create([
                    'restaurant_id' => $restaurant->id,
                    'plan_id' => $plan->id,
                    'status' => 'trialing',
                    'billing_cycle' => 'monthly',
                    'amount' => $plan->price_monthly,
                    'starts_at' => now(),
                    'ends_at' => now()->addDays(14),
                ]);
            }

            return User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
                'role' => 'owner',
                'restaurant_id' => $restaurant->id,
                'is_active' => true,
            ]);
        });

        $token = $user->createToken('auth')->plainTextToken;

        try {
            $user->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            Log::warning('Email de vérification non envoyé', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        app(AdminNotifier::class)->notify([
            'kind' => 'restaurant',
            'restaurant_id' => $user->restaurant_id,
            'restaurant_name' => $data['restaurant_name'],
            'owner' => $user->name,
        ]);

        return response()->json([
            'user' => $user->load('restaurant'),
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'Identifiants incorrects.'], 422);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();

            return response()->json(['message' => 'Compte désactivé.'], 403);
        }

        if ($user->two_factor_enabled) {
            return response()->json([
                'two_factor_required' => true,
                'email' => $user->email,
            ]);
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'user' => $user->load('restaurant.plan'),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function verifyTwoFactor(Request $request, TwoFactorService $totp)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string'],
        ]);

        /** @var User|null $user */
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! $user->two_factor_enabled) {
            return response()->json(['message' => 'Vérification impossible.'], 422);
        }

        if (! $totp->verify($user->two_factor_secret, $data['code'])) {
            return response()->json(['message' => 'Code de vérification invalide.'], 422);
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'user' => $user->load('restaurant.plan'),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('restaurant.plan'),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['sometimes', 'email', 'max:190', Rule::unique('users', 'email')->ignore($request->user()->id)],
            'avatar' => ['sometimes', 'nullable', 'string', new ValidImageDataUri],
        ]);

        if (array_key_exists('avatar', $data)) {
            $data['avatar'] = app(ImageStorage::class)->store($data['avatar'], 'avatars');
        }

        $request->user()->update($data);

        return response()->json([
            'user' => $request->user()->fresh('restaurant.plan'),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.',
            ]);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        $user->notify(new ResetPasswordNotification($token));

        return response()->json([
            'message' => 'Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $data['email'])->first();

        if (! $record || ! Hash::check($data['token'], $record->token)) {
            return response()->json(['message' => 'Jeton de réinitialisation invalide ou expiré.'], 422);
        }

        if (now()->diffInMinutes($record->created_at) > 60) {
            return response()->json(['message' => 'Jeton expiré. Refaites une demande.'], 422);
        }

        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            return response()->json(['message' => 'Compte introuvable.'], 404);
        }

        $user->update(['password' => Hash::make($data['password'])]);

        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

        $user->tokens()->delete();

        return response()->json(['message' => 'Mot de passe réinitialisé. Connectez-vous.']);
    }

    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Votre email est déjà vérifié.']);
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            Log::warning('Résend email de vérification échoué', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Impossible d\'envoyer l\'email. Réessayez dans quelques minutes.'], 500);
        }

        return response()->json(['message' => 'Email de vérification envoyé. Vérifiez votre boîte de réception.']);
    }
}
