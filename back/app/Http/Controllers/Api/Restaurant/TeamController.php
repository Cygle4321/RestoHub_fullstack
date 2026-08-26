<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Mail\TeamInvitationMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TeamController extends Controller
{
    public function index(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $users = User::where('restaurant_id', $restaurantId)
            ->whereIn('role', ['owner', 'staff', 'manager', 'driver', 'cook'])
            ->get();

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        // Seul le propriétaire ou un manager peut inviter
        if (!in_array($request->user()->role, ['owner', 'manager'])) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $data = $request->validate([
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', 'string', 'in:manager,cook,driver,staff'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $data['restaurant_id'] = $restaurantId;
        $data['password'] = Hash::make(Str::random(12)); // Random password pour l'invitation
        $data['is_active'] = true;

        $user = User::create($data);

        $this->sendInvitation($user, $request->user());

        return response()->json($user, 201);
    }

    /**
     * Renvoie le lien de définition du mot de passe (invitation).
     */
    public function resend(Request $request, $id)
    {
        $restaurantId = $request->user()->restaurant_id;

        if (!in_array($request->user()->role, ['owner', 'manager'])) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $user = User::where('restaurant_id', $restaurantId)->findOrFail($id);

        if ($user->role === 'owner') {
            return response()->json(['message' => 'Le propriétaire ne peut pas être réinvité.'], 422);
        }

        $this->sendInvitation($user, $request->user());

        return response()->json([
            'message' => "Email d'invitation renvoyé à {$user->email}.",
            'user' => $user,
        ]);
    }

    protected function sendInvitation(User $user, User $invitor): void
    {
        // Réutilise le broker "mot de passe oublié" : le membre définit son
        // mot de passe via /reset-password?token=...&email=...
        $token = Password::createToken($user);

        $frontend = rtrim((string) (config('app.frontend_url') ?: env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $url = $frontend.'/reset-password?'.http_build_query([
            'token' => $token,
            'email' => $user->email,
        ]);

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(
                new TeamInvitationMail(
                    $user,
                    $user->restaurant?->name ?? 'Notre restaurant',
                    $invitor->name,
                    $url
                )
            );
        } catch (\Throwable $e) {
            Log::warning("Email d'invitation équipe échoué", [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        $restaurantId = $request->user()->restaurant_id;

        if (!in_array($request->user()->role, ['owner', 'manager'])) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $user = User::where('restaurant_id', $restaurantId)->findOrFail($id);

        // Impossible de modifier le rôle du propriétaire principal si on n'est pas lui-même
        if ($user->role === 'owner' && $request->user()->id !== $user->id) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $data = $request->validate([
            'role' => ['sometimes', 'string', 'in:owner,manager,cook,driver,staff'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user->update($data);

        return response()->json($user);
    }

    public function destroy(Request $request, $id)
    {
        $restaurantId = $request->user()->restaurant_id;

        if (!in_array($request->user()->role, ['owner', 'manager'])) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $user = User::where('restaurant_id', $restaurantId)->findOrFail($id);

        if ($user->role === 'owner') {
            return response()->json(['message' => 'Impossible de supprimer le propriétaire.'], 403);
        }
        
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Impossible de se supprimer soi-même.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }
}
