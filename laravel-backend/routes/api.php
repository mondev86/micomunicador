<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\RecordingController;
use App\Http\Controllers\Api\V1\StateController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true]));

Route::prefix('auth')->group(function () {
    // Rate limiting: 5 intentos por minuto por IP para mitigar fuerza bruta.
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
});

Route::middleware(['auth:sanctum', 'throttle:100,1'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/state', [StateController::class, 'show']);
    Route::put('/state', [StateController::class, 'upsert']);

    Route::get('/recordings', [RecordingController::class, 'index']);
    Route::get('/recordings/expiring', [RecordingController::class, 'expiring']);
    Route::get('/recordings/{profileId}/{favoriteId}', [RecordingController::class, 'show']);
    Route::put('/recordings/{profileId}/{favoriteId}', [RecordingController::class, 'upsert']);
    Route::delete('/recordings/{profileId}/{favoriteId}', [RecordingController::class, 'destroy']);
});
