/**
 * audioDB — almacenamiento de grabaciones de audio en IndexedDB.
 * Evita el límite de 5 MB de localStorage al guardar blobs de audio.
 */

const DB_NAME = "comunicador-audio";
const STORE   = "recordings";
const DB_VERSION = 1;

export type RecordingOwner = "family" | "therapist";

export type AudioRecord = {
  blob: Blob;
  owner: RecordingOwner;
};

const DEFAULT_RECORDING_OWNER: RecordingOwner = "family";

function isStoredAudioRecord(value: unknown): value is AudioRecord {
  return Boolean(
    value &&
    typeof value === "object" &&
    "blob" in value &&
    (value as { blob?: unknown }).blob instanceof Blob &&
    "owner" in value &&
    ((value as { owner?: unknown }).owner === "family" || (value as { owner?: unknown }).owner === "therapist")
  );
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Guarda un Blob de audio asociado a un favoriteId. */
export async function saveAudio(favoriteId: string, blob: Blob, owner: RecordingOwner = DEFAULT_RECORDING_OWNER): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req   = store.put({ blob, owner }, favoriteId);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** Devuelve el Blob de audio, o null si no existe. */
export async function loadAudio(favoriteId: string): Promise<Blob | null> {
	const record = await loadAudioRecord(favoriteId);
	return record?.blob ?? null;
}

/** Devuelve el Blob de audio y su propietario, o null si no existe. */
export async function loadAudioRecord(favoriteId: string): Promise<AudioRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req   = store.get(favoriteId);
		req.onsuccess = () => {
			if (req.result instanceof Blob) {
				resolve({ blob: req.result, owner: DEFAULT_RECORDING_OWNER });
				return;
			}
			if (isStoredAudioRecord(req.result)) {
				resolve(req.result);
				return;
			}
			resolve(null);
		};
    req.onerror   = () => reject(req.error);
  });
}

/** Elimina la grabación de un favorito. */
export async function deleteAudio(favoriteId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req   = store.delete(favoriteId);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}
