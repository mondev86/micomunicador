# App.tsx - Manual tecnico de estudio y cambios

Este documento explica la logica actual de App.tsx para que puedas modificar el archivo con control total y bajo riesgo.

## 1) Responsabilidad del archivo

App.tsx concentra:

1. Estado principal de la app.
1. Persistencia por perfil en localStorage.
1. Logica de voz (TTS) y grabacion (MediaRecorder).
1. Navegacion de tableros AAC y navegacion por tabs de UI.
1. Restricciones por modo terapeuta.

## 2) Modelo mental de la interfaz

Capas fijas:

1. Header superior fijo.
1. Barra de urgencias fija.
1. Contenido principal por tab.
1. Barra de frase fija sobre el footer.
1. Footer fijo con tabs.

Tabs principales:

- boards: tableros AAC + busqueda + acciones de edicion (solo terapeuta)
- phrases: frases favoritas y grabaciones
- quick: accesos rapidos
- settings: perfiles, voz, velocidad, apariencia y modo terapeuta

## 3) Estados clave y para que sirven

Comunicacion:

- sentence: frase en construccion
- isSentenceSpeaking: feedback visual mientras habla
- searchTerm: busqueda global

Tableros:

- boardGraph: grafo de tableros/celdas
- boardHistory: historial de navegacion entre tableros

Perfiles y configuracion:

- profiles
- activeProfileId
- uiMode
- speechRate
- preferredVoiceURI

Favoritos y audio:

- favorites
- recordingFavoriteId
- mediaRecorderRef / mediaStreamRef / audioChunksRef

Seguridad y operacion:

- isTherapistMode
- sessionLog
- activeTab

## 4) Flujos criticos (end-to-end)

Flujo A: agregar pictograma a frase

1. click en celda speak o acceso rapido
2. addToSentence
3. render inmediato de chip en barra fija inferior

Flujo B: hablar frase

1. boton Hablar o click en chip
2. speakSentence construye texto
3. speak ejecuta TTS con voz seleccionada
4. se agrega entrada a sessionLog

Flujo C: guardar frase favorita

1. saveFavorite clona sentence
2. evita duplicados por contenido textual
3. persistFavorites guarda en estado + localStorage por perfil
4. limpia sentence y muestra feedback breve

Flujo D: grabar voz para favorito

1. startRecordingFavorite solicita microfono
2. MediaRecorder acumula chunks
3. stop transforma a DataURL
4. se guarda recordedAudioDataUrl en favorito

Flujo E: asignar foto real a celda (terapeuta)

1. terapeuta pulsa boton Foto en una celda
2. se abre selector de archivo (camara/galeria)
3. se convierte a DataURL
4. se persiste en boardGraph.imageDataUrl de la celda
5. la celda renderiza imagen en lugar de emoji

Flujo F: modo terapeuta

1. entrada por Ajustes
2. verifica o crea PIN en localStorage
3. habilita controles de edicion de tableros
4. permite revisar log de sesion

## 5) Zonas sensibles que NO conviene tocar sin revisar dependencias

1. useEffect de carga por perfil activo:

- carga boards y favorites por profileId
- resetea estado vinculado al perfil

1. useEffect de voces:

- sincroniza voiceschanged
- mantiene preferredVoiceURI valido

1. saveFavorite y migracion de formatos antiguos:

- pueden romper datos previos si se cambia el formato sin migracion

1. bloques de UI fixed (top/bottom):

- cualquier cambio exige verificar paddings de main

## 6) Como hacer cambios grandes sin perder estabilidad

Patron recomendado:

1. Aislar objetivo en una sola area (boards, phrases, quick o settings).
1. Cambiar primero handlers, luego UI.
1. Validar localStorage impactado.
1. Verificar responsive (mobile + desktop).
1. Verificar permisos de terapeuta.

Checklist de validacion rapida:

1. Build/TS sin errores.
1. Hablar frase funciona.
1. Guardar/cargar favorito funciona.
1. Grabar/reproducir audio funciona.
1. Cambiar perfil no mezcla datos.
1. PIN de terapeuta protege acceso.

## 7) Recetas practicas de manipulacion

Agregar nueva accion en Ajustes:

1. Crear estado o handler.
1. Renderizar control en tab settings.
1. Persistir por perfil si aplica.

Mover una accion de tab:

1. Ubicar handler existente.
1. Reutilizar handler en nueva seccion.
1. Eliminar duplicado viejo para evitar divergencia.

Restringir Frases a terapeuta:

1. En tab phrases, envolver acciones de mutacion con isTherapistMode.
1. En handlers de mutacion, agregar guard clause defensiva.

Agregar telemetria ligera:

1. Extender sessionLog.
1. Registrar evento en handlers clave.
1. Exponer en bloque terapeuta.

## 8) Deuda tecnica sugerida (si quieres escalar)

1. Extraer hooks:

- useProfiles
- useFavorites
- useVoices
- useTherapistMode

1. Dividir App.tsx por componentes:

- BoardsView
- PhrasesView
- QuickView
- SettingsView
- FixedSentenceBar
- BottomTabs

1. Definir tipos dedicados en archivo de dominio para reducir acoplamiento.

## 9) Regla de oro para este archivo

Si cambias estado global, revisa siempre estos 3 ejes:

1. Persistencia (localStorage).
1. Permisos (modo terapeuta).
1. Layout fijo (top/bottom y responsive).

## 10) Playbook tecnico semanal (App.tsx)

Duracion sugerida: 30-45 min.

Bloque A - Sanidad del archivo

1. Confirmar que no hay errores TypeScript.
1. Revisar que handlers criticos sigan en uso (sin codigo muerto).
1. Revisar que no haya estados duplicados o no utilizados.

Bloque B - Rutas funcionales minimas

1. boards:

- navegar entre tableros
- buscar y agregar pictograma

1. phrases:

- guardar favorita
- grabar y reproducir audio

1. settings:

- cambiar velocidad
- cambiar voz
- entrar/salir de terapeuta

Bloque C - Persistencia por perfil

1. Cambiar activeProfileId y validar carga de datos correcta.
1. Recargar pagina y verificar que los datos persisten.
1. Confirmar que no se mezcla contenido entre perfiles.

Bloque D - Controles sensibles

1. Modo terapeuta:

- acciones de edicion visibles solo en contexto correcto

1. Voz:

- preferredVoiceURI valido despues de recargar
- fallback correcto si no existe voz esperada

1. Layout fijo:

- top y bottom bars sin tapar contenido scrolleable

Bloque E - Higiene de refactor

1. Si App.tsx crece en complejidad, extraer primero componentes visuales puros.
1. Luego extraer hooks de estado/persistencia.
1. Mantener contratos de tipos estables antes de dividir logica.

Checklist de cierre de semana

1. No errores TS.
1. Flujos minimos funcionando.
1. Persistencia estable.
1. Responsive estable.
1. Permisos de terapeuta coherentes.
