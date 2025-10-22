import { STORAGE_TEST_KEY } from "../config/constants";

export type StorageAdapter = {
	get<T>(key: string): T | null;
	set<T>(key: string, value: T): boolean;
	remove(key: string): void;
	has(key: string): boolean;
};

const createStorageAdapter = (): StorageAdapter => {
	let storage: Storage | null = null;
	let tested = false;

	const getStorage = (): Storage | null => {
		if (tested) {
			return storage;
		}

		if (typeof window === "undefined" || !("localStorage" in window)) {
			storage = null;
			tested = true;
			return storage;
		}

		try {
			window.localStorage.setItem(STORAGE_TEST_KEY, "ok");
			window.localStorage.removeItem(STORAGE_TEST_KEY);
			storage = window.localStorage;
		} catch {
			storage = null;
		}

		tested = true;
		return storage;
	};

	return {
		get<T>(key: string): T | null {
			const store = getStorage();
			if (!store) {
				return null;
			}

			try {
				const raw = store.getItem(key);
				return raw ? JSON.parse(raw) : null;
			} catch {
				return null;
			}
		},

		set<T>(key: string, value: T): boolean {
			const store = getStorage();
			if (!store) {
				return false;
			}

			try {
				store.setItem(key, JSON.stringify(value));
				return true;
			} catch {
				return false;
			}
		},

		remove(key: string): void {
			const store = getStorage();
			if (!store) {
				return;
			}

			try {
				store.removeItem(key);
			} catch {
				// ignore
			}
		},

		has(key: string): boolean {
			const store = getStorage();
			if (!store) {
				return false;
			}

			try {
				return store.getItem(key) !== null;
			} catch {
				return false;
			}
		},
	};
};

export const storageAdapter = createStorageAdapter();
