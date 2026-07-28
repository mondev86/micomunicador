<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\RecordingController;
use App\Http\Controllers\Api\V1\StateController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true]));

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/state', [StateController::class, 'show']);
    Route::put('/state', [StateController::class, 'upsert']);

    Route::get('/recordings', [RecordingController::class, 'index']);
    Route::get('/recordings/{profileId}/{favoriteId}', [RecordingController::class, 'show']);
    Route::put('/recordings/{profileId}/{favoriteId}', [RecordingController::class, 'upsert']);
    Route::delete('/recordings/{profileId}/{favoriteId}', [RecordingController::class, 'destroy']);
});
