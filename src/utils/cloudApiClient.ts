export type CloudUser = {
	id: string;
	email: string;
};

export type CloudSession = {
	token: string;
	user: CloudUser;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "";
const TOKEN_STORAGE_KEY = "cloud-token";
const USER_STORAGE_KEY = "cloud-user";

export function isApiConfigured(): boolean {
	return true;
}

export function getApiBaseUrl(): string {
	return API_BASE_URL;
}

export function getCloudToken(): string {
	return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

export function getCloudSession(): CloudSession | null {
	const token = localStorage.getItem(TOKEN_STORAGE_KEY);
	const rawUser = localStorage.getItem(USER_STORAGE_KEY);
	if (!token || !rawUser) return null;
	try {
		const user = JSON.parse(rawUser) as CloudUser;
		if (!user?.id || !user?.email) return null;
		return { token, user };
	} catch {
		return null;
	}
}

function persistCloudSession(session: CloudSession): void {
	localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
}

export function clearCloudSession(): void {
	localStorage.removeItem(TOKEN_STORAGE_KEY);
	localStorage.removeItem(USER_STORAGE_KEY);
}

async function requestJson<T>(path: string, init: RequestInit = {}, withAuth = false): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(init.headers as Record<string, string> | undefined),
	};
	if (withAuth) {
		const token = getCloudToken();
		if (!token) throw new Error("No auth token");
		headers.authorization = `Bearer ${token}`;
	}
	const requestUrl = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
	const response = await fetch(requestUrl, { ...init, headers });
	if (!response.ok) {
		const payload = await response.json().catch(() => ({}));
		throw new Error((payload as { error?: string }).error || `HTTP ${response.status}`);
	}
	return response.json() as Promise<T>;
}

export async function cloudRegister(email: string, password: string): Promise<CloudSession> {
	const data = await requestJson<CloudSession>("/api/auth/register", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	});
	persistCloudSession(data);
	return data;
}

export async function cloudLogin(email: string, password: string): Promise<CloudSession> {
	const data = await requestJson<CloudSession>("/api/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	});
	persistCloudSession(data);
	return data;
}

export async function cloudMe(): Promise<CloudUser> {
	const data = await requestJson<{ user: CloudUser }>("/api/auth/me", { method: "GET" }, true);
	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
	return data.user;
}

export async function cloudFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
	return requestJson<T>(path, init, true);
}
