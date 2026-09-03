# Pictogramas AAC - Manual Completo de la App

Aplicacion web de Comunicacion Aumentativa y Alternativa (CAA) para niños y niñas con TEA o dificultades del lenguaje.

Este README es una guia tecnica para entender de pies a cabeza como funciona la app: que archivo es, que hace y para que sirve.

## 1) Que es esta app y como esta dividida

La app tiene 2 bloques principales:

1. Frontend React/Vite: interfaz, logica de tableros, voz, perfiles y guardado local.
1. Backend Laravel/MySQL: autenticacion, guardado remoto del estado y grabaciones de audio.

Capas de datos:

1. localStorage: estado de UI y datos serializados por perfil.
1. sessionStorage: sesion de nube activa (token + usuario), solo mientras la pestana esta abierta.
1. IndexedDB: blobs de audio local (mas robusto que localStorage para archivos).
1. MySQL via API Laravel: sincronizacion entre dispositivos.

Ingreso a la app: el login es obligatorio; sin una sesion de nube valida no se accede a la interfaz. Solo se permiten hasta 3 perfiles por dispositivo y cada perfil guarda sus datos en la nube del usuario conectado.

## 2) Mapa del proyecto (vision rapida)

- `src/`: frontend React.
- `src/utils/`: audio, sync cloud, helpers tecnicos.
- `laravel-backend/`: API Laravel.
- `mysql/schema.sql`: esquema SQL de referencia.
- `Dockerfile`, `nginx.conf`, `docker-compose.yml`: infraestructura.

## 3) Frontend archivo por archivo

### 3.1 Entradas y configuracion

- `index.html`
	- Plantilla HTML base con el nodo `#root`.
	- Punto donde React monta la app.

- `src/main.tsx`
	- Entrada de React.
	- Renderiza `App` dentro de `#root`.

- `vite.config.ts`
	- Config de Vite y plugins.
	- Incluye plugin React, Tailwind y PWA.
	- Define comportamiento de build y desarrollo.

- `tsconfig.json`
	- Reglas TypeScript (strict, target, modulos).

- `package.json`
	- Scripts (`dev`, `build`, `test`).
	- Dependencias del frontend.

- `src/index.css`
	- Estilos globales y base visual.

- `public/manifest.json`
	- Config PWA (nombre, iconos, metadatos).

### 3.2 Logica de negocio principal

- `src/App.tsx`
	- Archivo mas importante del frontend.
	- Orquesta tabs, frase actual, perfiles, favoritos, modo terapeuta, TTS y grabacion.
	- Coordina carga/guardado local y sincronizacion cloud.
	- Login obligatorio como puerta de entrada: sin sesion de nube no se accede a la app.
	- Sesion con cierre automatico por inactividad (10 min sin interaccion).
	- Uso de hasta 3 perfiles por dispositivo y sancamiento de entradas de texto (limpieza de `< >` y limites de longitud).
	- Busqueda de pictogramas desde el header con resaltado de resultados.
	- Tab "Rapido": acceso rapido y frases rapidas de alta frecuencia.
	- Modo visual Calma/Color por perfil y velocidad de voz (Lenta/Media/Normal).
	- Panel clinico: registro de sesion por rango, exportacion de reporte PDF (jsPDF), exportacion por sesion y progreso de vocabulario por perfil.

- `src/boards.ts`
	- Motor de tableros AAC.
	- Define tipos de tablero/celda.
	- Construye, clona y valida grafos de tableros.

- `src/data.ts`
	- Seed principal de categorias y pictogramas.
	- Mapa de iconos para render en UI.

- `src/data/categories.ts`
	- Reexporta categorias y utilidades para mantener imports limpios.

- `src/components/PictogramCard.tsx`
	- Tarjeta reutilizable de pictograma.
	- Encapsula parte visual y eventos del item.

### 3.3 Utilidades de almacenamiento, audio y sync

