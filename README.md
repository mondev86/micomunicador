# Pictogramas AAC - Manual del Proyecto

Aplicacion web de Comunicacion Aumentativa y Alternativa (CAA) para ninos y ninas con TEA o dificultades de lenguaje.

Este README esta pensado para estudiar el proyecto, entender su arquitectura y hacer cambios con seguridad.

## 1) Stack y contexto tecnico

- React 19
- Vite 7
- TypeScript 5
- Tailwind CSS 4
- Lucide React
- Web Speech API (TTS)
- MediaRecorder API (grabacion de audio)
- IndexedDB (audio local por dispositivo)
- API Laravel + MySQL (sincronizacion multi-dispositivo)

## 2) Mapa rapido del repo

- src/App.tsx: flujo principal de UI + estado global de la app
- src/boards.ts: motor de tableros AAC (grafo, clonacion, validacion)
- src/data.ts: categorias y pictogramas base (seed)
- src/index.css: estilos base
- public/manifest.json: manifest PWA
- Dockerfile + nginx.conf: build y serve por contenedor

## 3) Funciones actuales de producto

Tableros AAC con celdas de dos tipos:

- speak: agrega/habla palabra
- navigate: navega a otro tablero

Frase actual fija en la parte inferior:

- siempre visible
- chips removibles
- acciones: borrar ultimo, limpiar, hablar, guardar

Barra de urgencias fija debajo del header:

- Dolor, Bano, Agua, Ayuda, Fiebre

Navegacion por tabs:

- Tableros
- Frases
- Rapido
- Ajustes

Favoritos por perfil:

- persistencia por perfil
- grabacion por frase favorita

Personalizacion visual por nino:

- el terapeuta puede asignar foto real (camara/galeria) a cualquier celda del tablero
- opcion para quitar foto y volver a emoji

Voz:

- TTS por palabra y por frase
- selector de voz guardado en localStorage
- filtro de voces priorizadas (Laura/Pablo + voz femenina es-ES extra cuando exista)

Modo terapeuta:

- acceso protegido por PIN
- edicion de tableros
- registro de sesion (frases comunicadas con hora)

## 4) Persistencia (localStorage)

Claves utilizadas:

- child-profiles
- active-profile-id
- boards:{profileId}
- favorites:{profileId}
- preferred-voice-uri
- therapist-pin

Consejo:

- cuando cambies estructura de datos, agrega migracion defensiva para no romper datos previos

## 4.1) Sincronizacion en la nube

La app ahora sincroniza datos entre dispositivos usando Laravel + MySQL.
El backend activo está en [laravel-backend/README.md](laravel-backend/README.md).

Variables necesarias:

- `VITE_API_BASE_URL`
- credenciales de Laravel/MySQL en [laravel-backend/.env.example](laravel-backend/.env.example)

Flujo:

1. El usuario inicia sesion con correo y contraseña en Ajustes.
1. Al iniciar sesion, la app carga el snapshot remoto y lo escribe en el almacenamiento local.
1. Las grabaciones de audio se sincronizan tambien en la nube.

Nota tecnica actual:

- El frontend puede funcionar con `VITE_API_BASE_URL` vacio usando rutas relativas (`/api/...`) cuando se trabaja con proxy de Vite.
- En ese modo, `vite.config.ts` redirige `/api` a `http://127.0.0.1:8001`.

## 4.2) Estado del audio (actual)

El audio funciona en tres capas:

1. TTS (voz sintetizada del dispositivo) con Web Speech API.
1. Grabacion de voz familiar por frase favorita con `MediaRecorder`.
1. Reproduccion de grabaciones guardadas localmente en IndexedDB y sincronizadas a nube.

Mejoras aplicadas para Android/iOS:

- Seleccion dinamica de `mimeType` soportado por navegador (`audio/webm`, `audio/mp4`, `audio/ogg`).
- Persistencia del `mimeType` real del blob grabado para evitar incompatibilidades de reproduccion.
- Reproduccion con `playsinline`, `preload` y limpieza de object URLs.
- TTS reforzado con `resume()` y reintento corto cuando las voces no estan listas aun.
- Unlock inicial de audio/voz para iOS en primer gesto de usuario.

Limitacion importante:

- IndexedDB es local por dispositivo/navegador. Sin nube, una grabacion hecha en PC no aparece sola en celular.

Esquema SQL:

- [mysql/schema.sql](mysql/schema.sql)

Endpoints del backend Laravel:

1. `POST /api/auth/register`
1. `POST /api/auth/login`
1. `GET /api/auth/me`
1. `GET /api/state`
1. `PUT /api/state`
1. `GET /api/recordings`
1. `GET /api/recordings/:profileId/:favoriteId`
1. `PUT /api/recordings/:profileId/:favoriteId`
1. `DELETE /api/recordings/:profileId/:favoriteId`

