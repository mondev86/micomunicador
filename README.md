# Pictogramas con Audio Interactivo

Aplicacion web de Comunicacion Aumentativa y Alternativa (CAA) orientada a ninos y ninas con TEA o dificultades del lenguaje. El proyecto combina UX accesible, sintetizador de voz y sincronizacion de datos para uso en multiples dispositivos.

## Demo del proyecto

- Frontend: React + TypeScript + Vite
- Backend API: Laravel
- Persistencia: LocalStorage + IndexedDB + sincronizacion en MySQL

## Que problema resuelve

- Permite comunicar frases mediante pictogramas con retroalimentacion inmediata.
- Reduce friccion para familias y terapeutas con flujo rapido en movil.
- Mantiene continuidad entre sesiones y dispositivos mediante sincronizacion.

## Funcionalidades principales

- Tableros AAC navegables con celdas de hablar y navegar.
- Construccion de frase en tiempo real con acciones rapidas (hablar, borrar, guardar).
- Favoritos por perfil y grabaciones de voz familiar por frase.
- Modo terapeuta protegido por PIN para edicion y seguimiento de uso.
- Personalizacion visual por pictograma (foto real desde camara o galeria).
- Soporte de audio reforzado para Android/iOS (TTS + MediaRecorder).

## Stack tecnico

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS 4
- Web Speech API
- MediaRecorder API
- IndexedDB
- Laravel 12
- MySQL

## Arquitectura resumida

- Frontend SPA: interfaz AAC, estado de sesion y reproduccion de audio.
- Capa local: perfiles, frases y audios en almacenamiento del dispositivo.
- API Laravel: autenticacion, estado de usuario y sincronizacion de grabaciones.
- Base de datos: MySQL para estado y datos compartidos entre dispositivos.

## Ejecucion local

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd laravel-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

## Variables de entorno

Frontend (.env.example):

- VITE_API_BASE_URL

Backend (laravel-backend/.env.example):

- APP_KEY
- DB_HOST
- DB_PORT
- DB_DATABASE
- DB_USERNAME
- DB_PASSWORD
- SANCTUM_STATEFUL_DOMAINS

## Notas para evaluacion tecnica

- Se priorizo compatibilidad real en dispositivos moviles sobre un demo solo de escritorio.
- El modelo de datos y utilidades de sincronizacion quedaron desacoplados para evolucionar a escalas mayores.
- Incluye pruebas unitarias de utilidades criticas en src/utils.

## Roadmap corto

- Suite de tests E2E para flujos clinicos clave.
- Exportacion/importacion de perfiles.
- Panel de metricas terapeuticas.

## Estructura relevante

- src/: frontend React
- src/utils/: logica de audio, sincronizacion y helpers
- laravel-backend/: API Laravel
- public/: assets estaticos y manifest PWA

## Licencia

Uso educativo y de portafolio.
