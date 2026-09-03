<?php

// Configuración CORS restringida a los orígenes del frontend.
// Se publica como archivo porque este proyecto (Laravel 11 minimalista) no lo incluye por defecto.

$origins = array_values(array_filter(array_map(
    fn ($value) => trim((string) $value),
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
)));

if (empty($origins)) {
    $origins = ['http://localhost:4174', 'http://localhost:5173'];
}

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
