<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Exports CSV (comptabilité / analyse externe).
 */
class ExportController extends Controller
{
    public function orders(Request $request): StreamedResponse
    {
        $restaurantId = $request->user()->restaurant_id;

        $query = Order::with('items')
            ->where('restaurant_id', $restaurantId)
            ->latest();

        // Mêmes filtres que la liste des commandes
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($mode = $request->query('mode')) {
            $query->where('mode', $mode);
        }
        if ($q = $request->query('q')) {
            $query->where(function ($w) use ($q) {
                $w->where('number', 'like', "%{$q}%")
                    ->orWhere('customer_name', 'like', "%{$q}%")
                    ->orWhere('customer_phone', 'like', "%{$q}%");
            });
        }
        if ($date = $request->query('date')) {
            $query->whereDate('created_at', $date);
        }

        $filename = 'commandes-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');

            // BOM UTF-8 pour Excel
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                'Numero', 'Date', 'Client', 'Telephone', 'Mode',
                'Statut', 'Paiement', 'Sous-total', 'Livraison',
                'Reduction', 'Total', 'Articles',
            ], ';');

            $query->chunk(500, function ($orders) use ($out) {
                foreach ($orders as $o) {
                    $articles = $o->items
                        ->map(fn ($i) => "{$i->quantity}x {$i->name}")
                        ->implode(' | ');

                    fputcsv($out, [
                        $o->number,
                        $o->created_at?->format('d/m/Y H:i'),
                        $o->customer_name,
                        $o->customer_phone,
                        $o->mode,
                        $o->status,
                        $o->payment_status,
                        $o->subtotal,
                        $o->delivery_fee,
                        $o->discount,
                        $o->total,
                        $articles,
                    ], ';');
                }
            });

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function customers(Request $request): StreamedResponse
    {
        $restaurantId = $request->user()->restaurant_id;

        $query = Customer::where('restaurant_id', $restaurantId)
            ->orderByDesc('total_spent');

        if ($q = $request->query('q')) {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            });
        }

        $filename = 'clients-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                'Nom', 'Telephone', 'Email', 'Commandes',
                'Total depense', 'Derniere commande', 'Inscrit le',
            ], ';');

            $query->chunk(500, function ($customers) use ($out) {
                foreach ($customers as $c) {
                    fputcsv($out, [
                        $c->name,
                        $c->phone,
                        $c->email,
                        $c->orders_count,
                        $c->total_spent,
                        $c->last_order_at?->format('d/m/Y H:i'),
                        $c->created_at?->format('d/m/Y'),
                    ], ';');
                }
            });

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
