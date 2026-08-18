<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\Subscription;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    protected function monthExpr(): string
    {
        return DB::connection()->getDriverName() === 'pgsql'
            ? "to_char(created_at, 'YYYY-MM')"
            : "DATE_FORMAT(created_at, '%Y-%m')";
    }

    public function index()
    {
        $restaurantsTotal = Restaurant::count();
        $restaurantsActive = Restaurant::where('status', 'active')->count();
        $ordersMonth = Order::where('created_at', '>=', now()->startOfMonth())->count();
        $mrr = Subscription::where('status', 'active')->sum('amount');

        $series = Restaurant::select(
            DB::raw($this->monthExpr().' as month'),
            DB::raw('COUNT(*) as restaurants')
        )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $revenueSeries = Payment::where('status', 'approved')
            ->where('type', 'subscription')
            ->where('created_at', '>=', now()->subMonths(6))
            ->select(
                DB::raw($this->monthExpr().' as month'),
                DB::raw('SUM(amount) as revenus')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $ordersSeries = Order::where('created_at', '>=', now()->subMonths(6))
            ->select(
                DB::raw($this->monthExpr().' as month'),
                DB::raw('COUNT(*) as commandes')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $plans = Subscription::whereIn('status', ['active', 'trialing'])
            ->join('plans', 'plans.id', '=', 'subscriptions.plan_id')
            ->select('plans.name', DB::raw('COUNT(*) as count'))
            ->groupBy('plans.name')
            ->get();

        $latestRestaurants = Restaurant::with('plan')->latest()->limit(5)->get();

        $activity = collect()
            ->merge(
                Restaurant::latest()->limit(5)->get()->map(fn ($r) => [
                    'type' => 'signup',
                    'text' => 'Nouveau restaurant « '.$r->name.' » inscrit',
                    'at' => $r->created_at,
                    'tone' => 'primary',
                ])
            )
            ->merge(
                Payment::with('subscription.plan', 'order')
                    ->where('status', 'approved')
                    ->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn ($p) => [
                        'type' => 'payment',
                        'text' => 'Paiement reçu — '.$this->paymentLabel($p),
                        'at' => $p->paid_at ?? $p->created_at,
                        'tone' => 'success',
                    ])
            )
            ->merge(
                SupportTicket::latest()->limit(5)->get()->map(fn ($t) => [
                    'type' => 'support',
                    'text' => 'Ticket #'.$t->id.' — '.$t->subject,
                    'at' => $t->created_at,
                    'tone' => 'info',
                ])
            )
            ->merge(
                Order::latest()->limit(5)->get()->map(fn ($o) => [
                    'type' => 'order',
                    'text' => 'Commande '.$o->number.' — '.$o->customer_name,
                    'at' => $o->created_at,
                    'tone' => 'primary',
                ])
            )
            ->sortByDesc('at')
            ->values()
            ->take(8)
            ->map(fn ($a) => [
                'type' => $a['type'],
                'text' => $a['text'],
                'at' => optional($a['at'])->toIso8601String(),
                'tone' => $a['tone'],
            ]);

        $alerts = [
            'past_due' => Subscription::where('status', 'past_due')->count(),
            'tickets_open' => SupportTicket::whereIn('status', ['open', 'in_progress'])->count(),
            'suspended' => Restaurant::where('status', 'suspended')->count(),
        ];

        return response()->json([
            'kpis' => [
                'restaurants' => $restaurantsTotal,
                'active' => $restaurantsActive,
                'orders_month' => $ordersMonth,
                'mrr' => $mrr,
                'users' => User::count(),
                'subscriptions_active' => Subscription::where('status', 'active')->count(),
            ],
            'alerts' => $alerts,
            'plan_breakdown' => $plans,
            'series' => $series,
            'revenue_series' => $revenueSeries,
            'orders_series' => $ordersSeries,
            'latest_restaurants' => $latestRestaurants,
            'activity' => $activity,
        ]);
    }

    protected function paymentLabel(Payment $p): string
    {
        $amount = number_format($p->amount, 0, ',', ' ').' FCFA';

        if ($p->order_id) {
            return ($p->order?->number ?? 'Commande').' · '.$amount;
        }

        if ($p->subscription_id) {
            $plan = $p->subscription?->plan;
            return (($plan?->name ?? 'Abonnement').' · '.$amount);
        }

        return $amount;
    }
}