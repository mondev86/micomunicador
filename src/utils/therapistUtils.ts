export type SessionEntry = {
	phrase: string;
	timestamp: number;
};

export type ReportRange = "today" | "7d" | "30d" | "all" | "custom";

/** Hashes a PIN using SHA-256 with a fixed app salt. */
export async function hashPin(pin: string): Promise<string> {
	const data = new TextEncoder().encode(`comunicador-pwa:${pin}`);
	const buffer = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(buffer))
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
}

/** Returns true if value looks like a SHA-256 hex digest (64 lowercase hex chars). */
export function isHashedPin(value: string): boolean {
	return /^[0-9a-f]{64}$/.test(value);
}

export function getRangeLabel(range: ReportRange): string {
	switch (range) {
		case "today":
			return "hoy";
		case "7d":
			return "últimos 7 días";
		case "30d":
			return "últimos 30 días";
		case "custom":
			return "rango personalizado";
		default:
			return "todo el histórico";
	}
}

export function filterEntriesByRange(
	entries: SessionEntry[],
	range: ReportRange,
	opts: { customRangeStart?: string; customRangeEnd?: string; now?: number } = {}
): SessionEntry[] {
	if (entries.length === 0) return entries;
	const now = opts.now ?? Date.now();
	if (range === "all") return entries;
	if (range === "today") {
		const dayStart = new Date(now);
		dayStart.setHours(0, 0, 0, 0);
		return entries.filter(e => e.timestamp >= dayStart.getTime());
	}
	if (range === "7d") {
		return entries.filter(e => e.timestamp >= now - 7 * 24 * 60 * 60 * 1000);
	}
	if (range === "30d") {
		return entries.filter(e => e.timestamp >= now - 30 * 24 * 60 * 60 * 1000);
	}
	// custom
	const start = opts.customRangeStart
		? new Date(`${opts.customRangeStart}T00:00:00`).getTime()
		: Number.NEGATIVE_INFINITY;
	const end = opts.customRangeEnd
		? new Date(`${opts.customRangeEnd}T23:59:59.999`).getTime()
		: Number.POSITIVE_INFINITY;
	return entries.filter(e => e.timestamp >= start && e.timestamp <= end);
}

/**
 * Returns the session log minus every entry that appears in filtered.
 * Matching is done by timestamp (unique per entry).
 */
export function deleteFilteredEntries(
	log: SessionEntry[],
	filtered: SessionEntry[]
): SessionEntry[] {
	const ts = new Set(filtered.map(e => e.timestamp));
	return log.filter(e => !ts.has(e.timestamp));
}
