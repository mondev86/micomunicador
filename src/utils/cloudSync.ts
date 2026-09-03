import { cloudFetch, getCloudToken, isApiConfigured } from "./cloudApiClient";
import { loadAudioRecord, saveAudio, type RecordingOwner } from "./audioDB";

export type StorageSnapshot = Record<string, string>;

export type RemoteRecording = {
	profileId: string;
	favoriteId: string;
	voiceOwner: RecordingOwner;
	mimeType: string;
	dataUrl: string;
};

const STATIC_KEYS = [
	"child-profiles",
	"active-profile-id",
	"therapist-name",
	"therapist-license",
	"therapist-notes",
	"preferred-voice-uri",
];

const PREFIXES = ["boards:", "favorites:", "session-log:"];

const isSyncableKey = (key: string) => STATIC_KEYS.includes(key) || PREFIXES.some(prefix => key.startsWith(prefix));

function normalizeStoredText(value: unknown): string {
	if (typeof value !== "string") return "";
	const trimmed = value.trim();
	if (trimmed === "null" || trimmed === "undefined") return "";
	return value;
}

function normalizeStorageSnapshot(snapshot: unknown): StorageSnapshot {
	if (!snapshot || typeof snapshot !== "object") return {};
	const normalized: StorageSnapshot = {};
	for (const [key, value] of Object.entries(snapshot as Record<string, unknown>)) {
		if (!isSyncableKey(key)) continue;
		normalized[key] = normalizeStoredText(value);
	}
	return normalized;
}

export function captureSyncableStorageSnapshot(): StorageSnapshot {
	if (typeof window === "undefined") return {};
	const snapshot: StorageSnapshot = {};
	for (let index = 0; index < window.localStorage.length; index += 1) {
		const key = window.localStorage.key(index);
		if (!key || !isSyncableKey(key)) continue;
		const value = window.localStorage.getItem(key);
		if (value !== null) snapshot[key] = value;
	}
	return snapshot;
}

export function sanitizeSyncableStorage(): boolean {
	if (typeof window === "undefined") return false;
	const currentSnapshot = captureSyncableStorageSnapshot();
	const normalizedSnapshot = normalizeStorageSnapshot(currentSnapshot);
	const currentKeys = Object.keys(currentSnapshot).sort();
	const normalizedKeys = Object.keys(normalizedSnapshot).sort();
	const keysChanged = currentKeys.length !== normalizedKeys.length || currentKeys.some((key, index) => key !== normalizedKeys[index]);
	const valuesChanged = normalizedKeys.some(key => currentSnapshot[key] !== normalizedSnapshot[key]);
	if (!keysChanged && !valuesChanged) return false;
	applySyncableStorageSnapshot(normalizedSnapshot);
	return true;
}

export function applySyncableStorageSnapshot(snapshot: StorageSnapshot): void {
	if (typeof window === "undefined") return;
	const normalizedSnapshot = normalizeStorageSnapshot(snapshot);
	for (let index = 0; index < window.localStorage.length; index += 1) {
		const key = window.localStorage.key(index);
		if (!key || !isSyncableKey(key)) continue;
		window.localStorage.removeItem(key);
		index -= 1;
	}
	for (const [key, value] of Object.entries(normalizedSnapshot)) {
		if (isSyncableKey(key)) {
			window.localStorage.setItem(key, value);
		}
	}
}

export function hasCloudSync(): boolean {
	return isApiConfigured() && Boolean(getCloudToken());
}

export async function loadRemoteStorageSnapshot(userId: string): Promise<StorageSnapshot | null> {
	void userId;
	if (!hasCloudSync()) return null;
	const payload = await cloudFetch<{ payload: unknown }>("/api/state", { method: "GET" });
	return normalizeStorageSnapshot(payload.payload);
}

export async function saveRemoteStorageSnapshot(userId: string, snapshot: StorageSnapshot): Promise<void> {
	void userId;
	if (!hasCloudSync()) return;
	await cloudFetch<{ ok: boolean }>("/api/state", {
		method: "PUT",
		body: JSON.stringify({ payload: snapshot }),
	});
}

function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(String(reader.result ?? ""));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

function dataUrlToBlob(dataUrl: string, fallbackType: string): Blob {
	const [header, base64] = dataUrl.split(",");
	const mimeMatch = /data:([^;]+);base64/.exec(header ?? "");
	const mimeType = mimeMatch?.[1] ?? fallbackType;
	const binary = atob(base64 ?? "");
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return new Blob([bytes], { type: mimeType });
}

export async function upsertRemoteRecording(
	userId: string,
	profileId: string,
	favoriteId: string,
	blob: Blob,
	voiceOwner: RecordingOwner = "family"
): Promise<void> {
	void userId;
	if (!hasCloudSync()) return;
	await cloudFetch<{ ok: boolean }>(`/api/recordings/${encodeURIComponent(profileId)}/${encodeURIComponent(favoriteId)}`, {
		method: "PUT",
		body: JSON.stringify({
			voiceOwner,
			mimeType: blob.type || "audio/webm",
			dataUrl: await blobToDataUrl(blob),
		}),
	});
}

export async function deleteRemoteRecording(userId: string, profileId: string, favoriteId: string): Promise<void> {
	void userId;
	if (!hasCloudSync()) return;
	await cloudFetch<{ ok: boolean }>(`/api/recordings/${encodeURIComponent(profileId)}/${encodeURIComponent(favoriteId)}`, {
		method: "DELETE",
	});
}

export async function loadRemoteRecording(userId: string, profileId: string, favoriteId: string): Promise<Blob | null> {
	void userId;
	if (!hasCloudSync()) return null;
	try {
		const data = await cloudFetch<{ mimeType: string; dataUrl: string }>(`/api/recordings/${encodeURIComponent(profileId)}/${encodeURIComponent(favoriteId)}`, {
			method: "GET",
		});
		return dataUrlToBlob(data.dataUrl, data.mimeType || "audio/webm");
	} catch {
		return null;
	}
}

export async function restoreRemoteRecordingsToLocal(userId: string): Promise<void> {
	void userId;
	if (!hasCloudSync()) return;
	const data = await cloudFetch<{ recordings: RemoteRecording[] }>("/api/recordings", {
		method: "GET",
	});
	for (const record of data.recordings ?? []) {
		await saveAudio(
			record.favoriteId,
			dataUrlToBlob(record.dataUrl, record.mimeType || "audio/webm"),
			record.voiceOwner || "family"
		);
	}
}

export async function syncLocalRecordingsToRemote(userId: string): Promise<void> {
	if (!hasCloudSync() || typeof window === "undefined") return;
	const favoritesKeys: string[] = [];
	for (let index = 0; index < window.localStorage.length; index += 1) {
		const key = window.localStorage.key(index);
		if (key?.startsWith("favorites:")) favoritesKeys.push(key);
	}
	for (const favoritesKey of favoritesKeys) {
		const profileId = favoritesKey.slice("favorites:".length);
		const saved = window.localStorage.getItem(favoritesKey);
		if (!saved) continue;
		let parsed: unknown;
		try {
			parsed = JSON.parse(saved);
		} catch {
			continue;
		}
		if (!Array.isArray(parsed)) continue;
		for (const favorite of parsed) {
			if (!favorite || typeof favorite !== "object") continue;
			const favoriteId = typeof (favorite as { id?: unknown }).id === "string" ? (favorite as { id: string }).id : "";
			if (!favoriteId) continue;
			const record = await loadAudioRecord(favoriteId);
			if (record) {
				await upsertRemoteRecording(userId, profileId, favoriteId, record.blob, record.owner);
			}
		}
	}
}