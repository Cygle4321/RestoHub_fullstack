<?php

/**
 * FedaPay configuration
 *
 * Place your keys in .env — never commit real secrets.
 * Docs: https://docs.fedapay.com
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Environment
    |--------------------------------------------------------------------------
    | sandbox | live
    */
    'environment' => env('FEDAPAY_ENVIRONMENT', 'sandbox'),

    /*
    |--------------------------------------------------------------------------
    | Secret Key (server-side only)
    |--------------------------------------------------------------------------
    | Example sandbox: sk_sandbox_xxxxxxxx
    | Example live:    sk_live_xxxxxxxx
    */
    'secret_key' => env('FEDAPAY_SECRET_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Public Key (optional, for frontend widgets)
    |--------------------------------------------------------------------------
    */
    'public_key' => env('FEDAPAY_PUBLIC_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Webhook secret (to verify callbacks)
    |--------------------------------------------------------------------------
    */
    'webhook_secret' => env('FEDAPAY_WEBHOOK_SECRET', ''),

    /*
    |--------------------------------------------------------------------------
    | API base URL
    |--------------------------------------------------------------------------
    */
    'base_url' => env('FEDAPAY_ENVIRONMENT', 'sandbox') === 'live'
        ? 'https://api.fedapay.com/v1'
        : 'https://sandbox-api.fedapay.com/v1',

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    */
    'currency' => env('FEDAPAY_CURRENCY', 'XOF'),

    /*
    |--------------------------------------------------------------------------
    | Customer phone country (ISO 3166-1 alpha-2, ex: ci, bj, sn)
    |--------------------------------------------------------------------------
    */
    'phone_country' => env('FEDAPAY_PHONE_COUNTRY', 'ci'),

    /*
    |--------------------------------------------------------------------------
    | Callback / return URLs
    |--------------------------------------------------------------------------
    */
    'callback_url' => env('FEDAPAY_CALLBACK_URL', env('APP_URL').'/api/webhooks/fedapay'),
    'return_url' => env('FEDAPAY_RETURN_URL', env('FRONTEND_URL', 'http://localhost:5173').'/store/confirmation'),

];
