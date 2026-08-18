<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->restaurant) {
            return response()->json(['message' => 'Aucun restaurant associé.'], 403);
        }

        $restaurant = $user->restaurant;

        if ($restaurant->canUseService()) {
            return $next($request);
        }

        // Lecture autorisée (consultation du dashboard, des données, de la facturation)
        // pour que le propriétaire puisse voir où en est sa situation et payer.
        if ($request->isMethod('GET')) {
            return $next($request);
        }

        // Seules les actions de paiement restent possibles pour reprendre le service.
        if (in_array($request->path(), ['api/restaurant/subscribe', 'api/restaurant/subscription/cancel'], true)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Votre période d\'essai est terminée. Choisissez et payez un plan pour continuer à utiliser RestoHub.',
        ], 402);
    }
}