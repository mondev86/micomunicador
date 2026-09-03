# Modo desarrollo estricto — App SAAC de pictogramas con audio interactivo

Contexto del proyecto: app web de Comunicación Aumentativa y Alternativa (SAAC/CAA) para niños, construida con tableros de pictogramas, voz (TTS) y grabación de audio, persistencia por perfil en localStorage y sincronización con un backend (Laravel).

No alterar nada fuera de lo pedido. Reglas fijas, sin excepciones salvo que el usuario las mencione explícitamente.

1. Solo haz exactamente lo que se pida. No modifiques, refactorices ni "mejores" código existente que no se mencionó, aunque creas que tiene un error o podría estar mejor. Si ves algo que consideras un problema, dilo aparte — no lo toques por tu cuenta.

2. Respeta el patrón de diseño y las convenciones ya usadas en el proyecto (estructura de carpetas, nombres de variables/métodos, forma de organizar controladores/modelos/vistas). Antes de crear algo nuevo, revisa cómo está hecho algo similar ya existente en el proyecto y sigue ese mismo estilo, no un estilo genérico de Laravel.

3. Antes de empezar una sección nueva, pregunta lo necesario para mantener el orden del proyecto: nombre de la tabla/sección, dónde debería ubicarse (carpeta/módulo), si hay una convención de nombres que deba seguir, y si esta sección se relaciona con otra ya existente. No asumas esto por tu cuenta.

4. Alcance de cada tarea: cuando se pase una tabla para trabajar una sección, crea únicamente migración, modelo, controlador y vista Blade de esa sección específica — nada más. Si detectas que la sección requiere otra sección relacionada para funcionar completa (ej. una tabla que depende de otra que no existe aún), NO la crees por tu cuenta: di exactamente qué falta y por qué es necesaria, y espera confirmación antes de tocarla.

5. Cuando se pase una tabla para adaptarla a Laravel: crea la migración siguiendo el patrón de las migraciones ya existentes en el proyecto (nombres de columnas, tipos de datos, convenciones de timestamps/foreign keys que ya se usan). No la ejecutes ni la subas a ningún lado — el usuario la subirá manualmente a phpMyAdmin. Solo entrega el archivo de migración y el SQL equivalente si lo pide.

6. Cuando se pase un HTML de ejemplo para crear una vista: úsalo como guía de estructura y contenido, conviértelo a Blade siguiendo el patrón de vistas ya usado en el proyecto. NO agregues frameworks CSS ajenos (W3.CSS, Bootstrap, etc.) ni estilos que no estén ya en el proyecto. Si el proyecto usa Tailwind, tradúcelo a Tailwind. Elimina cualquier estilo inline o de otro framework que traiga el HTML de ejemplo.

7. No generes ejemplos adicionales, variantes, ni funciones que no se pidieron.

8. Incluye siempre manejo de errores y validaciones básicas, siguiendo el mismo patrón de validación que ya usa el proyecto (Form Requests, reglas en el controlador, etc.).

9. Si necesitas tocar código fuera del archivo/función mencionado, PARA antes de escribir nada y di qué y por qué. Espera confirmación.

10. No uses imágenes, voz, ni generes contenido multimedia salvo que se pida con esa palabra explícita.

11. Si tienes dudas sobre qué se quiere, pregunta antes de asumir. Una pregunta corta es mejor que una suposición larga.

12. Stack de referencia: Laravel, PHP 8, Vue 3, Inertia.js, Blade, Tailwind, MySQL, Alpine.js. Base de datos administrada manualmente vía phpMyAdmin, sin migraciones automáticas en producción.

13. Explicación breve del "por qué" de cada decisión clave — máximo 5 líneas por cambio normal, hasta 10 si es algo más complejo.

---

## Reglas de rendimiento y flujo de trabajo (mejoran velocidad y calidad)

14. **Un objetivo por tarea.** Cuando hay varios encargos, sepáralos y revísalos uno a uno con el usuario antes de seguir al siguiente. No acumules cambios sueltos sin confirmar.

15. **Valida al terminar.** Cuando un cambio involucre el frontend, ejecuta `npm run build` (y `npx tsc --noEmit` si aplica) al finalizar para confirmar que compila. Si el proyecto tiene `npm test` (vitest), ejecuta también los tests relacionados con lo que toqué. Reporta el resultado en una línea.

16. **No toques archivos fuera del scope.** Cualquier error de compilación o test detectado en archivos que NO toqué (pre-existente) se reporta aparte, se etiqueta como "pre-existente/fuera de alcance" y NO se corrige sin permiso explícito.

17. **Cada cambio se limita a un único archivo salvo que el flujo lo exija.** Si un cambio requiere tocar 3+ archivos, detente, lista los archivos y sus razones, y espera confirmación antes de empezar.

18. **Frontend vs backend.** Este repo es un monorepo: el frontend es React/Vite/TS en `src/`, el backend es Laravel en `laravel-backend/`. Indica siempre en qué parte estoy trabajando y confirma antes de cruzar entre ambas. Las reglas Laravel (5, 6, 12) aplican solo a `laravel-backend/`.

19. **Voz, audio y multimedia.** Como la app usa TTS y grabación (MediaRecorder), cualquier cambio que toque `speakUtils.ts`, `audioDB.ts` o el flujo de grabación debe respetar los tests existentes (`*.test.ts`) — cópialos SIEMPRE.

20. **No generes tests no pedidos.** Si no se pide prueba nueva, no crees archivos `.test.ts`. Solo los ejecuto si existe uno relacionado con el cambio.

21. **Avísame de problemas detectados, no los arreglo solo.** Si al leer código veo un posible bug, lo describo en 1-2 líneas y sigo con la tarea. El usuario decide si lo aborda.

22. **Sé explícito con los "por qué".** Recuerda la regla 13 en cada decisión clave: digo el motivo en máximo 5 líneas y ofrezco alternativa si la hay, sin aplicar nada que contradiga tu petición.

23. **Confirmo el plan antes de implementar en tareas grandes.** Si una tarea implica más de ~15 minutos de cambios o tocar secciones nuevas, presento primero un plan corto (pasos + archivos) y espero tu OK antes de modificar nada.

24. **Verificación de backend.** Para cambios en `laravel-backend/`, indico el comando de validación disponible (p. ej. `php artisan` config, rutas, tests) y no ejecuto nada que suba datos a la BD (la BD se administra vía phpMyAdmin).
