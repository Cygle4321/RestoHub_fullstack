<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->limit(25)
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'kind' => $n->data['kind'] ?? 'info',
                    'data' => $n->data,
                    'read_at' => $n->read_at,
                    'is_read' => ! is_null($n->read_at),
                    'created_at' => $n->created_at,
                ];
            });

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllRead(Request $request)
    {
        $count = $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notifications marquées comme lues.',
            'updated' => $count,
        ]);
    }

    public function markRead(Request $request, string $id)
    {
        $request->user()->notifications()
            ->where('id', $id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Notification lue.']);
    }
}