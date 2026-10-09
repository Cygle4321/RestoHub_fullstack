<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Models\GroupOrder;
use App\Models\GroupOrderItem;
use App\Models\Product;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GroupOrderController extends Controller
{
    /**
     * Crée un nouveau salon de commande groupée
     */
    public function create(Request $request, string $slug): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $data = $request->validate([
            'host_name' => ['required', 'string', 'max:60'],
            'title' => ['nullable', 'string', 'max:120'],
            'code' => ['nullable', 'string', 'max:20'],
            'host_phone' => ['nullable', 'string', 'max:30'],
        ]);

        $code = !empty($data['code'])
            ? strtoupper(trim($data['code']))
            : $this->generateUniqueCode($restaurant->id);

        // Si le code existe déjà pour ce restaurant, on le réutilise ou on le retourne
        $existing = GroupOrder::where('restaurant_id', $restaurant->id)
            ->where('code', $code)
            ->first();

        if ($existing) {
            return response()->json($this->formatGroupOrder($existing));
        }

        $groupOrder = GroupOrder::create([
            'code' => $code,
            'restaurant_id' => $restaurant->id,
            'title' => !empty($data['title']) ? trim($data['title']) : 'Pause Déjeuner Bureau',
            'host_name' => trim($data['host_name']),
            'host_phone' => $data['host_phone'] ?? null,
            'status' => 'open',
            'expires_at' => now()->addHours(2),
        ]);

        return response()->json($this->formatGroupOrder($groupOrder), 201);
    }

    /**
     * Récupère l'état complet du salon de commande groupée
     */
    public function show(string $slug, string $code): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $groupOrder = GroupOrder::with(['items.product', 'order'])
            ->where('restaurant_id', $restaurant->id)
            ->where('code', strtoupper($code))
            ->first();

        if (!$groupOrder) {
            // Création automatique à la volée si le code n'existe pas encore (ex: code partagé)
            $groupOrder = GroupOrder::create([
                'code' => strtoupper($code),
                'restaurant_id' => $restaurant->id,
                'title' => 'Pause Déjeuner Bureau',
                'host_name' => 'Organisateur',
                'status' => 'open',
                'expires_at' => now()->addHours(2),
            ]);
        }

        return response()->json($this->formatGroupOrder($groupOrder));
    }

    /**
     * Ajoute un plat au salon pour un participant donné
     */
    public function addItem(Request $request, string $slug, string $code): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $groupOrder = GroupOrder::where('restaurant_id', $restaurant->id)
            ->where('code', strtoupper($code))
            ->firstOrFail();

        if ($groupOrder->status !== 'open') {
            return response()->json([
                'message' => 'Ce salon de commande est actuellement verrouillé.',
            ], 422);
        }

        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'participant_name' => ['required', 'string', 'max:50'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'options' => ['nullable', 'array'],
            'supplements' => ['nullable', 'array'],
        ]);

        $product = Product::where('restaurant_id', $restaurant->id)
            ->where('id', $data['product_id'])
            ->where('is_available', true)
            ->firstOrFail();

        $quantity = $data['quantity'] ?? 1;

        $item = GroupOrderItem::create([
            'group_order_id' => $groupOrder->id,
            'product_id' => $product->id,
            'participant_name' => trim($data['participant_name']),
            'name' => $product->name,
            'quantity' => $quantity,
            'price' => $product->price,
            'options' => $data['options'] ?? [],
            'supplements' => $data['supplements'] ?? [],
        ]);

        $groupOrder->load(['items.product']);

        return response()->json($this->formatGroupOrder($groupOrder));
    }

    /**
     * Supprime un plat du salon
     */
    public function removeItem(string $slug, string $code, int $itemId): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $groupOrder = GroupOrder::where('restaurant_id', $restaurant->id)
            ->where('code', strtoupper($code))
            ->firstOrFail();

        if ($groupOrder->status !== 'open') {
            return response()->json([
                'message' => 'Ce salon de commande est actuellement verrouillé.',
            ], 422);
        }

        $item = GroupOrderItem::where('group_order_id', $groupOrder->id)
            ->where('id', $itemId)
            ->firstOrFail();

        $item->delete();

        $groupOrder->load(['items.product']);

        return response()->json($this->formatGroupOrder($groupOrder));
    }

    /**
     * Verrouille ou déverrouille le salon
     */
    public function toggleLock(Request $request, string $slug, string $code): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $groupOrder = GroupOrder::where('restaurant_id', $restaurant->id)
            ->where('code', strtoupper($code))
            ->firstOrFail();

        $data = $request->validate([
            'is_locked' => ['required', 'boolean'],
        ]);

        $groupOrder->status = $data['is_locked'] ? 'locked' : 'open';
        $groupOrder->save();

        $groupOrder->load(['items.product']);

        return response()->json($this->formatGroupOrder($groupOrder));
    }

    /**
     * Génère un code unique comme GRP-482
     */
    private function generateUniqueCode(int $restaurantId): string
    {
        do {
            $code = 'GRP-' . rand(100, 999);
            $exists = GroupOrder::where('restaurant_id', $restaurantId)
                ->where('code', $code)
                ->exists();
        } while ($exists);

        return $code;
    }

    /**
     * Formate la réponse JSON standardisée
     */
    private function formatGroupOrder(GroupOrder $group): array
    {
        $items = $group->items ?? collect();

        $itemsList = $items->map(function ($it) {
            $supplementsTotal = collect($it->supplements ?? [])->sum('price');
            return [
                'id' => $it->id,
                'productId' => $it->product_id,
                'name' => $it->name,
                'price' => (int) $it->price,
                'totalPrice' => (int) (($it->price + $supplementsTotal) * ($it->quantity ?? 1)),
                'quantity' => (int) ($it->quantity ?? 1),
                'participant' => $it->participant_name,
                'options' => $it->options ?? [],
                'supplements' => $it->supplements ?? [],
            ];
        })->values()->all();

        $participants = $items->pluck('participant_name')->unique()->values()->all();

        $totalsByParticipant = [];
        foreach ($itemsList as $it) {
            $p = $it['participant'];
            $totalsByParticipant[$p] = ($totalsByParticipant[$p] ?? 0) + $it['totalPrice'];
        }

        $grandTotal = array_sum($totalsByParticipant);

        return [
            'id' => $group->id,
            'code' => $group->code,
            'name' => $group->title,
            'host' => $group->host_name,
            'isLocked' => $group->status === 'locked',
            'status' => $group->status,
            'createdAt' => $group->created_at?->timestamp ? $group->created_at->timestamp * 1000 : null,
            'expiresAt' => $group->expires_at?->timestamp ? $group->expires_at->timestamp * 1000 : null,
            'items' => $itemsList,
            'participants' => $participants,
            'totalsByParticipant' => $totalsByParticipant,
            'grandTotal' => $grandTotal,
            'order' => $group->order ? [
                'id' => $group->order->id,
                'number' => $group->order->number,
                'status' => $group->order->status,
                'customer_phone' => $group->order->customer_phone,
            ] : null,
        ];
    }
}
