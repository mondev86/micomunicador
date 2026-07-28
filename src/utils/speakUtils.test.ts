import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	shouldCancelBeforeSpeak,
	isIOSUserAgent,
	pickSpanishVoice,
	buildUtterance,
} from "./speakUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeVoice(
	lang: string,
	voiceURI = lang,
	localService = false
): Pick<SpeechSynthesisVoice, "voiceURI" | "lang" | "localService"> {
	return { lang, voiceURI, localService };
}

// ─── shouldCancelBeforeSpeak ──────────────────────────────────────────────────
//
// Android Chrome bug #334408: calling cancel() on an IDLE synth permanently
// breaks the user-gesture association.  speak() calls are then silently
// ignored for the rest of the session.  We MUST only cancel when needed.

describe("shouldCancelBeforeSpeak", () => {
	it("returns false when synth is idle (speaking=false, pending=false)", () => {
		expect(shouldCancelBeforeSpeak({ speaking: false, pending: false })).toBe(false);
	});

	it("returns true when synth is speaking", () => {
		expect(shouldCancelBeforeSpeak({ speaking: true, pending: false })).toBe(true);
	});

	it("returns true when synth has items pending", () => {
		expect(shouldCancelBeforeSpeak({ speaking: false, pending: true })).toBe(true);
	});

	it("returns true when synth is both speaking and pending", () => {
		expect(shouldCancelBeforeSpeak({ speaking: true, pending: true })).toBe(true);
	});
});

// ─── isIOSUserAgent ───────────────────────────────────────────────────────────
//
// iOS Safari/WKWebView requires speak() to be called SYNCHRONOUSLY inside the
// user-gesture call stack.  Android Chrome does NOT have this restriction.

describe("isIOSUserAgent", () => {
	const androidUA =
		"Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
	const iPhoneUA =
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
	const iPadUA =
		"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
	const iPodUA =
		"Mozilla/5.0 (iPod touch; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
	const windowsUA =
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

	it("returns false for Android Chrome", () => {
		expect(isIOSUserAgent(androidUA)).toBe(false);
	});

	it("returns true for iPhone Safari", () => {
		expect(isIOSUserAgent(iPhoneUA)).toBe(true);
	});

	it("returns true for iPad Safari", () => {
		expect(isIOSUserAgent(iPadUA)).toBe(true);
	});

	it("returns true for iPod Safari", () => {
		expect(isIOSUserAgent(iPodUA)).toBe(true);
	});

	it("returns false for Windows Chrome", () => {
		expect(isIOSUserAgent(windowsUA)).toBe(false);
	});
});

// ─── pickSpanishVoice ─────────────────────────────────────────────────────────
//
// Android Chrome may silently skip an utterance with no voice set if the synth
// hasn't loaded voices yet.  We always pick the best available voice.

describe("pickSpanishVoice", () => {
	it("returns null when voice list is empty", () => {
		expect(pickSpanishVoice([])).toBeNull();
	});

	it("returns the preferred voice when preferredURI matches", () => {
		const voices = [makeVoice("en-US", "en-us-uri"), makeVoice("es-ES", "es-es-uri")];
		const result = pickSpanishVoice(voices, "es-es-uri");
		expect(result?.voiceURI).toBe("es-es-uri");
	});

	it("falls through to Spanish voice when preferredURI does not match", () => {
		const voices = [makeVoice("en-US", "en-us-uri"), makeVoice("es-ES", "es-es-uri")];
		const result = pickSpanishVoice(voices, "unknown-uri");
		expect(result?.lang).toBe("es-ES");
	});

	it("picks es-MX when es-ES is not available", () => {
		const voices = [makeVoice("en-US"), makeVoice("es-MX")];
		const result = pickSpanishVoice(voices);
		expect(result?.lang).toBe("es-MX");
	});

	it("falls back to first voice when no Spanish voice exists", () => {
		const voices = [makeVoice("en-US"), makeVoice("fr-FR")];
		const result = pickSpanishVoice(voices);
		expect(result?.lang).toBe("en-US");
	});

	it("prefers preferredURI over language heuristic", () => {
		const voices = [makeVoice("es-ES", "es-es-uri"), makeVoice("en-US", "preferred-uri")];
		// Even though es-ES would normally win, the explicit preference overrides it.
		const result = pickSpanishVoice(voices, "preferred-uri");
		expect(result?.voiceURI).toBe("preferred-uri");
	});

	it("prefers local Spanish voices when available", () => {
		const voices = [
			makeVoice("es-ES", "remote-es", false),
			makeVoice("es-MX", "local-es", true),
		];
		const result = pickSpanishVoice(voices);
		expect(result?.voiceURI).toBe("local-es");
	});
});

// ─── buildUtterance ───────────────────────────────────────────────────────────
//
// Verifies that utterances are built with the right properties before being
// handed to synth.speak().

