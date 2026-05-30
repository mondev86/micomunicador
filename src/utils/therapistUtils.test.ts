import { describe, it, expect } from "vitest";
import {
	hashPin,
	isHashedPin,
	getRangeLabel,
	filterEntriesByRange,
	deleteFilteredEntries,
	type SessionEntry,
} from "./therapistUtils";

// ─── hashPin ─────────────────────────────────────────────────────────────────

describe("hashPin", () => {
	it("returns a 64-char lowercase hex string", async () => {
		const hash = await hashPin("1234");
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it("is deterministic — same PIN always produces the same hash", async () => {
		const h1 = await hashPin("mipin");
		const h2 = await hashPin("mipin");
		expect(h1).toBe(h2);
	});

	it("different PINs produce different hashes", async () => {
		const h1 = await hashPin("1234");
		const h2 = await hashPin("5678");
		expect(h1).not.toBe(h2);
	});

	it("includes the app salt so PINs are app-specific", async () => {
		// A raw SHA-256 of "1234" without salt would differ
		const withSalt = await hashPin("1234");
		expect(withSalt).toHaveLength(64);
		// Sanity: not the SHA-256 of bare "1234"
		expect(withSalt).not.toBe(
			"03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"
		);
	});
});

// ─── isHashedPin ─────────────────────────────────────────────────────────────

describe("isHashedPin", () => {
	it("returns true for a valid 64-char hex hash", async () => {
		const hash = await hashPin("1234");
		expect(isHashedPin(hash)).toBe(true);
	});

	it("returns false for a plaintext PIN", () => {
		expect(isHashedPin("1234")).toBe(false);
	});

	it("returns false for a 63-char string", () => {
		expect(isHashedPin("a".repeat(63))).toBe(false);
	});

	it("returns false for a 65-char string", () => {
		expect(isHashedPin("a".repeat(65))).toBe(false);
	});

	it("returns false for uppercase hex", () => {
		expect(isHashedPin("A".repeat(64))).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isHashedPin("")).toBe(false);
	});
});

// ─── getRangeLabel ───────────────────────────────────────────────────────────

describe("getRangeLabel", () => {
	it.each([
		["today", "hoy"],
		["7d", "últimos 7 días"],
		["30d", "últimos 30 días"],
		["custom", "rango personalizado"],
		["all", "todo el histórico"],
	] as const)('range "%s" → "%s"', (range, expected) => {
		expect(getRangeLabel(range)).toBe(expected);
	});
});

// ─── filterEntriesByRange ────────────────────────────────────────────────────

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

function makeEntry(offsetMs: number, now: number): SessionEntry {
	return { phrase: "test", timestamp: now + offsetMs };
}

describe("filterEntriesByRange", () => {
	const now = new Date("2026-05-30T12:00:00").getTime();

	const entries: SessionEntry[] = [
		{ phrase: "hoy temprano", timestamp: now - 2 * MS_HOUR },        // today
		{ phrase: "ayer", timestamp: now - 1 * MS_DAY },                  // yesterday (within 7d & 30d)
		{ phrase: "hace 6 días", timestamp: now - 6 * MS_DAY },           // within 7d & 30d
		{ phrase: "hace 8 días", timestamp: now - 8 * MS_DAY },           // within 30d only
		{ phrase: "hace 35 días", timestamp: now - 35 * MS_DAY },         // outside all ranges
	];

	it("returns all entries when range is 'all'", () => {
		expect(filterEntriesByRange(entries, "all", { now })).toHaveLength(5);
	});

	it("returns empty array when input is empty (any range)", () => {
		expect(filterEntriesByRange([], "all", { now })).toHaveLength(0);
		expect(filterEntriesByRange([], "today", { now })).toHaveLength(0);
	});

	it("filters to today only", () => {
		const result = filterEntriesByRange(entries, "today", { now });
		expect(result).toHaveLength(1);
		expect(result[0].phrase).toBe("hoy temprano");
	});

	it("filters to last 7 days", () => {
		const result = filterEntriesByRange(entries, "7d", { now });
		expect(result).toHaveLength(3); // 2h ago, 1d ago, 6d ago
	});

	it("filters to last 30 days", () => {
		const result = filterEntriesByRange(entries, "30d", { now });
		expect(result).toHaveLength(4); // all except 35d ago
	});

	it("filters by custom range (inclusive both ends)", () => {
		const result = filterEntriesByRange(entries, "custom", {
			now,
			customRangeStart: "2026-05-29", // yesterday
			customRangeEnd: "2026-05-29",
		});
		// Only the "ayer" entry falls exactly on 2026-05-29
		expect(result).toHaveLength(1);
		expect(result[0].phrase).toBe("ayer");
	});

	it("custom range with no start defaults to -Infinity", () => {
		const result = filterEntriesByRange(entries, "custom", {
			now,
			customRangeEnd: "2026-05-29",
		});
		// Entries up to end of 2026-05-29: everything except "hoy temprano" (2026-05-30)
		expect(result.every(e => e.phrase !== "hoy temprano")).toBe(true);
	});

	it("custom range with no end defaults to +Infinity", () => {
		const result = filterEntriesByRange(entries, "custom", {
			now,
			customRangeStart: "2026-05-30",
		});
		// Only entries from today onward
		expect(result).toHaveLength(1);
		expect(result[0].phrase).toBe("hoy temprano");
	});
});

// ─── deleteFilteredEntries ───────────────────────────────────────────────────

describe("deleteFilteredEntries", () => {
	const log: SessionEntry[] = [
		{ phrase: "a", timestamp: 1 },
		{ phrase: "b", timestamp: 2 },
		{ phrase: "c", timestamp: 3 },
		{ phrase: "d", timestamp: 4 },
	];

	it("removes exactly the filtered entries", () => {
		const filtered = [log[1], log[3]]; // b, d
		const result = deleteFilteredEntries(log, filtered);
		expect(result).toHaveLength(2);
		expect(result.map(e => e.phrase)).toEqual(["a", "c"]);
	});

	it("returns full log when filtered is empty", () => {
		expect(deleteFilteredEntries(log, [])).toHaveLength(4);
	});

	it("returns empty log when filtered equals log", () => {
		expect(deleteFilteredEntries(log, log)).toHaveLength(0);
	});

	it("does not mutate the original log", () => {
		const original = [...log];
		deleteFilteredEntries(log, [log[0]]);
		expect(log).toEqual(original);
	});
});
