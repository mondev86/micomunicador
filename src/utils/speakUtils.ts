/**
 * Pure utilities extracted from the speak() function in App.tsx.
 * Kept framework-free so they can be unit-tested without a browser or React.
 */

/** Returns true only when the synth is actively playing or has items queued.
 *  Calling cancel() on an idle Android Chrome synth can permanently break the
 *  user-gesture association, causing all subsequent speak() calls to be silently
 *  ignored for the rest of the session (Chromium bug #334408). */
export function shouldCancelBeforeSpeak(
	synth: Pick<SpeechSynthesis, "speaking" | "pending">
): boolean {
	return synth.speaking || synth.pending;
}

/** Detects iOS Safari / WKWebView where speechSynthesis.speak() must be called
 *  synchronously inside a user-gesture handler. */
export function isIOSUserAgent(userAgent: string): boolean {
	return /iP(hone|od|ad)/.test(userAgent);
}

/** Picks the best available Spanish voice.
 *  Priority: preferredURI match → any es-* voice → first voice available. */
export function pickSpanishVoice(
	voices: Pick<SpeechSynthesisVoice, "voiceURI" | "lang" | "localService">[],
	preferredURI?: string
): Pick<SpeechSynthesisVoice, "voiceURI" | "lang" | "localService"> | null {
	if (voices.length === 0) return null;
	if (preferredURI) {
		const preferred = voices.find(v => v.voiceURI === preferredURI);
		if (preferred) return preferred;
	}
	const spanish = voices.filter(v => v.lang.toLowerCase().startsWith("es"));
	const localSpanish = spanish.filter(v => v.localService);
	if (localSpanish.length > 0) return localSpanish[0];
	return spanish[0] ?? voices[0];
}

/** Builds a plain SpeechSynthesisUtterance ready to be enqueued.
 *  Does NOT call synth.speak() — caller is responsible for that. */
export function buildUtterance(
	text: string,
	voice: Pick<SpeechSynthesisVoice, "voiceURI" | "lang"> | null,
	opts: { rate: number; pitch: number; volume: number; fallbackLang?: string; preserveBrowserDefaultLang?: boolean }
): SpeechSynthesisUtterance {
	const utterance = new SpeechSynthesisUtterance(text);
	if (voice) {
		utterance.voice = voice as SpeechSynthesisVoice;
		utterance.lang = voice.lang;
	} else {
		if (!opts.preserveBrowserDefaultLang) {
			utterance.lang = opts.fallbackLang || "es-ES";
		}
	}
	utterance.rate = opts.rate;
	utterance.pitch = opts.pitch;
	utterance.volume = opts.volume;
	return utterance;
}