describe("buildUtterance", () => {
	beforeEach(() => {
		// SpeechSynthesisUtterance is not available in the Vitest Node environment.
		vi.stubGlobal(
			"SpeechSynthesisUtterance",
			class {
				text: string;
				voice: SpeechSynthesisVoice | null = null;
				lang = "";
				rate = 1;
				pitch = 1;
				volume = 1;
				constructor(text: string) {
					this.text = text;
				}
			}
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("sets voice and lang when a voice is provided", () => {
		const voice = makeVoice("es-ES", "es-es-uri");
		const u = buildUtterance("Hola", voice, { rate: 0.8, pitch: 1.12, volume: 1 });
		expect(u.lang).toBe("es-ES");
		expect((u.voice as unknown as typeof voice)?.voiceURI).toBe("es-es-uri");
	});

	it("defaults lang to es-ES when voice is null", () => {
		const u = buildUtterance("Hola", null, { rate: 0.8, pitch: 1.12, volume: 1 });
		expect(u.lang).toBe("es-ES");
		expect(u.voice).toBeNull();
	});

	it("can preserve browser default language when requested", () => {
		const u = buildUtterance("Hola", null, {
			rate: 0.8,
			pitch: 1.12,
			volume: 1,
			preserveBrowserDefaultLang: true,
		});
		expect(u.lang).toBe("");
		expect(u.voice).toBeNull();
	});

	it("applies rate, pitch, volume from options", () => {
		const u = buildUtterance("prueba", null, { rate: 0.75, pitch: 1.2, volume: 0.9 });
		expect(u.rate).toBe(0.75);
		expect(u.pitch).toBe(1.2);
		expect(u.volume).toBe(0.9);
	});

	it("text is set on the utterance", () => {
		const u = buildUtterance("Quiero agua", null, { rate: 1, pitch: 1, volume: 1 });
		expect(u.text).toBe("Quiero agua");
	});
});

// ─── Integration: Android Chrome speak() call sequence ───────────────────────
//
// Verifies the complete sequence of calls the speak() function should make
// against a mocked speechSynthesis, covering the Android Chrome-specific cases.

describe("Android Chrome speak() call sequence", () => {
	let mockSynth: {
		speaking: boolean;
		pending: boolean;
		cancel: ReturnType<typeof vi.fn>;
		speak: ReturnType<typeof vi.fn>;
		resume: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		mockSynth = {
			speaking: false,
			pending: false,
			cancel: vi.fn(),
			speak: vi.fn(),
			resume: vi.fn(),
		};

		vi.stubGlobal(
			"SpeechSynthesisUtterance",
			class {
				text: string;
				voice = null;
				lang = "";
				rate = 1;
				pitch = 1;
				volume = 1;
				onend = null;
				onerror = null;
				constructor(text: string) {
					this.text = text;
				}
			}
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("does NOT call cancel() when synth is idle (the Android idle-cancel bug)", () => {
		// Arrange: synth is idle
		mockSynth.speaking = false;
		mockSynth.pending = false;

		// Act: simulate what speak() should do
		if (shouldCancelBeforeSpeak(mockSynth)) mockSynth.cancel();
		mockSynth.speak(new SpeechSynthesisUtterance("Sí"));

		// Assert
		expect(mockSynth.cancel).not.toHaveBeenCalled();
		expect(mockSynth.speak).toHaveBeenCalledOnce();
	});

	it("calls cancel() THEN speak() when something is already playing", () => {
		// Arrange: synth is mid-utterance
		mockSynth.speaking = true;
		mockSynth.pending = false;

		if (shouldCancelBeforeSpeak(mockSynth)) mockSynth.cancel();
		mockSynth.speak(new SpeechSynthesisUtterance("No"));

		expect(mockSynth.cancel).toHaveBeenCalledOnce();
		expect(mockSynth.speak).toHaveBeenCalledOnce();
		// cancel must be called before speak
		const cancelOrder = mockSynth.cancel.mock.invocationCallOrder[0];
		const speakOrder = mockSynth.speak.mock.invocationCallOrder[0];
		expect(cancelOrder).toBeLessThan(speakOrder);
	});

	it("calls cancel() when items are pending (queued but not yet playing)", () => {
		mockSynth.speaking = false;
		mockSynth.pending = true;

		if (shouldCancelBeforeSpeak(mockSynth)) mockSynth.cancel();
		mockSynth.speak(new SpeechSynthesisUtterance("Ayuda"));

		expect(mockSynth.cancel).toHaveBeenCalledOnce();
		expect(mockSynth.speak).toHaveBeenCalledOnce();
	});

	it("uses an es-* voice when Spanish voices are available", () => {
		const voices = [makeVoice("en-US"), makeVoice("es-MX", "es-mx-uri")];
		const voice = pickSpanishVoice(voices);
		const utterance = buildUtterance("Hola", voice, { rate: 0.8, pitch: 1.12, volume: 1 });

		mockSynth.speak(utterance);

		expect(utterance.lang).toBe("es-MX");
	});

	it("falls back to lang=es-ES when no voices are loaded yet", () => {
		const voice = pickSpanishVoice([]);
		const utterance = buildUtterance("Agua", voice, { rate: 0.8, pitch: 1.12, volume: 1 });

		expect(voice).toBeNull();
		expect(utterance.lang).toBe("es-ES");
	});
});
