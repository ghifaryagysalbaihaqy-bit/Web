<?php

use App\Http\Controllers\Api\InboundIntegrationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    // Inbound Webhooks & External App Integrations (WhatsApp, Telegram, Zapier, cURL)
    Route::match(['GET', 'POST'], '/inbound/{token}', [InboundIntegrationController::class, 'handle'])
        ->name('api.inbound.handle')
        ->middleware('throttle:60,1');

    Route::match(['GET', 'POST'], '/inbound', [InboundIntegrationController::class, 'handle'])
        ->name('api.inbound.handle-header')
        ->middleware('throttle:60,1');

    // WhatsApp dedicated alias
    Route::match(['GET', 'POST'], '/integrations/whatsapp/{token}', [InboundIntegrationController::class, 'handle'])
        ->name('api.whatsapp.webhook')
        ->middleware('throttle:60,1');
});
