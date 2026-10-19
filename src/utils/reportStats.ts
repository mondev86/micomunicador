import { SessionEntry } from "./therapistUtils";

// Grupo temporal de frases para exportes clínicos por sesión.
export type SessionGroup = {
	id: string;
	start: number;
	end: number;
	entries: SessionEntry[];
};

// Separa dos bloques de frases cuando pasa este tiempo entre pulsaciones.
export const SESSION_BREAK_MS = 45 * 60 * 1000;

export function buildSessionGroups(entries: SessionEntry[]): SessionGroup[] {
	if (entries.length === 0) return [] as SessionGroup[];
	const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
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
}

// Normaliza una frase a palabras en minúsculas, sin acentos ni símbolos.
const tokenizePhrase = (phrase: string): string[] => {
	const cleaned = phrase
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s]/g, " ");
	return cleaned.split(/\s+/).filter(token => token.length >= 2);
};

export function calculatePhraseUsage(entries: SessionEntry[]): [string, number][] {
	const counts = new Map<string, number>();
	for (const entry of entries) {
		const key = entry.phrase.trim();
		if (!key) continue;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function calculateWordUsage(entries: SessionEntry[]): [string, number][] {
	const counts = new Map<string, number>();
	for (const entry of entries) {
		for (const token of tokenizePhrase(entry.phrase)) {
			counts.set(token, (counts.get(token) ?? 0) + 1);
		}
	}
	return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function countUniqueWords(entries: SessionEntry[]): number {
	const words = new Set<string>();
	for (const entry of entries) {
		for (const token of tokenizePhrase(entry.phrase)) {
			words.add(token);
		}
	}
	return words.size;
}