- `src/utils/audioDB.ts`
	- Wrapper de IndexedDB para audios.
	- API local: abrir DB, guardar blob, leer blob, borrar blob.
	- Evita usar localStorage para audio pesado.

- `src/utils/cloudApiClient.ts`
	- Cliente HTTP hacia Laravel.
	- Maneja login/register/me, token y headers Authorization.
	- La sesion (token + usuario) se guarda en `sessionStorage`: vive solo mientras la pestana esta abierta; el navegador gestiona el guardado de la contrasena.
	- Soporta base URL absoluta o rutas relativas `/api/...`.

- `src/utils/cloudSync.ts`
	- Orquestador de sincronizacion cloud.
	- Captura snapshot sincronizable de localStorage.
	- Sube/baja estado remoto (`/api/state`).
	- Convierte blob <-> dataUrl para grabaciones (`/api/recordings`).

- `src/utils/speakUtils.ts`
	- Helpers de voz sintetizada.
	- Selecciona voces y arma utterances con parametros seguros.

- `src/utils/therapistUtils.ts`
	- Helpers del modo terapeuta y reportes de sesion.
	- Filtrado por rango temporal y utilidades de PIN/hash.

- `src/utils/cn.ts`
	- Helper de clases CSS (`clsx` + `tailwind-merge`).

- `src/utils/speakUtils.test.ts`
	- Pruebas unitarias de utilidades de voz.

- `src/utils/therapistUtils.test.ts`
	- Pruebas unitarias de utilidades de terapeuta.

- `src/utils/audioDB.test.ts`
	- Pruebas unitarias del wrapper de IndexedDB para audio.

## 4) Backend Laravel archivo por archivo

### 4.1 Entry points y rutas

- `laravel-backend/artisan`
	- CLI de Laravel para migrate, serve, etc.

- `laravel-backend/bootstrap/app.php`
	- Bootstrap principal de la app Laravel.
	- Registra rutas, middleware y manejo de excepciones.

