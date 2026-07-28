# Laravel Backend SaaS

Este directorio contiene el backend Laravel pensado para reemplazar la API Node/Express por una base más sólida para SaaS.

## Qué cubre

- Registro e inicio de sesión con token Bearer
- Estado por usuario en MySQL
- Grabaciones por usuario/perfil/favorito
- Rutas compatibles con el frontend actual

## Rutas

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/state`
- `PUT /api/state`
- `GET /api/recordings`
- `GET /api/recordings/{profileId}/{favoriteId}`
- `PUT /api/recordings/{profileId}/{favoriteId}`
- `DELETE /api/recordings/{profileId}/{favoriteId}`

## Arranque

1. Copia `.env.example` a `.env`.
1. Configura MySQL y `APP_URL`.
1. Ejecuta `composer install`.
1. Ejecuta `php artisan migrate`.
1. Inicia el servidor con `php artisan serve`.

## Integración con el frontend

En el frontend define:

- `VITE_API_BASE_URL=http://localhost:8000`

Y deja la app apuntando a esa URL para login y sincronización.
