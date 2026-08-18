<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class AdminPaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['restaurant', 'order', 'subscription'])->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        return response()->json($query->paginate(30));
    }

    public function refund(string $id)
    {
        $payment = Payment::with(['restaurant', 'order', 'subscription'])->findOrFail($id);

        if ($payment->status === 'refunded') {
            return response()->json(['message' => 'Transaction déjà remboursée.'], 422);
        }

        $payment->update([
            'status' => 'refunded',
            'payload' => array_merge((array) ($payment->payload ?? []), ['refunded_at' => now()->toIso8601String()]),
        ]);

        $payment->order?->update(['payment_status' => 'refunded']);

        if ($payment->subscription_id && $payment->subscription) {
            $payment->subscription->update(['status' => 'cancelled']);
            $payment->subscription->restaurant?->update(['plan_id' => null, 'subscription_ends_at' => null]);
        }

        return response()->json([
            'message' => 'Transaction remboursée.',
            'payment' => $payment->fresh(['restaurant', 'order', 'subscription']),
        ]);
    }
}
