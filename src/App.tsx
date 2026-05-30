import React, { useState, useEffect, useMemo, useRef } from "react";
import { Play, Delete, Trash2, Volume2, Search, X, Mic, Square, ChevronRight } from "lucide-react";
import { jsPDF } from "jspdf";
import { categories as originalCategories, Pictogram } from "./data/categories";
import { AacBoardGraph, buildBoardsFromCategories, cloneBoardGraph, isValidBoardGraph } from "./boards";
import { PictogramCard, PictogramIcon } from "./components/PictogramCard";
import { saveAudio, loadAudio, deleteAudio } from "./utils/audioDB";
import { SessionEntry, ReportRange, hashPin, isHashedPin, getRangeLabel, filterEntriesByRange, deleteFilteredEntries } from "./utils/therapistUtils";

type Favorite = {
	id: string;
	items: Pictogram[];
	colorClass: string;
};

type ChildProfile = {
	id: string;
	name: string;
	uiMode: UiMode;
	speechRate: number;
};

type SessionGroup = {
	id: string;
	start: number;
	end: number;
	entries: SessionEntry[];
};

type UiMode = "calma" | "color";

const THERAPIST_PIN_STORAGE_KEY = "therapist-pin";
const SESSION_BREAK_MS = 45 * 60 * 1000;

const defaultProfiles: ChildProfile[] = [
	{ id: "perfil-1", name: "Ana", uiMode: "calma", speechRate: 0.8 }
];