- `laravel-backend/routes/api.php`
	- Rutas API del sistema.
	- Publicas: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/health`.
	- Protegidas por token: `state` y `recordings`.

- `laravel-backend/routes/web.php`
	- Rutas web clasicas (no API).

- `laravel-backend/routes/console.php`
	- Comandos de consola programables.

### 4.2 Controladores

- `laravel-backend/app/Http/Controllers/Api/V1/AuthController.php`
	- Registro/login y lectura de usuario autenticado.
	- Emite tokens con Sanctum.
	- Seguridad reforzada: contrasena fuerte (8+ caracteres, letras y numeros), limite de cuentas por IP (5 cada 24 h) y bloqueo temporal por intentos de login fallidos (10 por IP cada 15 min).

- `laravel-backend/app/Http/Controllers/Api/V1/StateController.php`
	- `GET /api/state`: devuelve snapshot de estado del usuario.
	- `PUT /api/state`: guarda o actualiza snapshot JSON.

- `laravel-backend/app/Http/Controllers/Api/V1/RecordingController.php`
	- CRUD de grabaciones por `profileId` + `favoriteId`.
	- Guarda `mime_type` y `data_base64` en MySQL.

### 4.3 Modelo y migraciones

- `laravel-backend/app/Models/User.php`
	- Modelo del usuario.
	- Usa `HasApiTokens` para autenticacion API.

- `laravel-backend/database/migrations/2026_07_25_000001_create_users_table.php`
	- Crea tabla `users` (email unico, password hash, timestamps).

- `laravel-backend/database/migrations/2026_07_25_000002_create_app_user_state_table.php`
	- Crea `app_user_state`.
	- `user_id` es PK y FK a users.
	- `payload` JSON con snapshot completo sincronizable.

- `laravel-backend/database/migrations/2026_07_25_000003_create_audio_recordings_table.php`
	- Crea `audio_recordings`.
	- PK compuesta: `user_id + profile_id + favorite_id`.
	- Guarda audio como data URL/base64 en `longText`.

- `laravel-backend/database/migrations/2026_07_25_000004_create_personal_access_tokens_table.php`
	- Crea tabla de tokens de Sanctum.

### 4.4 Configuracion backend

- `laravel-backend/composer.json`
	- Dependencias PHP/Laravel.

- `laravel-backend/.env.example`
	- Variables de entorno requeridas (DB, CORS, app key, etc).

- `laravel-backend/README.md`
	- Guia local del backend.

## 5) Infraestructura y despliegue

- `Dockerfile`
	- Build del frontend y servido con Nginx.

- `nginx.conf`
	- Config para SPA (fallback a `index.html`) y cache de assets.

- `docker-compose.yml`
	- Orquesta backend Laravel + MySQL para desarrollo local.

- `laravel-backend/Dockerfile`
	- Imagen del backend (si se usa flujo dockerizado del API).

- `mysql/schema.sql`
	- Definicion SQL del esquema principal.

- `supabase/schema.sql`
	- Esquema alterno para pruebas o migracion futura.

### 5.1 Como se conectan frontend y backend

En este monorepo el frontend y el backend son **dos piezas independientes** que se hablan por HTTP (no comparten proceso ni codigo).

**En desarrollo:**

```
http://localhost:5173  (Vite / React)
   └─ peticiones /api/* → proxy de vite.config.ts → http://127.0.0.1:8001 (Laravel)
```

El navegador carga la app desde Vite y Vite reenvia las llamadas `/api/*` al backend. Por eso en desarrollo ambos servidores deben estar corriendo.

**En produccion:**

```
https://app.midominio.com      (assets frontend compilados: Nginx/Vercel/Netlify, etc.)
https://api.midominio.com      (backend Laravel + MySQL en un servidor VPS/PaaS)
```

Ya no hay proxy: el frontend llama **directo** a la URL publica del backend. Para que funcione hace falta:

1. `VITE_API_BASE_URL` con la URL publica del backend (hoy vacia en `.env`; hay que rellenarla y reconstruir `dist/`).
2. CORS del backend permitiendo el origen real del frontend (hoy solo acepta `http://localhost:5173` / `4174` en `laravel-backend/config/cors.php`).
3. HTTPS en ambos (los navegadores bloquean audio/TTS y requests no seguros fuera de localhost).

> El deploy es basicamente: subir el backend a un servidor con PHP 8 + MySQL, subir `dist/` a un hosting estatico, y rellenar `VITE_API_BASE_URL` + CORS. El hosting concreto aun no esta decidido.

## 6) Flujo end-to-end (como viajan los datos)

### 6.1 Flujo funcional

1. Usuario abre la app y debe iniciar sesion en la nube (login obligatorio como puerta de entrada).
1. Interactua en `src/App.tsx` (tableros, frase, favoritos, grabaciones).
1. Estado funcional se guarda en localStorage con claves controladas.
1. Audio se guarda en IndexedDB via `src/utils/audioDB.ts`.
1. Con sesion cloud activa, `src/utils/cloudSync.ts` sincroniza estado y audios.
1. `src/utils/cloudApiClient.ts` llama endpoints Laravel con Bearer token.
1. Laravel escribe en MySQL tablas `app_user_state` y `audio_recordings`.
1. En otro dispositivo, login + carga remota restauran estado y grabaciones.
1. La sesion se cierra al cerrar la pestana/navegador o tras 10 min de inactividad.

### 6.2 Claves locales sincronizables

- fijas: `child-profiles`, `active-profile-id`, `therapist-name`, `therapist-license`, `therapist-notes`, `preferred-voice-uri`
- prefijos: `boards:`, `favorites:`, `session-log:`

### 6.3 Endpoints relevantes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/state`
- `PUT /api/state`
- `GET /api/recordings`
- `GET /api/recordings/{profileId}/{favoriteId}`
- `PUT /api/recordings/{profileId}/{favoriteId}`
- `DELETE /api/recordings/{profileId}/{favoriteId}`

## 7) Como levantar el proyecto localmente

### 7.1 Frontend

```bash
npm install
npm run dev
```

### 7.2 Backend

```bash
cd laravel-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

Para levantar el servidor se recomienda el servidor integrado de PHP en **http://127.0.0.1:8001** (mismo puerto que usa el proxy del frontend):

```bash
php -S 127.0.0.1:8001 -t public public/index.php
```

> Nota: se usa `php -S` en lugar de `php artisan serve` porque `artisan serve` lanza un proceso hijo que puede quedar huerfano y dejar el puerto 8001 ocupado (causando "Failed to listen"). `php -S` es un solo proceso, se detiene limpio con Ctrl+C.
>
> Si 8001 ya esta ocupado, liberalo antes: `netstat -ano | findstr :8001` y mata el PID que aparezca en LISTENING con `taskkill /F /PID <PID>`.

### 7.3 Con Docker Compose (si aplica)

```bash
docker compose up --build
```

## 8) Que tocar para cada tipo de cambio

### 8.1 Nuevo pictograma/categoria

1. Editar `src/data.ts`.
1. Validar render en `src/App.tsx` o `src/components/PictogramCard.tsx`.

### 8.2 Reglas de tablero o navegacion

1. Editar `src/boards.ts`.
1. Validar usos en `src/App.tsx`.

### 8.3 Cambios de voz/TTS

1. Editar `src/utils/speakUtils.ts`.
1. Verificar flujo de llamada en `src/App.tsx`.

### 8.4 Cambios de sincronizacion cloud

1. Cliente HTTP: `src/utils/cloudApiClient.ts`.
1. Orquestacion sync: `src/utils/cloudSync.ts`.
1. API backend: rutas + controllers en `laravel-backend/app/Http/Controllers/Api/V1`.

### 8.5 Cambios de base de datos

1. Crear/editar migration en `laravel-backend/database/migrations`.
1. Mantener consistencia con `mysql/schema.sql`.

## 9) Riesgos comunes (y como evitarlos)

- Audio en localStorage: no hacerlo, usar IndexedDB (`src/utils/audioDB.ts`).
- Token ausente o vencido: la sesion vive en `sessionStorage` (se borra al cerrar pestana/navegador o por inactividad de 10 min); revisar login y el backend encendido en `127.0.0.1:8001`.
- CORS/API inaccesible: validar URL base, puertos y backend encendido.
- Divergencia entre perfiles y tableros: validar grafo y claves por perfil.
- Archivos de audio muy grandes: considerar limpieza o politica de retencion.
- Abuso de registro/login: el backend limita cuentas por IP y bloquea intentos fallidos.
- Perfiles ilimitados: la app limita a 3 perfiles por dispositivo.
- Entradas de texto: se sanea (`< >` y longitud) en perfiles, frases personalizadas y campos del logopeda; no usar `dangerouslySetInnerHTML`.

## 10) Checklist para entender la app rapido

1. Leer `src/App.tsx` completo para ver el flujo principal.
1. Leer `src/boards.ts` y `src/data.ts` para entender dominio AAC.
1. Leer `src/utils/audioDB.ts`, `src/utils/cloudApiClient.ts`, `src/utils/cloudSync.ts` para entender persistencia/sync.
1. Leer `laravel-backend/routes/api.php` y controllers para ver contrato API.
1. Leer migraciones para ver modelo de datos final.

## 11) Checklist antes de subir cambios

1. `npm run build` sin errores.
1. Login obligatorio y pantalla de acceso funcionando (sin sesion no se entra).
1. Cierre por inactividad (10 min) y cierre al cambiar de usuario.
1. Login cloud y carga inicial remota funcionando.
1. Guardado de estado (`PUT /api/state`) correcto.
1. Guardado y lectura de grabacion (`PUT/GET /api/recordings/...`) correcto.
1. Pruebas unitarias en utilidades de voz/terapeuta (si tocaste esas areas).

## 12) Documento complementario

- `App.README.md`: guia enfocada solo en `src/App.tsx`.
