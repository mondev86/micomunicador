import { cloudFetch, getCloudToken, isApiConfigured } from "./cloudApiClient";
import { loadAudio, saveAudio } from "./audioDB";

export type StorageSnapshot = Record<string, string>;

export type RemoteRecording = {
	profileId: string;
	favoriteId: string;
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

export function applySyncableStorageSnapshot(snapshot: StorageSnapshot): void {
	if (typeof window === "undefined") return;
	for (let index = 0; index < window.localStorage.length; index += 1) {
		const key = window.localStorage.key(index);
		if (!key || !isSyncableKey(key)) continue;
		window.localStorage.removeItem(key);
		index -= 1;
	}
	for (const [key, value] of Object.entries(snapshot)) {
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
	const payload = await cloudFetch<{ payload: StorageSnapshot }>("/api/state", { method: "GET" });
	return payload.payload ?? null;
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
	blob: Blob
): Promise<void> {
	void userId;
	if (!hasCloudSync()) return;
	await cloudFetch<{ ok: boolean }>(`/api/recordings/${encodeURIComponent(profileId)}/${encodeURIComponent(favoriteId)}`, {
		method: "PUT",
		body: JSON.stringify({
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
	const data = await cloudFetch<{ recordings: Array<{ profileId: string; favoriteId: string; mimeType: string; dataUrl: string }> }>("/api/recordings", {
		method: "GET",
	});
	for (const record of data.recordings ?? []) {
		await saveAudio(record.favoriteId, dataUrlToBlob(record.dataUrl, record.mimeType || "audio/webm"));
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
			const blob = await loadAudio(favoriteId);
			if (blob) {
				await upsertRemoteRecording(userId, profileId, favoriteId, blob);
			}
		}
	}
}