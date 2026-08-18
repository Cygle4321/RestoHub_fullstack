<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidImageDataUri implements ValidationRule
{
    public function __construct(private readonly int $maxBytes = 4 * 1024 * 1024) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            return;
        }

        // Déjà une URL (image déjà stockée sur disque) : rien à valider.
        if (! str_starts_with($value, 'data:image/')) {
            return;
        }

        if (! preg_match('#^data:image/(png|jpe?g|webp);base64,#i', $value)) {
            $fail('Le fichier doit être une image PNG, JPEG ou WebP.');

            return;
        }

        $raw = substr($value, (int) strpos($value, ',') + 1);
        $decoded = base64_decode($raw, true);

        if ($decoded === false) {
            $fail('L\'image est invalide.');

            return;
        }

        if (strlen($decoded) > $this->maxBytes) {
            $fail('L\'image est trop volumineuse (maximum 4 Mo).');

            return;
        }

        $info = @getimagesizefromstring($decoded);

        if ($info === false) {
            $fail('L\'image est invalide.');

            return;
        }

        if (! in_array($info['mime'], ['image/png', 'image/jpeg', 'image/webp'], true)) {
            $fail('Le type de fichier doit être PNG, JPEG ou WebP.');
        }
    }
}