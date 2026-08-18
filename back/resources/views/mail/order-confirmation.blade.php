@component('mail::message')
# Merci {{ $order->customer_name }} !

Votre commande **{{ $order->number }}** a bien été enregistrée chez **{{ $order->restaurant->name }}**.

@component('mail::table')
| Produit | Qté | Montant |
| :------ | :-- | ------: |
@foreach ($order->items as $item)
| {{ $item->name }} | {{ $item->quantity }} | {{ number_format($item->line_total, 0, ',', ' ') }} FCFA |
@endforeach
@endcomponent

**Total : {{ number_format($order->total, 0, ',', ' ') }} FCFA**

- Mode : {{ $order->mode === 'livraison' ? 'Livraison' : 'Retrait sur place' }}
- Paiement : {{ $order->payment_status === 'paid' ? 'Payé en ligne' : 'À régler' }}

@if ($order->mode === 'livraison' && $order->delivery_address)
Adresse : {{ $order->delivery_address }}
@endif

Vous pouvez suivre votre commande à tout moment :

@component('mail::button', ['url' => $storeUrl.'/track'])
Suivre ma commande
@endcomponent

Merci de votre confiance,<br>
**{{ $order->restaurant->name }}**
@endcomponent