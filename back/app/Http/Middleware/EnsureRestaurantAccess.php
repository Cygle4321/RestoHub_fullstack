<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRestaurantAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        if (! $user->restaurant_id) {
            return response()->json(['message' => 'Aucun restaurant associé.'], 403);
        }

        // Attach restaurant id for controllers
        $request->attributes->set('restaurant_id', $user->restaurant_id);

        return $next($request);
    }
}
