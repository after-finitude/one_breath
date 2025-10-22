export interface DraftStorage {
	load: () => string;
	save: (value: string) => void;
	clear: () => void;
}

const createDraftStorage = (storageKey: string): DraftStorage => {
	const getSessionStorage = () => {
		if (typeof window === "undefined" || !window.sessionStorage) {
			return null;
		}

		return window.sessionStorage;
	};
	const load = () => {
		const store = getSessionStorage();
		if (!store) {
			return "";
		}

		try {
			const value = store.getItem(storageKey);
			return value ?? "";
		} catch {
			return "";
		}
	};

	const persist = (value: string) => {
		const store = getSessionStorage();
		if (!store) {
			return;
		}

		try {
			if (value.trim()) {
				store.setItem(storageKey, value);
			} else {
				store.removeItem(storageKey);
			}
		} catch {
			// Safely ignore quota errors or storage unavailability
		}
	};

	const clear = () => {
		const store = getSessionStorage();
		if (!store) {
			return;
		}

		try {
			store.removeItem(storageKey);
		} catch {
			// Ignore storage errors
		}
	};

	return {
		load,
		save: persist,
		clear,
	};
};

export const createSessionDraft = (key: string): DraftStorage => {
	return createDraftStorage(key);
};
