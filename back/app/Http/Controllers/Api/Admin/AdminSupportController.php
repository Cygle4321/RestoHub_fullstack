<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Notifications\SupportReplyNotification;
use App\Services\RestaurantNotifier;
use Illuminate\Http\Request;

class AdminSupportController extends Controller
{
    public function index(Request $request)
    {
        $query = SupportTicket::with(['restaurant', 'user'])
            ->withCount('messages')
            ->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->paginate(30));
    }

    public function show(SupportTicket $ticket)
    {
        return response()->json($ticket->load(['restaurant', 'user', 'messages']));
    }

    public function update(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:open,in_progress,resolved,closed'],
            'priority' => ['sometimes', 'in:low,medium,high'],
        ]);
        $ticket->update($data);

        return response()->json($ticket);
    }

    public function reply(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
            'status' => ['sometimes', 'in:open,in_progress,resolved,closed'],
        ]);

        $user = $request->user();
        $message = SupportMessage::create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'sender' => 'agent',
            'author' => $user->name,
            'body' => $data['body'],
        ]);

        if (isset($data['status'])) {
            $ticket->update(['status' => $data['status']]);
        } elseif ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        app(RestaurantNotifier::class)->notify(
            $ticket->restaurant,
            new SupportReplyNotification([
                'id' => $ticket->id,
                'subject' => $ticket->subject,
            ]),
            'tickets'
        );

        return response()->json($message, 201);
    }
}