Backend SaaS activo:

- [laravel-backend/README.md](laravel-backend/README.md)

## 5) Arranque local

Instalacion:

```bash
npm install
```

Desarrollo:

```bash
npm run dev
```

Para exponer en red local en modo dev usa el comando directo de Vite (no `npm run dev -- --host`):

```bash
npx vite --host 0.0.0.0 --port 4174
```

API Laravel (en otra terminal):

```bash
cd laravel-backend
php artisan serve
```

Puerto fijo (util para pruebas en red/ngrok):

```bash
npx vite --host 0.0.0.0 --port 4174
```

Modo estable para pruebas en celular (recomendado):

```bash
npm run build
npx vite preview --host 0.0.0.0 --port 4174
```

Este modo evita recargas HMR y suele ser mas estable en Android.

## 6) Exponer con ngrok

Con app en 4174:

```bash
npx ngrok http 4174
```

Errores comunes:

`ERR_NGROK_334`:

1. Ya existe ese endpoint online.
1. Reutiliza la URL activa o cierra el ngrok previo.
1. Alternativa: usar --pooling-enabled.

`ERR_NGROK_3200`:

1. El endpoint esta offline (agente ngrok no corriendo o URL vieja).
1. Levanta de nuevo `ngrok http 4174` y comparte la URL activa.
1. Verifica en `http://127.0.0.1:4040` que diga `Session Status: online`.

Consejo para Android:

1. Abrir el enlace en Chrome directamente (no dentro del preview de WhatsApp).
1. Si viene de mensajeria, usar "Abrir en navegador".

## 7) Docker

Build y run:

```bash
docker build -t pictogramas-aac .
docker run --rm -p 8080:80 pictogramas-aac
```

Abrir:

- <http://localhost:8080>

## 8) Flujo mental para hacer cambios sin romper

Antes de tocar codigo:

1. Ubica el flujo en App.tsx (tab, handler y estado involucrado).
1. Revisa si afecta persistencia en localStorage.
1. Revisa si afecta modo terapeuta o permisos de UI.
1. Verifica responsive (mobile y desktop).

Despues de cambiar:

1. Compila sin errores TS.
1. Prueba frase actual (hablar, guardar, limpiar).
1. Prueba tab Frases (guardar, cargar, grabar/reproducir).
1. Prueba Ajustes (voz, velocidad, perfiles).
1. Prueba modo terapeuta (PIN y acciones de tablero).

## 9) Recetas de cambios frecuentes

Agregar pictograma base:

1. Edita src/data.ts.
1. Agrega item en categoria.
1. Verifica que aparezca en tableros construidos.

Agregar accion de urgencia:

1. Edita lista urgencyItems en App.tsx.
1. Verifica etiqueta corta y comprensible.

Restringir frases solo a terapeuta:

1. En tab Frases, envolver botones de crear/editar/eliminar con guardas de isTherapistMode.
1. En handlers, agregar validacion defensiva adicional.

Asignar foto personalizada a celda:

1. Entrar en modo terapeuta.
1. Ir a Tableros.
1. En una celda, usar boton Foto.
1. Elegir imagen de camara o galeria.
1. Opcional: usar Quitar foto para volver al emoji.

Agregar nueva voz prioritaria:

1. Ajustar filtro de voces en App.tsx.
1. Mantener fallback cuando no existan voces esperadas.

## 10) Riesgos comunes

- Romper persistencia al cambiar tipos sin migracion
- Permitir acciones de terapeuta fuera de modo protegido
- Re-render costoso por estados no memoizados
- Cortes visuales por elementos fijos (top/bottom) sin padding correcto
- Confundir fallo de audio con endpoint offline de ngrok
- Probar en preview de apps de mensajeria en lugar de navegador real

## 11) Documento complementario

Para estudio profundo de la logica principal revisa App.README.md.

## 12) Playbook de mantenimiento semanal

Objetivo:

- Detectar regresiones temprano
- Mantener estabilidad funcional para nino/familia/terapeuta
- Evitar deuda tecnica silenciosa

Rutina sugerida (1 vez por semana, 30-45 min):

1. Verificacion rapida de ejecucion.
1. Flujo de comunicacion (critico).
1. Flujo de favoritos y audio.
1. Flujo de perfiles.
1. Flujo de terapeuta.
1. Revision de responsive.
1. Revision de persistencia.

Checklist mensual (60-90 min):

1. Revisar dependencias (npm outdated).
1. Revisar tamano/legibilidad de App.tsx para extraer modulos.
1. Revisar mensajes UX para familias y terapeutas.
1. Revisar compatibilidad de voces en el equipo objetivo.

Regla operativa:

- si un cambio toca estado global, persistencia o layout fijo, ejecutar playbook completo antes de dar por cerrado
