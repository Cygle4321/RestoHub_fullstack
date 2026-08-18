<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ImageStorage
{
    /**
     * Stocke une image reçue en data URI (base64) et renvoie son URL publique.
     * Si la valeur est déjà une URL / un chemin (image déjà stockée), elle est
     * retournée telle quelle. Retourne null si la valeur est vide.
     */
    public function store(?string $value, string $dir): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        // Déjà une URL (fichier déjà stocké) : rien à faire.
        if (! str_starts_with($value, 'data:image/')) {
            return $value;
        }

        $ext = $this->extensionFromMime($value);
        $raw = substr($value, (int) strpos($value, ',') + 1);
        $decoded = base64_decode($raw, true);

        if ($decoded === false || $ext === null) {
            return $value;
        }

        $name = $dir.'/'.date('Ymd_His').'_'.bin2hex(random_bytes(4)).'.'.$ext;

        try {
            Storage::disk('public')->put($name, $decoded);

            return Storage::disk('public')->url($name);
        } catch (\Throwable $e) {
            Log::warning('Stockage image échoué', ['dir' => $dir, 'error' => $e->getMessage()]);

            return $value;
        }
    }

    private function extensionFromMime(string $dataUri): ?string
    {
        if (! preg_match('#^data:image/(png|jpe?g|webp);#i', $dataUri, $m)) {
            return null;
        }

        return match (strtolower($m[1])) {
            'png' => 'png',
            'webp' => 'webp',
            default => 'jpg',
        };
    }
}