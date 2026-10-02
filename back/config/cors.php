<?php

/*
 * CORS — les origines autorisées sont lues depuis le .env.
 * Pour ajouter un domaine de production, ajouter FRONTEND_URL dans .env
 * puis php artisan config:clear.
 */

$frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter(array_unique([
        $frontendUrl,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ])),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
