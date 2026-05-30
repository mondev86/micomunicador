/**
 * audioDB — almacenamiento de grabaciones de audio en IndexedDB.
 * Evita el límite de 5 MB de localStorage al guardar blobs de audio.
 */

const DB_NAME = "comunicador-audio";
const STORE   = "recordings";
const DB_VERSION = 1;

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
export async function saveAudio(favoriteId: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req   = store.put(blob, favoriteId);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** Devuelve el Blob de audio, o null si no existe. */
export async function loadAudio(favoriteId: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req   = store.get(favoriteId);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
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
