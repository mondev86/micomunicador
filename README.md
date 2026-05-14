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

## 5) Arranque local

Instalacion:

```bash
npm install
```

Desarrollo:

```bash
npm run dev
```

Puerto fijo (util para pruebas en red/ngrok):

```bash
npx vite --host 0.0.0.0 --port 4174
```

## 6) Exponer con ngrok

Con app en 4174:

```bash
npx ngrok http 4174
```

Si aparece ERR_NGROK_334:

1. Ya existe ese endpoint online.
1. Reutiliza la URL activa o cierra el ngrok previo.
1. Alternativa: usar --pooling-enabled.

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
