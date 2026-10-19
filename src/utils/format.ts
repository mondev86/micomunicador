import { storage } from "./storage";

// Recorta y elimina caracteres peligrosos para HTML (< >). React ya escapa el
// texto al renderizar, pero esto añade una defensa extra y limita el tamaño.
export const sanitizeInput = (value: string, max: number): string => {
	return value.replace(/[<>]/g, "").slice(0, max);
};

// Paleta aleatoria por modo visual para pintar frases favoritas.
export const randomColorClass = (mode: "calma" | "color" = "calma") => {
	const colors = mode === "calma"
		? [
				"bg-amber-50 border-amber-200 text-amber-800",
				"bg-sky-50 border-sky-200 text-sky-800",
				"bg-emerald-50 border-emerald-200 text-emerald-800",
				"bg-rose-50 border-rose-200 text-rose-800",
				"bg-violet-50 border-violet-200 text-violet-800",
			]
		: [
				"bg-amber-100 border-amber-300 text-amber-900",
				"bg-cyan-100 border-cyan-300 text-cyan-900",
				"bg-lime-100 border-lime-300 text-lime-900",
				"bg-pink-100 border-pink-300 text-pink-900",
				"bg-orange-100 border-orange-300 text-orange-900",
			];
	return colors[Math.floor(Math.random() * colors.length)];
};

// Formatos de audio candidatos según compatibilidad de navegador.
const RECORDING_MIME_CANDIDATES = [
	"audio/webm;codecs=opus",
	"audio/webm",
	"audio/mp4;codecs=mp4a.40.2",
	"audio/mp4",
	"audio/ogg;codecs=opus",
	"audio/ogg",
];

export const canBrowserPlayAudioMime = (mimeType: string): boolean => {
	if (typeof document === "undefined") return false;
	const audio = document.createElement("audio");
	const compactType = mimeType.split(";")[0]?.trim() || mimeType;
	return audio.canPlayType(mimeType) !== "" || audio.canPlayType(compactType) !== "";
};

// Devuelve el primer mimeType realmente soportado por MediaRecorder.
export const pickSupportedRecordingMimeType = (): string | undefined => {
	if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
		return undefined;
	}
	const preferred = RECORDING_MIME_CANDIDATES.find(type => MediaRecorder.isTypeSupported(type) && canBrowserPlayAudioMime(type));
	if (preferred) return preferred;
	return RECORDING_MIME_CANDIDATES.find(type => MediaRecorder.isTypeSupported(type));
};

export const getStoredText = (key: string): string => {
	const value = storage.getItem(key);
	if (!value) return "";
	const trimmed = value.trim();
	return trimmed === "null" || trimmed === "undefined" ? "" : value;
};
