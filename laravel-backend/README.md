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
1. Inicia el servidor en **http://127.0.0.1:8001**:

```bash
php -S 127.0.0.1:8001 -t public public/index.php
```

> Se usa `php -S` en lugar de `php artisan serve`: `artisan serve` lanza un proceso hijo que puede quedar huérfano y bloquear el puerto 8001 con "Failed to listen". `php -S` es un solo proceso y se detiene con Ctrl+C.
>
> Si 8001 ya está ocupado: `netstat -ano | findstr :8001` y mata el PID en LISTENING con `taskkill /F /PID <PID>`.

## Integración con el frontend

En el frontend define:

- `VITE_API_BASE_URL=http://localhost:8001`

Y deja la app apuntando a esa URL para login y sincronización.

En desarrollo el frontend (Vite, puerto 5173) reenvía las llamadas `/api/*` al backend mediante el proxy de `vite.config.ts` (target `http://127.0.0.1:8001`). En producción el frontend llama directo a la URL pública del backend: hay que rellenar `VITE_API_BASE_URL`, permitir el origen real del frontend en CORS (además de `http://localhost:5173`) y usar HTTPS en ambos.
