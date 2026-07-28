<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => 'Mi Comunicador SaaS',
    'status' => 'ok',
]));
