@component('mail::message')
# Bonjour {{ $restaurant->name }},

Votre période d'essai RestoHub touche à sa fin le **{{ $trialEndDate }}**.

Pour continuer à utiliser votre boutique sans interruption (et débloquer les limites de la formule **{{ $planName }}**), choisissez un abonnement dès maintenant.

@component('mail::button', ['url' => $frontendUrl.'/dashboard/billing'])
Choisir mon abonnement
@endcomponent

À bientôt sur RestoHub !
@endcomponent