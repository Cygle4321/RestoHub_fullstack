<?php

use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminPaymentController;
use App\Http\Controllers\Api\Admin\AdminRestaurantController;
use App\Http\Controllers\Api\Admin\AdminSettingsController;
use App\Http\Controllers\Api\Admin\AdminSubscriptionController;
use App\Http\Controllers\Api\Admin\AdminSupportController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Restaurant\BillingController;
use App\Http\Controllers\Api\Restaurant\CategoryController;
use App\Http\Controllers\Api\Restaurant\CustomerController;
use App\Http\Controllers\Api\Restaurant\DashboardController;
use App\Http\Controllers\Api\Restaurant\DeliveryController;
use App\Http\Controllers\Api\Restaurant\ExportController;
use App\Http\Controllers\Api\Restaurant\NotificationController;
use App\Http\Controllers\Api\Restaurant\OrderController;
use App\Http\Controllers\Api\Restaurant\ProductController;
use App\Http\Controllers\Api\Restaurant\PromotionController;
use App\Http\Controllers\Api\Restaurant\SearchController;
use App\Http\Controllers\Api\Restaurant\SettingsController;
use App\Http\Controllers\Api\Restaurant\SupportController;
use App\Http\Controllers\Api\Restaurant\TeamController;
use App\Http\Controllers\Api\Restaurant\SecurityController;
use App\Http\Controllers\Api\Store\StoreController;
use App\Http\Controllers\Api\Webhook\FedaPayWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — RestoHub
|--------------------------------------------------------------------------
| Prefix: /api
*/

// ---------- Auth ----------
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:register');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('two-factor', [AuthController::class, 'verifyTwoFactor'])->middleware('throttle:login');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:login');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('email/resend', [AuthController::class, 'resendVerification'])->middleware('throttle:6,1');
    });
});

// ---------- Notifications (any authenticated user) ----------
Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::post('read', [NotificationController::class, 'markAllRead']);
    Route::post('{id}/read', [NotificationController::class, 'markRead']);
});

// ---------- FedaPay webhook + callback (public) ----------
// POST = webhook serveur-à-serveur · GET = retour navigateur après paiement
Route::match(['get', 'post'], 'webhooks/fedapay', FedaPayWebhookController::class);

// ---------- Public storefront ----------
Route::prefix('store/{slug}')->group(function () {
    Route::get('/', [StoreController::class, 'show']);
    Route::get('products/{productSlug}', [StoreController::class, 'product']);
    Route::post('checkout', [StoreController::class, 'checkout']);
    Route::post('promo/verify', [StoreController::class, 'verifyPromo']);
    Route::get('track', [StoreController::class, 'track']);
    Route::post('reviews', [StoreController::class, 'storeReview']);
    Route::get('payment/{transactionId}', [StoreController::class, 'payment']);
});

