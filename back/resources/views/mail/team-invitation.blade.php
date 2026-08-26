@component('mail::message')
# Bonjour {{ $member->name }} !

**{{ $invitedBy }}** vous invite à rejoindre l'équipe du restaurant **{{ $restaurantName }}**
sur RestoHub en tant que **{{ $roleLabel }}**.

Choisissez votre mot de passe pour activer votre compte. Ce lien expire sous 60 minutes.

@component('mail::button', ['url' => $setPasswordUrl])
Choisir mon mot de passe
@endcomponent

Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
<small>{{ $setPasswordUrl }}</small>

<br><br>

Si vous n'attendiez pas cette invitation, ignorez simplement cet email.

Merci,<br>
**{{ $restaurantName }}** via RestoHub
@endcomponent
