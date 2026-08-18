@component('mail::message')
# Bonjour {{ $restaurant->name }} !

Voici votre récap quotidien RestoHub :

@if ($pendingOrders > 0)
- Vous avez **{{ $pendingOrders }} commande(s) en attente** de traitement.
@else
- Aucune commande en attente pour le moment.
@endif
- Pensez à ouvrir votre boutique pour continuer à recevoir vos commandes.

@component('mail::button', ['url' => $frontendUrl.'/dashboard'])
Ouvrir mon tableau de bord
@endcomponent

À demain !
@endcomponent