// ---------- Restaurant dashboard (owner / staff) ----------
Route::middleware(['auth:sanctum', 'role:owner,staff', 'restaurant', 'subscription'])
    ->prefix('restaurant')
    ->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index']);

        // Recherche globale (header dashboard)
        Route::get('search', SearchController::class);

        // Orders
        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::get('orders-export', [ExportController::class, 'orders']);

        // Products
        Route::apiResource('products', ProductController::class);

        // Categories
        Route::get('categories', [CategoryController::class, 'index']);
        Route::post('categories', [CategoryController::class, 'store']);
        Route::put('categories/{category}', [CategoryController::class, 'update']);
        Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

        // Customers
        Route::get('customers', [CustomerController::class, 'index']);
        Route::get('customers/{customer}', [CustomerController::class, 'show']);
        Route::get('customers-export', [ExportController::class, 'customers']);

        // Delivery
        Route::get('delivery/zones', [DeliveryController::class, 'zones']);
        Route::post('delivery/zones', [DeliveryController::class, 'storeZone']);
        Route::put('delivery/zones/{zone}', [DeliveryController::class, 'updateZone']);
        Route::delete('delivery/zones/{zone}', [DeliveryController::class, 'destroyZone']);
        Route::get('delivery/drivers', [DeliveryController::class, 'drivers']);
        Route::post('delivery/drivers', [DeliveryController::class, 'storeDriver']);
        Route::put('delivery/drivers/{driver}', [DeliveryController::class, 'updateDriver']);
        Route::get('delivery/pending', [DeliveryController::class, 'pendingOrders']);
        Route::post('delivery/orders/{order}/assign', [DeliveryController::class, 'assignDriver']);
        Route::post('delivery/orders/{order}/unassign', [DeliveryController::class, 'unassignDriver']);

        // Promotions
        Route::get('promotions', [PromotionController::class, 'index']);
        Route::post('promotions', [PromotionController::class, 'store']);
        Route::put('promotions/{promotion}', [PromotionController::class, 'update']);
        Route::delete('promotions/{promotion}', [PromotionController::class, 'destroy']);

        // Settings & shop
        Route::get('settings', [SettingsController::class, 'show']);
        Route::put('settings', [SettingsController::class, 'update']);
        Route::get('billing', [SettingsController::class, 'billing']);
        
        // Team
        Route::apiResource('team', TeamController::class)->except(['create', 'edit', 'show']);
        Route::post('team/{id}/resend-invitation', [TeamController::class, 'resend']);
        
        // Security
        Route::put('security/password', [SecurityController::class, 'updatePassword']);
        Route::get('security/2fa', [SecurityController::class, 'status']);
        Route::put('security/2fa', [SecurityController::class, 'toggleTwoFactor']);
        Route::get('security/sessions', [SecurityController::class, 'sessions']);
        Route::delete('security/sessions/{token}', [SecurityController::class, 'destroySession']);

        // Subscriptions (SaaS plan payment via FedaPay)
        Route::get('plans', [BillingController::class, 'plans']);
        Route::post('subscribe', [BillingController::class, 'subscribe']);
        Route::post('subscription/cancel', [BillingController::class, 'cancelSubscription']);

        // Support
        Route::get('support', [SupportController::class, 'index']);
        Route::post('support', [SupportController::class, 'store']);
        Route::get('support/{ticket}', [SupportController::class, 'show']);
        Route::post('support/{ticket}/messages', [SupportController::class, 'reply']);
    });

// ---------- Super Admin ----------
Route::middleware(['auth:sanctum', 'role:super_admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('dashboard', [AdminDashboardController::class, 'index']);

        Route::get('restaurants', [AdminRestaurantController::class, 'index']);
        Route::get('restaurants/{restaurant}', [AdminRestaurantController::class, 'show']);
        Route::patch('restaurants/{restaurant}/status', [AdminRestaurantController::class, 'updateStatus']);

        Route::get('subscriptions', [AdminSubscriptionController::class, 'index']);
        Route::get('plans', [AdminSubscriptionController::class, 'plans']);
        Route::post('plans', [AdminSubscriptionController::class, 'storePlan']);
        Route::put('plans/{plan}', [AdminSubscriptionController::class, 'updatePlan']);

        Route::get('payments', [AdminPaymentController::class, 'index']);
        Route::post('payments/{payment}/refund', [AdminPaymentController::class, 'refund']);

        Route::get('users', [AdminUserController::class, 'index']);
        Route::post('users', [AdminUserController::class, 'store']);
        Route::patch('users/{user}/status', [AdminUserController::class, 'updateStatus']);
        Route::delete('users/{user}', [AdminUserController::class, 'destroy']);

        Route::get('orders', [AdminOrderController::class, 'index']);
        Route::get('orders/{order}', [AdminOrderController::class, 'show']);

        Route::get('support', [AdminSupportController::class, 'index']);
        Route::get('support/{ticket}', [AdminSupportController::class, 'show']);
        Route::patch('support/{ticket}', [AdminSupportController::class, 'update']);
        Route::post('support/{ticket}/messages', [AdminSupportController::class, 'reply']);

        Route::get('settings', [AdminSettingsController::class, 'index']);
        Route::put('settings', [AdminSettingsController::class, 'update']);
        Route::delete('sessions/{token}', [AdminSettingsController::class, 'destroySession']);
    });