const randomColorClass = (mode: UiMode = "calma") => {
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

function App() {
	const defaultBoardGraph = useMemo(() => buildBoardsFromCategories(originalCategories), []);
	const [boardGraph, setBoardGraph] = useState<AacBoardGraph>(() => cloneBoardGraph(defaultBoardGraph));
	const { boardsById, boardOrder, homeBoardId } = boardGraph;

	const allPictograms: Pictogram[] = useMemo(
		() =>
			Object.values(boardsById)
				.flatMap(board => board.cells)
				.filter(cell => cell.type === "speak")
				.map(cell => ({
					id: cell.id,
					iconName: cell.iconName,
					word: cell.label,
				})),
		[boardsById]
	);

	const [boardHistory, setBoardHistory] = useState<string[]>([homeBoardId]);
	const [profiles, setProfiles] = useState<ChildProfile[]>(() => {
		const saved = localStorage.getItem("child-profiles");
		if (!saved) return defaultProfiles;
		try {
			const parsed = JSON.parse(saved) as ChildProfile[];
			return parsed.length > 0 ? parsed : defaultProfiles;
		} catch {
			return defaultProfiles;
		}
	});
	const [activeProfileId, setActiveProfileId] = useState<string>(() => localStorage.getItem("active-profile-id") || defaultProfiles[0].id);
	const [searchTerm, setSearchTerm] = useState("");
	const [sentence, setSentence] = useState<Pictogram[]>([]);
	const [isSentenceSpeaking, setIsSentenceSpeaking] = useState(false);
	const [isTherapistMode, setIsTherapistMode] = useState(false);
	const [pinStep, setPinStep] = useState<"idle" | "enter" | "new1" | "new2" | "change-current" | "change-new1" | "change-new2">("idle");
	const [pinInput, setPinInput] = useState("");
	const [pendingPin, setPendingPin] = useState("");
	const [pinError, setPinError] = useState("");
	const [showSavedNotice, setShowSavedNotice] = useState(false);
	const [recordingFavoriteId, setRecordingFavoriteId] = useState<string | null>(null);
	const [customWordInput, setCustomWordInput] = useState("");
	const [speechRate, setSpeechRate] = useState<number>(0.8);
	const [uiMode, setUiMode] = useState<UiMode>("calma");
	const [activeTab, setActiveTab] = useState<"boards" | "phrases" | "quick" | "settings">("boards");
	const [sessionLog, setSessionLog] = useState<SessionEntry[]>([]);
	const [reportRange, setReportRange] = useState<ReportRange>("7d");
	const [customRangeStart, setCustomRangeStart] = useState<string>("");
	const [customRangeEnd, setCustomRangeEnd] = useState<string>("");
	const [therapistName, setTherapistName] = useState<string>(() => localStorage.getItem("therapist-name") || "");
	const [therapistLicense, setTherapistLicense] = useState<string>(() => localStorage.getItem("therapist-license") || "");
	const [therapistNotes, setTherapistNotes] = useState<string>(() => localStorage.getItem("therapist-notes") || "");
	const [sessionLogHydratedProfileId, setSessionLogHydratedProfileId] = useState<string | null>(null);

	const [favorites, setFavorites] = useState<Favorite[]>([]);
	// favoriteId → tiene grabación en IndexedDB
	const [hasAudio, setHasAudio] = useState<Record<string, boolean>>({});
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const audioChunksRef = useRef<BlobPart[]>([]);
	const [voicesReady, setVoicesReady] = useState(false);
	const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
	const [preferredVoiceURI, setPreferredVoiceURI] = useState<string>(() => localStorage.getItem("preferred-voice-uri") || "");

	const activeProfile = profiles.find(profile => profile.id === activeProfileId) ?? profiles[0];
	const activeBoardId = boardHistory[boardHistory.length - 1] ?? homeBoardId;
	const activeBoard = boardsById[activeBoardId] ?? boardsById[homeBoardId];

	useEffect(() => {
		localStorage.setItem("child-profiles", JSON.stringify(profiles));
	}, [profiles]);

	useEffect(() => {
		localStorage.setItem("active-profile-id", activeProfileId);
	}, [activeProfileId]);

	useEffect(() => {
		if (!activeProfile) return;
		const savedBoards = localStorage.getItem(`boards:${activeProfile.id}`);
		if (savedBoards) {
			try {
				const parsed = JSON.parse(savedBoards);
				setBoardGraph(isValidBoardGraph(parsed) ? cloneBoardGraph(parsed) : cloneBoardGraph(defaultBoardGraph));
			} catch {
				setBoardGraph(cloneBoardGraph(defaultBoardGraph));
			}
		} else {
			setBoardGraph(cloneBoardGraph(defaultBoardGraph));
		}
		setBoardHistory([defaultBoardGraph.homeBoardId]);
		setUiMode(activeProfile.uiMode);
		setSpeechRate(activeProfile.speechRate);

		const savedFavorites = localStorage.getItem(`favorites:${activeProfile.id}`);
		if (!savedFavorites) {
			setFavorites([]);
		} else {
			try {
				const parsed = JSON.parse(savedFavorites);
				setFavorites(Array.isArray(parsed) ? parsed : []);
			} catch {
				setFavorites([]);
			}
		}

		const savedSessionLog = localStorage.getItem(`session-log:${activeProfile.id}`);
		if (!savedSessionLog) {
			setSessionLog([]);
			setSessionLogHydratedProfileId(activeProfile.id);
			return;
		}
		try {
			const parsed = JSON.parse(savedSessionLog);
			const normalized: SessionEntry[] = Array.isArray(parsed)
				? parsed
						.filter((item): item is SessionEntry => Boolean(item && typeof item.phrase === "string" && typeof item.timestamp === "number"))
						.map(item => ({ phrase: item.phrase, timestamp: item.timestamp }))
				: [];
			setSessionLog(normalized);
			setSessionLogHydratedProfileId(activeProfile.id);
		} catch {
			setSessionLog([]);
			setSessionLogHydratedProfileId(activeProfile.id);
		}
	}, [activeProfile, defaultBoardGraph]);

	useEffect(() => {
		if (!activeProfile) return;
		localStorage.setItem(`boards:${activeProfile.id}`, JSON.stringify(boardGraph));
	}, [activeProfile, boardGraph]);

	useEffect(() => {
		if (!activeProfile) return;
		if (sessionLogHydratedProfileId !== activeProfile.id) return;
		localStorage.setItem(`session-log:${activeProfile.id}`, JSON.stringify(sessionLog));
	}, [activeProfile, sessionLog, sessionLogHydratedProfileId]);

	useEffect(() => {
		localStorage.setItem("therapist-name", therapistName);
	}, [therapistName]);

	useEffect(() => {
		localStorage.setItem("therapist-license", therapistLicense);
	}, [therapistLicense]);

	useEffect(() => {
		localStorage.setItem("therapist-notes", therapistNotes);
	}, [therapistNotes]);

	useEffect(() => {
		if (favorites.length === 0) return;
		if (typeof (favorites as unknown as string[])[0] === "string") {
			const normalized: Favorite[] = (favorites as unknown as string[]).map((s: string, idx: number) => {
				const words = s.split(" ");
				const items = words.map((w, i) => ({ id: `${w}-${i}`, iconName: "Sparkles", word: w }));
				return { id: `migrated-${idx}`, items, colorClass: randomColorClass(uiMode) };
			});
			setFavorites(normalized);
			if (activeProfile) {
				localStorage.setItem(`favorites:${activeProfile.id}`, JSON.stringify(normalized));
			}
		}
	}, [favorites, activeProfile, uiMode]);

	useEffect(() => {
		if (!("speechSynthesis" in window)) return;
		const synth = window.speechSynthesis;
		const syncVoices = () => {
			const voices = synth.getVoices();
			setAvailableVoices(voices);
			setVoicesReady(voices.length > 0);
		};
		syncVoices();
		synth.addEventListener?.("voiceschanged", syncVoices);
		synth.onvoiceschanged = syncVoices;
		return () => {
			synth.removeEventListener?.("voiceschanged", syncVoices);
			if (synth.onvoiceschanged === syncVoices) synth.onvoiceschanged = null;
		};
	}, []);

	useEffect(() => {
		localStorage.setItem("preferred-voice-uri", preferredVoiceURI);
	}, [preferredVoiceURI]);

	const voiceNameFilter = /laura|pablo/i;
	const femaleSpanishSpainHint = /female|mujer|femen|woman|girl|es-es|espa[ñn]a|spain|sabina|lucia|luc[íi]a|monica|m[óo]nica|sofia|sof[íi]a|paulina|helena|maria|mar[íi]a/i;
	const limitedVoices = useMemo(() => {
		const curatedVoices = availableVoices.filter(voice => voiceNameFilter.test(`${voice.name} ${voice.voiceURI}`));
		const extraFemaleEsEsVoice = availableVoices.find(voice => {
			const descriptor = `${voice.name} ${voice.voiceURI}`;
			const isSpanishSpain = voice.lang.toLowerCase().startsWith("es-es");
			const looksFemale = femaleSpanishSpainHint.test(descriptor);
			const notAlreadyIncluded = !curatedVoices.some(curated => curated.voiceURI === voice.voiceURI);
			return isSpanishSpain && looksFemale && notAlreadyIncluded;
		});
		return extraFemaleEsEsVoice ? [...curatedVoices, extraFemaleEsEsVoice] : curatedVoices;
	}, [availableVoices]);

	useEffect(() => {
		if (limitedVoices.length === 0) return;
		if (limitedVoices.some(voice => voice.voiceURI === preferredVoiceURI)) return;
		setPreferredVoiceURI(limitedVoices[0].voiceURI);
	}, [limitedVoices, preferredVoiceURI]);

	const persistFavorites = (updated: Favorite[]) => {
		setFavorites(updated);
		if (activeProfile) {
			try {
				localStorage.setItem(`favorites:${activeProfile.id}`, JSON.stringify(updated));
			} catch {
				// localStorage lleno — los favoritos están en memoria de todas formas
			}
		}
	};

	const saveFavorite = () => {
		if (sentence.length === 0) return;
		const copy = sentence.map(p => ({ ...p }));
		const text = copy.map(p => p.word).join(" ");
		const exists = favorites.some(f => f.items.map(p => p.word).join(" ") === text);
		if (exists) return;
		const newFav: Favorite = {
			id: `${Date.now()}`,
			items: copy,
			colorClass: randomColorClass(uiMode),
		};
		persistFavorites([...favorites, newFav]);
		setSentence([]);
		setShowSavedNotice(true);
		window.setTimeout(() => setShowSavedNotice(false), 1500);
	};

	const getFriendlySpanishVoice = () => {
		if (!("speechSynthesis" in window)) return null;
		const voices = limitedVoices.length > 0 ? limitedVoices : availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
		if (!voices.length) return null;
		if (preferredVoiceURI) {
			const preferred = voices.find(voice => voice.voiceURI === preferredVoiceURI);
			if (preferred) return preferred;
		}
		const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith("es"));
		return spanishVoices[0] ?? voices[0];
	};

	const speak = (text: string, source: "sentence" | "single" = "single") => {
		if (!("speechSynthesis" in window)) return;
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		const selectedVoice = getFriendlySpanishVoice();
		if (selectedVoice) {
			utterance.voice = selectedVoice;
			utterance.lang = selectedVoice.lang;
		} else {
			utterance.lang = "es-ES";
		}
		utterance.rate = source === "sentence" ? speechRate : Math.min(speechRate + 0.08, 1);
		utterance.pitch = 1.12;
		utterance.volume = 1;
		if (source === "sentence") setIsSentenceSpeaking(true);
		utterance.onend = () => { if (source === "sentence") setIsSentenceSpeaking(false); };
		utterance.onerror = () => { if (source === "sentence") setIsSentenceSpeaking(false); };
		if (voicesReady) {
			window.speechSynthesis.speak(utterance);
		} else {
			window.setTimeout(() => window.speechSynthesis.speak(utterance), 150);
		}
	};

	const addToSentence = (pic: Pictogram) => {
		setSentence(prev => [...prev, { ...pic }]);
	};

	const removeSentenceItem = (indexToRemove: number) => {
		setSentence(prev => prev.filter((_, index) => index !== indexToRemove));
	};

	const removeLast = () => setSentence(prev => prev.slice(0, -1));
	const clearSentence = () => setSentence([]);

	const speakSentence = () => {
		if (sentence.length === 0) return;
		const phraseText = sentence.map(p => p.word).join(" ");
		speak(phraseText, "sentence");
		setSessionLogHydratedProfileId(activeProfile?.id ?? null);
		setSessionLog(prev => [...prev, { phrase: phraseText, timestamp: Date.now() }]);
	};

	const speakSingle = (e: React.MouseEvent, text: string) => {
		e.stopPropagation();
		speak(text);
	};

	const addProfile = () => {
		const name = window.prompt("Nombre del perfil:", `Perfil ${profiles.length + 1}`)?.trim();
		if (!name) return;
		const newProfile: ChildProfile = { id: `${Date.now()}`, name, uiMode: "calma", speechRate: 0.8 };
		setProfiles(prev => [...prev, newProfile]);
		setActiveProfileId(newProfile.id);
		setSentence([]);
	};

	const removeProfile = () => {
		if (!activeProfile || profiles.length <= 1) return;
		const confirmed = window.confirm(`Eliminar ${activeProfile.name}?`);
		if (!confirmed) return;
		const remaining = profiles.filter(profile => profile.id !== activeProfile.id);
		localStorage.removeItem(`favorites:${activeProfile.id}`);
		localStorage.removeItem(`boards:${activeProfile.id}`);
		localStorage.removeItem(`session-log:${activeProfile.id}`);
		setProfiles(remaining);
		setActiveProfileId(remaining[0].id);
		setSentence([]);
	};

	const filteredSessionLog = useMemo(() => filterEntriesByRange(sessionLog, reportRange, { customRangeStart, customRangeEnd }), [sessionLog, reportRange, customRangeStart, customRangeEnd]);

	const sessionGroups = useMemo(() => {
		if (filteredSessionLog.length === 0) return [] as SessionGroup[];
		const sorted = [...filteredSessionLog].sort((a, b) => a.timestamp - b.timestamp);
		const groups: SessionGroup[] = [];
		let current: SessionEntry[] = [];

		for (const entry of sorted) {
			if (current.length === 0) {
				current.push(entry);
				continue;
			}
			const previous = current[current.length - 1];
			if (entry.timestamp - previous.timestamp > SESSION_BREAK_MS) {
				groups.push({
					id: `session-${current[0].timestamp}`,
					start: current[0].timestamp,
					end: current[current.length - 1].timestamp,
					entries: current,
				});
				current = [entry];
			} else {
				current.push(entry);
			}
		}

		if (current.length > 0) {
			groups.push({
				id: `session-${current[0].timestamp}`,
				start: current[0].timestamp,
				end: current[current.length - 1].timestamp,
				entries: current,
			});
		}

		return groups.reverse();
	}, [filteredSessionLog]);

	const phraseUsage = useMemo(() => {
		const counts = new Map<string, number>();
		for (const entry of filteredSessionLog) {
			const key = entry.phrase.trim();
			if (!key) continue;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]);
	}, [filteredSessionLog]);

	const wordUsage = useMemo(() => {
		const counts = new Map<string, number>();
		for (const entry of filteredSessionLog) {
			const cleaned = entry.phrase
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/[^a-z0-9\s]/g, " ");
			for (const token of cleaned.split(/\s+/)) {
				if (!token || token.length < 2) continue;
				counts.set(token, (counts.get(token) ?? 0) + 1);
			}
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]);
	}, [filteredSessionLog]);

	const getStoredSessionLog = (profileId: string): SessionEntry[] => {
		if (activeProfile?.id === profileId) return sessionLog;
		const saved = localStorage.getItem(`session-log:${profileId}`);
		if (!saved) return [];
		try {
			const parsed = JSON.parse(saved);
			if (!Array.isArray(parsed)) return [];
			return parsed.filter((item): item is SessionEntry => Boolean(item && typeof item.phrase === "string" && typeof item.timestamp === "number"));
		} catch {
			return [];
		}
	};

	const profileVocabularyStats = useMemo(() => {
		return profiles.map(profile => {
			const log = filterEntriesByRange(getStoredSessionLog(profile.id), reportRange, { customRangeStart, customRangeEnd });
			const words = new Set<string>();
			for (const entry of log) {
				const cleaned = entry.phrase
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "")
					.replace(/[^a-z0-9\s]/g, " ");
				for (const token of cleaned.split(/\s+/)) {
					if (!token || token.length < 2) continue;
					words.add(token);
				}
			}
			return {
				profileId: profile.id,
				profileName: profile.name,
				phrasesCount: log.length,
				activeVocabulary: words.size,
			};
		});
	}, [profiles, activeProfile?.id, sessionLog, reportRange, customRangeStart, customRangeEnd]);

	const calculatePhraseUsage = (entries: SessionEntry[]) => {
		const counts = new Map<string, number>();
		for (const entry of entries) {
			const key = entry.phrase.trim();
			if (!key) continue;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]);
	};

	const calculateWordUsage = (entries: SessionEntry[]) => {
		const counts = new Map<string, number>();
		for (const entry of entries) {
			const cleaned = entry.phrase
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/[^a-z0-9\s]/g, " ");
			for (const token of cleaned.split(/\s+/)) {
				if (!token || token.length < 2) continue;
				counts.set(token, (counts.get(token) ?? 0) + 1);
			}
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]);
	};

	const downloadSessionPdf = (entries: SessionEntry[] = filteredSessionLog, scopeLabel?: string, filenameSuffix?: string) => {
		if (!activeProfile) return;
		if (entries.length === 0) {
			window.alert("No hay frases en el registro para exportar.");
			return;
		}

		const now = new Date();
		const dateLabel = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(now);
		const generatedAt = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(now);
		const localPhraseUsage = calculatePhraseUsage(entries);
		const localWordUsage = calculateWordUsage(entries);
		const topPhrases = localPhraseUsage.slice(0, 3).map(([phrase]) => phrase);
		const topWords = localWordUsage.slice(0, 8);
		const topSummary = topPhrases.length > 0 ? topPhrases.join(" / ") : "sin datos";

		const doc = new jsPDF({ unit: "pt", format: "a4" });
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const marginX = 40;
		const contentWidth = pageWidth - marginX * 2;
		const subtleBorder = [226, 232, 240] as const;
		const bodyText = [15, 23, 42] as const;
		const mutedText = [71, 85, 105] as const;

		doc.setFillColor(29, 78, 216);
		doc.rect(0, 0, pageWidth, 98, "F");

		doc.setTextColor(255, 255, 255);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(23);
		doc.text("Mi Comunicador", marginX, 45);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(12);
		doc.text("Reporte clínico de sesión", marginX, 66);
		doc.setFontSize(9.5);
		doc.text(`Generado: ${generatedAt}`, marginX, 83);

		doc.setFillColor(247, 249, 252);
		doc.setDrawColor(...subtleBorder);
		doc.roundedRect(marginX, 114, contentWidth, 100, 10, 10, "F");
		doc.roundedRect(marginX, 114, contentWidth, 100, 10, 10, "S");
		doc.setTextColor(...bodyText);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(11.5);
		doc.text("Resumen de sesión", marginX + 14, 134);
		doc.setDrawColor(29, 78, 216);
		doc.line(marginX + 14, 142, marginX + 92, 142);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.8);
		doc.text(`Perfil: ${activeProfile.name}`, marginX + 14, 157);
		doc.text(`Fecha: ${dateLabel}`, marginX + 14, 173);
		const rangeText = `Rango: ${scopeLabel ?? getRangeLabel(reportRange)}`;
		doc.text(rangeText, marginX + 14, 189);
		doc.setFontSize(8.6);
		doc.setTextColor(...mutedText);
		const criteriaText = "Criterio de conteo: frases = pulsaciones de Hablar; frases unicas = textos exactos distintos; vocabulario activo = palabras normalizadas unicas.";
		const criteriaLines = doc.splitTextToSize(criteriaText, contentWidth - 28);
		doc.text(criteriaLines, marginX + 14, 201);

		const cardTop = 228;
		const cardGap = 12;
		const cardWidth = (contentWidth - cardGap * 2) / 3;
		const drawMetricCard = (index: number, title: string, value: string) => {
			const x = marginX + index * (cardWidth + cardGap);
			doc.setFillColor(250, 250, 250);
			doc.setDrawColor(...subtleBorder);
			doc.roundedRect(x, cardTop, cardWidth, 74, 8, 8, "F");
			doc.roundedRect(x, cardTop, cardWidth, 74, 8, 8, "S");
			doc.setDrawColor(37, 99, 235);
			doc.line(x + 10, cardTop + 10, x + 44, cardTop + 10);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(9.2);
			doc.setTextColor(...mutedText);
			doc.text(title.toUpperCase(), x + 12, cardTop + 26);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(20);
			doc.setTextColor(...bodyText);
			doc.text(value, x + 12, cardTop + 54);
		};

		drawMetricCard(0, "Frases", String(entries.length));
		drawMetricCard(1, "Frases unicas", String(localPhraseUsage.length));
		drawMetricCard(2, "Vocabulario activo", String(localWordUsage.length));

		const summaryY = 322;
		doc.setFont("helvetica", "bold");
		doc.setFontSize(11);
		doc.setTextColor(...bodyText);
		doc.text("Lectura clínica", marginX, summaryY);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		const summaryText = `${activeProfile.name} comunicó ${entries.length} frases en el período seleccionado. Las 3 más utilizadas fueron: ${topSummary}.`;
		const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
		doc.text(summaryLines, marginX, summaryY + 18);

		let nextY = summaryY + 18 + summaryLines.length * 13 + 18;
		if (therapistNotes.trim()) {
			doc.setFont("helvetica", "bold");
			doc.setFontSize(11);
			doc.setTextColor(...bodyText);
			doc.text("Observaciones del logopeda", marginX, nextY);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			const notesLines = doc.splitTextToSize(therapistNotes.trim(), contentWidth);
			doc.text(notesLines, marginX, nextY + 18);
			nextY += 18 + notesLines.length * 13 + 14;
		}

		const sectionY = nextY;
		doc.setDrawColor(...subtleBorder);
		doc.line(marginX, sectionY, pageWidth - marginX, sectionY);

		doc.setFont("helvetica", "bold");
		doc.setFontSize(11);
		doc.setTextColor(...bodyText);
		doc.text("Top frases", marginX, sectionY + 24);
		doc.text("Palabras más usadas", pageWidth / 2 + 8, sectionY + 24);

		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		let leftY = sectionY + 46;
		for (const [phrase, count] of localPhraseUsage.slice(0, 10)) {
			const phraseLines = doc.splitTextToSize(`- ${phrase} (${count})`, contentWidth / 2 - 22);
			doc.text(phraseLines, marginX, leftY);
			leftY += phraseLines.length * 13;
		}

		let rightY = sectionY + 46;
		for (const [word, count] of topWords) {
			doc.text(`- ${word} (${count})`, pageWidth / 2 + 8, rightY);
			rightY += 14;
		}

		const listsBottomY = Math.max(leftY, rightY) + 12;
		let signatureBlockTop: number;
		if (listsBottomY + 150 > pageHeight) {
			doc.addPage();
			signatureBlockTop = 40;
		} else {
			signatureBlockTop = listsBottomY;
		}
		doc.setDrawColor(...subtleBorder);
		doc.line(marginX, signatureBlockTop, pageWidth - marginX, signatureBlockTop);

		doc.setFont("helvetica", "bold");
		doc.setFontSize(11);
		doc.setTextColor(...bodyText);
		doc.text("Validación profesional", marginX, signatureBlockTop + 22);

		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.8);
		doc.text(`Logopeda: ${therapistName.trim() || "____________________________"}`, marginX, signatureBlockTop + 40);
		doc.text(`Colegiado: ${therapistLicense.trim() || "____________________________"}`, marginX, signatureBlockTop + 56);
		doc.text(`Fecha de firma: ${new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(now)}`, pageWidth / 2 + 8, signatureBlockTop + 40);
		doc.text("Firma", pageWidth / 2 + 8, signatureBlockTop + 56);
		doc.line(pageWidth / 2 + 48, signatureBlockTop + 58, pageWidth - marginX, signatureBlockTop + 58);

		doc.setFont("helvetica", "italic");
		doc.setFontSize(8.8);
		doc.setTextColor(100, 116, 139);
		doc.text("Mi Comunicador - reporte generado automáticamente para seguimiento terapéutico.", marginX, pageHeight - 20);

		const safeName = activeProfile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "perfil";
		const fileDate = now.toISOString().slice(0, 10);
		doc.save(`reporte-sesion-${safeName}-${filenameSuffix ?? reportRange}-${fileDate}.pdf`);
	};

	const handleUiModeChange = (mode: UiMode) => {
		setUiMode(mode);
		if (!activeProfile) return;
		setProfiles(prev => prev.map(profile => profile.id === activeProfile.id ? { ...profile, uiMode: mode } : profile));
	};

	const handleSpeechRateChange = (rate: number) => {
		setSpeechRate(rate);
		if (!activeProfile) return;
		setProfiles(prev => prev.map(profile => profile.id === activeProfile.id ? { ...profile, speechRate: rate } : profile));
	};

	const chooseBoardId = (message: string, defaultIndex = 1): string | null => {
		const boardList = boardOrder.map((id, index) => `${index + 1}. ${boardsById[id]?.name ?? id}`).join("\n");
		const raw = window.prompt(`${message}\n\n${boardList}`, String(defaultIndex))?.trim();
		if (!raw) return null;
		const numericChoice = Number(raw);
		if (!Number.isFinite(numericChoice)) return null;
		const index = Math.floor(numericChoice) - 1;
		return boardOrder[index] ?? null;
	};

	const openTherapistMode = () => {
		const savedPin = localStorage.getItem(THERAPIST_PIN_STORAGE_KEY);
		setPinInput("");
		setPinError("");
		setPinStep(savedPin ? "enter" : "new1");
	};

	const handlePinSubmit = async () => {
		const savedPin = localStorage.getItem(THERAPIST_PIN_STORAGE_KEY);
		if (pinStep === "new1") {
			if (pinInput.length < 4) { setPinError("El PIN debe tener al menos 4 caracteres."); return; }
			setPendingPin(pinInput);
			setPinInput("");
			setPinError("");
			setPinStep("new2");
			return;
		}
		if (pinStep === "new2") {
			if (pinInput !== pendingPin) { setPinError("Los PINs no coinciden. Intenta de nuevo."); setPinInput(""); return; }
			localStorage.setItem(THERAPIST_PIN_STORAGE_KEY, await hashPin(pinInput));
			setPinStep("idle");
			setPinInput("");
			setPendingPin("");
			setPinError("");
			setIsTherapistMode(true);
			return;
		}
		if (pinStep === "enter") {
			if (!savedPin) return;
			let matches = false;
			if (isHashedPin(savedPin)) {
				matches = (await hashPin(pinInput)) === savedPin;
			} else {
				// Migración: PIN antiguo en texto plano
				matches = pinInput === savedPin;
				if (matches) localStorage.setItem(THERAPIST_PIN_STORAGE_KEY, await hashPin(pinInput));
			}
			if (!matches) { setPinError("PIN incorrecto."); setPinInput(""); return; }
			setPinStep("idle");
			setPinInput("");
			setPinError("");
			setIsTherapistMode(true);
			return;
		}
		if (pinStep === "change-current") {
			if (!savedPin) return;
			let matches = false;
			if (isHashedPin(savedPin)) {
				matches = (await hashPin(pinInput)) === savedPin;
			} else {
				matches = pinInput === savedPin;
			}
			if (!matches) { setPinError("PIN actual incorrecto."); setPinInput(""); return; }
			setPendingPin("");
			setPinInput("");
			setPinError("");
			setPinStep("change-new1");
			return;
		}
		if (pinStep === "change-new1") {
			if (pinInput.length < 4) { setPinError("El PIN debe tener al menos 4 caracteres."); return; }
			setPendingPin(pinInput);
			setPinInput("");
			setPinError("");
			setPinStep("change-new2");
			return;
		}
		if (pinStep === "change-new2") {
			if (pinInput !== pendingPin) { setPinError("Los PINs no coinciden."); setPinInput(""); return; }
			localStorage.setItem(THERAPIST_PIN_STORAGE_KEY, await hashPin(pinInput));
			setPinStep("idle");
			setPinInput("");
			setPendingPin("");
			setPinError("");
			return;
		}
	};

	const cancelPinFlow = () => {
		setPinStep("idle");
		setPinInput("");
		setPendingPin("");
		setPinError("");
	};

	const resetPin = () => {
		if (!window.confirm("¿Restablecer el PIN? Se borrará el PIN actual y deberás crear uno nuevo.")) return;
		localStorage.removeItem(THERAPIST_PIN_STORAGE_KEY);
		setPinInput("");
		setPinError("");
		setPinStep("new1");
	};

	const toggleTherapistMode = () => {
		if (isTherapistMode) {
			setIsTherapistMode(false);
			return;
		}
		openTherapistMode();
	};

	const updateBoard = (boardId: string, updater: (graph: AacBoardGraph) => AacBoardGraph) => {
		if (!boardsById[boardId]) return;
		setBoardGraph(prev => updater(prev));
	};

	const renameActiveBoard = () => {
		const currentName = activeBoard?.name ?? "";
		const nextName = window.prompt("Nuevo nombre del tablero:", currentName)?.trim();
		if (!nextName || nextName === currentName) return;
		updateBoard(activeBoard.id, prev => ({
			...prev,
			boardsById: {
				...prev.boardsById,
				[activeBoard.id]: { ...prev.boardsById[activeBoard.id], name: nextName },
			},
		}));
	};

	const addSpeakCellToActiveBoard = () => {
		const label = window.prompt("Palabra nueva:")?.trim();
		if (!label) return;
		const iconName = window.prompt("Icono (Lucide iconName, opcional):", "Sparkles")?.trim() || "Sparkles";
		updateBoard(activeBoard.id, prev => ({
			...prev,
			boardsById: {
				...prev.boardsById,
				[activeBoard.id]: {
					...prev.boardsById[activeBoard.id],
					cells: [
						...prev.boardsById[activeBoard.id].cells,
						{ id: `custom-${Date.now()}`, label, iconName, type: "speak", textToSpeak: label },
					],
				},
			},
		}));
	};

	const createSubBoardFromActive = () => {
		const boardName = window.prompt("Nombre del nuevo subtablero:", "Nuevo tablero")?.trim();
		if (!boardName) return;
		const navLabel = window.prompt("Texto del acceso en este tablero:", boardName)?.trim() || boardName;
		const navIconName = window.prompt("Icono del acceso:", "ArrowRight")?.trim() || "ArrowRight";
		const newBoardId = `board-custom-${Date.now()}`;
		setBoardGraph(prev => ({
			...prev,
			boardOrder: [...prev.boardOrder, newBoardId],
			boardsById: {
				...prev.boardsById,
				[newBoardId]: {
					id: newBoardId,
					name: boardName,
					colorClass: "bg-slate-100 border-slate-300 hover:bg-slate-200",
					cells: [],
				},
				[activeBoard.id]: {
					...prev.boardsById[activeBoard.id],
					cells: [
						...prev.boardsById[activeBoard.id].cells,
						{ id: `go-custom-${Date.now()}`, label: navLabel, iconName: navIconName, type: "navigate", targetBoardId: newBoardId },
					],
				},
			},
		}));
	};

	const addNavigateCellToActiveBoard = () => {
		if (boardOrder.length <= 1) return;
		const targetBoardId = chooseBoardId("Elige tablero destino (numero):", 1);
		if (!targetBoardId || targetBoardId === activeBoard.id) return;
		const targetBoard = boardsById[targetBoardId];
		if (!targetBoard) return;
		const navLabel = window.prompt("Texto del acceso:", targetBoard.name)?.trim() || targetBoard.name;
		const navIconName = window.prompt("Icono del acceso:", "ArrowRight")?.trim() || "ArrowRight";
		updateBoard(activeBoard.id, prev => ({
			...prev,
			boardsById: {
				...prev.boardsById,
				[activeBoard.id]: {
					...prev.boardsById[activeBoard.id],
					cells: [
						...prev.boardsById[activeBoard.id].cells,
						{ id: `go-link-${Date.now()}`, label: navLabel, iconName: navIconName, type: "navigate", targetBoardId },
					],
				},
			},
		}));
	};

	const editCell = (cellId: string) => {
		const cell = activeBoard.cells.find(item => item.id === cellId);
		if (!cell) return;
		const nextLabel = window.prompt("Editar texto:", cell.label)?.trim();
		if (!nextLabel) return;
		const nextIconName = window.prompt("Editar icono:", cell.iconName)?.trim() || cell.iconName;
		let targetBoardId = cell.targetBoardId;
		if (cell.type === "navigate") {
			const selectedTarget = chooseBoardId("Destino del acceso (numero):", 1);
			if (!selectedTarget) return;
			targetBoardId = selectedTarget;
		}
		updateBoard(activeBoard.id, prev => ({
			...prev,
			boardsById: {
				...prev.boardsById,
				[activeBoard.id]: {
					...prev.boardsById[activeBoard.id],
					cells: prev.boardsById[activeBoard.id].cells.map(item =>
						item.id === cellId
							? {
									...item,
									label: nextLabel,
									iconName: nextIconName,
									textToSpeak: item.type === "speak" ? nextLabel : item.textToSpeak,
									targetBoardId: item.type === "navigate" ? targetBoardId : item.targetBoardId,
								}
							: item
					),
				},
			},
		}));
	};

	const removeCell = (cellId: string) => {
		const cell = activeBoard.cells.find(item => item.id === cellId);
		if (!cell) return;
		const confirmed = window.confirm(`Eliminar celda "${cell.label}"?`);
		if (!confirmed) return;
		updateBoard(activeBoard.id, prev => ({
			...prev,
			boardsById: {
				...prev.boardsById,
				[activeBoard.id]: {
					...prev.boardsById[activeBoard.id],
					cells: prev.boardsById[activeBoard.id].cells.filter(item => item.id !== cellId),
				},
			},
		}));
	};

	const stopRecorderAndRelease = () => {
		const recorder = mediaRecorderRef.current;
		if (recorder && recorder.state !== "inactive") recorder.stop();
		if (mediaStreamRef.current) {
			mediaStreamRef.current.getTracks().forEach(track => track.stop());
			mediaStreamRef.current = null;
		}
	};

	const startRecordingFavorite = async (favoriteId: string) => {
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
			window.alert("Este navegador no soporta grabacion de audio.");
			return;
		}
		try {
			stopRecorderAndRelease();
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaStreamRef.current = stream;
			const recorder = new MediaRecorder(stream);
			mediaRecorderRef.current = recorder;
			audioChunksRef.current = [];
			setRecordingFavoriteId(favoriteId);

			recorder.ondataavailable = event => {
				if (event.data.size > 0) audioChunksRef.current.push(event.data);
			};

			recorder.onstop = () => {
				const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
				if (blob.size > 0) {
					saveAudio(favoriteId, blob)
						.then(() => setHasAudio(prev => ({ ...prev, [favoriteId]: true })))
						.catch(() => window.alert("No se pudo guardar la grabación."));
				}
				if (mediaStreamRef.current) {
					mediaStreamRef.current.getTracks().forEach(track => track.stop());
					mediaStreamRef.current = null;
				}
				mediaRecorderRef.current = null;
				audioChunksRef.current = [];
				setRecordingFavoriteId(null);
			};

			recorder.start();
		} catch {
			window.alert("No fue posible iniciar la grabacion. Revisa permisos del microfono.");
			setRecordingFavoriteId(null);
			stopRecorderAndRelease();
		}
	};

	const stopRecordingFavorite = () => stopRecorderAndRelease();

	const playFavoriteRecording = (favoriteId: string) => {
		loadAudio(favoriteId)
			.then(blob => {
				if (!blob) { window.alert("Esta frase aun no tiene grabacion."); return; }
				const url = URL.createObjectURL(blob);
				const audio = new Audio(url);
				audio.onended = () => URL.revokeObjectURL(url);
				audio.play().catch(() => window.alert("No se pudo reproducir la grabacion."));
			})
			.catch(() => window.alert("No se pudo cargar la grabacion."));
	};

	// Hidrata el mapa hasAudio cuando cambia la lista de favoritos
	useEffect(() => {
		if (favorites.length === 0) { setHasAudio({}); return; }
		let cancelled = false;
		Promise.all(
			favorites.map(fav =>
				loadAudio(fav.id).then(blob => ({ id: fav.id, has: blob !== null }))
			)
		).then(results => {
			if (cancelled) return;
			const map: Record<string, boolean> = {};
			for (const r of results) map[r.id] = r.has;
			setHasAudio(map);
		}).catch(() => { /* IndexedDB no disponible, sin audio */ });
		return () => { cancelled = true; };
	}, [favorites]);

	useEffect(() => {
		return () => {
			stopRecorderAndRelease();
		};
	}, []);

	const openBoard = (boardId: string) => {
		if (!boardsById[boardId]) return;
		setBoardHistory(prev => [...prev, boardId]);
	};
	const jumpToBoard = (boardId: string) => {
		if (!boardsById[boardId]) return;
		setBoardHistory([boardId]);
	};
	const goBackBoard = () => {
		setBoardHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
	};

	const normalizeText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
	const normalizedQuery = normalizeText(searchTerm);

	const quickAccessIds = ["help", "hurt", "headache", "fever", "bathroom", "drink", "eat", "sleep", "doctor"];
	const quickAccess = quickAccessIds.map(id => allPictograms.find(pic => pic.id === id)).filter((pic): pic is Pictogram => Boolean(pic));

	const urgencyIds = ["hurt", "bathroom", "water", "help", "fever"];
	const urgencyItems = urgencyIds.map(id => allPictograms.find(pic => pic.id === id)).filter((pic): pic is Pictogram => Boolean(pic));

	const connectorWords = ["yo", "quiero", "no quiero", "ir", "al", "no", "me", "duele", "el", "la", "mi", "porque", "por favor"];

	const addCustomWord = (rawWord: string) => {
		const word = rawWord.trim();
		if (!word) return;
		addToSentence({ id: `typed-${Date.now()}`, iconName: "Sparkles", word });
	};

	const addCustomWordFromInput = () => {
		const value = customWordInput.trim();
		if (!value) return;
		addCustomWord(value);
		setCustomWordInput("");
	};

	const visiblePictograms = normalizedQuery ? allPictograms.filter(pic => normalizeText(pic.word).includes(normalizedQuery)) : [];
	const isCalm = uiMode === "calma";

	const tabs = [
		{ id: "boards", label: "Tableros", icon: "📋" },
		{ id: "phrases", label: "Frases", icon: "💬" },
		{ id: "quick", label: "Rápido", icon: "⚡" },
		{ id: "settings", label: "Ajustes", icon: "⚙️" },
	] as const;

	return (
		<div className={`min-h-screen flex flex-col text-slate-800 ${isCalm ? "bg-[linear-gradient(180deg,#f7fbff_0%,#f2f8ff_46%,#f8fbff_100%)]" : "bg-[linear-gradient(180deg,#fffaf5_0%,#fff5f0_44%,#f3f9ff_100%)]"}`}>
			<header className={`fixed left-0 right-0 top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/95 px-4 shadow-sm backdrop-blur-sm ${isCalm ? "border-sky-100" : "border-orange-200"}`}>
				<h1 className="text-lg font-black tracking-tight text-slate-900">Mi Comunicador</h1>
				<div className="ml-auto rounded-xl bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{activeProfile?.name ?? "Perfil"}</div>
			</header>

			<div className={`fixed left-0 right-0 top-14 z-20 flex h-12 items-center gap-2 overflow-x-auto border-b px-3 backdrop-blur-sm ${isCalm ? "border-rose-100 bg-rose-50/90" : "border-orange-100 bg-orange-50/90"}`}>
				{urgencyItems.map(item => (
					<button
						key={item.id}
						onClick={() => {
							addToSentence(item);
							speak(item.word);
						}}
						className="shrink-0 rounded-xl border border-rose-200 bg-white px-3 py-1 text-xs font-bold text-rose-700"
					>
						{item.word}
					</button>
				))}
			</div>

			<main className="flex-1 overflow-y-auto pt-[104px] pb-44">
				{activeTab === "boards" && (
					<div className="flex min-h-full flex-col md:flex-row">
						<div className={`flex gap-2 overflow-x-auto border-b bg-white/90 p-3 md:w-72 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r ${isCalm ? "border-sky-100" : "border-orange-200"}`}>
							{boardOrder.map(boardId => {
								const board = boardsById[boardId];
								if (!board) return null;
								return (
									<button
										key={board.id}
										onClick={() => jumpToBoard(board.id)}
										className={`min-h-11 rounded-2xl border-2 px-4 py-2 text-sm font-extrabold transition ${
											activeBoard.id === board.id
												? `${board.colorClass} scale-[1.02] shadow-md`
												: isCalm
												? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
												: "border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100"
										}`}
									>
										{board.name}
									</button>
								);
							})}
						</div>

						<div className="flex-1 p-3 md:p-6">
							<div className="mb-3 flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-2 shadow-sm">
								<Search size={18} className="text-slate-400" />
								<input
									type="text"
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									placeholder="Buscar pictograma"
									className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
								/>
								{searchTerm && (
									<button onClick={() => setSearchTerm("")} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
										<X size={16} />
									</button>
								)}
							</div>

							{!normalizedQuery && boardHistory.length > 1 && (
								<button onClick={goBackBoard} className="mb-3 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
									Volver
								</button>
							)}

							<h2 className="mb-4 text-2xl font-black tracking-tight text-slate-900">
								{normalizedQuery ? `Resultados (${visiblePictograms.length}) para "${searchTerm}"` : `Tablero: ${activeBoard.name}`}
							</h2>

							{isTherapistMode && !normalizedQuery && (
								<div className="mb-4 flex flex-wrap gap-2">
									<button onClick={renameActiveBoard} className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Renombrar tablero</button>
									<button onClick={addSpeakCellToActiveBoard} className="rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-800 hover:bg-emerald-200">Agregar celda</button>
									<button onClick={createSubBoardFromActive} className="rounded-xl border border-cyan-300 bg-cyan-100 px-3 py-1.5 text-sm font-bold text-cyan-900 hover:bg-cyan-200">Crear subtablero</button>
									<button onClick={addNavigateCellToActiveBoard} className="rounded-xl border border-indigo-300 bg-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-900 hover:bg-indigo-200">Agregar acceso</button>
								</div>
							)}

							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
								{normalizedQuery
									? visiblePictograms.map(pic => (
											<PictogramCard key={pic.id} pictogram={pic} color={activeBoard.colorClass} onClick={addToSentence} />
										))
									: activeBoard.cells.map(cell =>
											cell.type === "speak" ? (
												<div key={cell.id} className="relative">
													<PictogramCard
														pictogram={{ id: cell.id, word: cell.label, iconName: cell.iconName }}
														color={activeBoard.colorClass}
														onClick={() => addToSentence({ id: cell.id, word: cell.label, iconName: cell.iconName })}
													/>
													<button
														onClick={e => speakSingle(e, cell.label)}
														className="absolute right-1.5 top-1.5 z-20 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
													>
														<Volume2 size={18} />
													</button>
													{isTherapistMode && (
														<div className="absolute bottom-2 left-2 right-2 z-10 flex gap-1">
															<button onClick={e => { e.stopPropagation(); editCell(cell.id); }} className="flex-1 rounded-lg border border-slate-300 bg-white/95 px-2 py-1 text-[11px] font-bold text-slate-700">Editar</button>
															<button onClick={e => { e.stopPropagation(); removeCell(cell.id); }} className="rounded-lg border border-rose-300 bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700">Borrar</button>
														</div>
													)}
												</div>
											) : (
												<button
													key={cell.id}
													onClick={() => cell.targetBoardId && openBoard(cell.targetBoardId)}
													className={`group relative flex min-h-36 flex-col items-center justify-center rounded-3xl border-2 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 ${isCalm ? "border-cyan-100 hover:border-cyan-300" : "border-orange-100 hover:border-orange-300"}`}
												>
													<PictogramIcon name={cell.iconName} className="mb-2" />
													<span className="text-sm font-extrabold text-slate-800">{cell.label}</span>
													<ChevronRight className="absolute right-2 top-2 text-cyan-600" size={18} />
													{isTherapistMode && (
														<div className="absolute bottom-2 left-2 right-2 z-10 flex gap-1">
															<button onClick={e => { e.stopPropagation(); editCell(cell.id); }} className="flex-1 rounded-lg border border-slate-300 bg-white/95 px-2 py-1 text-[11px] font-bold text-slate-700">Editar</button>
															<button onClick={e => { e.stopPropagation(); removeCell(cell.id); }} className="rounded-lg border border-rose-300 bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700">Borrar</button>
														</div>
													)}
												</button>
											)
										)}
							</div>
						</div>
					</div>
				)}

				{activeTab === "phrases" && (
					<div className="flex flex-col gap-4 p-4 md:mx-auto md:max-w-2xl">
						<div className={`rounded-2xl border p-3 ${isCalm ? "border-slate-200 bg-white/80" : "border-orange-200 bg-orange-50/60"}`}>
							<div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Ayuda para crear frase</div>
							<div className="mb-2.5 -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
								{connectorWords.map(word => (
									<button
										key={`connector-${word}`}
										onClick={() => addCustomWord(word)}
										className={`min-h-9 shrink-0 snap-start rounded-xl border px-3 py-1.5 text-sm font-bold transition ${isCalm ? "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100" : "border-orange-300 bg-orange-100 text-orange-900 hover:bg-orange-200"}`}
									>
										{word}
									</button>
								))}
							</div>
							<div className="flex gap-2">
								<input
									type="text"
									value={customWordInput}
									onChange={e => setCustomWordInput(e.target.value)}
									onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomWordFromInput(); } }}
									placeholder="Escribe una palabra y agrégala"
									className="min-h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
								/>
								<button
									onClick={addCustomWordFromInput}
									className="min-h-10 rounded-xl border border-emerald-300 bg-emerald-100 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-200"
								>
									Agregar
								</button>
							</div>
						</div>

						{favorites.length === 0 ? (
							<div className={`rounded-2xl border p-8 text-center ${isCalm ? "border-slate-200 bg-white/80" : "border-orange-200 bg-orange-50/60"}`}>
								<p className="text-sm font-medium text-slate-500">Todavía no hay frases guardadas.</p>
								<p className="mt-1 text-xs text-slate-400">Arma una frase y toca Guardar.</p>
							</div>
						) : (
							<div className="flex flex-col gap-3">
								<div className="text-xs font-bold uppercase tracking-wide text-slate-500">Frases guardadas</div>
								{favorites.map(fav => {
									const text = fav.items.map(p => p.word).join(" ");
									return (
										<div key={fav.id} className={`rounded-2xl border bg-white p-3 shadow-sm ${isCalm ? "border-slate-200" : "border-orange-200"}`}>
											<div className="mb-2.5 flex items-start gap-2">
												<button
													onClick={() => {
														setSentence(fav.items.map(p => ({ ...p })));
														speak(text);
													}}
													className={`flex-1 rounded-xl border px-3 py-2.5 text-left text-sm font-bold shadow-sm transition hover:brightness-95 ${fav.colorClass}`}
												>
													{text}
												</button>
												<button
													onClick={() => { deleteAudio(fav.id).catch(() => {}); persistFavorites(favorites.filter(f => f.id !== fav.id)); }}
													className="rounded-xl border border-rose-300 bg-rose-100 p-2.5 text-rose-600 transition hover:bg-rose-200"
													aria-label="Eliminar frase"
												>
													<X size={16} />
												</button>
											</div>

											<div className="flex flex-wrap gap-2">
												{recordingFavoriteId === fav.id ? (
													<button
														onClick={stopRecordingFavorite}
														className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-400 bg-rose-100 px-3 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-200"
													>
														<Square size={16} />
														Detener grabación
													</button>
												) : (
													<button
														onClick={() => startRecordingFavorite(fav.id)}
														className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${hasAudio[fav.id] ? "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100" : "border-cyan-400 bg-cyan-100 text-cyan-900 hover:bg-cyan-200"}`}
													>
														<Mic size={16} />
														{hasAudio[fav.id] ? "Volver a grabar" : "Grabar voz familiar"}
													</button>
												)}

												{hasAudio[fav.id] && (
													<button
														onClick={() => playFavoriteRecording(fav.id)}
														className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-200"
													>
														<Play size={15} />
														Escuchar
													</button>
												)}

												<button
													onClick={() => setSentence(prev => [...prev, ...fav.items.map(p => ({ ...p }))])}
													className="flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-100 px-3 py-2.5 text-sm font-bold text-indigo-800 transition hover:bg-indigo-200"
												>
													+ Agregar
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}

				{activeTab === "quick" && (
					<div className="p-4 md:mx-auto md:max-w-2xl">
						<h2 className="mb-4 text-xl font-black tracking-tight text-slate-900">Acceso rápido</h2>
						<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
							{quickAccess.map(pic => (
								<PictogramCard key={`qt-${pic.id}`} pictogram={pic} color={isCalm ? "border-sky-200 bg-white" : "border-orange-200 bg-white"} onClick={() => { addToSentence(pic); speak(pic.word); }} />
							))}
						</div>
					</div>
				)}

				{activeTab === "settings" && (
					<div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 sm:mx-auto sm:max-w-xl">
						<h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">Configuración</h2>

						<section className={`rounded-2xl border p-3 sm:p-4 ${isCalm ? "border-slate-200 bg-white" : "border-orange-200 bg-white"}`}>
							<div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Perfiles</div>
							<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
								<select
									value={activeProfile?.id}
									onChange={e => {
										setActiveProfileId(e.target.value);
										setSentence([]);
									}}
									className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 sm:flex-1 sm:min-w-max"
								>
									{profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
								</select>
								<button onClick={addProfile} className="rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-200 sm:flex-1">+ Agregar</button>
								<button onClick={removeProfile} disabled={profiles.length <= 1} className="rounded-xl border border-rose-300 bg-rose-100 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1">Eliminar</button>
							</div>
						</section>

						<section className={`rounded-2xl border p-3 sm:p-4 ${isCalm ? "border-slate-200 bg-white" : "border-orange-200 bg-white"}`}>
							<div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Modo visual</div>
							<div className="flex rounded-2xl border-2 border-slate-200 bg-white p-1 shadow-sm" role="group">
								<button onClick={() => handleUiModeChange("calma")} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition ${isCalm ? "bg-sky-100 text-sky-800" : "text-slate-600 hover:bg-slate-100"}`}>Calma</button>
								<button onClick={() => handleUiModeChange("color")} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition ${!isCalm ? "bg-orange-100 text-orange-800" : "text-slate-600 hover:bg-slate-100"}`}>Color</button>
							</div>
						</section>

						<section className={`rounded-2xl border p-3 sm:p-4 ${isCalm ? "border-slate-200 bg-white" : "border-orange-200 bg-white"}`}>
							<div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Voz y velocidad</div>
							<div className="mb-3 flex gap-2 flex-col sm:flex-row">
								{([
									{ rate: 0.72, label: "Lenta" },
									{ rate: 0.8, label: "Media" },
									{ rate: 0.92, label: "Normal" },
								] as { rate: number; label: string }[]).map(({ rate, label }) => (
									<button
										key={rate}
										onClick={() => handleSpeechRateChange(rate)}
										className={`flex-1 rounded-xl px-3 py-2 sm:py-2.5 text-sm font-bold transition ${
											(rate === 0.72 && speechRate <= 0.74) || (rate === 0.8 && speechRate > 0.74 && speechRate < 0.9) || (rate === 0.92 && speechRate >= 0.9)
												? isCalm
													? "bg-sky-100 text-sky-800"
													: "bg-orange-100 text-orange-800"
												: "bg-slate-50 text-slate-600 hover:bg-slate-100"
										}`}
									>
										{label}
									</button>
								))}
							</div>

							{limitedVoices.length > 0 ? (
								<select
									value={preferredVoiceURI}
									onChange={e => setPreferredVoiceURI(e.target.value)}
									className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
								>
									{limitedVoices.map(voice => (
										<option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
									))}
								</select>
							) : (
								<p className="text-sm text-slate-500">No se encontraron voces Laura/Pablo ni una voz femenina es-ES.</p>
							)}
						</section>

						<section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3 sm:p-4">
							<div className="mb-3 text-xs font-bold uppercase tracking-wide text-cyan-700">Modo terapeuta</div>
							{isTherapistMode ? (
								<div className="flex flex-col gap-3">
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
										<span className="w-fit rounded-lg bg-cyan-200 px-2.5 py-1 text-xs font-black text-cyan-900">Activo</span>
										<button onClick={() => setIsTherapistMode(false)} className="flex-1 rounded-xl border border-cyan-300 bg-white px-3 py-2 text-sm font-bold text-cyan-800 hover:bg-cyan-100 sm:flex-none">
											Salir del modo terapeuta
										</button>
										{pinStep === "idle" && (
											<button onClick={() => { setPinInput(""); setPinError(""); setPendingPin(""); setPinStep("change-current"); }} className="flex-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
												Cambiar PIN
											</button>
										)}
									</div>
									<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
										<input
											type="text"
											value={therapistName}
											onChange={e => setTherapistName(e.target.value)}
											placeholder="Nombre del logopeda"
											className="rounded-xl border border-cyan-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
										/>
										<input
											type="text"
											value={therapistLicense}
											onChange={e => setTherapistLicense(e.target.value)}
											placeholder="Nro colegiado"
											className="rounded-xl border border-cyan-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
										/>
									</div>
									<textarea
										value={therapistNotes}
										onChange={e => setTherapistNotes(e.target.value)}
										placeholder="Observaciones clínicas (opcional, se incluye en el PDF)"
										rows={3}
										className="rounded-xl border border-cyan-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
									/>
								</div>
						) : pinStep !== "idle" ? (
							<div className="flex flex-col gap-2">
								<p className="text-sm font-semibold text-cyan-800">
									{pinStep === "enter" && "Ingresa tu PIN:"}
									{pinStep === "new1" && "Crea un PIN (min. 4 caracteres):"}
									{pinStep === "new2" && "Confirma el PIN:"}
									{pinStep === "change-current" && "Ingresa el PIN actual:"}
									{pinStep === "change-new1" && "Nuevo PIN (min. 4 caracteres):"}
									{pinStep === "change-new2" && "Confirma el nuevo PIN:"}
								</p>
								<input
									type="password"
									value={pinInput}
									autoFocus
									onChange={e => { setPinInput(e.target.value); setPinError(""); }}
									onKeyDown={e => e.key === "Enter" && void handlePinSubmit()}
									placeholder="****"
									className="rounded-xl border border-cyan-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
								/>
								{pinError && <p className="text-xs font-semibold text-rose-600">{pinError}</p>}
								<div className="flex gap-2">
									<button onClick={() => void handlePinSubmit()} className="flex-1 rounded-xl border-2 border-cyan-400 bg-cyan-400 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500">Confirmar</button>
									<button onClick={cancelPinFlow} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
								</div>
								{pinStep === "enter" && (
									<button onClick={resetPin} className="text-xs font-semibold text-slate-400 underline hover:text-rose-600">Olvidaste el PIN? Restablecer</button>
								)}
							</div>
						) : (
							<button onClick={openTherapistMode} className="w-full rounded-xl border-2 border-cyan-300 bg-white px-4 py-3 text-sm font-bold text-cyan-800 transition hover:bg-cyan-50">
									Entrar con PIN
							</button>
						)}
						</section>

						{isTherapistMode && (
							<section className={`rounded-2xl border p-3 sm:p-4 ${isCalm ? "border-slate-200 bg-white" : "border-orange-200 bg-white"}`}>
								<div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
									<div className="text-xs font-bold uppercase tracking-wide text-slate-500">Registro de sesión</div>
									<div className="flex gap-2">
										<button onClick={() => downloadSessionPdf()} disabled={filteredSessionLog.length === 0} className="rounded-lg border border-indigo-300 bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-800 hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50">Descargar PDF</button>
										{filteredSessionLog.length > 0 && (
											<button
												onClick={() => {
													const label = reportRange === "all" ? "TODO el historial" : `el período "${getRangeLabel(reportRange)}"`;
													if (!window.confirm(`¿Borrar ${label}? Esta acción no se puede deshacer.`)) return;
													setSessionLog(prev => deleteFilteredEntries(prev, filteredSessionLog));
												}}
												className="rounded-lg border border-rose-300 bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-200"
											>
												{reportRange === "all" ? "Borrar todo" : "Borrar período"}
											</button>
										)}
									</div>
								</div>
								<div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
									<button onClick={() => setReportRange("today")} className={`rounded-lg border px-2 py-1 text-xs font-bold ${reportRange === "today" ? "border-sky-300 bg-sky-100 text-sky-800" : "border-slate-200 bg-white text-slate-600"}`}>Hoy</button>
									<button onClick={() => setReportRange("7d")} className={`rounded-lg border px-2 py-1 text-xs font-bold ${reportRange === "7d" ? "border-sky-300 bg-sky-100 text-sky-800" : "border-slate-200 bg-white text-slate-600"}`}>7 días</button>
									<button onClick={() => setReportRange("30d")} className={`rounded-lg border px-2 py-1 text-xs font-bold ${reportRange === "30d" ? "border-sky-300 bg-sky-100 text-sky-800" : "border-slate-200 bg-white text-slate-600"}`}>30 días</button>
									<button onClick={() => setReportRange("all")} className={`rounded-lg border px-2 py-1 text-xs font-bold ${reportRange === "all" ? "border-sky-300 bg-sky-100 text-sky-800" : "border-slate-200 bg-white text-slate-600"}`}>Todo</button>
									<button onClick={() => setReportRange("custom")} className={`rounded-lg border px-2 py-1 text-xs font-bold ${reportRange === "custom" ? "border-sky-300 bg-sky-100 text-sky-800" : "border-slate-200 bg-white text-slate-600"}`}>Personalizado</button>
								</div>
								{reportRange === "custom" && (
									<div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
										<input type="date" value={customRangeStart} onChange={e => setCustomRangeStart(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" />
										<input type="date" value={customRangeEnd} onChange={e => setCustomRangeEnd(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" />
									</div>
								)}
								<div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
									<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
										<div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Frases visibles</div>
										<div className="text-lg font-black text-slate-800">{filteredSessionLog.length}</div>
									</div>
									<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
										<div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Frases únicas</div>
										<div className="text-lg font-black text-slate-800">{phraseUsage.length}</div>
									</div>
									<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
										<div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Vocabulario activo</div>
										<div className="text-lg font-black text-slate-800">{wordUsage.length}</div>
									</div>
								</div>
								{phraseUsage.length > 0 && (
									<p className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-900">
										{activeProfile?.name ?? "Perfil"}, período {getRangeLabel(reportRange)}: comunicó {filteredSessionLog.length} frases para el reporte, las 3 más usadas fueron {phraseUsage.slice(0, 3).map(([phrase]) => phrase).join(" / ")}.
									</p>
								)}
								{sessionLog.length === 0 ? (
									<p className="text-sm text-slate-400">No hay frases comunicadas todavía.</p>
								) : filteredSessionLog.length === 0 ? (
									<p className="text-sm text-slate-400">No hay frases en el período seleccionado.</p>
								) : (
									<div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
										{[...filteredSessionLog].reverse().map((entry) => (
										<div key={entry.timestamp} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
										<span className="mt-0.5 shrink-0 font-mono text-xs text-slate-400">{new Date(entry.timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
										<span className="text-sm font-semibold text-slate-700">{entry.phrase}</span>
										</div>
										))}
									</div>
								)}
								{sessionGroups.length > 0 && (
									<div className="mt-4">
										<div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Exportar por sesión</div>
										<div className="flex flex-col gap-2">
											{sessionGroups.map((session, index) => {
												const labelDate = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(session.start));
												const startTime = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(session.start));
												const endTime = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(session.end));
												const sessionLabel = `sesion-${sessionGroups.length - index}`;
												return (
													<div key={session.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
														<div className="text-sm font-bold text-slate-700">Sesión {sessionGroups.length - index}</div>
														<div className="text-xs font-semibold text-slate-500">{labelDate} · {startTime} - {endTime} · {session.entries.length} frases</div>
														<button
															onClick={() => downloadSessionPdf(session.entries, `sesión ${sessionGroups.length - index}`, sessionLabel)}
															className="ml-auto rounded-lg border border-indigo-300 bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-800 hover:bg-indigo-200"
														>
															PDF sesión
														</button>
													</div>
												);
											})}
										</div>
									</div>
								)}
								<div className="mt-4">
									<div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Progreso por perfil (vocabulario activo)</div>
									<div className="grid gap-2 sm:grid-cols-2">
										{profileVocabularyStats.map(stat => (
											<div key={stat.profileId} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
												<div className="text-sm font-black text-slate-800">{stat.profileName}</div>
												<div className="text-xs font-semibold text-slate-600">Frases: {stat.phrasesCount} · Vocabulario activo: {stat.activeVocabulary}</div>
											</div>
										))}
									</div>
								</div>
							</section>
						)}
					</div>
				)}
			</main>

			<div className={`fixed bottom-16 left-0 right-0 z-20 border-t bg-white/97 px-3 py-2 shadow-md backdrop-blur-sm ${isCalm ? "border-sky-100" : "border-orange-100"} ${isSentenceSpeaking ? "ring-2 ring-inset ring-emerald-200" : ""}`}>
				<div className="-mx-1 mb-2 flex snap-x snap-mandatory items-start gap-2 overflow-x-auto px-1 pb-1 pt-0.5 scroll-smooth">
					{sentence.length === 0 ? (
						<p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400">Toca un pictograma para armar tu frase...</p>
					) : (
						sentence.map((pic, index) => (
							<div
								key={`${pic.id}-${index}`}
								onClick={speakSentence}
								role="button"
								tabIndex={0}
								onKeyDown={e => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										speakSentence();
									}
								}}
								className={`relative flex min-h-[72px] min-w-[84px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border bg-white px-2 py-2 pr-7 shadow-sm transition active:scale-[0.98] ${isCalm ? "border-sky-200" : "border-orange-200"} ${isSentenceSpeaking ? "scale-[1.03] animate-pulse border-emerald-300" : ""}`}
							>
								<button onClick={e => { e.stopPropagation(); removeSentenceItem(index); }} className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-rose-400 bg-rose-500 text-white shadow-sm transition hover:bg-rose-600" aria-label={`Quitar ${pic.word}`}>
									<X size={10} strokeWidth={3} aria-hidden="true" />
								</button>
								<PictogramIcon name={pic.iconName} className="scale-75" />
								<span className="mt-0.5 line-clamp-2 text-center text-[11px] font-bold leading-tight text-slate-700">{pic.word}</span>
							</div>
						))
					)}
				</div>

				<div className="flex gap-2">
					<button onClick={removeLast} disabled={sentence.length === 0} className={`flex min-h-9 items-center justify-center rounded-xl border-2 px-3 font-bold text-slate-700 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${isCalm ? "border-slate-300 bg-slate-100 hover:bg-slate-200" : "border-orange-300 bg-orange-100 hover:bg-orange-200"}`}>
						<Delete size={18} />
					</button>
					<button onClick={clearSentence} disabled={sentence.length === 0} className="flex min-h-9 items-center justify-center rounded-xl border-2 border-rose-200 bg-rose-50 px-3 text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45">
						<Trash2 size={18} className="text-rose-600" />
					</button>
					<button onClick={speakSentence} disabled={sentence.length === 0} className={`flex min-h-9 flex-1 items-center justify-center gap-2 rounded-xl border-2 font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${isCalm ? "border-emerald-400 bg-emerald-400 hover:bg-emerald-500" : "border-cyan-400 bg-cyan-400 hover:bg-cyan-500"}`}>
						<Play size={17} />
						<span className="text-sm">Hablar</span>
					</button>
					<button onClick={saveFavorite} className={`flex min-h-9 items-center justify-center rounded-xl border-2 px-3 text-sm font-bold shadow-sm transition ${isCalm ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100" : "border-pink-300 bg-pink-100 text-pink-800 hover:bg-pink-200"}`}>
						Guardar
					</button>
				</div>

				{showSavedNotice && <div className="mt-1.5 rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Frase guardada ✓</div>}
			</div>

			<nav className={`fixed bottom-0 left-0 right-0 z-30 flex h-16 border-t bg-white/97 backdrop-blur-sm ${isCalm ? "border-sky-100" : "border-orange-200"}`}>
				{tabs.map(tab => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition ${
							activeTab === tab.id
								? isCalm
									? "border-t-2 border-sky-500 text-sky-700"
									: "border-t-2 border-orange-500 text-orange-700"
								: "text-slate-500 hover:text-slate-700"
						}`}
					>
						<span className="text-xl">{tab.icon}</span>
						<span className="text-[11px] font-bold">{tab.label}</span>
					</button>
				))}
			</nav>
		</div>
	);
}

export default App;
