# Mi Comunicador

Aplicación web de **Comunicación Aumentativa y Alternativa (CAA)** para niños y niñas con autismo (TEA) o dificultades del lenguaje.

> Proyecto personal desarrollado para un niño con autismo, con el objetivo de darle una voz a través de pictogramas, voz sintetizada (TTS) y grabación de audio. Código desplegado como PWA, responsive y con diseño pensado en sensibilidad sensorial.

---

## Qué hace

El niño toca pictogramas para construir frases con pictogramas que se leen en voz alta, sin necesidad de saber leer ni escribir.

- **Tableros AAC**: más de 120 pictogramas organizados por categorías (emociones, necesidades, comida, rutinas…), cada una con su propio color distintivo.
- **Voz (TTS)**: al tocar un pictograma, la app lo lee en voz alta con la voz configurada del dispositivo.
- **Frase de la sesión**: los pictos tocados se acumulan arriba y se leen como frase completa.
- **Frases favoritas**: guardar y recuperar frases hechas (con o sin audio grabado por un adulto).
- **Acceso rápido**: barra de pictogramas más usados para momentos urgentes.
- **Perfiles**: hasta 3 perfiles por dispositivo, cada uno con sus datos independientes.
- **Modo logopeda**: vista con registro de sesiones, exportación a PDF con estadísticas de uso, notas y nombre del terapeuta.
- **Configurable**: velocidad de voz, modo calma (colores suaves), contraste de colores.

---

## Stack

| Capa | Tecnologías |
|---|---|
| Frontend | React, TypeScript, Vite |
| Estilos | Tailwind CSS |
| Audio | Web Speech API (TTS), MediaRecorder, IndexedDB (blobs) |
| Persistencia | localStorage por perfil, sessionStorage (sesión cloud) |
| PWA | `manifest.json`, service worker (Workbox) |
| Backend (privado) | Laravel 11, PHP 8, MySQL — API RESTful, no incluido en este repo |

---

## Cómo ver la demo local

```bash
git clone https://github.com/mondev86/micomunicador.git
cd micomunicador
npm install
npm run dev        # http://localhost:5173
```

Al abrir la pantalla de acceso, pulsar **"Explorar en modo demo"** para entrar sin cuenta: la app funciona 100% con datos locales (pictogramas, voz TTS, frases favoritas, perfiles, modo logopeda). El modo demo es persistente y se sale con el botón de cerrar sesión.

---

## Estructura del proyecto

```
src/
├── App.tsx              # Lógica principal: estado, sincronización, UI
├── boards.ts            # Tableros por defecto (categorías y pictogramas)
├── data.ts              # Definición completa de pictogramas
├── manual.ts            # Manual de uso mostrado dentro de la app
├── data/categories.ts   # Paleta de colores por categoría + mapa de íconos
├── components/
│   └── PictogramCard.tsx
└── utils/
    ├── speakUtils.ts    # TTS (voz sintetizada)
    ├── audioDB.ts       # IndexedDB para grabaciones de audio
    ├── cloudSync.ts     # Sincronización localStorage ↔ backend
    ├── cloudApiClient.ts
    ├── therapistUtils.ts
    └── cn.ts            # Helper de clases CSS (clsx + tailwind-merge)
```

---

## Características técnicas destacadas

- **PWA completa**: instalable, offline-capable (íconos y estructura cachean, los datos se guardan en IndexedDB y localStorage).
- **Diseño sensory-friendly**: modo calma con colores suaves, opciones para reducir estimulación visual (diseñado con niños TEA en mente).
- **Sync bidireccional**: pull remoto o seed local según qué tenga datos más recientes — el conflicto se resuelve explícitamente evitando pérdida de tableros.
- **Exportación PDF**: resumen de sesiones con pictogramas usados, tiempos de uso y estadísticas, listo para presentar al terapeuta.
- **Accesibilidad**: botones grandes con áreas de toque amplias, iconos con color + nombre, sin dependencia de texto para navegar.

---

## Créditos

Pictogramas inspirados en ARASAAC (Creative Commons). Desarrollado con amor para un niño que merece ser escuchado.

---

*Este repositorio contiene solo el frontend. El backend Laravel (API, autenticación, base de datos) es privado.*
