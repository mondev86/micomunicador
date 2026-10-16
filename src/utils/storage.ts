/**
 * storage — acceso a localStorage con espacio de nombres para el modo demo.
 *
 * En modo demo antepone "demo:" a las claves para no mezclar los datos de la
 * demo (perfiles, tableros, favoritos, ajustes...) con la sesión real. El flag
 * "demo-mode" se guarda sin prefijo porque es el interruptor que decide el prefijo.
 *
 * Es tolerante a entornos sin `window` (p. ej. tests en Node): en ese caso no
 * persiste nada y devuelve null, igual que un localStorage vacío.
 */

const DEMO_FLAG_KEY = "demo-mode";
const DEMO_PREFIX = "demo:";

function hasLocalStorage(): boolean {
	return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isDemoActive(): boolean {
	return hasLocalStorage() && window.localStorage.getItem(DEMO_FLAG_KEY) === "1";
}

function resolveKey(key: string): string {
	if (key === DEMO_FLAG_KEY) return key;
	return isDemoActive() ? `${DEMO_PREFIX}${key}` : key;
}

export const storage = {
	getItem(key: string): string | null {
		if (!hasLocalStorage()) return null;
		return window.localStorage.getItem(resolveKey(key));
	},
	setItem(key: string, value: string): void {
		if (!hasLocalStorage()) return;
		window.localStorage.setItem(resolveKey(key), value);
	},
	removeItem(key: string): void {
		if (!hasLocalStorage()) return;
		window.localStorage.removeItem(resolveKey(key));
	},
};
