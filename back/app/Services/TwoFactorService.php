<?php

namespace App\Services;

use RuntimeException;

/**
 * TOTP (RFC 6238) minimal — HMAC-SHA1, 6 chiffres, fenêtre 30s.
 * Compatible Google Authenticator / Authy / FreeOTP.
 */
class TwoFactorService
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public function generateSecret(int $length = 32): string
    {
        $bytes = random_bytes(intdiv($length * 5, 8));

        return $this->base32Encode($bytes);
    }

    public function codeAt(string $secret, ?int $at = null): string
    {
        $at ??= time();
        $counter = intdiv($at, 30);
        $binary = pack('NN', 0, $counter);
        $key = $this->base32Decode($secret);
        $hash = hash_hmac('sha1', $binary, $key, true);
        $offset = ord($hash[strlen($hash) - 1]) & 0x0f;
        $value = ((ord($hash[$offset]) & 0x7f) << 24)
            | ((ord($hash[$offset + 1]) & 0xff) << 16)
            | ((ord($hash[$offset + 2]) & 0xff) << 8)
            | (ord($hash[$offset + 3]) & 0xff);

        return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
    }

    public function verify(string $secret, string $code, int $window = 1): bool
    {
        $code = trim($code);
        if (! preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        for ($i = -$window; $i <= $window; $i++) {
            if (hash_equals($this->codeAt($secret, time() + $i * 30), $code)) {
                return true;
            }
        }

        return false;
    }

    public function provisioningUri(string $secret, string $account, string $issuer = 'RestoHub'): string
    {
        return 'otpauth://totp/'.rawurlencode($issuer).':'.rawurlencode($account)
            .'?secret='.rawurlencode($secret)
            .'&issuer='.rawurlencode($issuer)
            .'&algorithm=SHA1&digits=6&period=30';
    }

    private function base32Encode(string $data): string
    {
        $bits = '';
        $len = strlen($data);
        for ($i = 0; $i < $len; $i++) {
            $bits .= str_pad(decbin(ord($data[$i])), 8, '0', STR_PAD_LEFT);
        }

        $out = '';
        $chars = strlen($bits);
        for ($i = 0; $i + 5 <= $chars; $i += 5) {
            $out .= self::ALPHABET[bindec(substr($bits, $i, 5))];
        }
        if ($chars % 5 !== 0) {
            $out .= self::ALPHABET[bindec(str_pad(substr($bits, -($chars % 5)), 5, '0'))];
        }

        return str_pad($out, (int) ceil(strlen($out) / 8) * 8, '=');
    }

    private function base32Decode(string $b32): string
    {
        $b32 = strtoupper(rtrim($b32, '='));
        $bits = '';
        $len = strlen($b32);
        for ($i = 0; $i < $len; $i++) {
            $pos = strpos(self::ALPHABET, $b32[$i]);
            if ($pos === false) {
                throw new RuntimeException('Secret base32 invalide.');
            }
            $bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }

        $out = '';
        $chars = strlen($bits);
        for ($i = 0; $i + 8 <= $chars; $i += 8) {
            $out .= chr(bindec(substr($bits, $i, 8)));
        }

        return $out;
    }
}