<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Services\AdminNotifier;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function index(Request $request)
    {
        $tickets = SupportTicket::where('restaurant_id', $request->user()->restaurant_id)
            ->with('messages')
            ->latest()
            ->get();

        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:160'],
            'body' => ['required', 'string', 'max:2000'],
            'priority' => ['sometimes', 'in:low,medium,high'],
        ]);

        $user = $request->user();
        $ticket = SupportTicket::create([
            'restaurant_id' => $user->restaurant_id,
            'user_id' => $user->id,
            'subject' => $data['subject'],
            'body' => $data['body'],
            'priority' => $data['priority'] ?? 'medium',
            'status' => 'open',
        ]);

        SupportMessage::create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'sender' => 'client',
            'author' => $user->name,
            'body' => $data['body'],
        ]);

        app(AdminNotifier::class)->notify([
            'kind' => 'support_ticket',
            'ticket_id' => $ticket->id,
            'subject' => $ticket->subject,
            'restaurant_name' => $ticket->restaurant->name,
        ]);

        return response()->json($ticket->load('messages'), 201);
    }

    public function show(Request $request, SupportTicket $ticket)
    {
        abort_unless($ticket->restaurant_id === $request->user()->restaurant_id, 403);

        return response()->json($ticket->load('messages'));
    }

    public function reply(Request $request, SupportTicket $ticket)
    {
        abort_unless($ticket->restaurant_id === $request->user()->restaurant_id, 403);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();
        $message = SupportMessage::create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'sender' => 'client',
            'author' => $user->name,
            'body' => $data['body'],
        ]);

        // Réouverture si le ticket avait été résolu / clos
        if (in_array($ticket->status, ['resolved', 'closed'], true)) {
            $ticket->update(['status' => 'open']);
        }

        return response()->json($message, 201);
    }
}